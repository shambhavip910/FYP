from flask import Flask, request, jsonify

from database import save_solution
from models import Depot, Delivery, Vehicle
from optimizer import run_nsga2

app = Flask(__name__)


@app.route("/")
def home():
    return "MOVRP Backend Running"


@app.route("/optimize", methods=["POST"])
def optimize():

    data = request.get_json(silent=True)

    if data is None:
        return jsonify({"error": "JSON not received"}), 400

    try:
        # ---------------- Depot ----------------
        depot = Depot(
            data["depot"]["lat"],
            data["depot"]["lng"]
        )

        # ---------------- Deliveries ----------------
        deliveries = []
        for d in data["deliveries"]:
            deliveries.append(
                Delivery(
                    d["id"],
                    d["lat"],
                    d["lng"],
                    d["demand"],
                    d["time_window"]
                )
            )

        # ---------------- Vehicles ----------------
        vehicles = []
        for v in data["vehicles"]:
            vehicles.append(
                Vehicle(
                    v["id"],
                    v["capacity"],
                    v["fuel_rate"],
                    v["max_distance"]
                )
            )
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e}"}), 400

    if not deliveries:
        return jsonify({"error": "At least one delivery is required"}), 400

    if not vehicles:
        return jsonify({"error": "At least one vehicle is required"}), 400

    # ---------------- Run Optimization ----------------
    try:
        pareto_front = run_nsga2(deliveries, vehicles, depot)
    except Exception as e:
        return jsonify({"error": f"Optimization failed: {e}"}), 500

    solutions = []

    for individual in pareto_front:
        solution = {
            "route": list(individual),
            "fitness": {
                "fuel_cost": individual.fitness.values[0],
                "delivery_time": individual.fitness.values[1],
                "workload_balance": individual.fitness.values[2]
            }
        }

        save_solution(solution)
        solution.pop("_id", None)
        solutions.append(solution)

    return jsonify({
        "message": "Optimization Completed",
        "solutions": solutions
    })


if __name__ == "__main__":
    app.run(debug=True)
