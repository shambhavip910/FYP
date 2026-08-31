# config.py

# -----------------------------
# NSGA-II Configuration (baseline, 3 objectives)
# -----------------------------
POPULATION_SIZE = 50
GENERATIONS = 50

CROSSOVER_RATE = 0.8
MUTATION_RATE = 0.2

# -----------------------------
# NSGA-III Configuration (OC1, 5 objectives)
# -----------------------------
# Keep modest by default so a 1,000-customer run finishes in reasonable time.
# Increase for higher solution quality, e.g. POP=100, GEN=100–200.
NSGA3_POPULATION_SIZE = 56
NSGA3_GENERATIONS = 40
NSGA3_CROSSOVER_RATE = 0.8
NSGA3_MUTATION_RATE = 0.25

# Das–Dennis reference-point divisions (nobj=5).
# p=4 → C(5+4-1, 4) = 70 reference points (good match for pop ≈ 56–84).
NSGA3_REF_POINT_DIVISIONS = 4

# Fleet size available for the 1,000-customer OC1 instance.
# Objective 1 minimizes vehicles *used* (non-empty routes), not this pool size.
# ~demand 1–10 (mean≈5.5) with capacity 80 ⇒ ≈14 customers/vehicle
# ⇒ need ≥ ~70 vehicles for capacity feasibility on 1000 customers.
NSGA3_NUM_VEHICLES = 80
NSGA3_VEHICLE_CAPACITY = 80
NSGA3_VEHICLE_MAX_DISTANCE = 500.0
NSGA3_VEHICLE_FUEL_RATE = 8.0

# -----------------------------
# Vehicle / schedule Parameters
# -----------------------------
AVERAGE_SPEED = 40          # km/hr
FUEL_COST_PER_KM = 8        # ₹/km

# Time all vehicles depart the depot (24hr clock, as a float, e.g. 9.5 = 9:30 AM)
DEPOT_START_TIME = 9.0

# Default depot (Prayagraj) — matches existing dummy data
DEFAULT_DEPOT_LAT = 25.4358
DEFAULT_DEPOT_LNG = 81.8463

# -----------------------------
# Penalty Values (NSGA-II baseline only)
# -----------------------------
# NSGA-III OC1 does NOT apply these to objective values. Waiting / delay /
# reliability are already explicit objectives; capacity & max-distance are
# handled via a separate constraint-violation measure (see fitness_oc1.py).
CAPACITY_PENALTY = 10000
TIME_WINDOW_PENALTY = 10000
DISTANCE_PENALTY = 10000

# -----------------------------
# Dataset / paths
# -----------------------------
CUSTOMER_COUNT = 1000
DATA_DIR = "data"
RESULTS_DIR = "results"
CUSTOMERS_CSV = "data/customers_1000.csv"
DISTANCE_MATRIX_XLSX = "data/distance_matrix.xlsx"
TIME_MATRIX_XLSX = "data/time_matrix.xlsx"
PARETO_CSV = "results/pareto_solutions.csv"
PARETO_PLOT = "results/pareto_front.png"

# -----------------------------
# MongoDB
# -----------------------------
MONGO_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "MOVRP"
COLLECTION_NAME = "optimized_routes"
