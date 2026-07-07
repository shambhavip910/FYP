import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

from xgboost import XGBRegressor

# Load dataset
df = pd.read_csv(
    "data/processed/featured_data.csv"
)

# Remove date column
df = df.drop(columns=["order_date"])

# Target
y = df["delivery_time_minutes"]

# Features
X = df.drop(
    columns=[
        "delivery_time_minutes",
        "demand_orders"
    ]
)

# Train Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Model
model = XGBRegressor(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=6,
    random_state=42
)

model.fit(X_train, y_train)

predictions = model.predict(X_test)

print("\nDelivery Time Prediction Results")

print(
    "MAE:",
    mean_absolute_error(
        y_test,
        predictions
    )
)

print(
    "R2:",
    r2_score(
        y_test,
        predictions
    )
)

# Save model
joblib.dump(
    model,
    "models/delivery_time_model.pkl"
)

print(
    "\nDelivery Time Model Saved Successfully"
)