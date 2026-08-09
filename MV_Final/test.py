"""
Quick sanity check for the optimizer, independent of the Flask app.
Run with: python test.py
"""

from models import Depot, Delivery, Vehicle
from optimizer import run_nsga2

depot = Depot(25.4358, 81.8463)

vehicles = [
    Vehicle("V1", 30, 8, 80),
    Vehicle("V2", 30, 8, 80)
]

deliveries = [
    Delivery(1, 25.45, 81.85, 5, "10:00-12:00"),
    Delivery(2, 25.46, 81.84, 4, "10:00-12:00"),
    Delivery(3, 25.44, 81.82, 6, "10:00-12:00"),
    Delivery(4, 25.43, 81.86, 3, "10:00-12:00")
]

pareto = run_nsga2(deliveries, vehicles, depot)

for solution in pareto:
    print(solution)
    print(solution.fitness.values)
