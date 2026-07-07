import copy
import random

from deap import creator


def create_individual(deliveries, vehicles):

    if not vehicles:
        raise ValueError("Cannot create an individual with zero vehicles")

    customer_ids = [d.id for d in deliveries]

    random.shuffle(customer_ids)

    routes = [[] for _ in range(len(vehicles))]

    for i, customer in enumerate(customer_ids):
        routes[i % len(vehicles)].append(customer)

    return creator.Individual(routes)


def generate_initial_population(deliveries, vehicles, population_size):

    population = []

    for _ in range(population_size):
        population.append(
            create_individual(deliveries, vehicles)
        )

    return population


def custom_crossover(parent1, parent2):

    child = copy.deepcopy(parent1)

    for i in range(len(child)):

        if random.random() < 0.5:
            child[i] = copy.deepcopy(parent2[i])

    return creator.Individual(child)


def custom_mutation(individual):

    child = copy.deepcopy(individual)

    from_vehicle = random.randint(0, len(child) - 1)
    to_vehicle = random.randint(0, len(child) - 1)

    if len(child[from_vehicle]) == 0:
        return creator.Individual(child)

    customer = random.choice(child[from_vehicle])

    child[from_vehicle].remove(customer)
    child[to_vehicle].append(customer)

    return creator.Individual(child)


def repair_solution(individual, deliveries):
    """
    Ensures every delivery appears in the individual exactly once:
    removes any duplicate customer ids across routes, then appends
    any customer missing from the solution to a random route.
    """

    all_customers = {d.id for d in deliveries}

    seen = set()

    for route in individual:

        i = 0

        while i < len(route):

            if route[i] in seen:
                route.pop(i)
            else:
                seen.add(route[i])
                i += 1

    missing = list(all_customers - seen)

    for customer in missing:
        random.choice(individual).append(customer)

    return creator.Individual(individual)
