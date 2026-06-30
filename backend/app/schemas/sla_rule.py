from pydantic import BaseModel
from app.models.sla_rule import Priority


class SLARuleCreate(BaseModel):
    priority: Priority
    resolution_hours: float


class SLARuleUpdate(BaseModel):
    resolution_hours: float


class SLARuleOut(BaseModel):
    id: int
    priority: Priority
    resolution_hours: float

    model_config = {"from_attributes": True}
