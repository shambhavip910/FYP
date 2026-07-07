class Depot:

    def __init__(self, lat, lng):
        self.lat = lat
        self.lng = lng


class Delivery:

    def __init__(self, id, lat, lng, demand, time_window):

        self.id = id
        self.lat = lat
        self.lng = lng
        self.demand = demand
        self.time_window = time_window


class Vehicle:

    def __init__(self, id, capacity, fuel_rate, max_distance):

        self.id = id
        self.capacity = capacity
        self.fuel_rate = fuel_rate
        self.max_distance = max_distance