from fastapi import FastAPI, HTTPException

from src.schemas import StateResponse, DistrictResponse,SubDistrictResponse,VillageResponse
from src.services import get_states, get_districts_by_state,get_subdistricts_by_district,get_villages_by_subdistrict,search_villages


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
def states():
    return get_states()
@app.get(
    "/states/{state_id}/districts",
    response_model=list[DistrictResponse]
)
def districts(state_id: int):

    print("TEST STATE ID:", state_id)

    result = get_districts_by_state(state_id)

    print("TEST RESULT:", result)

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
def subdistricts(district_id: int):

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
def villages(sub_district_id: int):

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
    limit: int = 20
):
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