# Auto-generated DB Schema module: user-db

from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User_db(Base):
    __tablename__ = "user_db"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

print("DB Schema ready for user-db")
