# config.py

# -----------------------------
# NSGA-II Configuration
# -----------------------------
POPULATION_SIZE = 50
GENERATIONS = 50

CROSSOVER_RATE = 0.8
MUTATION_RATE = 0.2

# -----------------------------
# Vehicle Parameters
# -----------------------------
AVERAGE_SPEED = 40          # km/hr
FUEL_COST_PER_KM = 8        # ₹/km

# Time all vehicles depart the depot (24hr clock, as a float, e.g. 9.5 = 9:30 AM)
DEPOT_START_TIME = 9.0

# -----------------------------
# Penalty Values
# -----------------------------
CAPACITY_PENALTY = 10000
TIME_WINDOW_PENALTY = 10000
DISTANCE_PENALTY = 10000

# -----------------------------
# MongoDB
# -----------------------------
MONGO_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "MOVRP"
COLLECTION_NAME = "optimized_routes"