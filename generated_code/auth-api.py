# Auto-generated API module: auth-api

from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "Running auth-api API"}
