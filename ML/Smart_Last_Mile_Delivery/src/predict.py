import joblib
import pandas as pd

model = joblib.load(
    "models/demand_model.pkl"
)

sample = pd.DataFrame({
    "weather_condition":[2],
    "traffic_level":[1],
    "area_type":[0],
    "distance_km":[8],
    "historical_orders":[300],
    "holiday_flag":[0],
    "peak_hour":[1],
    "rider_count":[40],
    "year":[2024],
    "month":[5],
    "day":[15],
    "weekday":[2],
    "hour":[18],
    "rolling_demand_7":[280],
    "traffic_weather_score":[2]
})

prediction = model.predict(sample)

print(
    "Predicted Demand:",
    prediction[0]
)