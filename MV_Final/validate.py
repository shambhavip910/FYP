"""
Pre-run and post-run validation for the NSGA-III OC1 pipeline.
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import pandas as pd

from config import (
    CUSTOMER_COUNT,
    CUSTOMERS_CSV,
    DISTANCE_MATRIX_XLSX,
    TIME_MATRIX_XLSX,
    DEFAULT_DEPOT_LAT,
    DEFAULT_DEPOT_LNG,
)
from constraints import assignment_is_valid
from models import Delivery, Depot, Vehicle
from utils import build_delivery_map


class ValidationError(Exception):
    pass


def _ok(msg):
    print(f"  ✓ {msg}")


def _fail(msg):
    raise ValidationError(msg)


def load_customers_csv(path=CUSTOMERS_CSV):
    df = pd.read_csv(path)
    required = {
        "customer_id",
        "latitude",
        "longitude",
        "demand",
        "service_time",
        "ready_time",
        "due_time",
    }
    missing = required - set(df.columns)
    if missing:
        _fail(f"customers CSV missing columns: {missing}")
    return df


def customers_to_deliveries(df):
    deliveries = []
    for _, row in df.iterrows():
        tw = row.get("time_window")
        if pd.isna(tw) or not tw:
            from utils import hours_to_hhmm

            tw = f"{hours_to_hhmm(row['ready_time'])}-{hours_to_hhmm(row['due_time'])}"

        deliveries.append(
            Delivery(
                id=int(row["customer_id"]),
                lat=float(row["latitude"]),
                lng=float(row["longitude"]),
                demand=float(row["demand"]),
                time_window=str(tw),
                service_time=float(row["service_time"]),
                ready_time=float(row["ready_time"]),
                due_time=float(row["due_time"]),
            )
        )
    return deliveries


def make_fleet(n_vehicles, capacity, max_distance, fuel_rate=8.0):
    return [
        Vehicle(
            id=f"V{i + 1:03d}",
            capacity=capacity,
            fuel_rate=fuel_rate,
            max_distance=max_distance,
        )
        for i in range(n_vehicles)
    ]


def validate_dataset(
    customers_path=CUSTOMERS_CSV,
    distance_path=DISTANCE_MATRIX_XLSX,
    time_path=TIME_MATRIX_XLSX,
    expected_n=CUSTOMER_COUNT,
):
    print("Validating dataset...")

    if not Path(customers_path).exists():
        _fail(f"missing {customers_path}")

    df = load_customers_csv(customers_path)

    if len(df) != expected_n:
        _fail(f"expected {expected_n} customers, found {len(df)}")
    _ok(f"dataset contains exactly {expected_n} customers")

    if not df["customer_id"].is_unique:
        _fail("customer_id values are not unique")
    _ok("customer IDs are unique")

    if not (df["demand"] > 0).all():
        _fail("all demand must be > 0")
    _ok("demands are positive")

    if not (df["ready_time"] <= df["due_time"]).all():
        _fail("ready_time must be <= due_time for all customers")
    _ok("time windows are valid (ready <= due)")

    if df[["latitude", "longitude"]].isna().any().any():
        _fail("invalid geographic coordinates (NaN)")
    _ok("geographic coordinates are present")

    # Matrices
    for label, path in (("distance", distance_path), ("time", time_path)):
        if not Path(path).exists():
            _fail(f"missing {path}")
        mat = pd.read_excel(path, index_col=0)
        expected_dim = expected_n + 1
        if mat.shape != (expected_dim, expected_dim):
            _fail(
                f"{label} matrix shape {mat.shape}, expected "
                f"({expected_dim}, {expected_dim})"
            )
        if mat.isna().any().any():
            _fail(f"{label} matrix contains NaN")
        _ok(f"{label} matrix dimensions correct {mat.shape}")

    return df


def validate_solution(individual, deliveries, vehicles, metrics):
    ok, detail = assignment_is_valid(individual, deliveries)
    if not ok:
        _fail(f"assignment invalid: {detail}")

    if metrics["reliability"] < 0 or metrics["reliability"] > 1:
        _fail(f"reliability out of range: {metrics['reliability']}")

    if metrics["waiting_time"] < 0:
        _fail("waiting_time < 0")
    if metrics["delay"] < 0:
        _fail("delay < 0")

    if not (1 <= metrics["vehicles_used"] <= len(vehicles)):
        _fail(f"invalid vehicles_used={metrics['vehicles_used']}")

    for key in ("distance", "waiting_time", "delay", "reliability"):
        if not math.isfinite(metrics[key]):
            _fail(f"{key} is not finite")

    return True


def validate_pareto_nondominated(solutions, weights=(-1, -1, 1, -1, -1)):
    """
    Verify no solution in the reported set is dominated by another,
    using DEAP-style weights (negative = minimize, positive = maximize).
    """

    objs = []
    for s in solutions:
        objs.append(
            (
                s["vehicles_used"],
                s["distance"],
                s["reliability"],
                s["waiting_time"],
                s["delay"],
            )
        )

    def dominates(a, b):
        better_or_equal = True
        strictly_better = False
        for i, w in enumerate(weights):
            if w < 0:
                if a[i] > b[i]:
                    better_or_equal = False
                    break
                if a[i] < b[i]:
                    strictly_better = True
            else:
                if a[i] < b[i]:
                    better_or_equal = False
                    break
                if a[i] > b[i]:
                    strictly_better = True
        return better_or_equal and strictly_better

    for i, a in enumerate(objs):
        for j, b in enumerate(objs):
            if i == j:
                continue
            if dominates(b, a):
                _fail(
                    f"solution {solutions[i].get('solution_id', i)} is dominated "
                    f"by solution {solutions[j].get('solution_id', j)}"
                )

    _ok(f"Pareto set is mutually non-dominated ({len(solutions)} solutions)")
    return True


def default_depot():
    return Depot(DEFAULT_DEPOT_LAT, DEFAULT_DEPOT_LNG)
