import copy
import random

from deap import creator


def _individual_cls(individual_cls=None):
    if individual_cls is not None:
        return individual_cls
    return creator.Individual


def create_individual(deliveries, vehicles, individual_cls=None):
    """
    Round-robin shuffle assignment (fast, diverse).

    For large instances, prefer create_individual_capacity_aware when
    capacity feasibility matters early in the search.
    """

    if not vehicles:
        raise ValueError("Cannot create an individual with zero vehicles")

    cls = _individual_cls(individual_cls)
    customer_ids = [d.id for d in deliveries]

    random.shuffle(customer_ids)

    routes = [[] for _ in range(len(vehicles))]

    for i, customer in enumerate(customer_ids):
        routes[i % len(vehicles)].append(customer)

    return cls(routes)


def create_individual_capacity_aware(deliveries, vehicles, individual_cls=None):
    """
    Greedy assignment: place each shuffled customer on a random feasible
    vehicle (demand fits). Falls back to the least-loaded vehicle if none fit.
    Improves early capacity feasibility on large fleets.
    """

    if not vehicles:
        raise ValueError("Cannot create an individual with zero vehicles")

    cls = _individual_cls(individual_cls)
    demand = {d.id: d.demand for d in deliveries}
    customer_ids = [d.id for d in deliveries]
    random.shuffle(customer_ids)

    routes = [[] for _ in range(len(vehicles))]
    loads = [0.0] * len(vehicles)

    for customer in customer_ids:
        dmd = demand[customer]
        candidates = [
            i for i, v in enumerate(vehicles)
            if loads[i] + dmd <= v.capacity
        ]
        if candidates:
            i = random.choice(candidates)
        else:
            i = min(range(len(vehicles)), key=lambda j: loads[j] / max(vehicles[j].capacity, 1))
        routes[i].append(customer)
        loads[i] += dmd

    return cls(routes)


def generate_initial_population(
    deliveries, vehicles, population_size, individual_cls=None, capacity_aware_ratio=0.7
):

    population = []

    n_aware = int(population_size * capacity_aware_ratio)
    for _ in range(n_aware):
        population.append(
            create_individual_capacity_aware(
                deliveries, vehicles, individual_cls=individual_cls
            )
        )
    for _ in range(population_size - n_aware):
        population.append(
            create_individual(deliveries, vehicles, individual_cls=individual_cls)
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


def custom_crossover(parent1, parent2, individual_cls=None):

    cls = _individual_cls(individual_cls)
    child = copy.deepcopy(parent1)

    for i in range(len(child)):

        if random.random() < 0.5:
            # Same set of customers on both sides -> recombine their order.
            if set(parent1[i]) == set(parent2[i]) and len(parent1[i]) >= 2:
                child[i] = _order_crossover(parent1[i], parent2[i])
            else:
                child[i] = copy.deepcopy(parent2[i])

    return cls(child)


def custom_mutation(individual, individual_cls=None):
    """
    Two kinds of mutation:
      1. Re-order mutation: swap two customers within the SAME route.
      2. Re-assignment mutation: move a customer from one vehicle's route
         to another. Only meaningful with 2+ vehicles.
    Also: with small probability, try to empty a lightly-loaded route by
    moving all its customers onto other routes (helps vehicles-used objective).
    """

    cls = _individual_cls(individual_cls)
    child = copy.deepcopy(individual)

    non_empty_routes = [i for i in range(len(child)) if len(child[i]) > 0]

    if not non_empty_routes:
        return cls(child)

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

    # ---- 3. Route-merge mutation (encourage fewer vehicles) ----
    non_empty_routes = [i for i in range(len(child)) if len(child[i]) > 0]
    if len(non_empty_routes) >= 2 and random.random() < 0.15:
        src = min(non_empty_routes, key=lambda i: len(child[i]))
        dst = random.choice([i for i in non_empty_routes if i != src])
        child[dst].extend(child[src])
        child[src] = []

    return cls(child)


def repair_solution(individual, deliveries, individual_cls=None):
    """
    Ensures every delivery appears in the individual exactly once:
    removes any duplicate customer ids across routes, then appends
    any customer missing from the solution to a random route.
    """

    cls = _individual_cls(individual_cls)
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

    return cls(individual)
