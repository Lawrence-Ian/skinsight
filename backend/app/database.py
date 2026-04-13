"""SKINSIGHT v2 — Database"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./skinsight.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100), nullable=False)
    email         = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at    = Column(DateTime, default=datetime.utcnow)

class ScanHistory(Base):
    __tablename__ = "scan_history"
    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, nullable=False, index=True)
    condition       = Column(String(50), nullable=False)
    confidence      = Column(Float, nullable=False)
    all_predictions = Column(Text, nullable=False)
    has_lesion_alert= Column(Boolean, default=False)
    source          = Column(String(20), default="live_camera")   # always "live_camera"
    created_at      = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
