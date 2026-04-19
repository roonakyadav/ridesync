"""
Placeholder FastAPI app.

RideSync uses Supabase for all server-side concerns (auth, database,
realtime). This file exists only to satisfy the supervisor config which
expects a backend service on port 8001. No real API routes live here.
"""
from fastapi import FastAPI

app = FastAPI(title="RideSync placeholder backend")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ridesync-placeholder"}
