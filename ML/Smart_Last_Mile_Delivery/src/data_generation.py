import pandas as pd
import numpy as np

np.random.seed(42)

n = 10000

dates = pd.date_range(
    start="2024-01-01",
    periods=n,
    freq="h"
)

df = pd.DataFrame()

df["order_date"] = dates

df["weather_condition"] = np.random.choice(
    ["Sunny", "Cloudy", "Rainy"],
    n,
    p=[0.5, 0.3, 0.2]
)

df["traffic_level"] = np.random.choice(
    ["Low", "Medium", "High"],
    n,
    p=[0.4, 0.4, 0.2]
)

df["area_type"] = np.random.choice(
    ["Urban", "Suburban", "Rural"],
    n
)

df["distance_km"] = np.random.uniform(1, 20, n)

df["historical_orders"] = np.random.randint(
    50,
    500,
    n
)

df["holiday_flag"] = np.random.randint(
    0,
    2,
    n
)

df["peak_hour"] = np.random.randint(
    0,
    2,
    n
)

df["rider_count"] = np.random.randint(
    10,
    100,
    n
)

df["demand_orders"] = (
    0.7 * df["historical_orders"]
    + 50 * df["peak_hour"]
    + 40 * df["holiday_flag"]
    + np.random.normal(0, 20, n)
).astype(int)

traffic_map = {
    "Low": 0,
    "Medium": 10,
    "High": 25
}

weather_map = {
    "Sunny": 0,
    "Cloudy": 5,
    "Rainy": 15
}

df["delivery_time_minutes"] = (
    15
    + df["distance_km"] * 2
    + df["traffic_level"].map(traffic_map)
    + df["weather_condition"].map(weather_map)
    + np.random.normal(0, 5, n)
)

df.to_csv(
    "data/raw/delivery_data.csv",
    index=False
)

print("Dataset Generated Successfully")
print(df.head())