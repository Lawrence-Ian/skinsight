"""SKINSIGHT v2 — Auth API"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db, User
from app.services.auth_service import hash_password, verify_password, create_token

router = APIRouter()

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
async def signup(data: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email.lower()).first():
        raise HTTPException(409, "Email already registered.")
    if len(data.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    user = User(name=data.name.strip(), email=data.email.lower().strip(),
                password_hash=hash_password(data.password))
    db.add(user); db.commit(); db.refresh(user)
    return JSONResponse({"message": "Account created!", "token": create_token(user.id, user.email),
                         "user": {"id": user.id, "name": user.name, "email": user.email}}, status_code=201)

@router.post("/login")
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password.")
    return JSONResponse({"message": "Login successful!", "token": create_token(user.id, user.email),
                         "user": {"id": user.id, "name": user.name, "email": user.email}})
