from flask import Flask, request, jsonify
from flask_cors import CORS
import qrcode
import base64
import io
import uuid
import time
import csv
from datetime import datetime, timedelta
from geopy.distance import geodesic

app = Flask(__name__)
CORS(app)

# In-memory storage
sessions = {}
attendance_records = []
device_sessions = {}  # Track device attendance per session

GEOFENCE_RADIUS = 50  # meters

@app.route('/api/generate-qr', methods=['POST'])
def generate_qr():
    data = request.json
    class_name = data.get('className')
    teacher_name = data.get('teacherName')
    class_lat = data.get('latitude')
    class_lng = data.get('longitude')
    
    session_id = str(uuid.uuid4())
    expires_at = datetime.now() + timedelta(minutes=10)
    
    sessions[session_id] = {
        'className': class_name,
        'teacherName': teacher_name,
        'latitude': class_lat,
        'longitude': class_lng,
        'expiresAt': expires_at,
        'createdAt': datetime.now()
    }
    
    qr_data = f"http://localhost:3000/attend/{session_id}"
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return jsonify({
        'sessionId': session_id,
        'qrCode': f"data:image/png;base64,{img_str}",
        'expiresAt': expires_at.isoformat()
    })

@app.route('/api/mark-attendance', methods=['POST'])
def mark_attendance():
    data = request.json
    session_id = data.get('sessionId')
    student_name = data.get('studentName')
    roll_no = data.get('rollNo')
    course = data.get('course')
    student_lat = data.get('latitude')
    student_lng = data.get('longitude')
    device_id = request.headers.get('User-Agent', '') + str(request.environ.get('REMOTE_ADDR', ''))
    
    if session_id not in sessions:
        return jsonify({'error': 'Invalid session'}), 400
    
    session = sessions[session_id]
    if datetime.now() > session['expiresAt']:
        return jsonify({'error': 'Session expired'}), 400
    
    # Calculate distance
    class_location = (session['latitude'], session['longitude'])
    student_location = (student_lat, student_lng)
    distance = geodesic(class_location, student_location).meters
    
    if distance > GEOFENCE_RADIUS:
        return jsonify({'error': f'Too far from class. Distance: {distance:.1f}m'}), 400
    
    # Check device restriction
    device_key = f"{session_id}_{device_id}"
    if device_key in device_sessions:
        return jsonify({'error': 'Device already used for this session'}), 400
    
    # Check if already marked
    for record in attendance_records:
        if record['sessionId'] == session_id and record['rollNo'] == roll_no:
            return jsonify({'error': 'Already marked present'}), 400
    
    record = {
        'sessionId': session_id,
        'studentName': student_name,
        'rollNo': roll_no,
        'course': course,
        'className': session['className'],
        'teacherName': session['teacherName'],
        'timestamp': datetime.now().isoformat(),
        'distance': round(distance, 1)
    }
    
    attendance_records.append(record)
    device_sessions[device_key] = datetime.now()
    save_to_csv(record)
    
    return jsonify({'message': 'Attendance marked successfully', 'distance': round(distance, 1)})

@app.route('/api/attendance/<session_id>', methods=['GET'])
def get_attendance(session_id):
    records = [r for r in attendance_records if r['sessionId'] == session_id]
    return jsonify(records)

@app.route('/api/session/<session_id>', methods=['GET'])
def get_session(session_id):
    cleanup_expired_sessions()
    
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    session = sessions[session_id]
    if datetime.now() > session['expiresAt']:
        return jsonify({'error': 'Session expired'}), 400
    
    return jsonify({
        'className': session['className'],
        'teacherName': session['teacherName'],
        'expiresAt': session['expiresAt'].isoformat()
    })

def cleanup_expired_sessions():
    current_time = datetime.now()
    expired_sessions = [sid for sid, session in sessions.items() if current_time > session['expiresAt']]
    
    for session_id in expired_sessions:
        del sessions[session_id]
        # Remove device restrictions for expired sessions
        expired_devices = [key for key in device_sessions.keys() if key.startswith(f"{session_id}_")]
        for device_key in expired_devices:
            del device_sessions[device_key]

def save_to_csv(record):
    filename = f"attendance_{record['className'].replace(' ', '_')}.csv"
    file_exists = False
    try:
        with open(filename, 'r'):
            file_exists = True
    except FileNotFoundError:
        pass
    
    with open(filename, 'a', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['rollNo', 'studentName', 'course', 'className', 'teacherName', 'timestamp', 'distance']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        if not file_exists:
            writer.writeheader()
        
        writer.writerow({
            'rollNo': record['rollNo'],
            'studentName': record['studentName'],
            'course': record['course'],
            'className': record['className'],
            'teacherName': record['teacherName'],
            'timestamp': record['timestamp'],
            'distance': record['distance']
        })

if __name__ == '__main__':
    app.run(debug=True, port=5000)