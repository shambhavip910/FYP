"""
Genuine NSGA-III optimizer for Objective Combination #1.

Uses DEAP's selNSGA3 with Das–Dennis uniform reference points.
Does NOT call selNSGA2.

Chromosome representation (preserved from NSGA-II):
  Individual = [[customers for vehicle 1], [customers for vehicle 2], ...]
  Every customer appears exactly once (enforced by repair_solution).
"""

from __future__ import annotations

import copy
import random

from deap import base, creator, tools

from fitness_oc1 import evaluate_oc1, solution_dict
from routing import (
    generate_initial_population,
    custom_crossover,
    custom_mutation,
    repair_solution,
)
from config import (
    NSGA3_POPULATION_SIZE,
    NSGA3_GENERATIONS,
    NSGA3_CROSSOVER_RATE,
    NSGA3_MUTATION_RATE,
    NSGA3_REF_POINT_DIVISIONS,
)


# FitnessOC1 weights:
#   vehicles ↓, distance ↓, reliability ↑, waiting ↓, delay ↓
if not hasattr(creator, "FitnessOC1"):
    creator.create(
        "FitnessOC1",
        base.Fitness,
        weights=(-1.0, -1.0, 1.0, -1.0, -1.0),
    )

if not hasattr(creator, "IndividualOC1"):
    creator.create(
        "IndividualOC1",
        list,
        fitness=creator.FitnessOC1,
    )


def _constraint_violation(ind):
    return float(getattr(ind, "constraint_violation", 0.0) or 0.0)


def _feasible_first(population):
    """
    Deb-style preference: if any feasible individuals exist, drop infeasible
    ones before NSGA-III niching. If none are feasible, keep the whole set
    (NSGA-III will still diversify among them).
    """

    feasible = [ind for ind in population if _constraint_violation(ind) <= 1e-9]
    return feasible if feasible else list(population)


def _nsga3_survive(combined, k, ref_points):
    """
    Survival: prefer feasible, then NSGA-III reference-point selection.
    If fewer than k feasible remain, fill remaining slots from infeasible
    sorted by ascending constraint violation, then NSGA-III among those.
    """

    feasible = [ind for ind in combined if _constraint_violation(ind) <= 1e-9]
    infeasible = [ind for ind in combined if _constraint_violation(ind) > 1e-9]

    if not feasible:
        return tools.selNSGA3(combined, k, ref_points)

    if len(feasible) >= k:
        return tools.selNSGA3(feasible, k, ref_points)

    selected = list(feasible)
    remaining = k - len(selected)

    infeasible.sort(key=_constraint_violation)
    pool = infeasible[: max(remaining * 3, remaining)]
    if len(pool) <= remaining:
        selected.extend(pool)
    else:
        selected.extend(tools.selNSGA3(pool, remaining, ref_points))

    return selected[:k]


def run_nsga3(
    deliveries,
    vehicles,
    depot,
    population_size=None,
    generations=None,
    crossover_rate=None,
    mutation_rate=None,
    ref_point_divisions=None,
    verbose=True,
):
    """
    Run NSGA-III on OC1 objectives.

    Returns the first non-dominated front (list of IndividualOC1).
    """

    if not vehicles:
        raise ValueError("At least one vehicle is required to run NSGA-III")
    if not deliveries:
        raise ValueError("At least one delivery is required to run NSGA-III")

    pop_size = population_size or NSGA3_POPULATION_SIZE
    ngen = generations or NSGA3_GENERATIONS
    cx_rate = crossover_rate if crossover_rate is not None else NSGA3_CROSSOVER_RATE
    mut_rate = mutation_rate if mutation_rate is not None else NSGA3_MUTATION_RATE
    p_div = ref_point_divisions or NSGA3_REF_POINT_DIVISIONS

    # Reference directions for 5 objectives
    ref_points = tools.uniform_reference_points(nobj=5, p=p_div)

    # Align population size with number of reference points when sensible
    n_refs = len(ref_points)
    if pop_size < n_refs:
        if verbose:
            print(
                f"[NSGA-III] Raising population_size {pop_size} → {n_refs} "
                f"to match {n_refs} reference points (p={p_div})."
            )
        pop_size = n_refs

    toolbox = base.Toolbox()

    def _evaluate(ind):
        return evaluate_oc1(ind, deliveries, depot, vehicles)

    def _mate(a, b):
        return custom_crossover(a, b, individual_cls=creator.IndividualOC1)

    def _mutate(ind):
        return custom_mutation(ind, individual_cls=creator.IndividualOC1)

    def _repair(ind):
        return repair_solution(ind, deliveries, individual_cls=creator.IndividualOC1)

    toolbox.register("evaluate", _evaluate)
    toolbox.register("mate", _mate)
    toolbox.register("mutate", _mutate)
    toolbox.register("repair", _repair)

    # ---- Initial population ----
    population = generate_initial_population(
        deliveries,
        vehicles,
        pop_size,
        individual_cls=creator.IndividualOC1,
    )

    for i in range(len(population)):
        population[i] = toolbox.repair(population[i])
        population[i].fitness.values = toolbox.evaluate(population[i])

    if verbose:
        print(
            f"[NSGA-III] OC1 | customers={len(deliveries)} | "
            f"fleet={len(vehicles)} | pop={pop_size} | gen={ngen} | "
            f"ref_points={n_refs}"
        )

    # ---- Evolution ----
    for gen in range(ngen):
        offspring = []

        while len(offspring) < pop_size:
            parent1 = random.choice(population)
            parent2 = random.choice(population)

            if random.random() < cx_rate:
                child = toolbox.mate(parent1, parent2)
            else:
                child = copy.deepcopy(parent1)

            if random.random() < mut_rate:
                child = toolbox.mutate(child)

            child = toolbox.repair(child)
            offspring.append(child)

        for i in range(len(offspring)):
            offspring[i].fitness.values = toolbox.evaluate(offspring[i])

        combined = population + offspring
        population = _nsga3_survive(combined, pop_size, ref_points)

        if verbose and (gen + 1) % max(1, ngen // 5) == 0:
            front = tools.sortNondominated(
                population, len(population), first_front_only=True
            )[0]
            best_v = min(ind.fitness.values[0] for ind in front)
            best_d = min(ind.fitness.values[1] for ind in front)
            best_r = max(ind.fitness.values[2] for ind in front)
            n_feas = sum(
                1 for ind in population if _constraint_violation(ind) <= 1e-9
            )
            print(
                f"  gen {gen + 1:>3}/{ngen} | front={len(front):>3} | "
                f"feasible={n_feas:>3} | best vehicles={best_v:.0f} "
                f"dist={best_d:.1f} rel={best_r:.3f}"
            )

    # ---- Final Pareto front (feasible preferred) ----
    candidates = _feasible_first(population)
    pareto = tools.sortNondominated(
        candidates,
        len(candidates),
        first_front_only=True,
    )[0]

    # Re-attach clean metrics (fitness already set)
    for ind in pareto:
        evaluate_oc1(ind, deliveries, depot, vehicles)

    if verbose:
        print(f"[NSGA-III] Done. Pareto size = {len(pareto)}")

    return pareto


def pareto_to_solutions(pareto):
    """Deduplicate routes and return list of solution dicts."""

    solutions = []
    seen = set()

    for ind in pareto:
        routes = [list(r) for r in ind]
        key = tuple(tuple(r) for r in routes)
        if key in seen:
            continue
        seen.add(key)
        solutions.append(solution_dict(ind, solution_id=len(solutions) + 1))

    return solutions
