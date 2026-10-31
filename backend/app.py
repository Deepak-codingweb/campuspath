import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from bfs import bfs
from graph import campus_graph

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

# CORS_ORIGINS is a comma-separated list, for example:
# https://campuspath.vercel.app,https://www.your-domain.com
allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "*").split(",")
    if origin.strip()
]
CORS(app, resources={r"/*": {"origins": allowed_origins}})


@app.get("/")
def home():
    return jsonify({
        "name": "CampusPath API",
        "status": "online",
        "message": "CampusPath route-finding service is ready.",
        "endpoints": ["/health", "/locations", "/find-route"],
    })


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "campuspath-api"})


@app.get("/locations")
def get_locations():
    return jsonify({"locations": list(campus_graph.keys())})


@app.post("/find-route")
def find_route():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Send a valid JSON request body."}), 400

    start = data.get("start")
    destination = data.get("destination")

    if not isinstance(start, str) or not isinstance(destination, str) or not start.strip() or not destination.strip():
        return jsonify({"error": "Both starting location and destination are required."}), 400

    if start not in campus_graph or destination not in campus_graph:
        return jsonify({"error": "Choose valid locations from the campus list."}), 400

    result = bfs(campus_graph, start, destination)
    if not result["path"]:
        return jsonify({"message": "No route found between these locations.", **result}), 404

    return jsonify({
        "message": "Shortest route found.",
        "start": start,
        "destination": destination,
        "algorithm": "Breadth-First Search (BFS)",
        **result,
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
