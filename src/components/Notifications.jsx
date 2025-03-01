import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get logged in user ID from localStorage
  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user.user_id : null;
  };

  const fetchNotifications = async () => {
    const userId = getUserId();
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await api.get(`/notifications/user/${userId}`);
      
      if (response.data && Array.isArray(response.data)) {
        setNotifications(response.data);
        
        // Count unread notifications
        const unread = response.data.filter(notification => !notification.read).length;
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notifications initially and set up interval to check for new ones
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      // Ideally there would be an API endpoint for marking notifications as read
      // Since it's not in the provided API list, we'll just update the local state
      setNotifications(notifications.map(notification => 
        notification.notification_id === notificationId 
          ? { ...notification, read: true } 
          : notification
      ));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  return (
    <div className="relative">
      {/* Notification Icon with Badge */}
      <button 
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden">
          <div className="py-2 px-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
          </div>
          
          {error && (
            <div className="p-4 text-sm text-red-600">
              {error}
            </div>
          )}
          
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              Loading...
            </div>
          )}
          
          {!isLoading && notifications.length === 0 && (
            <div className="p-4 text-sm text-gray-500 text-center">
              No notifications
            </div>
          )}
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.map(notification => (
              <div 
                key={notification.notification_id}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                onClick={() => handleMarkAsRead(notification.notification_id)}
              >
                <p className="text-sm text-gray-800">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          
          <div className="py-2 px-4 bg-gray-50 border-t border-gray-200 text-right">
            <button 
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
