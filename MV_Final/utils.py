from math import radians, sin, cos, sqrt, atan2

from config import AVERAGE_SPEED, DEPOT_START_TIME


def haversine(lat1, lon1, lat2, lon2):

    R = 6371

    dlat = radians(lat2-lat1)
    dlon = radians(lon2-lon1)

    a = sin(dlat/2)**2 + \
        cos(radians(lat1))*cos(radians(lat2))*sin(dlon/2)**2

    c = 2*atan2(sqrt(a), sqrt(1-a))

    return R*c


def calculate_distance(route, deliveries, depot):

    if not route:
        return 0

    total = 0

    current_lat = depot.lat
    current_lng = depot.lng

    for customer in route:

        delivery = next(
            d for d in deliveries
            if d.id == customer
        )

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


def simulate_route_schedule(route, deliveries, depot, start_time=None):
    """
    Walks a single vehicle's route leg by leg starting from the depot,
    tracking real elapsed time against each delivery's time window.

    Returns a dict with:
      - driving_time: total hours spent driving
      - waiting_time: total hours spent waiting for a window to open
      - lateness: total hours arrived past a window's close
      - late_count: number of deliveries arrived at late

    This is what actually makes delivery_time a genuine second objective
    instead of being a fixed multiple of distance/fuel: two routes can
    have the same total distance but very different waiting/lateness
    depending on the order customers are visited in.
    """

    if start_time is None:
        start_time = DEPOT_START_TIME

    if not route:
        return {
            "driving_time": 0.0,
            "waiting_time": 0.0,
            "lateness": 0.0,
            "late_count": 0
        }

    current_lat, current_lng = depot.lat, depot.lng
    current_time = start_time

    driving_time = 0.0
    waiting_time = 0.0
    lateness = 0.0
    late_count = 0

    for customer in route:

        delivery = next(
            d for d in deliveries
            if d.id == customer
        )

        leg_distance = haversine(
            current_lat,
            current_lng,
            delivery.lat,
            delivery.lng
        )

        leg_time = leg_distance / AVERAGE_SPEED

        driving_time += leg_time
        current_time += leg_time

        window_start, window_end = parse_time_window(delivery.time_window)

        if current_time < window_start:
            waiting_time += (window_start - current_time)
            current_time = window_start
        elif current_time > window_end:
            lateness += (current_time - window_end)
            late_count += 1

        current_lat, current_lng = delivery.lat, delivery.lng

    return {
        "driving_time": driving_time,
        "waiting_time": waiting_time,
        "lateness": lateness,
        "late_count": late_count
    }

