import pandas as pd
from sklearn.preprocessing import LabelEncoder

# Load data
df = pd.read_csv("data/raw/delivery_data.csv")

# Missing values handling
df.fillna(df.median(numeric_only=True), inplace=True)

# Encode categorical columns
encoder = LabelEncoder()

categorical_cols = [
    "weather_condition",
    "traffic_level",
    "area_type"
]

for col in categorical_cols:
    df[col] = encoder.fit_transform(df[col])

# Save processed data
df.to_csv(
    "data/processed/preprocessed_data.csv",
    index=False
)

print("Preprocessing Completed")
print(df.head())