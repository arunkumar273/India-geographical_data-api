from sqlalchemy import BigInteger, Column, ForeignKey, Integer, String
from sqlalchemy.orm import declarative_base, relationship


Base = declarative_base()


class State(Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True)
    state_code = Column(String, nullable=False)
    state_name = Column(String, nullable=False)

    districts = relationship(
        "District",
        back_populates="state"
    )


class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True)
    district_code = Column(String, nullable=False)
    district_name = Column(String, nullable=False)
    state_id = Column(
        Integer,
        ForeignKey("states.id"),
        nullable=False
    )

    state = relationship(
        "State",
        back_populates="districts"
    )

    sub_districts = relationship(
        "SubDistrict",
        back_populates="district"
    )


class SubDistrict(Base):
    __tablename__ = "sub_districts"

    id = Column(Integer, primary_key=True)
    sub_district_code = Column(String, nullable=False)
    sub_district_name = Column(String, nullable=False)
    district_id = Column(
        Integer,
        ForeignKey("districts.id"),
        nullable=False
    )

    district = relationship(
        "District",
        back_populates="sub_districts"
    )

    villages = relationship(
        "Village",
        back_populates="sub_district"
    )


class Village(Base):
    __tablename__ = "villages"

    id = Column(BigInteger, primary_key=True)
    village_code = Column(String, nullable=False)
    village_name = Column(String, nullable=False)
    sub_district_id = Column(
        Integer,
        ForeignKey("sub_districts.id"),
        nullable=False
    )

    sub_district = relationship(
        "SubDistrict",
        back_populates="villages"
    )