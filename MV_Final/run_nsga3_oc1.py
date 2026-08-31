"""
End-to-end runner for NSGA-III Objective Combination #1 on the
1,000-customer dataset.

Usage (from MV_Final/):
  python generate_dataset.py
  python run_nsga3_oc1.py

Optional flags:
  python run_nsga3_oc1.py --pop 70 --gen 50 --skip-generate
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from config import (
    CUSTOMERS_CSV,
    NSGA3_GENERATIONS,
    NSGA3_NUM_VEHICLES,
    NSGA3_POPULATION_SIZE,
    NSGA3_REF_POINT_DIVISIONS,
    NSGA3_VEHICLE_CAPACITY,
    NSGA3_VEHICLE_FUEL_RATE,
    NSGA3_VEHICLE_MAX_DISTANCE,
    PARETO_CSV,
    PARETO_PLOT,
    RESULTS_DIR,
)
from database import save_solution
from generate_dataset import generate_dataset
from nsga3 import pareto_to_solutions, run_nsga3
from validate import (
    ValidationError,
    customers_to_deliveries,
    default_depot,
    load_customers_csv,
    make_fleet,
    validate_dataset,
    validate_pareto_nondominated,
    validate_solution,
)
from visualization import plot_pareto_analysis, save_pareto_csv


def main():
    parser = argparse.ArgumentParser(description="Run NSGA-III OC1 on 1000 customers")
    parser.add_argument("--pop", type=int, default=NSGA3_POPULATION_SIZE)
    parser.add_argument("--gen", type=int, default=NSGA3_GENERATIONS)
    parser.add_argument("--vehicles", type=int, default=NSGA3_NUM_VEHICLES)
    parser.add_argument("--ref-p", type=int, default=NSGA3_REF_POINT_DIVISIONS)
    parser.add_argument("--skip-generate", action="store_true")
    parser.add_argument("--no-mongo", action="store_true")
    args = parser.parse_args()

    Path(RESULTS_DIR).mkdir(parents=True, exist_ok=True)

    # ---- Dataset ----
    if not args.skip_generate or not Path(CUSTOMERS_CSV).exists():
        generate_dataset()
    else:
        print(f"Using existing dataset at {CUSTOMERS_CSV}")

    try:
        df = validate_dataset()
    except ValidationError as e:
        print(f"VALIDATION FAILED: {e}", file=sys.stderr)
        sys.exit(1)

    deliveries = customers_to_deliveries(df)
    depot = default_depot()
    vehicles = make_fleet(
        args.vehicles,
        NSGA3_VEHICLE_CAPACITY,
        NSGA3_VEHICLE_MAX_DISTANCE,
        NSGA3_VEHICLE_FUEL_RATE,
    )

    print(
        f"\nFleet: {len(vehicles)} vehicles | capacity={NSGA3_VEHICLE_CAPACITY} | "
        f"max_distance={NSGA3_VEHICLE_MAX_DISTANCE} km"
    )
    print(
        "Tip: increase --pop / --gen for better fronts "
        "(e.g. --pop 100 --gen 150)."
    )

    # ---- Optimize ----
    pareto = run_nsga3(
        deliveries,
        vehicles,
        depot,
        population_size=args.pop,
        generations=args.gen,
        ref_point_divisions=args.ref_p,
        verbose=True,
    )

    solutions = pareto_to_solutions(pareto)

    # ---- Validate each solution ----
    print("\nValidating Pareto solutions...")
    for sol, ind in zip(solutions, pareto):
        try:
            validate_solution(ind, deliveries, vehicles, sol)
        except ValidationError as e:
            print(f"VALIDATION FAILED for solution {sol['solution_id']}: {e}")
            sys.exit(1)
    print(f"  ✓ all {len(solutions)} solutions pass assignment / metric checks")

    try:
        validate_pareto_nondominated(solutions)
    except ValidationError as e:
        print(f"VALIDATION FAILED: {e}", file=sys.stderr)
        sys.exit(1)

    # ---- Persist ----
    save_pareto_csv(solutions, PARETO_CSV)
    plot_pareto_analysis(solutions, PARETO_PLOT)

    if not args.no_mongo:
        for sol in solutions:
            doc = dict(sol)
            # routes can be large; still store as required
            inserted = save_solution(doc)
            if inserted:
                sol["mongo_id"] = inserted
        print("MongoDB save attempted (see warnings if Mongo is offline).")

    # ---- Summary ----
    print("\n===== NSGA-III OC1 Pareto Summary =====")
    print(f"Solutions: {len(solutions)}")
    if solutions:
        print(
            f"Vehicles used:  "
            f"{min(s['vehicles_used'] for s in solutions)} – "
            f"{max(s['vehicles_used'] for s in solutions)}"
        )
        print(
            f"Distance:       "
            f"{min(s['distance'] for s in solutions):.2f} – "
            f"{max(s['distance'] for s in solutions):.2f} km"
        )
        print(
            f"Reliability:    "
            f"{min(s['reliability'] for s in solutions):.4f} – "
            f"{max(s['reliability'] for s in solutions):.4f}"
        )
        print(
            f"Waiting time:   "
            f"{min(s['waiting_time'] for s in solutions):.3f} – "
            f"{max(s['waiting_time'] for s in solutions):.3f} h"
        )
        print(
            f"Delay:          "
            f"{min(s['delay'] for s in solutions):.3f} – "
            f"{max(s['delay'] for s in solutions):.3f} h"
        )

        # Print first solution as example
        sample = {k: solutions[0][k] for k in solutions[0] if k != "routes"}
        sample["routes_preview"] = [
            r[:5] + (["..."] if len(r) > 5 else [])
            for r in solutions[0]["routes"]
            if r
        ][:3]
        print("\nExample solution:")
        print(json.dumps(sample, indent=2))

    print(f"\nResults written to {RESULTS_DIR}/")
    return solutions


if __name__ == "__main__":
    main()
