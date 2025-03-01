import React from 'react';
import BoardCard from './BoardCard';

const BoardList = ({ boards, isLoading, onView, onEdit, onDelete, onCreateNew }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 mb-4">No boards available. Create your first board to get started.</p>
        <button 
          onClick={onCreateNew}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors duration-200"
        >
          <span className="mr-2">+</span>
          Create New Board
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {boards.map((board) => (
        <BoardCard 
          key={board.board_id} 
          board={board}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default BoardList;
