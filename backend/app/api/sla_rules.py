from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.sla_rule import SLARule
from app.models.user import User
from app.schemas.sla_rule import SLARuleCreate, SLARuleUpdate, SLARuleOut
from app.core.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/sla-rules", tags=["sla-rules"])


@router.get("", response_model=List[SLARuleOut])
def list_sla_rules(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SLARule).all()


@router.post("", response_model=SLARuleOut, status_code=201)
def create_sla_rule(payload: SLARuleCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    if db.query(SLARule).filter(SLARule.priority == payload.priority).first():
        raise HTTPException(status_code=400, detail="SLA rule for this priority already exists")
    rule = SLARule(**payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.patch("/{rule_id}", response_model=SLARuleOut)
def update_sla_rule(rule_id: int, payload: SLARuleUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    rule = db.query(SLARule).filter(SLARule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="SLA rule not found")
    rule.resolution_hours = payload.resolution_hours
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=204)
def delete_sla_rule(rule_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    rule = db.query(SLARule).filter(SLARule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="SLA rule not found")
    db.delete(rule)
    db.commit()
