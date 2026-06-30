import enum
from sqlalchemy import Column, Integer, Float, Enum as SAEnum
from app.database import Base


class Priority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class SLARule(Base):
    __tablename__ = "sla_rules"

    id = Column(Integer, primary_key=True, index=True)
    priority = Column(SAEnum(Priority, name='priority_level', create_type=False), unique=True, nullable=False)
    resolution_hours = Column(Float, nullable=False)
