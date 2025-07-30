import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function StudentAttendance() {
  const { sessionId } = useParams();
  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [course, setCourse] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchSessionInfo();
    }
  }, [sessionId]);

  const fetchSessionInfo = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/session/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSessionInfo(data);
      } else {
        setMessage('Invalid or expired session');
      }
    } catch (error) {
      setMessage('Error fetching session info');
    }
  };

  const markAttendance = async () => {
    if (!studentName.trim() || !rollNo.trim() || !course.trim()) {
      setMessage('Please fill all fields');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch('http://localhost:5000/api/mark-attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              studentName: studentName.trim(),
              rollNo: rollNo.trim(),
              course: course.trim(),
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          });

          const data = await response.json();
          if (response.ok) {
            setMessage(`✅ Attendance marked! Distance: ${data.distance}m`);
          } else {
            setMessage(`❌ ${data.error}`);
          }
        } catch (error) {
          setMessage('❌ Error marking attendance');
        }
        setLoading(false);
      },
      (error) => {
        setMessage('❌ Please enable location access');
        setLoading(false);
      }
    );
  };

  if (!sessionId) {
    return (
      <div className="container">
        <h2>Student Attendance</h2>
        <p>Scan a QR code to mark attendance</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Mark Attendance</h2>
      
      {sessionInfo && (
        <div className="session-info">
          <h3>{sessionInfo.className}</h3>
          <p>Teacher: {sessionInfo.teacherName}</p>
          <p>Expires: {new Date(sessionInfo.expiresAt).toLocaleString()}</p>
        </div>
      )}

      <div className="form-group">
        <input
          type="text"
          placeholder="Enter your name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
        />
        
        <input
          type="text"
          placeholder="Enter your roll number"
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
        />
        
        <input
          type="text"
          placeholder="Enter your course"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        />
        
        <button onClick={markAttendance} disabled={loading} className="attend-btn">
          {loading ? 'Marking...' : 'Mark Attendance'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default StudentAttendance;