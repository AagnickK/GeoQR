import React, { useState } from 'react';

function TeacherDashboard() {
  const [formData, setFormData] = useState({
    className: '',
    teacherName: ''
  });
  const [qrData, setQrData] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState([]);

  const getCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLoading(false);
      },
      (error) => {
        alert('Please enable location access');
        setLoading(false);
      }
    );
  };

  const generateQR = async () => {
    if (!location) {
      alert('Please get your location first');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          latitude: location.latitude,
          longitude: location.longitude
        })
      });

      const data = await response.json();
      setQrData(data);
      fetchAttendance(data.sessionId);
    } catch (error) {
      alert('Error generating QR code');
    }
  };

  const fetchAttendance = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/attendance/${sessionId}`);
      const data = await response.json();
      setAttendance(data);
    } catch (error) {
      console.error('Error fetching attendance');
    }
  };

  return (
    <div className="container">
      <h2>Teacher Dashboard</h2>
      
      <div className="form-group">
        <input
          type="text"
          placeholder="Class Name"
          value={formData.className}
          onChange={(e) => setFormData({...formData, className: e.target.value})}
        />
        <input
          type="text"
          placeholder="Teacher Name"
          value={formData.teacherName}
          onChange={(e) => setFormData({...formData, teacherName: e.target.value})}
        />
        
        <button onClick={getCurrentLocation} disabled={loading}>
          {loading ? 'Getting Location...' : location ? '✅ Location Set' : '📍 Get Location'}
        </button>
        
        {location && (
          <p className="location-info">
            📍 Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
          </p>
        )}
        
        <button onClick={generateQR} className="generate-btn">
          Generate QR Code
        </button>
      </div>

      {qrData && (
        <div className="qr-section">
          <h3>Attendance QR Code</h3>
          <img src={qrData.qrCode} alt="QR Code" className="qr-image" />
          <p>Session expires: {new Date(qrData.expiresAt).toLocaleString()}</p>
          <button onClick={() => fetchAttendance(qrData.sessionId)} className="refresh-btn">
            🔄 Refresh Attendance
          </button>
          
          <div className="attendance-list">
            <h4>Present Students ({attendance.length})</h4>
            {attendance.length === 0 ? (
              <p>No students marked present yet</p>
            ) : (
              <ul>
                {attendance.map((record, index) => (
                  <li key={index} className="attendance-item">
                    <strong>{record.studentName}</strong>
                    <span>Distance: {record.distance}m</span>
                    <span>{new Date(record.timestamp).toLocaleTimeString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;