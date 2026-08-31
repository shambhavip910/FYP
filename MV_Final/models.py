class Depot:

    def __init__(self, lat, lng):
        self.lat = lat
        self.lng = lng


class Delivery:
    """
    Customer / delivery stop.

    time_window: "HH:MM-HH:MM" string used by the existing NSGA-II path.
    ready_time / due_time: float hours (e.g. 10.5 = 10:30) for NSGA-III OC1.
    service_time: hours spent serving the customer (default 0 for NSGA-II compat).
    """

    def __init__(
        self,
        id,
        lat,
        lng,
        demand,
        time_window,
        service_time=0.0,
        ready_time=None,
        due_time=None,
    ):
        self.id = id
        self.lat = lat
        self.lng = lng
        self.demand = demand
        self.time_window = time_window
        self.service_time = float(service_time)

        if ready_time is not None and due_time is not None:
            self.ready_time = float(ready_time)
            self.due_time = float(due_time)
        else:
            from utils import parse_time_window

            self.ready_time, self.due_time = parse_time_window(time_window)


class Vehicle:

    def __init__(self, id, capacity, fuel_rate, max_distance):
        self.id = id
        self.capacity = capacity
        self.fuel_rate = fuel_rate
        self.max_distance = max_distance
