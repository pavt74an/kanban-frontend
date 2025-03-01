import React from 'react';

const BoardCard = ({ board, onView, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{board.board_name}</h2>
        
        <button
          onClick={() => onView(board)}
          className="w-full mb-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium transition-colors duration-200"
        >
          View Board
        </button>
        
        <div className="border-t border-gray-200 mt-2 pt-4 flex justify-between">
          <button
            onClick={() => onEdit(board)}
            className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors duration-200"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(board.board_id)}
            className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoardCard;
