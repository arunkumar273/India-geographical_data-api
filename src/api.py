import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException,Header
from pydantic import BaseModel
from sqlalchemy import select
from datetime import datetime
from src.models import ApiKey
from src.database import engine
from src.schemas import StateResponse, DistrictResponse,SubDistrictResponse,VillageResponse
from src.services import get_states, get_districts_by_state,get_subdistricts_by_district,get_villages_by_subdistrict,search_villages,create_api_key,verify_api_key
load_dotenv()

ADMIN_SECRET = os.getenv("ADMIN_SECRET")
def verify_admin(admin_secret: str):

    if not ADMIN_SECRET:
        return False

    return admin_secret == ADMIN_SECRET
class ApiKeyRequest(BaseModel):
    name: str

class ApiKeyExpiryRequest(BaseModel):
    expires_at: datetime | None = None    

app = FastAPI(
    title="India Village Geographical Data API",
    description=(
        "REST API for India's state, district, "
        "sub-district and village geographical data."
    ),
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "India Village Geographical Data API",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/states",)
def states(x_api_key: str = Header(...)):

    if not verify_api_key(x_api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key"
        )

    result = get_states()
    return {
        "data": result,
        "count": len(result)
    }
@app.get("/states/{state_id}/districts")
def get_districts(
    state_id: int,
    page: int = 1,
    limit: int = 20,
    x_api_key: str = Header(...)
):
    if not verify_api_key(x_api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key"
        )

    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="Page must be at least 1"
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100"
        )

    offset = (page - 1) * limit

    result = get_districts_by_state(
        state_id,
        limit,
        offset
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="State not found"
        )

    return {
        "data": result["data"],
        "count": len(result["data"]),
        "total": result["total"],
        "page": page,
        "limit": limit
    }
@app.get("/districts/{district_id}/sub-districts")
def get_sub_districts(
    district_id: int,
    page: int = 1,
    limit: int = 20,
    x_api_key: str = Header(...)
):
    if not verify_api_key(x_api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key"
        )

    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="Page must be at least 1"
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100"
        )

    offset = (page - 1) * limit

    result = get_subdistricts_by_district(
        district_id,
        limit,
        offset
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="District not found"
        )

    return {
        "data": result["data"],
        "count": len(result["data"]),
        "total": result["total"],
        "page": page,
        "limit": limit
    }
@app.get("/sub-districts/{sub_district_id}/villages")
def get_villages(
    sub_district_id: int,
    page: int = 1,
    limit: int = 20,
    x_api_key: str = Header(...)
):
    if not verify_api_key(x_api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key"
        )

    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="Page must be at least 1"
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100"
        )

    offset = (page - 1) * limit

    result = get_villages_by_subdistrict(
        sub_district_id,
        limit,
        offset
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Sub-district not found"
        )

    return {
        "data": result["data"],
        "count": len(result["data"]),
        "total": result["total"],
        "page": page,
        "limit": limit
    }
@app.get("/villages/search")
def search_village_api(
    q: str,
    page: int = 1,
    limit: int = 20,
    x_api_key: str = Header(...)
):
    if not verify_api_key(x_api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key"
        )

    if not q.strip():
        raise HTTPException(
            status_code=400,
            detail="Search query cannot be empty"
        )

    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="Page must be at least 1"
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100"
        )

    offset = (page - 1) * limit

    results = search_villages(
        q.strip(),
        limit,
        offset
    )

    return {
        "data": results["data"],
        "count": len(results["data"]),
        "total": results["total"],
        "page": page,
        "limit": limit
    }

@app.post("/api-keys")
def generate_api_key(request: ApiKeyRequest,
    admin_secret: str = Header(...)):
    if not verify_admin(admin_secret):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin secret"
        )
    if not request.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty"
        )

    return create_api_key(request.name.strip())

@app.get("/api-keys")
def list_api_keys(admin_secret: str = Header(...)):

    if not verify_admin(admin_secret):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin secret"
        )
    with engine.connect() as connection:
        result = connection.execute(
            select(
                ApiKey.id,
                ApiKey.name,
                ApiKey.is_active,
                ApiKey.created_at,
                ApiKey.expires_at
            ).order_by(ApiKey.id)
        )

        return result.mappings().all()   
    
@app.patch("/api-keys/{api_key_id}/deactivate")
def deactivate_api_key(
    api_key_id: int,
    admin_secret: str = Header(...)
):

    if not verify_admin(admin_secret):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin secret"
        )

    with engine.begin() as connection:

        result = connection.execute(
            ApiKey.__table__.update()
            .where(ApiKey.id == api_key_id)
            .values(is_active=False)
        )

        if result.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="API key not found"
            )

    return {
        "message": "API key deactivated successfully",
        "api_key_id": api_key_id
    }     

@app.patch("/api-keys/{api_key_id}/expiry")
def update_api_key_expiry(
    api_key_id: int,
    request: ApiKeyExpiryRequest,
    admin_secret: str = Header(...)
):

    if not verify_admin(admin_secret):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin secret"
        )

    with engine.begin() as connection:

        result = connection.execute(
            ApiKey.__table__.update()
            .where(ApiKey.id == api_key_id)
            .values(expires_at=request.expires_at)
        )

        if result.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="API key not found"
            )

    return {
        "message": "API key expiration updated successfully",
        "api_key_id": api_key_id,
        "expires_at": request.expires_at
    }