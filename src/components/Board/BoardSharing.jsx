import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const BoardSharing = ({ boardId }) => {
  const [users, setUsers] = useState([]);
  const [boardMembers, setBoardMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all users and board members when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all users
        const usersResponse = await api.get('/user');
        setUsers(usersResponse.data);
        
        // Fetch board members
        const boardResponse = await api.get(`/boards/${boardId}`);
        if (boardResponse.data && boardResponse.data.members) {
          setBoardMembers(boardResponse.data.members);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load users or board data');
      } finally {
        setIsLoading(false);
      }
    };

    if (boardId) {
      fetchData();
    }
  }, [boardId]);

  // Add member to board
  const handleAddMember = async () => {
    if (!selectedUserId) return;
    
    setIsLoading(true);
    try {
      await api.post(`/board-member/${boardId}/members`, {
        userId: selectedUserId
      });
      
      // Refresh board members after adding
      const boardResponse = await api.get(`/boards/${boardId}`);
      if (boardResponse.data && boardResponse.data.members) {
        setBoardMembers(boardResponse.data.members);
      }
      
      setSelectedUserId('');
      setError(null);
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member to board');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove member from board
  const handleRemoveMember = async (userId) => {
    if (!userId) return;
    
    if (window.confirm('Are you sure you want to remove this member from the board?')) {
      setIsLoading(true);
      try {
        await api.delete(`/board-member/${boardId}/members/${userId}`);
        
        // Refresh board members after removing
        const boardResponse = await api.get(`/boards/${boardId}`);
        if (boardResponse.data && boardResponse.data.members) {
          setBoardMembers(boardResponse.data.members);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error removing member:', err);
        setError('Failed to remove member from board');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Filter out users who are already board members
  const availableUsers = users.filter(user => 
    !boardMembers.some(member => member.user_id === user.user_id)
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-4">Board Members</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Add member form */}
      <div className="flex mb-4">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="flex-1 border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading || availableUsers.length === 0}
        >
          <option value="">Select a user to invite...</option>
          {availableUsers.map(user => (
            <option key={user.user_id} value={user.user_id}>
              {user.fname} {user.lname} ({user.email})
            </option>
          ))}
        </select>
        <button
          onClick={handleAddMember}
          disabled={!selectedUserId || isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-r font-medium hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Adding...' : 'Invite'}
        </button>
      </div>
      
      {/* Member list */}
      <div className="mt-4">
        <h3 className="font-medium text-gray-700 mb-2">Current Members:</h3>
        {boardMembers.length === 0 ? (
          <p className="text-gray-500 italic">No members yet</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {boardMembers.map(member => (
              <li key={member.user_id} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-medium">{member.fname} {member.lname}</span>
                  <span className="text-gray-500 ml-2">({member.email})</span>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.user_id)}
                  className="text-red-600 hover:text-red-800"
                  disabled={isLoading}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BoardSharing;
