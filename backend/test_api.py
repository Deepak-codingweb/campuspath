import unittest

from app import app


class APITests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "ok")

    def test_locations(self):
        response = self.client.get("/locations")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.get_json()["locations"]), 12)

    def test_find_route(self):
        response = self.client.post("/find-route", json={"start": "Main Gate", "destination": "Library"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["total_edges"], 2)
        self.assertTrue(response.get_json()["trace"])

    def test_reject_invalid_location(self):
        response = self.client.post("/find-route", json={"start": "Mars", "destination": "Library"})
        self.assertEqual(response.status_code, 400)

    def test_reject_empty_body(self):
        response = self.client.post("/find-route", json={})
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
