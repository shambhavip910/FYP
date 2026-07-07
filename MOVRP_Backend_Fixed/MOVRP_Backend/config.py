# config.py

# -----------------------------
# NSGA-II Configuration
# -----------------------------
POPULATION_SIZE = 100
GENERATIONS = 100

CROSSOVER_RATE = 0.8
MUTATION_RATE = 0.2

# -----------------------------
# Vehicle Parameters
# -----------------------------
AVERAGE_SPEED = 40          # km/hr
FUEL_COST_PER_KM = 8        # ₹/km

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