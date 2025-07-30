# 📍 GeoQR – Location-Aware QR Code Attendance System

## Setup Instructions

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run Flask server:
   ```bash
   python app.py
   ```
   Server runs on http://localhost:5000

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start React development server:
   ```bash
   npm start
   ```
   App runs on http://localhost:3000

## Usage

### For Teachers:
1. Go to http://localhost:3000
2. Enter class name and teacher name
3. Click "Get Location" to set classroom location
4. Click "Generate QR Code"
5. Display QR code for students to scan

### For Students:
1. Scan QR code with phone camera or go to the generated URL
2. Enter your name, roll number, and course
3. Click "Mark Attendance"
4. Your location will be verified (must be within 50m of classroom)

## Features
- ✅ Dynamic QR code generation
- ✅ GPS location validation
- ✅ 50-meter geofence radius
- ✅ 10-minute session expiry
- ✅ Duplicate attendance prevention (by roll number)
- ✅ Real-time distance calculation
- ✅ Student information capture (name, roll number, course)
- ✅ CSV export for attendance records

## Security
- Sessions expire after 10 minutes
- Location must be enabled on student device
- Distance validation prevents proxy attendance
- Duplicate prevention based on roll number
- CSV files saved locally for record keeping
- In-memory storage (easily extendable to database)