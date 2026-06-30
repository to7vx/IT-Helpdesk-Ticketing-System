import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Enum as SAEnum, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class CommentType(str, enum.Enum):
    public_reply = "public_reply"
    internal_note = "internal_note"
    status_change = "status_change"
    assignment_change = "assignment_change"
    system = "system"


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    content = Column(Text, nullable=False)
    comment_type = Column(SAEnum(CommentType, name='comment_type', create_type=False), default=CommentType.public_reply, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    ticket = relationship("Ticket", back_populates="comments")
    author = relationship("User", foreign_keys=[author_id])
