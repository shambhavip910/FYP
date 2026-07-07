import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

from xgboost import XGBRegressor

# Load dataset
df = pd.read_csv(
    "data/processed/featured_data.csv"
)

# Drop date column
df = df.drop(columns=["order_date"])

# Target
y = df["demand_orders"]

# Features
X = df.drop(columns=["demand_orders",
                     "delivery_time_minutes"])

# Train Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# -------------------------------
# Linear Regression
# -------------------------------

lr = LinearRegression()

lr.fit(X_train, y_train)

lr_pred = lr.predict(X_test)

print("\nLinear Regression")

print(
    "MAE:",
    mean_absolute_error(y_test, lr_pred)
)

print(
    "R2:",
    r2_score(y_test, lr_pred)
)

# -------------------------------
# Random Forest
# -------------------------------

rf = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)

rf.fit(X_train, y_train)

rf_pred = rf.predict(X_test)

print("\nRandom Forest")

print(
    "MAE:",
    mean_absolute_error(y_test, rf_pred)
)

print(
    "R2:",
    r2_score(y_test, rf_pred)
)

# -------------------------------
# XGBoost
# -------------------------------

xgb = XGBRegressor(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=6,
    random_state=42
)

xgb.fit(X_train, y_train)

xgb_pred = xgb.predict(X_test)

print("\nXGBoost")

print(
    "MAE:",
    mean_absolute_error(y_test, xgb_pred)
)

print(
    "R2:",
    r2_score(y_test, xgb_pred)
)

# Save best model

joblib.dump(
    xgb,
    "models/demand_model.pkl"
)

print(
    "\nDemand Model Saved Successfully"
)