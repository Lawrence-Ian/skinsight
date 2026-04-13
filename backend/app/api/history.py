"""SKINSIGHT v2 — History API"""
import json
from fastapi import APIRouter, Header, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db, ScanHistory
from app.services.auth_service import verify_token
from app.services.recommendations import get_recommendation
import json

router = APIRouter()

def require_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authentication required.")
    user = verify_token(authorization.split(" ", 1)[1])
    if not user:
        raise HTTPException(401, "Invalid or expired token.")
    return user

@router.get("/")
async def get_history(user=Depends(require_user), db: Session = Depends(get_db)):
    scans = (db.query(ScanHistory)
             .filter(ScanHistory.user_id == user["user_id"])
             .order_by(ScanHistory.created_at.desc()).limit(50).all())
    return JSONResponse({"history": [{
        "id": s.id, "condition": s.condition, "confidence": s.confidence,
        "confidence_percent": round(s.confidence * 100, 1),
        "all_scores": json.loads(s.all_predictions) if s.all_predictions else {},
        "has_lesion_alert": s.has_lesion_alert, "source": s.source,
        "created_at": s.created_at.isoformat(),
    } for s in scans]})

@router.delete("/{scan_id}")
async def delete_scan(scan_id: int, user=Depends(require_user), db: Session = Depends(get_db)):
    scan = db.query(ScanHistory).filter(ScanHistory.id == scan_id,
                                        ScanHistory.user_id == user["user_id"]).first()
    if not scan:
        raise HTTPException(404, "Scan not found.")
    db.delete(scan); db.commit()
    return JSONResponse({"message": "Deleted."})

@router.get("/{scan_id}")
async def get_scan(scan_id: int, user=Depends(require_user), db: Session = Depends(get_db)):
    scan = db.query(ScanHistory).filter(ScanHistory.id == scan_id, ScanHistory.user_id == user["user_id"]).first()
    if not scan:
        raise HTTPException(404, "Scan not found.")
    all_scores = json.loads(scan.all_predictions) if scan.all_predictions else {}
    rec = get_recommendation(scan.condition)
    return JSONResponse({
        "scan_id": scan.id,
        "condition": scan.condition,
        "condition_label": rec["label"],
        "confidence": scan.confidence,
        "confidence_percent": round(scan.confidence * 100, 1),
        "all_scores": all_scores,
        "severity": rec["severity"],
        "description": rec["description"],
        "morning_routine": rec["morning_routine"],
        "night_routine": rec["night_routine"],
        "products": rec["products"],
        "preventive_tips": rec["preventive_tips"],
        "ingredients_to_avoid": rec.get("ingredients_to_avoid", []),
        "consult_dermatologist": rec["consult_dermatologist"],
        "first_aid_tips": rec.get("first_aid_tips", []),
        "emergency_note": rec.get("emergency_note", []),
        "has_lesion_alert": scan.has_lesion_alert,
        "source": scan.source,
        "timestamp": scan.created_at.isoformat(),
    })


