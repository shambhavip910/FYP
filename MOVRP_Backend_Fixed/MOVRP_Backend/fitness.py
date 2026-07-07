from utils import calculate_distance
from constraints import (
    check_capacity,
    check_max_distance,
    check_time_window
)

from config import (
    FUEL_COST_PER_KM,
    AVERAGE_SPEED,
    CAPACITY_PENALTY,
    DISTANCE_PENALTY,
    TIME_WINDOW_PENALTY
)

def calculate_fuel(distance):

    return distance * FUEL_COST_PER_KM

def calculate_time(distance):

    return distance / AVERAGE_SPEED

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

        total_time += calculate_time(route_distance)

        total_fuel += calculate_fuel(route_distance)

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
        if not check_time_window(
            route,
            deliveries
        ):

            penalty += TIME_WINDOW_PENALTY

    workload = calculate_workload(individual)

    return (
        total_fuel + penalty,
        total_time + penalty,
        workload + penalty
    )
