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


def _order_crossover(route1, route2):
    """
    Classic order crossover (OX) for a single route: keeps a random slice
    from route1 in place, fills the rest with route2's customers in the
    order they appear there. Produces a valid permutation with no
    duplicates/missing customers.
    """

    if len(route1) < 2 or set(route1) != set(route2):
        return list(route1)

    size = len(route1)
    a, b = sorted(random.sample(range(size), 2))

    child = [None] * size
    child[a:b] = route1[a:b]

    fill_values = [c for c in route2 if c not in child[a:b]]

    pos = 0
    for i in range(size):
        if child[i] is None:
            child[i] = fill_values[pos]
            pos += 1

    return child


def custom_crossover(parent1, parent2):

    child = copy.deepcopy(parent1)

    for i in range(len(child)):

        if random.random() < 0.5:
            # Same set of customers on both sides -> recombine their order.
            if set(parent1[i]) == set(parent2[i]) and len(parent1[i]) >= 2:
                child[i] = _order_crossover(parent1[i], parent2[i])
            else:
                child[i] = copy.deepcopy(parent2[i])

    return creator.Individual(child)


def custom_mutation(individual):
    """
    Two kinds of mutation:
      1. Re-order mutation: swap two customers within the SAME route.
         This is what actually improves the visiting order (distance/time),
         and is essential even with a single vehicle.
      2. Re-assignment mutation: move a customer from one vehicle's route
         to another. Only meaningful with 2+ vehicles.
    Both are tried so the search doesn't stagnate regardless of fleet size.
    """

    child = copy.deepcopy(individual)

    non_empty_routes = [i for i in range(len(child)) if len(child[i]) > 0]

    if not non_empty_routes:
        return creator.Individual(child)

    # ---- 1. Re-order mutation (swap within a route) ----
    reorder_candidates = [i for i in non_empty_routes if len(child[i]) >= 2]

    if reorder_candidates and random.random() < 0.7:
        route_idx = random.choice(reorder_candidates)
        route = child[route_idx]

        pos1, pos2 = random.sample(range(len(route)), 2)
        route[pos1], route[pos2] = route[pos2], route[pos1]

    # ---- 2. Re-assignment mutation (move between vehicles) ----
    if len(child) >= 2 and random.random() < 0.5:
        from_vehicle = random.choice(non_empty_routes)
        to_vehicle = random.randint(0, len(child) - 1)

        if child[from_vehicle]:
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
