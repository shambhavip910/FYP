# constraints.py

from utils import calculate_distance, simulate_route_schedule


def check_capacity(route, deliveries, vehicle):

    total_demand = 0

    for customer_id in route:

        delivery = next(
            d for d in deliveries
            if d.id == customer_id
        )

        total_demand += delivery.demand

    return total_demand <= vehicle.capacity


def check_max_distance(route, deliveries, depot, vehicle):

    distance = calculate_distance(
        route,
        deliveries,
        depot
    )

    return distance <= vehicle.max_distance


def check_time_window(route, deliveries, depot):
    """
    Returns True only if every delivery on this route is reached within
    its time window (no lateness), based on a real leg-by-leg schedule
    simulation starting from the depot.
    """

    schedule = simulate_route_schedule(route, deliveries, depot)

    return schedule["late_count"] == 0


