from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.comment import CommentType
from app.schemas.user import UserPublic


class CommentCreate(BaseModel):
    content: str
    comment_type: CommentType = CommentType.public_reply


class CommentOut(BaseModel):
    id: int
    ticket_id: int
    author: Optional[UserPublic]
    content: str
    comment_type: CommentType
    created_at: datetime

    model_config = {"from_attributes": True}
