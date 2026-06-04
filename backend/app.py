from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient

app = Flask(__name__)
CORS(app)

# HERE IS YOUR NEW CLOUD CONNECTION:
client = MongoClient('mongodb+srv://JOHNDARO:exmartial2003@cluster0.5nwpjbf.mongodb.net/?appName=Cluster0')

db = client['crop_recommendation_db']
climate_collection = db['climate_data']

# ... all your @app.route code stays down here untouched ...

@app.route('/save-data', methods=['POST'])
def save_data():
    data = request.json
    if not data:
        return jsonify({"message": "No data received"}), 400
    climate_collection.insert_one(data)
    return jsonify({"message": "Data saved successfully!"}), 201

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.json
    temp = data.get('temperature')
    hum = data.get('humidity')
    ph = data.get('soil_ph')

    if temp > 20 and hum > 50 and ph > 6.0:
        recommendation = "Rice"
    elif temp > 25 and hum < 40:
        recommendation = "Maize"
    else:
        recommendation = "Wheat"
    return jsonify({"crop": recommendation})

# This is where your history route goes
@app.route('/get-history', methods=['GET'])
def get_history():
    history = list(climate_collection.find().sort('_id', -1).limit(5))
    for entry in history:
        entry['_id'] = str(entry['_id'])
    return jsonify(history)

if __name__ == '__main__':
    app.run(debug=True)