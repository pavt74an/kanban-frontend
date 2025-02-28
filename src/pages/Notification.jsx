import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <div>
        {notifications.map((notification) => (
          <div key={notification.id} className="bg-white p-4 mb-2 rounded shadow-md">
            <p>{notification.message}</p>
            {!notification.readStatus && (
              <button
                onClick={() => markAsRead(notification.id)}
                className="mt-2 bg-blue-500 text-white p-1 rounded"
              >
                Mark as Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notification;
