from flask import Flask, request, jsonify
from flask_cors import CORS

from database import save_solution
from models import Depot, Delivery, Vehicle
from optimizer import run_nsga2
from nsga3 import run_nsga3, pareto_to_solutions
from ml_predict import predict_all, predict_demand, predict_delivery_time
from utils import haversine

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "MOVRP Backend Running"


@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "movrp-optimizer",
        "algorithms": ["NSGA-II", "NSGA-III"],
    })


@app.route("/predict/demand", methods=["POST"])
def predict_demand_route():
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(predict_demand(data))
    except Exception as e:
        return jsonify({"error": f"Demand prediction failed: {e}"}), 500


@app.route("/predict/delivery-time", methods=["POST"])
def predict_time_route():
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(predict_delivery_time(data))
    except Exception as e:
        return jsonify({"error": f"Delivery-time prediction failed: {e}"}), 500


@app.route("/predict", methods=["POST"])
def predict_route():
    data = request.get_json(silent=True) or {}
    try:
        return jsonify(predict_all(data))
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {e}"}), 500


@app.route("/predict/batch", methods=["POST"])
def predict_batch_route():
    """Enrich each delivery with ML demand + ETA using depot distance."""
    data = request.get_json(silent=True) or {}
    depot = data.get("depot") or {}
    deliveries = data.get("deliveries") or []
    context = data.get("context") or {}

    if "lat" not in depot or "lng" not in depot:
        return jsonify({"error": "depot.lat and depot.lng are required"}), 400

    enriched = []
    try:
        for d in deliveries:
            distance_km = haversine(
                float(depot["lat"]),
                float(depot["lng"]),
                float(d["lat"]),
                float(d["lng"]),
            )
            payload = {
                **context,
                "distance_km": distance_km,
                "historical_orders": d.get("historical_orders", 200),
            }
            prediction = predict_all(payload)
            user_demand = d.get("demand")
            use_ml = user_demand is None or user_demand == "" or float(user_demand) <= 0
            final_demand = (
                prediction["predicted_demand"]
                if use_ml
                else int(float(user_demand))
            )
            enriched.append({
                **d,
                "distance_km": round(distance_km, 3),
                "demand": final_demand,
                "user_demand": user_demand,
                "predicted_demand": prediction["predicted_demand"],
                "predicted_orders": prediction["predicted_orders"],
                "predicted_delivery_time_minutes": prediction[
                    "predicted_delivery_time_minutes"
                ],
                "demand_source": "ml" if use_ml else "user",
            })
    except Exception as e:
        return jsonify({"error": f"Batch prediction failed: {e}"}), 500

    return jsonify({"deliveries": enriched})


def _parse_problem(data):
    depot = Depot(
        data["depot"]["lat"],
        data["depot"]["lng"]
    )

    deliveries = []
    for d in data["deliveries"]:
        deliveries.append(
            Delivery(
                d["id"],
                d["lat"],
                d["lng"],
                d["demand"],
                d["time_window"],
                service_time=float(d.get("service_time", 0) or 0),
                ready_time=d.get("ready_time"),
                due_time=d.get("due_time"),
            )
        )

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

    return depot, deliveries, vehicles


@app.route("/optimize", methods=["POST"])
def optimize():
    """NSGA-II baseline: fuel_cost ↓, delivery_time ↓, workload_balance ↓."""

    data = request.get_json(silent=True)

    if data is None:
        return jsonify({"error": "JSON not received"}), 400

    try:
        depot, deliveries, vehicles = _parse_problem(data)
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e}"}), 400

    if not deliveries:
        return jsonify({"error": "At least one delivery is required"}), 400

    if not vehicles:
        return jsonify({"error": "At least one vehicle is required"}), 400

    try:
        pareto_front = run_nsga2(deliveries, vehicles, depot)
    except Exception as e:
        return jsonify({"error": f"Optimization failed: {e}"}), 500

    solutions = []
    seen_routes = set()

    for individual in pareto_front:
        route = [list(r) for r in individual]

        route_key = tuple(sorted(tuple(r) for r in route))
        if route_key in seen_routes:
            continue
        seen_routes.add(route_key)

        solution = {
            "route": route,
            "algorithm": "NSGA-II",
            "fitness": {
                "fuel_cost": individual.fitness.values[0],
                "delivery_time": individual.fitness.values[1],
                "workload_balance": individual.fitness.values[2]
            }
        }

        inserted_id = save_solution(dict(solution))
        if inserted_id:
            solution["id"] = inserted_id

        solutions.append(solution)

    return jsonify({
        "message": "Optimization Completed",
        "algorithm": "NSGA-II",
        "solutions": solutions
    })


@app.route("/optimize/nsga3", methods=["POST"])
def optimize_nsga3():
    """
    NSGA-III Objective Combination #1:
      vehicles ↓, distance ↓, reliability ↑, waiting_time ↓, delay ↓
    """

    data = request.get_json(silent=True)

    if data is None:
        return jsonify({"error": "JSON not received"}), 400

    try:
        depot, deliveries, vehicles = _parse_problem(data)
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e}"}), 400

    if not deliveries:
        return jsonify({"error": "At least one delivery is required"}), 400

    if not vehicles:
        return jsonify({"error": "At least one vehicle is required"}), 400

    pop = data.get("population_size")
    gen = data.get("generations")

    try:
        pareto_front = run_nsga3(
            deliveries,
            vehicles,
            depot,
            population_size=pop,
            generations=gen,
            verbose=False,
        )
        solutions = pareto_to_solutions(pareto_front)
    except Exception as e:
        return jsonify({"error": f"NSGA-III optimization failed: {e}"}), 500

    for solution in solutions:
        inserted_id = save_solution(dict(solution))
        if inserted_id:
            solution["id"] = inserted_id

    return jsonify({
        "message": "NSGA-III Optimization Completed",
        "algorithm": "NSGA-III",
        "objective_combination": "OC1",
        "objectives": {
            "vehicles_used": "minimize",
            "distance": "minimize",
            "reliability": "maximize",
            "waiting_time": "minimize",
            "delay": "minimize",
        },
        "solutions": solutions,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
