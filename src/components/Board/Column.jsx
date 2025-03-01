import React, { useState } from 'react';
import Task from './Task';

const Column = ({ 
  column, 
  allColumns, 
  boardId, 
  boardMembers,
  onEditColumn, 
  onDeleteColumn, 
  onAddTask, 
  onEditTask, 
  onDeleteTask, 
  onMoveTask 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [columnName, setColumnName] = useState(column.column_name || '');
  const [newTaskName, setNewTaskName] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSaveColumn = () => {
    if (columnName.trim() !== '') {
      onEditColumn(column.column_id, columnName);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveColumn();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setColumnName(column.column_name);
    }
  };

  const handleAddTask = () => {
    if (newTaskName.trim() !== '') {
      onAddTask(column.column_id, newTaskName);
      setNewTaskName('');
      setShowAddTask(false);
    }
  };

  const handleAddTaskKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setShowAddTask(false);
      setNewTaskName('');
    }
  };

  const handleTaskUpdated = () => {
    // Notify parent component that a task has been updated
    if (onEditTask) {
      // We don't have actual parameters here but this signals to parent
      // that something changed and it should refresh data
      onEditTask();
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-blue-50');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50');
    
    const taskId = e.dataTransfer.getData('taskId');
    const sourceColumnId = e.dataTransfer.getData('sourceColumnId');
    
    // Only move if dropping to a different column
    if (sourceColumnId !== column.column_id) {
      onMoveTask(taskId, column.column_id);
    }
  };

  return (
    <div className="bg-gray-100 rounded-lg shadow p-4 flex flex-col h-[600px]">
      {/* Column Header */}
      <div className="flex justify-between items-center mb-4">
        {isEditing ? (
          <div className="flex w-full">
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow p-1 border border-gray-300 rounded"
              autoFocus
            />
            <button
              onClick={handleSaveColumn}
              className="ml-2 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Save
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold">{column.column_name}</h3>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Column options"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
                  <ul className="py-1">
                    <li>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        Edit Column
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          onDeleteColumn(column.column_id);
                          setShowMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                      >
                        Delete Column
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Tasks Container - Droppable Area */}
      <div 
        className="flex-grow overflow-y-auto mb-4 p-1 transition-colors duration-200"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {column.tasks && column.tasks.length > 0 ? (
          column.tasks.map((task) => (
            <Task
              key={task.task_id}
              task={task}
              onTaskUpdated={handleTaskUpdated}
              columnId={column.column_id}
              columns={allColumns}
              boardMembers={boardMembers}
            />
          ))
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm italic">
            No tasks yet. Add a task to get started.
          </div>
        )}
      </div>

      {/* Add Task Form */}
      {showAddTask ? (
        <div className="p-2 bg-white border border-gray-200 rounded shadow-inner">
          <textarea
            placeholder="Enter task description..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={handleAddTaskKeyDown}
            className="w-full p-2 border border-gray-300 rounded resize-none"
            rows="2"
            autoFocus
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={() => {
                setShowAddTask(false);
                setNewTaskName('');
              }}
              className="px-3 py-1 text-gray-600 hover:text-gray-800 mr-2"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTask}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={!newTaskName.trim()}
            >
              Add Task
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddTask(true)}
          className="flex items-center justify-center py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Task
        </button>
      )}
    </div>
  );
};

export default Column;
