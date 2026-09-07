from fastapi import FastAPI, HTTPException,Header
from pydantic import BaseModel
from sqlalchemy import select
from src.models import ApiKey
from src.database import engine
from src.schemas import StateResponse, DistrictResponse,SubDistrictResponse,VillageResponse
from src.services import get_states, get_districts_by_state,get_subdistricts_by_district,get_villages_by_subdistrict,search_villages,create_api_key,verify_api_key
class ApiKeyRequest(BaseModel):
    name: str

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


@app.get(
    "/states",
    response_model=list[StateResponse]
)
def states(x_api_key: str = Header(...)):

    if not verify_api_key(x_api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key"
        )

    return get_states()
@app.get(
    "/states/{state_id}/districts",
    response_model=list[DistrictResponse]
)
def districts(
    state_id: int,
    x_api_key: str = Header(...)
):

    if not verify_api_key(x_api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key"
        )

    result = get_districts_by_state(state_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="State not found"
        )

    return result
@app.get(
    "/districts/{district_id}/sub-districts",
    response_model=list[SubDistrictResponse]
)
def subdistricts(
    district_id: int,
    x_api_key: str = Header(...)
):

    if not verify_api_key(x_api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key"
        )

    result = get_subdistricts_by_district(district_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="District not found"
        )

    return result
@app.get(
    "/sub-districts/{sub_district_id}/villages",
    response_model=list[VillageResponse]
)
def villages(
    sub_district_id: int,
    x_api_key: str = Header(...)
):

    if not verify_api_key(x_api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key"
        )

    result = get_villages_by_subdistrict(sub_district_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Sub-district not found"
        )

    return result
@app.get(
    "/villages/search",
    response_model=list[VillageResponse]
)
def search_village_api(
    q: str,
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

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100"
        )

    return search_villages(q.strip(), limit)

@app.post("/api-keys")
def generate_api_key(request: ApiKeyRequest):

    if not request.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty"
        )

    return create_api_key(request.name.strip())

@app.get("/api-keys")
def list_api_keys( x_api_key: str = Header(...)):

    if not verify_api_key(x_api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key"
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
    x_api_key: str = Header(...)
):

    if not verify_api_key(x_api_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive API key"
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