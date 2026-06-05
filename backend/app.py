from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
CORS(app, origins=["http://localhost:56652", "https://johndaro7.github.io"])

client = MongoClient('mongodb+srv://JOHNDARO:exmartial2003@cluster0.5nwpjbf.mongodb.net/?appName=Cluster0')

db = client['crop_recommendation_db']
climate_collection = db['climate_data']
users_collection = db['users']


# ── AUTH ──────────────────────────────────────────────────────────────────────

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    if not data:
        return jsonify({"message": "No data received"}), 400

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({"message": "Name, email and password are required."}), 400

    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters."}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"message": "An account with this email already exists."}), 409

    hashed_pw = generate_password_hash(password)
    result = users_collection.insert_one({"name": name, "email": email, "password": hashed_pw})

    return jsonify({"message": "Account registered successfully!", "user_id": str(result.inserted_id)}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data:
        return jsonify({"message": "No data received"}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"message": "Email and password are required."}), 400

    user = users_collection.find_one({"email": email})
    if not user or not check_password_hash(user['password'], password):
        return jsonify({"message": "Invalid email or password."}), 401

    return jsonify({"message": "Login successful!", "user_id": str(user['_id']), "name": user.get('name', '')}), 200


# ── CLIMATE DATA ──────────────────────────────────────────────────────────────

@app.route('/climate', methods=['POST'])
def save_climate():
    """Save climate data (called by the climate-input form)."""
    data = request.json
    if not data:
        return jsonify({"message": "No data received"}), 400
    climate_collection.insert_one(data)
    return jsonify({"message": "Data saved successfully!"}), 201


# Legacy alias kept so any old bookmarks still work
@app.route('/save-data', methods=['POST'])
def save_data():
    return save_climate()


@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    temp = data.get('temperature', 0)
    hum = data.get('humidity', 0)
    ph = data.get('soil_ph', 7.0)

    if temp > 20 and hum > 50 and ph > 6.0:
        recommendation = "Rice"
    elif temp > 25 and hum < 40:
        recommendation = "Maize"
    else:
        recommendation = "Wheat"

    return jsonify({"crop": recommendation})


@app.route('/get-history', methods=['GET'])
def get_history():
    history = list(climate_collection.find().sort('_id', -1).limit(5))
    for entry in history:
        entry['_id'] = str(entry['_id'])
    return jsonify(history)


# ── ENTRY POINT ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
