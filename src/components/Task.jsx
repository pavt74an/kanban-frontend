import React from 'react';

const Task = ({ task, onDelete }) => {
  return (
    <div className="bg-white p-2 mb-2 rounded shadow-sm">
      <p>{task.name}</p>
      <div className="flex space-x-2 mt-2">
        {task.tags.map((tag, index) => (
          <span key={index} className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
            {tag}
          </span>
        ))}
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="mt-2 bg-red-500 text-white p-1 rounded"
      >
        Delete
      </button>
    </div>
  );
};

export default Task;
