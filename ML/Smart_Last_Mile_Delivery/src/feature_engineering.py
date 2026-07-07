import pandas as pd

# Load processed dataset
df = pd.read_csv("data/processed/preprocessed_data.csv")

# Convert date column
df["order_date"] = pd.to_datetime(df["order_date"])

# Date-based features
df["year"] = df["order_date"].dt.year
df["month"] = df["order_date"].dt.month
df["day"] = df["order_date"].dt.day
df["weekday"] = df["order_date"].dt.weekday
df["hour"] = df["order_date"].dt.hour

# Rolling demand feature
df["rolling_demand_7"] = (
    df["historical_orders"]
    .rolling(window=7, min_periods=1)
    .mean()
)

# Traffic × Weather interaction
df["traffic_weather_score"] = (
    df["traffic_level"] *
    df["weather_condition"]
)

# Save featured dataset
df.to_csv(
    "data/processed/featured_data.csv",
    index=False
)

print("Feature Engineering Completed")
print(df.head())