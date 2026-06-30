from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.ticket import Ticket
from app.models.comment import Comment, CommentType
from app.models.user import User, UserRole
from app.models.notification import Notification, NotificationType
from app.schemas.comment import CommentCreate, CommentOut
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/tickets/{ticket_id}/comments", tags=["comments"])


def _notify(db: Session, user_id: int, ticket_id: int, ntype: NotificationType, title: str, message: str):
    notif = Notification(user_id=user_id, ticket_id=ticket_id, notification_type=ntype, title=title, message=message)
    db.add(notif)


@router.get("", response_model=List[CommentOut])
def list_comments(ticket_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role == UserRole.end_user and ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    q = db.query(Comment).options(joinedload(Comment.author)).filter(Comment.ticket_id == ticket_id)
    if current_user.role == UserRole.end_user:
        q = q.filter(Comment.comment_type != CommentType.internal_note)
    return q.order_by(Comment.created_at.asc()).all()


@router.post("", response_model=CommentOut, status_code=201)
def add_comment(ticket_id: int, payload: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role == UserRole.end_user and ticket.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == UserRole.end_user and payload.comment_type == CommentType.internal_note:
        raise HTTPException(status_code=403, detail="End users cannot post internal notes")

    comment = Comment(ticket_id=ticket_id, author_id=current_user.id, content=payload.content, comment_type=payload.comment_type)
    db.add(comment)

    if payload.comment_type == CommentType.public_reply:
        if current_user.id != ticket.created_by_id:
            _notify(db, ticket.created_by_id, ticket_id, NotificationType.new_reply,
                    f"New reply on ticket #{ticket_id}", payload.content[:120])
        if ticket.assigned_to_id and current_user.id != ticket.assigned_to_id:
            _notify(db, ticket.assigned_to_id, ticket_id, NotificationType.new_reply,
                    f"New reply on ticket #{ticket_id}", payload.content[:120])

    db.commit()
    db.refresh(comment)
    return comment
