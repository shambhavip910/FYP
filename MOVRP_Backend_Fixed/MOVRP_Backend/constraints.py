# constraints.py

from utils import calculate_distance


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


def check_time_window(route, deliveries):

    # Abhi placeholder
    return True

