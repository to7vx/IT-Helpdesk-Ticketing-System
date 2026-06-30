import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base


class NotificationType(str, enum.Enum):
    ticket_assigned = "ticket_assigned"
    status_changed = "status_changed"
    new_reply = "new_reply"
    sla_breach = "sla_breach"
    ticket_created = "ticket_created"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    notification_type = Column(SAEnum(NotificationType, name='notification_type', create_type=False), nullable=False)
    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[user_id])
    ticket = relationship("Ticket", foreign_keys=[ticket_id])
