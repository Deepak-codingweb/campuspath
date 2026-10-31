import unittest

from bfs import bfs
from graph import campus_graph


class BFSTests(unittest.TestCase):
    def test_known_shortest_route(self):
        result = bfs(campus_graph, "Main Gate", "Library")
        self.assertEqual(result["path"], ["Main Gate", "Administrative Block", "Library"])
        self.assertEqual(result["total_edges"], 2)

    def test_start_equals_destination(self):
        result = bfs(campus_graph, "Library", "Library")
        self.assertEqual(result["path"], ["Library"])
        self.assertEqual(result["total_edges"], 0)

    def test_route_is_connected(self):
        result = bfs(campus_graph, "Main Gate", "Auditorium")
        self.assertTrue(result["path"])
        for current, following in zip(result["path"], result["path"][1:]):
            self.assertIn(following, campus_graph[current])

    def test_unreachable_destination(self):
        graph = {"A": ["B"], "B": ["A"], "C": []}
        result = bfs(graph, "A", "C")
        self.assertEqual(result["path"], [])
        self.assertEqual(result["total_edges"], 0)
        self.assertEqual(result["trace"][-1]["action"], "unreachable")

    def test_start_and_destination_are_visited(self):
        result = bfs(campus_graph, "Main Gate", "Library")
        self.assertEqual(result["nodes_visited"][0], "Main Gate")
        self.assertIn("Library", result["nodes_visited"])

    def test_trace_includes_queue_and_final_path(self):
        result = bfs(campus_graph, "Main Gate", "Library")
        self.assertEqual(result["trace"][0]["action"], "initialize")
        self.assertIn("queue", result["trace"][0])
        self.assertEqual(result["trace"][-1]["action"], "complete")

    def test_all_locations_are_connected(self):
        for destination in campus_graph:
            self.assertTrue(bfs(campus_graph, "Main Gate", destination)["path"])


if __name__ == "__main__":
    unittest.main()
