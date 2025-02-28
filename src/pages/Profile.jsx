import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="bg-white p-4 rounded shadow-md">
        <p><strong>Name:</strong> {user.fname} {user.lname}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>
    </div>
  );
};

export default Profile;
