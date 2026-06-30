import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models  # ensure all models are registered
from app.api import auth, tickets, comments, categories, sla_rules, users, notifications, analytics

# Only auto-create tables in local dev (Supabase manages schema in production)
if os.getenv("ENVIRONMENT", "development") == "development":
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass

app = FastAPI(title="IT Helpdesk Ticketing System", version="1.0.0")

# Accept CORS_ORIGINS env var (comma-separated); default to all origins for easy deployment
_raw_origins = os.getenv("CORS_ORIGINS", "*")
cors_origins = [o.strip() for o in _raw_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(comments.router)
app.include_router(categories.router)
app.include_router(sla_rules.router)
app.include_router(users.router)
app.include_router(notifications.router)
app.include_router(analytics.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
