"""CLI sample — production predictions use Flask /predict via MV_Final/ml_predict.py."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "MV_Final"))
from ml_predict import predict_all

if __name__ == "__main__":
    print(
        predict_all(
            {
                "distance_km": 8,
                "weather_condition": "Sunny",
                "traffic_level": "Low",
            }
        )
    )
