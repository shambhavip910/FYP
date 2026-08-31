# constraints.py

from utils import calculate_distance, simulate_route_schedule, build_delivery_map


def check_capacity(route, deliveries, vehicle, delivery_map=None):

    if delivery_map is None:
        delivery_map = build_delivery_map(deliveries)

    total_demand = 0.0

    for customer_id in route:
        total_demand += delivery_map[customer_id].demand

    return total_demand <= vehicle.capacity


def capacity_overflow(route, deliveries, vehicle, delivery_map=None):
    """How much demand exceeds capacity (0 if feasible)."""

    if delivery_map is None:
        delivery_map = build_delivery_map(deliveries)

    total_demand = sum(delivery_map[c].demand for c in route)
    return max(0.0, total_demand - vehicle.capacity)


def check_max_distance(route, deliveries, depot, vehicle, delivery_map=None):

    distance = calculate_distance(
        route,
        deliveries,
        depot,
        delivery_map=delivery_map,
    )

    return distance <= vehicle.max_distance


def distance_overflow(route, deliveries, depot, vehicle, delivery_map=None):
    """How much route distance exceeds max_distance (0 if feasible)."""

    distance = calculate_distance(
        route,
        deliveries,
        depot,
        delivery_map=delivery_map,
    )
    return max(0.0, distance - vehicle.max_distance)


def check_time_window(route, deliveries, depot, delivery_map=None):
    """
    Returns True only if every delivery on this route is reached within
    its time window (no lateness), based on a real leg-by-leg schedule
    simulation starting from the depot.
    """

    schedule = simulate_route_schedule(
        route, deliveries, depot, delivery_map=delivery_map
    )

    return schedule["late_count"] == 0


def assignment_is_valid(individual, deliveries):
    """
    Every customer appears exactly once across all routes.
    Returns (ok: bool, detail: str).
    """

    all_customers = {d.id for d in deliveries}
    flat = [c for route in individual for c in route]

    if len(flat) != len(set(flat)):
        return False, "duplicate customers in solution"

    if set(flat) != all_customers:
        missing = all_customers - set(flat)
        extra = set(flat) - all_customers
        return False, f"missing={sorted(missing)[:5]} extra={sorted(extra)[:5]}"

    return True, "ok"
