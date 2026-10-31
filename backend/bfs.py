from collections import deque


def bfs(graph, start, destination):
    """Return a shortest path and an auditable step trace for an unweighted graph."""
    queue = deque([start])
    visited = {start}
    visited_order = [start]
    parent = {start: None}
    nodes_visited = []
    explored_edges = []
    trace = [
        {
            "action": "initialize",
            "current": None,
            "neighbor": None,
            "queue": list(queue),
            "visited": visited_order.copy(),
            "explored_edges": explored_edges.copy(),
            "message": f"Add {start} to the queue. The search is ready to begin.",
        }
    ]

    while queue:
        current = queue.popleft()
        nodes_visited.append(current)
        trace.append(
            {
                "action": "dequeue",
                "current": current,
                "neighbor": None,
                "queue": list(queue),
                "visited": visited_order.copy(),
                "explored_edges": explored_edges.copy(),
                "message": f"Remove {current} from the front of the queue and explore it.",
            }
        )

        if current == destination:
            break

        for neighbor in graph.get(current, []):
            explored_edges.append([current, neighbor])
            if neighbor not in visited:
                visited.add(neighbor)
                visited_order.append(neighbor)
                parent[neighbor] = current
                queue.append(neighbor)
                trace.append(
                    {
                        "action": "discover",
                        "current": current,
                        "neighbor": neighbor,
                        "queue": list(queue),
                        "visited": visited_order.copy(),
                        "explored_edges": explored_edges.copy(),
                        "message": f"Discover {neighbor} from {current}. Mark it visited and add it to the queue.",
                    }
                )
            else:
                trace.append(
                    {
                        "action": "skip",
                        "current": current,
                        "neighbor": neighbor,
                        "queue": list(queue),
                        "visited": visited_order.copy(),
                        "explored_edges": explored_edges.copy(),
                        "message": f"Skip {neighbor}; it has already been visited.",
                    }
                )

    if destination not in parent:
        trace.append(
            {
                "action": "unreachable",
                "current": None,
                "neighbor": destination,
                "queue": list(queue),
                "visited": visited_order.copy(),
                "explored_edges": explored_edges.copy(),
                "message": f"No route from {start} to {destination} exists in this graph.",
            }
        )
        return {
            "path": [],
            "nodes_visited": nodes_visited,
            "total_edges": 0,
            "trace": trace,
        }

    path = []
    current = destination
    while current is not None:
        path.append(current)
        current = parent[current]
    path.reverse()

    trace.append(
        {
            "action": "complete",
            "current": destination,
            "neighbor": None,
            "queue": list(queue),
            "visited": visited_order.copy(),
            "explored_edges": explored_edges.copy(),
            "message": f"Destination reached. The shortest route contains {len(path) - 1} edge(s).",
        }
    )

    return {
        "path": path,
        "nodes_visited": nodes_visited,
        "total_edges": len(path) - 1,
        "trace": trace,
    }
