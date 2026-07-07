import pandas as pd
import matplotlib.pyplot as plt
import joblib

# Load dataset
df = pd.read_csv(
    "data/processed/featured_data.csv"
)

# Load models
demand_model = joblib.load(
    "models/demand_model.pkl"
)

delivery_model = joblib.load(
    "models/delivery_time_model.pkl"
)

# Remove non-feature columns
feature_df = df.drop(
    columns=[
        "order_date",
        "demand_orders",
        "delivery_time_minutes"
    ]
)

# Demand Model Feature Importance
importance = demand_model.feature_importances_

importance_df = pd.DataFrame({
    "Feature": feature_df.columns,
    "Importance": importance
})

importance_df = importance_df.sort_values(
    by="Importance",
    ascending=False
)

print("\nDemand Model Feature Importance:\n")
print(importance_df)

plt.figure(figsize=(10,6))
plt.barh(
    importance_df["Feature"],
    importance_df["Importance"]
)

plt.title("Demand Prediction Feature Importance")

plt.tight_layout()

plt.savefig("models/feature_importance.png")

print("Feature importance graph saved successfully")

plt.show()