from typing import Optional
from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    default_sla_hours: float = 24.0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    default_sla_hours: Optional[float] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    default_sla_hours: float

    model_config = {"from_attributes": True}
