from math import radians, sin, cos, sqrt, atan2

from config import AVERAGE_SPEED, DEPOT_START_TIME


def haversine(lat1, lon1, lat2, lon2):

    R = 6371

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = sin(dlat / 2) ** 2 + \
        cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


def build_delivery_map(deliveries):
    """O(1) lookup by customer id — critical for 1,000-customer evaluation."""
    return {d.id: d for d in deliveries}


def calculate_distance(route, deliveries, depot, delivery_map=None):

    if not route:
        return 0.0

    if delivery_map is None:
        delivery_map = build_delivery_map(deliveries)

    total = 0.0

    current_lat = depot.lat
    current_lng = depot.lng

    for customer in route:
        delivery = delivery_map[customer]

        total += haversine(
            current_lat,
            current_lng,
            delivery.lat,
            delivery.lng
        )

        current_lat = delivery.lat
        current_lng = delivery.lng

    total += haversine(
        current_lat,
        current_lng,
        depot.lat,
        depot.lng
    )

    return total


def parse_time_window(window_str):
    """
    Converts a "HH:MM-HH:MM" string into (start_hour, end_hour) as floats,
    e.g. "10:30-14:00" -> (10.5, 14.0)
    """

    start_str, end_str = window_str.split("-")

    start_h, start_m = (int(x) for x in start_str.strip().split(":"))
    end_h, end_m = (int(x) for x in end_str.strip().split(":"))

    return start_h + start_m / 60, end_h + end_m / 60


def hours_to_hhmm(hours):
    """Format a float hour value as HH:MM."""
    h = int(hours) % 24
    m = int(round((hours - int(hours)) * 60)) % 60
    return f"{h:02d}:{m:02d}"


def simulate_route_schedule(
    route,
    deliveries,
    depot,
    start_time=None,
    delivery_map=None,
    include_service_time=True,
):
    """
    Walks a single vehicle's route leg by leg starting from the depot,
    tracking real elapsed time against each delivery's time window.

    Returns a dict with:
      - driving_time: total hours spent driving
      - waiting_time: total hours spent waiting for a window to open
      - lateness: total hours arrived past a window's close (delay)
      - late_count: number of deliveries arrived late
      - on_time_count: number of deliveries arrived on time (arrival <= due)
      - served_count: number of customers on this route
    """

    if start_time is None:
        start_time = DEPOT_START_TIME

    if not route:
        return {
            "driving_time": 0.0,
            "waiting_time": 0.0,
            "lateness": 0.0,
            "late_count": 0,
            "on_time_count": 0,
            "served_count": 0,
        }

    if delivery_map is None:
        delivery_map = build_delivery_map(deliveries)

    current_lat, current_lng = depot.lat, depot.lng
    current_time = start_time

    driving_time = 0.0
    waiting_time = 0.0
    lateness = 0.0
    late_count = 0
    on_time_count = 0

    for customer in route:
        delivery = delivery_map[customer]

        leg_distance = haversine(
            current_lat,
            current_lng,
            delivery.lat,
            delivery.lng
        )

        leg_time = leg_distance / AVERAGE_SPEED

        driving_time += leg_time
        current_time += leg_time

        # Prefer explicit ready/due when present (NSGA-III dataset);
        # fall back to parsing time_window (NSGA-II path).
        if hasattr(delivery, "ready_time") and hasattr(delivery, "due_time"):
            window_start = delivery.ready_time
            window_end = delivery.due_time
        else:
            window_start, window_end = parse_time_window(delivery.time_window)

        if current_time < window_start:
            waiting_time += (window_start - current_time)
            current_time = window_start

        if current_time > window_end:
            lateness += (current_time - window_end)
            late_count += 1
        else:
            on_time_count += 1

        service = getattr(delivery, "service_time", 0.0) or 0.0
        if include_service_time and service > 0:
            current_time += service

        current_lat, current_lng = delivery.lat, delivery.lng

    return {
        "driving_time": driving_time,
        "waiting_time": waiting_time,
        "lateness": lateness,
        "late_count": late_count,
        "on_time_count": on_time_count,
        "served_count": len(route),
    }
