"""
Database models and configuration for the NewsBreak Ad Launcher
"""

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./newsbreak_launcher.db")

# Handle Railway's postgres URL format
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Organization(Base):
    """Organization for grouping ad accounts"""
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    access_tokens = relationship("AccessToken", back_populates="organization")


class AccessToken(Base):
    """Stored access tokens for NewsBreak API"""
    __tablename__ = "access_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    name = Column(String(255), nullable=False)  # Friendly name
    token = Column(Text, nullable=False)  # Encrypted token
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, nullable=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="access_tokens")
    cached_accounts = relationship("CachedAdAccount", back_populates="access_token")


class CachedAdAccount(Base):
    """Cached ad account information from NewsBreak API"""
    __tablename__ = "cached_ad_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    access_token_id = Column(Integer, ForeignKey("access_tokens.id"), nullable=False)
    newsbreak_account_id = Column(Integer, nullable=False)  # ID from NewsBreak
    name = Column(String(255), nullable=True)
    status = Column(String(50), nullable=True)
    cached_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    access_token = relationship("AccessToken", back_populates="cached_accounts")


class CampaignTemplate(Base):
    """Saved campaign templates for quick launching"""
    __tablename__ = "campaign_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    objective = Column(Integer, nullable=False)  # 1=AWARENESS, 2=TRAFFIC, etc.
    daily_budget = Column(Float, nullable=True)
    lifetime_budget = Column(Float, nullable=True)
    
    # Ad Set defaults
    billing_event = Column(Integer, nullable=True)  # 1=CPC, 2=CPM
    bid_amount = Column(Float, nullable=True)
    optimization_goal = Column(Integer, nullable=True)
    targeting_json = Column(Text, nullable=True)  # JSON string of targeting
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LaunchHistory(Base):
    """History of campaign launches"""
    __tablename__ = "launch_history"
    
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("campaign_templates.id"), nullable=True)
    campaign_name = Column(String(255), nullable=False)
    accounts_targeted = Column(Text, nullable=False)  # JSON array of account IDs
    accounts_succeeded = Column(Text, nullable=True)  # JSON array of successful account IDs
    accounts_failed = Column(Text, nullable=True)  # JSON array of failed account IDs
    error_messages = Column(Text, nullable=True)  # JSON object of errors
    launched_at = Column(DateTime, default=datetime.utcnow)
    launched_by = Column(String(255), nullable=True)


def init_db():
    """Initialize the database tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for getting database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
