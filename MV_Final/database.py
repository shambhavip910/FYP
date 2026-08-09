from pymongo import MongoClient
from pymongo.errors import PyMongoError

from config import MONGO_URI, DATABASE_NAME, COLLECTION_NAME

_client = None
_collection = None


def _get_collection():
    """
    Lazily creates the MongoDB client/collection so importing this module
    never fails even if MongoDB isn't reachable yet.
    """
    global _client, _collection

    if _collection is None:
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        db = _client[DATABASE_NAME]
        _collection = db[COLLECTION_NAME]

    return _collection


def save_solution(solution):
    """
    Persists a solution to MongoDB. Returns the inserted id on success,
    or None if MongoDB is unavailable (so the API can still respond with
    results even when the database is down).
    """
    try:
        collection = _get_collection()
        result = collection.insert_one(solution)
        return str(result.inserted_id)
    except PyMongoError as e:
        print("Warning: could not save solution to MongoDB:", e)
        return None
