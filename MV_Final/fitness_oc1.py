"""
NSGA-III Objective Combination #1 (OC1) — five objectives.

  1. Vehicles used          MINIMIZE
  2. Total distance (km)    MINIMIZE
  3. Reliability            MAXIMIZE   (on-time deliveries / total)
  4. Total waiting time (h) MINIMIZE
  5. Total delay (h)        MINIMIZE

Constraint handling (why not copy NSGA-II penalties):
  Waiting, delay, and reliability *are* the time-window objectives.
  Adding TIME_WINDOW_PENALTY on top would double-count lateness and warp
  NSGA-III's reference-point niching.

  Capacity and max-distance are hard constraints. We track a separate
  scalar `constraint_violation` (sum of overflows). Survival selection in
  nsga3.py prefers feasible individuals first (Deb's constraint-domination
  idea), so objective values themselves stay clean and comparable.
"""

from utils import (
    calculate_distance,
    simulate_route_schedule,
    build_delivery_map,
)
from constraints import capacity_overflow, distance_overflow


def vehicles_used(individual):
    """Number of non-empty routes (vehicles actually used)."""
    return sum(1 for route in individual if route)


def evaluate_oc1(individual, deliveries, depot, vehicles):
    """
    Returns a 5-tuple suitable for DEAP FitnessOC1 weights:
      (-vehicles, -distance, +reliability, -waiting, -delay) handled via weights;
    here we return the raw values:
      (vehicles_used, distance, reliability, waiting_time, delay)

    Also attaches ``individual.constraint_violation`` and ``individual.metrics``.
    """

    delivery_map = build_delivery_map(deliveries)

    total_distance = 0.0
    total_waiting = 0.0
    total_delay = 0.0
    on_time = 0
    served = 0
    cv = 0.0

    for i, route in enumerate(individual):
        if i >= len(vehicles):
            # Extra routes beyond fleet — treat as hard violation
            cv += 1e6
            continue

        vehicle = vehicles[i]

        route_distance = calculate_distance(
            route, deliveries, depot, delivery_map=delivery_map
        )
        total_distance += route_distance

        schedule = simulate_route_schedule(
            route,
            deliveries,
            depot,
            delivery_map=delivery_map,
            include_service_time=True,
        )

        total_waiting += schedule["waiting_time"]
        total_delay += schedule["lateness"]
        on_time += schedule["on_time_count"]
        served += schedule["served_count"]

        cv += capacity_overflow(
            route, deliveries, vehicle, delivery_map=delivery_map
        )
        cv += distance_overflow(
            route, deliveries, depot, vehicle, delivery_map=delivery_map
        )

    n_vehicles = vehicles_used(individual)
    reliability = (on_time / served) if served > 0 else 0.0

    metrics = {
        "vehicles_used": n_vehicles,
        "distance": round(total_distance, 4),
        "reliability": round(reliability, 6),
        "waiting_time": round(total_waiting, 4),
        "delay": round(total_delay, 4),
        "constraint_violation": round(cv, 4),
        "on_time_count": on_time,
        "served_count": served,
    }

    individual.constraint_violation = cv
    individual.metrics = metrics

    return (
        float(n_vehicles),
        float(total_distance),
        float(reliability),
        float(total_waiting),
        float(total_delay),
    )


def solution_dict(individual, solution_id=None):
    """Serialize a Pareto individual into the API / results schema."""

    metrics = getattr(individual, "metrics", None)
    if metrics is None:
        raise ValueError("Individual has no metrics; evaluate_oc1 first")

    payload = {
        "routes": [list(r) for r in individual],
        "vehicles_used": metrics["vehicles_used"],
        "distance": metrics["distance"],
        "reliability": metrics["reliability"],
        "waiting_time": metrics["waiting_time"],
        "delay": metrics["delay"],
        "constraint_violation": metrics["constraint_violation"],
        "algorithm": "NSGA-III",
        "objective_combination": "OC1",
    }

    if solution_id is not None:
        payload["solution_id"] = solution_id

    return payload
