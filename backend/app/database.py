from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# cd "C:\Odoo Hackthon\Urban-Furniture-Accounting-System\backend"
# .\.venv\Scripts\uvicorn.exe app.main:app --reload


# "C:\cloudflared-windows-amd64.exe" tunnel --url http://localhost:8000
