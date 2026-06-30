from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.sla_rule import Priority
from app.models.ticket import TicketStatus
from app.schemas.user import UserPublic


class CategoryBrief(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class TicketCreate(BaseModel):
    title: str
    description: str
    category_id: Optional[int] = None
    priority: Priority = Priority.medium


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    priority: Optional[Priority] = None
    status: Optional[TicketStatus] = None
    assigned_to_id: Optional[int] = None


class TicketOut(BaseModel):
    id: int
    title: str
    description: str
    category: Optional[CategoryBrief]
    priority: Priority
    status: TicketStatus
    created_by: UserPublic
    assigned_to: Optional[UserPublic]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    sla_due_at: Optional[datetime]
    sla_status: Optional[str] = None

    model_config = {"from_attributes": True}


class TicketListOut(BaseModel):
    id: int
    title: str
    category: Optional[CategoryBrief]
    priority: Priority
    status: TicketStatus
    created_by: UserPublic
    assigned_to: Optional[UserPublic]
    created_at: datetime
    updated_at: datetime
    sla_due_at: Optional[datetime]
    sla_status: Optional[str] = None

    model_config = {"from_attributes": True}


class PaginatedTickets(BaseModel):
    items: List[TicketListOut]
    total: int
    page: int
    size: int
    pages: int
