from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.database import get_db
from app.models.ticket import Ticket, TicketStatus
from app.models.comment import Comment, CommentType
from app.models.sla_rule import SLARule, Priority
from app.models.user import User, UserRole
from app.models.notification import Notification, NotificationType
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketOut, TicketListOut, PaginatedTickets
from app.core.dependencies import get_current_user, require_agent

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


def compute_sla_status(ticket: Ticket) -> str:
    if ticket.status in (TicketStatus.resolved, TicketStatus.closed):
        return "resolved"
    if not ticket.sla_due_at:
        return "none"
    now = datetime.now(timezone.utc)
    due = ticket.sla_due_at
    if due.tzinfo is None:
        due = due.replace(tzinfo=timezone.utc)
    remaining = (due - now).total_seconds()
    if remaining < 0:
        return "overdue"
    if remaining < 3600:
        return "at_risk"
    return "ok"


def enrich(ticket: Ticket) -> dict:
    d = TicketOut.model_validate(ticket).model_dump()
    d["sla_status"] = compute_sla_status(ticket)
    return d


def _notify(db: Session, user_id: int, ticket_id: int, ntype: NotificationType, title: str, message: str):
    notif = Notification(user_id=user_id, ticket_id=ticket_id, notification_type=ntype, title=title, message=message)
    db.add(notif)


@router.post("", response_model=TicketOut, status_code=201)
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sla_hours = 24.0
    sla_rule = db.query(SLARule).filter(SLARule.priority == payload.priority).first()
    if sla_rule:
        sla_hours = sla_rule.resolution_hours
    sla_due = datetime.now(timezone.utc) + timedelta(hours=sla_hours)

    ticket = Ticket(
        title=payload.title,
        description=payload.description,
        category_id=payload.category_id,
        priority=payload.priority,
        created_by_id=current_user.id,
        sla_due_at=sla_due,
    )
    db.add(ticket)
    db.flush()

    log = Comment(ticket_id=ticket.id, author_id=current_user.id, content="Ticket created.", comment_type=CommentType.system)
    db.add(log)
    db.commit()
    db.refresh(ticket)
    return enrich(ticket)


@router.get("", response_model=PaginatedTickets)
def list_tickets(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category_id: Optional[int] = None,
    assigned_to_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Ticket).options(
        joinedload(Ticket.created_by),
        joinedload(Ticket.assigned_to),
        joinedload(Ticket.category),
    )
    if current_user.role == UserRole.end_user:
        q = q.filter(Ticket.created_by_id == current_user.id)
    if status:
        q = q.filter(Ticket.status == status)
    if priority:
        q = q.filter(Ticket.priority == priority)
    if category_id:
        q = q.filter(Ticket.category_id == category_id)
    if assigned_to_id:
        q = q.filter(Ticket.assigned_to_id == assigned_to_id)
    if search:
        q = q.filter(or_(Ticket.title.ilike(f"%{search}%"), Ticket.description.ilike(f"%{search}%")))

    total = q.count()
    tickets = q.order_by(Ticket.created_at.desc()).offset((page - 1) * size).limit(size).all()
    items = []
    for t in tickets:
        item = TicketListOut.model_validate(t).model_dump()
        item["sla_status"] = compute_sla_status(t)
        items.append(item)
    return {"items": items, "total": total, "page": page, "size": size, "pages": max(1, -(-total // size))}


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(Ticket).options(
        joinedload(Ticket.created_by),
        joinedload(Ticket.assigned_to),
        joinedload(Ticket.category),
    ).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role == UserRole.end_user and ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return enrich(ticket)


@router.patch("/{ticket_id}", response_model=TicketOut)
def update_ticket(ticket_id: int, payload: TicketUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_agent)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = ticket.status
    old_assigned = ticket.assigned_to_id

    if payload.status is not None:
        ticket.status = payload.status
        if payload.status == TicketStatus.resolved and not ticket.resolved_at:
            ticket.resolved_at = datetime.now(timezone.utc)
        if payload.status == TicketStatus.in_progress and old_status in (TicketStatus.resolved, TicketStatus.closed):
            ticket.resolved_at = None
        log = Comment(
            ticket_id=ticket.id,
            author_id=current_user.id,
            content=f"Status changed from {old_status.value} to {payload.status.value}.",
            comment_type=CommentType.status_change,
        )
        db.add(log)
        _notify(db, ticket.created_by_id, ticket.id, NotificationType.status_changed,
                f"Ticket #{ticket.id} status updated", f"Status is now {payload.status.value}.")

    if payload.assigned_to_id is not None and payload.assigned_to_id != old_assigned:
        ticket.assigned_to_id = payload.assigned_to_id
        log = Comment(
            ticket_id=ticket.id,
            author_id=current_user.id,
            content=f"Ticket assigned.",
            comment_type=CommentType.assignment_change,
        )
        db.add(log)
        _notify(db, payload.assigned_to_id, ticket.id, NotificationType.ticket_assigned,
                f"Ticket #{ticket.id} assigned to you", ticket.title)

    if payload.title is not None:
        ticket.title = payload.title
    if payload.description is not None:
        ticket.description = payload.description
    if payload.category_id is not None:
        ticket.category_id = payload.category_id
    if payload.priority is not None:
        if payload.priority != ticket.priority:
            sla_rule = db.query(SLARule).filter(SLARule.priority == payload.priority).first()
            sla_hours = sla_rule.resolution_hours if sla_rule else 24.0
            ticket.sla_due_at = datetime.now(timezone.utc) + timedelta(hours=sla_hours)
        ticket.priority = payload.priority

    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    return enrich(ticket)


@router.delete("/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_agent)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    db.delete(ticket)
    db.commit()
