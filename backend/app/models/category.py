from sqlalchemy import Column, Integer, String, Float
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    default_sla_hours = Column(Float, default=24.0, nullable=False)
