"""MongoDB connection helper for the AI service"""
import os
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta

_client = None

def get_db():
    global _client
    if _client is None:
        uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/buildtrack_ai")
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    return _client["buildtrack_ai"]

def oid(s: str):
    """Convert string to ObjectId safely"""
    try:
        return ObjectId(s)
    except Exception:
        return None

def days_ago(n: int) -> datetime:
    return datetime.utcnow() - timedelta(days=n)
