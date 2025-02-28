import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Board from './pages/Board';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Notification from './pages/Notification';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/boards" element={<Board />} />
        <Route path="/notifications" element={<Notification />} /> 
        <Route path="/profile" element={<Profile />} /> 
      </Routes>
    </Router>
  );
};

export default App;
