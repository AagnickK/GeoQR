import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TeacherDashboard from './TeacherDashboard';
import StudentAttendance from './StudentAttendance';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <h1>📍 GeoQR Attendance</h1>
          <div>
            <Link to="/" className="nav-link">Teacher</Link>
            <Link to="/student" className="nav-link">Student</Link>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<TeacherDashboard />} />
          <Route path="/student" element={<StudentAttendance />} />
          <Route path="/attend/:sessionId" element={<StudentAttendance />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;