from pydantic import BaseModel


class StateResponse(BaseModel):
    id: int
    state_code: str
    state_name: str


class DistrictResponse(BaseModel):
    id: int
    district_code: str
    district_name: str
    state_id: int


class SubDistrictResponse(BaseModel):
    id: int
    sub_district_code: str
    sub_district_name: str
    district_id: int


class VillageResponse(BaseModel):

    id: int
    village_code: str
    village_name: str
    sub_district_id: int
    sub_district: str
    district: str
    state: str