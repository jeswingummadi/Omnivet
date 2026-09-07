import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("uvicorn")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/animal_surveillance")

def get_engine():
    is_postgres = DATABASE_URL.startswith("postgresql")
    try:
        connect_args = {} if is_postgres else {"check_same_thread": False}
        eng = create_engine(DATABASE_URL, connect_args=connect_args)
        # Test connection
        with eng.connect() as conn:
            if is_postgres:
                try:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                    conn.commit()
                    logger.info("PostGIS extension initialized successfully.")
                except Exception as ext_err:
                    logger.warning(f"Could not enable PostGIS extension (might already exist or lack superuser): {ext_err}")
            else:
                logger.info("Using SQLite database.")
        return eng
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL at {DATABASE_URL}: {e}")
        logger.warning("Falling back to local SQLite database: sqlite:///./animal_surveillance.db")
        sqlite_url = "sqlite:///./animal_surveillance.db"
        return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
