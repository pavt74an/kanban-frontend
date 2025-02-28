import React, { useState } from 'react';
import axios from 'axios';
import Task from './Task';

const Column = ({ column, fetchColumns }) => {
  const [newTaskName, setNewTaskName] = useState('');
  const [newTag, setNewTag] = useState('');
  const [assignedUser, setAssignedUser] = useState('');

  const handleCreateTask = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/columns/${column.id}/tasks`,
        { name: newTaskName, tags: [newTag], assignedUserId: assignedUser },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchColumns();
      setNewTaskName('');
      setNewTag('');
      setAssignedUser('');
    } catch (error) {
      console.error('Failed to create task', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchColumns();
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded shadow-md w-64">
      <h3 className="text-lg font-semibold mb-4">{column.name}</h3>
      <div className="mb-4">
        <input
          type="text"
          placeholder="New Task Name"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          className="p-2 border rounded w-full mb-2"
        />
        <input
          type="text"
          placeholder="Add Tag"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          className="p-2 border rounded w-full mb-2"
        />
        <input
          type="text"
          placeholder="Assign User ID"
          value={assignedUser}
          onChange={(e) => setAssignedUser(e.target.value)}
          className="p-2 border rounded w-full mb-2"
        />
        <button onClick={handleCreateTask} className="w-full bg-green-500 text-white p-2 rounded">
          Add Task
        </button>
      </div>
      <div>
        {column.tasks.map((task) => (
          <Task key={task.id} task={task} onDelete={handleDeleteTask} />
        ))}
      </div>
    </div>
  );
};

export default Column;
