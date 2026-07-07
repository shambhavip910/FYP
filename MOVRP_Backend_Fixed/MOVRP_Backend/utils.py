from math import radians, sin, cos, sqrt, atan2


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
