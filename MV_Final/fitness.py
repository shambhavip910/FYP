from utils import calculate_distance, simulate_route_schedule
from constraints import (
    check_capacity,
    check_max_distance
)

from config import (
    FUEL_COST_PER_KM,
    CAPACITY_PENALTY,
    DISTANCE_PENALTY,
    TIME_WINDOW_PENALTY
)

def calculate_fuel(distance, fuel_rate=None):

    rate = fuel_rate if fuel_rate is not None else FUEL_COST_PER_KM
    return distance * rate

def calculate_workload(routes):

    workloads = []

    for route in routes:

        workloads.append(len(route))

    return max(workloads) - min(workloads)

def evaluate(individual,
             deliveries,
             depot,
             vehicles):

    total_distance = 0

    total_time = 0

    total_fuel = 0

    penalty = 0

    for i, route in enumerate(individual):

        vehicle = vehicles[i]

        route_distance = calculate_distance(
            route,
            deliveries,
            depot
        )

        total_distance += route_distance

        total_fuel += calculate_fuel(route_distance, vehicle.fuel_rate)

        # Real elapsed time: driving + any waiting for a window to open +
        # any lateness past a window's close. This is what makes
        # delivery_time a genuine second objective instead of a fixed
        # multiple of fuel_cost/distance.
        schedule = simulate_route_schedule(
            route,
            deliveries,
            depot
        )

        total_time += (
            schedule["driving_time"]
            + schedule["waiting_time"]
            + schedule["lateness"]
        )

        # Capacity
        if not check_capacity(
            route,
            deliveries,
            vehicle
        ):

            penalty += CAPACITY_PENALTY

        # Maximum Distance
        if not check_max_distance(
            route,
            deliveries,
            depot,
            vehicle
        ):

            penalty += DISTANCE_PENALTY

        # Time Window
        if schedule["late_count"] > 0:

            penalty += TIME_WINDOW_PENALTY

    workload = calculate_workload(individual)

    return (
        total_fuel + penalty,
        total_time + penalty,
        workload + penalty
    )
