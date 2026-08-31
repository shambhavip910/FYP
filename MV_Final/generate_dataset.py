"""
Generate a realistic synthetic MOVRPTW dataset with exactly 1,000 customers
around the Prayagraj depot used by the existing NSGA-II project.

Outputs (under data/):
  - customers_1000.csv
  - distance_matrix.xlsx   (depot + 1000 customers)
  - time_matrix.xlsx       (hours = distance / AVERAGE_SPEED)
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

import numpy as np
import pandas as pd

from config import (
    AVERAGE_SPEED,
    CUSTOMER_COUNT,
    CUSTOMERS_CSV,
    DATA_DIR,
    DEFAULT_DEPOT_LAT,
    DEFAULT_DEPOT_LNG,
    DISTANCE_MATRIX_XLSX,
    TIME_MATRIX_XLSX,
)
from utils import hours_to_hhmm


def _sample_customers(n, depot_lat, depot_lng, rng):
    """
    Sample customers in a ~25 km radius around the depot with varied
    demand, service times, and time windows.
    """

    # Offset in degrees ≈ km / 111
    max_radius_km = 22.0
    angles = rng.uniform(0, 2 * np.pi, n)
    # Prefer denser near depot (sqrt for area-uniform disk)
    radii_km = max_radius_km * np.sqrt(rng.uniform(0.05, 1.0, n))

    dlat = (radii_km * np.cos(angles)) / 111.0
    dlng = (radii_km * np.sin(angles)) / (
        111.0 * np.cos(np.radians(depot_lat))
    )

    lats = depot_lat + dlat
    lngs = depot_lng + dlng

    demand = rng.integers(1, 11, size=n)  # 1..10
    # Service time 5–20 minutes → hours
    service_min = rng.integers(5, 21, size=n)
    service_time = service_min / 60.0

    # Time windows: morning / midday / afternoon clusters (≈3–5 hour spans)
    window_profiles = [
        (9.0, 13.0),
        (9.0, 14.0),
        (10.0, 14.0),
        (10.0, 15.0),
        (11.0, 15.0),
        (11.0, 16.0),
        (12.0, 16.0),
        (12.0, 17.0),
        (9.5, 14.5),
        (10.5, 15.5),
        (8.5, 13.0),
        (13.0, 17.5),
    ]
    profile_idx = rng.integers(0, len(window_profiles), size=n)

    ready = np.empty(n, dtype=float)
    due = np.empty(n, dtype=float)
    for i in range(n):
        r0, d0 = window_profiles[profile_idx[i]]
        # Small jitter so windows are not identical
        jitter = float(rng.uniform(-0.25, 0.25))
        ready[i] = max(8.0, r0 + jitter)
        due[i] = min(18.0, d0 + jitter)
        if due[i] <= ready[i] + 1.0:
            due[i] = ready[i] + 2.0

    rows = []
    for i in range(n):
        tw = f"{hours_to_hhmm(ready[i])}-{hours_to_hhmm(due[i])}"
        rows.append(
            {
                "customer_id": i + 1,
                "latitude": round(float(lats[i]), 6),
                "longitude": round(float(lngs[i]), 6),
                "demand": int(demand[i]),
                "service_time": round(float(service_time[i]), 4),
                "ready_time": round(float(ready[i]), 4),
                "due_time": round(float(due[i]), 4),
                "time_window": tw,
            }
        )

    return pd.DataFrame(rows)


def _build_matrices(customers_df, depot_lat, depot_lng):
    """
    Build (n+1) x (n+1) distance (km) and time (hours) matrices.
    Index 0 = depot, indices 1..n = customers in CSV order.
    Vectorized haversine for speed at n=1000.
    """

    n = len(customers_df)
    coords = np.zeros((n + 1, 2), dtype=float)
    coords[0] = (depot_lat, depot_lng)
    coords[1:, 0] = customers_df["latitude"].to_numpy()
    coords[1:, 1] = customers_df["longitude"].to_numpy()

    lat = np.radians(coords[:, 0])[:, None]
    lon = np.radians(coords[:, 1])[:, None]
    dlat = lat - lat.T
    dlon = lon - lon.T
    a = (
        np.sin(dlat / 2) ** 2
        + np.cos(lat) * np.cos(lat.T) * np.sin(dlon / 2) ** 2
    )
    dist = 2 * 6371.0 * np.arcsin(np.sqrt(np.clip(a, 0.0, 1.0)))
    np.fill_diagonal(dist, 0.0)

    time_h = dist / AVERAGE_SPEED
    return dist, time_h


def generate_dataset(
    n_customers=CUSTOMER_COUNT,
    seed=42,
    depot_lat=DEFAULT_DEPOT_LAT,
    depot_lng=DEFAULT_DEPOT_LNG,
    out_dir=DATA_DIR,
):
    rng = np.random.default_rng(seed)
    Path(out_dir).mkdir(parents=True, exist_ok=True)

    print(f"Generating {n_customers} customers around ({depot_lat}, {depot_lng})...")
    customers = _sample_customers(n_customers, depot_lat, depot_lng, rng)

    # Uniqueness / consistency checks before write
    assert len(customers) == n_customers
    assert customers["customer_id"].is_unique
    assert (customers["demand"] > 0).all()
    assert (customers["ready_time"] <= customers["due_time"]).all()
    n_unique_coords = customers[["latitude", "longitude"]].drop_duplicates().shape[0]
    if n_unique_coords < n_customers:
        print(
            f"  warning: {n_customers - n_unique_coords} coordinate collisions "
            "(IDs remain unique)"
        )

    csv_path = os.path.join(out_dir, Path(CUSTOMERS_CSV).name)
    customers.to_csv(csv_path, index=False)
    print(f"  wrote {csv_path}")

    print("Building distance / time matrices (this may take a minute)...")
    dist, time_h = _build_matrices(customers, depot_lat, depot_lng)

    labels = ["DEPOT"] + [f"C{i}" for i in customers["customer_id"]]
    dist_df = pd.DataFrame(dist, index=labels, columns=labels)
    time_df = pd.DataFrame(time_h, index=labels, columns=labels)

    dist_path = os.path.join(out_dir, Path(DISTANCE_MATRIX_XLSX).name)
    time_path = os.path.join(out_dir, Path(TIME_MATRIX_XLSX).name)

    dist_df.to_excel(dist_path)
    time_df.to_excel(time_path)
    print(f"  wrote {dist_path}  shape={dist_df.shape}")
    print(f"  wrote {time_path}  shape={time_df.shape}")

    # Tiny sample preview
    print("\nSample (first 5 customers):")
    print(customers.head().to_string(index=False))

    return customers, dist_df, time_df


def main():
    parser = argparse.ArgumentParser(description="Generate 1000-customer MOVRPTW dataset")
    parser.add_argument("--n", type=int, default=CUSTOMER_COUNT)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    generate_dataset(n_customers=args.n, seed=args.seed)


if __name__ == "__main__":
    main()
