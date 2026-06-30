from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.notification import NotificationType


class NotificationOut(BaseModel):
    id: int
    user_id: int
    ticket_id: Optional[int]
    notification_type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
