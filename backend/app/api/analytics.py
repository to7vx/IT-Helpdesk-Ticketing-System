from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.database import get_db
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User, UserRole
from app.models.comment import Comment
from app.core.dependencies import require_agent, require_admin

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _sla_due(ticket: Ticket) -> bool:
    if not ticket.sla_due_at:
        return False
    due = ticket.sla_due_at
    if due.tzinfo is None:
        due = due.replace(tzinfo=timezone.utc)
    return due < datetime.now(timezone.utc)


@router.get("/overview")
def overview(db: Session = Depends(get_db), current_user: User = Depends(require_agent)):
    total = db.query(Ticket).count()
    open_count = db.query(Ticket).filter(Ticket.status == TicketStatus.open).count()
    in_progress = db.query(Ticket).filter(Ticket.status == TicketStatus.in_progress).count()
    resolved = db.query(Ticket).filter(Ticket.status == TicketStatus.resolved).count()
    closed = db.query(Ticket).filter(Ticket.status == TicketStatus.closed).count()

    now = datetime.now(timezone.utc)
    overdue = db.query(Ticket).filter(
        Ticket.status.not_in([TicketStatus.resolved, TicketStatus.closed]),
        Ticket.sla_due_at < now,
    ).count()
    at_risk = db.query(Ticket).filter(
        Ticket.status.not_in([TicketStatus.resolved, TicketStatus.closed]),
        Ticket.sla_due_at >= now,
        Ticket.sla_due_at < now + timedelta(hours=1),
    ).count()

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress,
        "resolved": resolved,
        "closed": closed,
        "overdue": overdue,
        "at_risk": at_risk,
    }


@router.get("/by-priority")
def by_priority(db: Session = Depends(get_db), current_user: User = Depends(require_agent)):
    rows = db.query(Ticket.priority, func.count(Ticket.id)).group_by(Ticket.priority).all()
    return [{"priority": r[0], "count": r[1]} for r in rows]


@router.get("/by-category")
def by_category(db: Session = Depends(get_db), current_user: User = Depends(require_agent)):
    from app.models.category import Category
    rows = (
        db.query(Category.name, func.count(Ticket.id))
        .outerjoin(Ticket, Ticket.category_id == Category.id)
        .group_by(Category.name)
        .all()
    )
    return [{"category": r[0], "count": r[1]} for r in rows]


@router.get("/by-status")
def by_status(db: Session = Depends(get_db), current_user: User = Depends(require_agent)):
    rows = db.query(Ticket.status, func.count(Ticket.id)).group_by(Ticket.status).all()
    return [{"status": r[0], "count": r[1]} for r in rows]


@router.get("/trend")
def trend(days: int = Query(30, ge=7, le=365), db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(func.date(Ticket.created_at).label("day"), func.count(Ticket.id))
        .filter(Ticket.created_at >= since)
        .group_by(func.date(Ticket.created_at))
        .order_by(func.date(Ticket.created_at))
        .all()
    )
    return [{"date": str(r[0]), "count": r[1]} for r in rows]


@router.get("/sla-compliance")
def sla_compliance(days: int = Query(30, ge=7, le=365), db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    tickets = db.query(Ticket).filter(
        Ticket.created_at >= since,
        Ticket.status.in_([TicketStatus.resolved, TicketStatus.closed]),
    ).all()
    total = len(tickets)
    if total == 0:
        return {"compliant": 0, "breached": 0, "rate": 100.0}
    compliant = sum(
        1 for t in tickets
        if t.resolved_at and t.sla_due_at and (
            t.resolved_at.replace(tzinfo=timezone.utc) if t.resolved_at.tzinfo is None else t.resolved_at
        ) <= (
            t.sla_due_at.replace(tzinfo=timezone.utc) if t.sla_due_at.tzinfo is None else t.sla_due_at
        )
    )
    return {"compliant": compliant, "breached": total - compliant, "rate": round(compliant / total * 100, 1)}


@router.get("/avg-resolution")
def avg_resolution(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    tickets = db.query(Ticket).filter(
        Ticket.status.in_([TicketStatus.resolved, TicketStatus.closed]),
        Ticket.resolved_at.isnot(None),
    ).all()
    if not tickets:
        return {"avg_hours": 0}
    durations = []
    for t in tickets:
        created = t.created_at.replace(tzinfo=timezone.utc) if t.created_at.tzinfo is None else t.created_at
        resolved = t.resolved_at.replace(tzinfo=timezone.utc) if t.resolved_at.tzinfo is None else t.resolved_at
        durations.append((resolved - created).total_seconds() / 3600)
    return {"avg_hours": round(sum(durations) / len(durations), 2)}


@router.get("/agent-performance")
def agent_performance(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    agents = db.query(User).filter(User.role.in_([UserRole.agent, UserRole.admin])).all()
    result = []
    for agent in agents:
        all_assigned = db.query(Ticket).filter(Ticket.assigned_to_id == agent.id).all()
        resolved = [t for t in all_assigned if t.status in (TicketStatus.resolved, TicketStatus.closed) and t.resolved_at]
        open_load = sum(1 for t in all_assigned if t.status in (TicketStatus.open, TicketStatus.in_progress))

        avg_res = 0.0
        if resolved:
            durations = []
            for t in resolved:
                created = t.created_at.replace(tzinfo=timezone.utc) if t.created_at.tzinfo is None else t.created_at
                res = t.resolved_at.replace(tzinfo=timezone.utc) if t.resolved_at.tzinfo is None else t.resolved_at
                durations.append((res - created).total_seconds() / 3600)
            avg_res = round(sum(durations) / len(durations), 2)

        result.append({
            "agent_id": agent.id,
            "name": agent.name,
            "email": agent.email,
            "resolved_count": len(resolved),
            "open_load": open_load,
            "avg_resolution_hours": avg_res,
        })
    return result


@router.get("/sla-queue")
def sla_queue(db: Session = Depends(get_db), current_user: User = Depends(require_agent)):
    now = datetime.now(timezone.utc)
    tickets = db.query(Ticket).filter(
        Ticket.status.not_in([TicketStatus.resolved, TicketStatus.closed]),
        Ticket.sla_due_at.isnot(None),
    ).order_by(Ticket.sla_due_at.asc()).limit(50).all()

    result = []
    for t in tickets:
        due = t.sla_due_at.replace(tzinfo=timezone.utc) if t.sla_due_at.tzinfo is None else t.sla_due_at
        remaining = (due - now).total_seconds()
        sla_status = "overdue" if remaining < 0 else ("at_risk" if remaining < 3600 else "ok")
        result.append({
            "id": t.id,
            "title": t.title,
            "priority": t.priority,
            "status": t.status,
            "sla_due_at": t.sla_due_at,
            "sla_status": sla_status,
            "remaining_seconds": remaining,
        })
    return result
