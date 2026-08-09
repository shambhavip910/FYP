"""Demand and delivery-time prediction using trained XGBoost models."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

import joblib
import pandas as pd

MODELS_DIR = (
    Path(__file__).resolve().parent.parent
    / "ML"
    / "Smart_Last_Mile_Delivery"
    / "models"
)

FEATURE_COLUMNS = [
    "weather_condition",
    "traffic_level",
    "area_type",
    "distance_km",
    "historical_orders",
    "holiday_flag",
    "peak_hour",
    "rider_count",
    "year",
    "month",
    "day",
    "weekday",
    "hour",
    "rolling_demand_7",
    "traffic_weather_score",
]

# LabelEncoder alphabetical fit from training data
WEATHER_MAP = {"Cloudy": 0, "Rainy": 1, "Sunny": 2}
TRAFFIC_MAP = {"High": 0, "Low": 1, "Medium": 2}
AREA_MAP = {"Rural": 0, "Suburban": 1, "Urban": 2}

_demand_model = None
_time_model = None


def _load_models():
    global _demand_model, _time_model
    if _demand_model is None:
        _demand_model = joblib.load(MODELS_DIR / "demand_model.pkl")
    if _time_model is None:
        _time_model = joblib.load(MODELS_DIR / "delivery_time_model.pkl")
    return _demand_model, _time_model


def _build_features(payload: dict) -> pd.DataFrame:
    now = datetime.now()
    weather = payload.get("weather_condition", "Sunny")
    traffic = payload.get("traffic_level", "Medium")
    area = payload.get("area_type", "Urban")

    weather_code = WEATHER_MAP.get(weather, WEATHER_MAP["Sunny"])
    traffic_code = TRAFFIC_MAP.get(traffic, TRAFFIC_MAP["Medium"])
    area_code = AREA_MAP.get(area, AREA_MAP["Urban"])

    hour = int(payload.get("hour", now.hour))
    historical = float(payload.get("historical_orders", 200))
    rolling = float(payload.get("rolling_demand_7", historical))

    row = {
        "weather_condition": weather_code,
        "traffic_level": traffic_code,
        "area_type": area_code,
        "distance_km": float(payload.get("distance_km", 5.0)),
        "historical_orders": historical,
        "holiday_flag": int(payload.get("holiday_flag", 0)),
        "peak_hour": int(payload.get("peak_hour", 1 if 17 <= hour <= 21 else 0)),
        "rider_count": int(payload.get("rider_count", 40)),
        "year": int(payload.get("year", now.year)),
        "month": int(payload.get("month", now.month)),
        "day": int(payload.get("day", now.day)),
        "weekday": int(payload.get("weekday", now.weekday())),
        "hour": hour,
        "rolling_demand_7": rolling,
        "traffic_weather_score": traffic_code * weather_code,
    }
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)


def scale_orders_to_packages(orders: float, max_units: int = 12) -> int:
    """Map regional order volume to per-stop package demand for MOVRP."""
    return max(1, min(max_units, int(round(float(orders) / 80.0))))


def predict_demand(payload: dict) -> dict:
    demand_model, _ = _load_models()
    features = _build_features(payload)
    orders = float(demand_model.predict(features)[0])
    packages = scale_orders_to_packages(orders)
    return {
        "predicted_orders": round(orders, 2),
        "predicted_demand": packages,
    }


def predict_delivery_time(payload: dict) -> dict:
    _, time_model = _load_models()
    features = _build_features(payload)
    minutes = float(time_model.predict(features)[0])
    return {
        "predicted_delivery_time_minutes": round(max(5.0, minutes), 2),
    }


def predict_all(payload: dict) -> dict:
    demand = predict_demand(payload)
    eta = predict_delivery_time(payload)
    return {**demand, **eta}
