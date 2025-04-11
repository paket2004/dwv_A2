from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import threading
from collections import deque

app = Flask(__name__, static_folder="front")
CORS(app)
# maximum amount of possible packages on the earth
# they will be updated whe limit is reached with new information
packages = deque(maxlen=777) 

@app.route('/api/packages', methods=['POST'])
def receive_package():
    package = request.json
    # print(package)
    packages.append(package)
    return jsonify({'status': 'success'}), 200


@app.route('/api/packages', methods=['GET'])
def get_packages():
    formatted_packages = []
    for package in packages:
        formatted_packages.append({
            "ip_address": str(package.get('ip_address', '')),
            "latitude": float(package.get('latitude', 0)),
            "longitude": float(package.get('longitude', 0)),
            "timestamp": int(package.get('timestamp', 0)),
            "suspicious": str(package.get('suspicious', '0'))
        })
    return jsonify(formatted_packages)
    
def run_server():
    app.run(host='0.0.0.0', port=5000, debug=True)

@app.route('/')
def home():
    return render_template('index.html')

run_server()