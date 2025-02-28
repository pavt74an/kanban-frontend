import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/auth/register', {
        email,
        password,
        fname,
        lname,
      });
      alert('Registration successful!');
      navigate('/'); 
    } catch (error) {
      alert('Registration failed');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 mx-4 bg-white rounded-lg shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-600 mt-2">Join us today and get started</p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fname" className="text-sm font-medium text-gray-700 block mb-2">
                First Name
              </label>
              <input
                id="fname"
                type="text"
                placeholder="John"
                value={fname}
                onChange={(e) => setFname(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>
            <div>
              <label htmlFor="lname" className="text-sm font-medium text-gray-700 block mb-2">
                Last Name
              </label>
              <input
                id="lname"
                type="text"
                placeholder="Doe"
                value={lname}
                onChange={(e) => setLname(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="register-email" className="text-sm font-medium text-gray-700 block mb-2">
              Email Address
            </label>
            <input
              id="register-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
          </div>
          
          <div>
            <label htmlFor="register-password" className="text-sm font-medium text-gray-700 block mb-2">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              required
            />
            <p className="mt-1 text-sm text-gray-500">Password must be at least 6 characters</p>
          </div>
          
          <div className="pt-2">
            <button 
              type="submit" 
              className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/" className="font-medium text-blue-600 hover:text-blue-500 transition">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
