"""
NSGA-II baseline fitness (Objective Combination — existing 3 objectives).

Objectives (all minimized):
  1. Fuel cost
  2. Delivery time  (driving + waiting + lateness)
  3. Workload imbalance (max customers/route − min customers/route)

Constraint violations add large penalties to every objective (legacy design).
NSGA-III OC1 uses fitness_oc1.py instead — do not mix these objective sets.
"""

from utils import calculate_distance, simulate_route_schedule, build_delivery_map
from constraints import (
    check_capacity,
    check_max_distance,
)

from config import (
    FUEL_COST_PER_KM,
    CAPACITY_PENALTY,
    DISTANCE_PENALTY,
    TIME_WINDOW_PENALTY,
)


def calculate_fuel(distance, fuel_rate=None):

    rate = fuel_rate if fuel_rate is not None else FUEL_COST_PER_KM
    return distance * rate


def calculate_workload(routes):

    workloads = []

    for route in routes:
        workloads.append(len(route))

    if not workloads:
        return 0

    return max(workloads) - min(workloads)


def evaluate(individual, deliveries, depot, vehicles):

    delivery_map = build_delivery_map(deliveries)

    total_distance = 0.0
    total_time = 0.0
    total_fuel = 0.0
    penalty = 0.0

    for i, route in enumerate(individual):

        vehicle = vehicles[i]

        route_distance = calculate_distance(
            route,
            deliveries,
            depot,
            delivery_map=delivery_map,
        )

        total_distance += route_distance
        total_fuel += calculate_fuel(route_distance, vehicle.fuel_rate)

        schedule = simulate_route_schedule(
            route,
            deliveries,
            depot,
            delivery_map=delivery_map,
        )

        total_time += (
            schedule["driving_time"]
            + schedule["waiting_time"]
            + schedule["lateness"]
        )

        if not check_capacity(route, deliveries, vehicle, delivery_map=delivery_map):
            penalty += CAPACITY_PENALTY

        if not check_max_distance(
            route, deliveries, depot, vehicle, delivery_map=delivery_map
        ):
            penalty += DISTANCE_PENALTY

        if schedule["late_count"] > 0:
            penalty += TIME_WINDOW_PENALTY

    workload = calculate_workload(individual)

    return (
        total_fuel + penalty,
        total_time + penalty,
        workload + penalty,
    )
