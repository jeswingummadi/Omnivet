import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Search for .env in: current dir, backend/ dir, and parent root dir
load_dotenv()
backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(backend_dir / ".env")
load_dotenv(backend_dir.parent / ".env")

# Neon DB connection string from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")

# Auto-recovery: if the user pasted a raw connection string into .env without "DATABASE_URL="
if not DATABASE_URL:
    candidate_paths = [backend_dir / ".env", backend_dir.parent / ".env", Path(".env")]
    for env_path in candidate_paths:
        if env_path.exists():
            try:
                for line in env_path.read_text(encoding="utf-8").splitlines():
                    cleaned = line.strip()
                    if cleaned.startswith("postgres://") or cleaned.startswith("postgresql://"):
                        DATABASE_URL = cleaned
                        break
            except Exception:
                pass
        if DATABASE_URL:
            break

# Ensure connection string starts with postgresql:// for SQLAlchemy
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Fallback for local offline tests without internet/Neon
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./animal_surveillance.db"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
