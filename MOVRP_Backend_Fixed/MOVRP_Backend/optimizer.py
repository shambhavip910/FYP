import random

from deap import base, creator, tools

from fitness import evaluate

from routing import (
    generate_initial_population,
    custom_crossover,
    custom_mutation,
    repair_solution
)

from config import (
    POPULATION_SIZE,
    GENERATIONS
)

# -------------------------
# Create DEAP Classes
# -------------------------

if not hasattr(creator, "FitnessMin"):
    creator.create(
        "FitnessMin",
        base.Fitness,
        weights=(-1.0, -1.0, -1.0)
    )

if not hasattr(creator, "Individual"):
    creator.create(
        "Individual",
        list,
        fitness=creator.FitnessMin
    )


# -------------------------
# Toolbox
# -------------------------

toolbox = base.Toolbox()


# -------------------------
# Run NSGA-II
# -------------------------

def run_nsga2(deliveries, vehicles, depot):

    if not vehicles:
        raise ValueError("At least one vehicle is required to run the optimizer")

    if not deliveries:
        raise ValueError("At least one delivery is required to run the optimizer")

    # Register evaluation / genetic operators
    if "evaluate" in toolbox.__dict__:
        toolbox.unregister("evaluate")

    toolbox.register(
        "evaluate",
        evaluate,
        deliveries=deliveries,
        depot=depot,
        vehicles=vehicles
    )

    toolbox.register("mate", custom_crossover)
    toolbox.register("mutate", custom_mutation)
    toolbox.register("select", tools.selNSGA2)

    # ---------------- Initial population ----------------
    population = generate_initial_population(
        deliveries,
        vehicles,
        POPULATION_SIZE
    )

    # Evaluate the initial population once before entering the loop
    for individual in population:
        individual.fitness.values = evaluate(
            individual,
            deliveries,
            depot,
            vehicles
        )

    # ---------------- Evolution loop ----------------
    for generation in range(GENERATIONS):

        offspring = []

        while len(offspring) < POPULATION_SIZE:

            parent1 = random.choice(population)
            parent2 = random.choice(population)

            child = toolbox.mate(parent1, parent2)
            child = toolbox.mutate(child)
            child = repair_solution(child, deliveries)

            offspring.append(child)

        # Evaluate offspring
        for child in offspring:
            child.fitness.values = evaluate(
                child,
                deliveries,
                depot,
                vehicles
            )

        # Environmental selection (NSGA-II)
        population = toolbox.select(
            population + offspring,
            k=POPULATION_SIZE
        )

    # ---------------- Pareto Front ----------------
    pareto = tools.sortNondominated(
        population,
        len(population),
        first_front_only=True
    )

    return pareto[0]
