import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Task = ({ task, onEditTask, onDeleteTask, onMoveTask, boardMembers, allColumns }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [taskName, setTaskName] = useState(task.task_name || '');
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveOptions, setShowMoveOptions] = useState(false);
  const [assignedMembers, setAssignedMembers] = useState(task.assigned_members || []);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [tags, setTags] = useState(task.tags || []);
  const [newTag, setNewTag] = useState('');
  const [showTagMenu, setShowTagMenu] = useState(false);

  useEffect(() => {
    // Fetch assigned members if needed
    if (!task.assigned_members) {
      fetchAssignedMembers();
    }
    
    // Fetch tags if needed
    if (!task.tags) {
      fetchTags();
    }
  }, [task.task_id]);

  const fetchAssignedMembers = async () => {
    try {
      const response = await api.get(`/tasks/${task.task_id}/members`);
      setAssignedMembers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch assigned members:", error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get(`/tasks/${task.task_id}/tags`);
      setTags(response.data || []);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    }
  };

  const handleSubmitEdit = () => {
    if (taskName.trim() !== '') {
      onEditTask(task.task_id, taskName);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmitEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTaskName(task.task_name);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      const response = await api.post(`/tasks/${task.task_id}/tags`, { 
        tagName: newTag 
      });
      
      setTags([...tags, response.data]);
      setNewTag('');
      setShowTagMenu(false);
    } catch (error) {
      console.error("Failed to add tag:", error);
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      await api.delete(`/tasks/${task.task_id}/tags/${tagId}`);
      setTags(tags.filter(tag => tag.tag_id !== tagId));
    } catch (error) {
      console.error("Failed to remove tag:", error);
    }
  };

  const handleAssignMember = async (userId) => {
    try {
      await api.post(`/tasks/${task.task_id}/members`, { userId });
      
      // Find the member from boardMembers
      const newMember = boardMembers.find(member => member.user_id === userId);
      if (newMember) {
        // Check if member is already assigned to avoid duplicates
        if (!assignedMembers.some(member => member.user_id === userId)) {
          setAssignedMembers([...assignedMembers, newMember]);
        }
      }
      
      setShowAssignMenu(false);
    } catch (error) {
      console.error("Failed to assign member:", error);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await api.delete(`/tasks/${task.task_id}/members/${userId}`);
      setAssignedMembers(assignedMembers.filter(member => member.user_id !== userId));
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  // Get available members (members not already assigned)
  const availableMembers = boardMembers.filter(boardMember => 
    !assignedMembers.some(assignedMember => assignedMember.user_id === boardMember.user_id)
  );

  // Close any open menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenu(false);
      setShowMoveOptions(false);
      setShowAssignMenu(false);
      setShowTagMenu(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
    setShowMoveOptions(false);
    setShowAssignMenu(false);
    setShowTagMenu(false);
  };

  // Function to make tasks draggable
  const handleDragStart = (e) => {
    e.dataTransfer.setData('taskId', task.task_id);
    e.dataTransfer.setData('sourceColumnId', task.column_id);
  };

  return (
    <div 
      className="p-3 mb-2 bg-white rounded shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      draggable="true"
      onDragStart={handleDragStart}
    >
      {isEditing ? (
        <div className="flex mb-2">
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-1 border border-gray-300 rounded"
            autoFocus
          />
          <button
            onClick={handleSubmitEdit}
            className="ml-2 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-medium">{task.task_name}</h3>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleMenuClick}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Task options"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Edit Task
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        setShowMoveOptions(!showMoveOptions);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Move Task
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        setShowAssignMenu(!showAssignMenu);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Assign Member
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        setShowTagMenu(!showTagMenu);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Manage Tags
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDeleteTask(task.task_id);
                      }}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Delete Task
                    </button>
                  </li>
                </ul>
              </div>
            )}
            
            {showMoveOptions && (
              <div 
                className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-lg z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 text-xs font-medium text-gray-500">Move to column:</div>
                <ul className="py-1">
                  {allColumns
                    .filter(col => col.column_id !== task.column_id)
                    .map(column => (
                      <li key={column.column_id}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveTask(task.task_id, column.column_id);
                            setShowMoveOptions(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          {column.column_name}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            
            {showAssignMenu && (
              <div 
                className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-lg z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 text-xs font-medium text-gray-500">Assign to member:</div>
                <ul className="max-h-40 overflow-y-auto">
                  {availableMembers.length > 0 ? (
                    availableMembers.map(member => (
                      <li key={member.user_id} className="border-b border-gray-100 last:border-b-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignMember(member.user_id);
                          }}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                              {member.fname ? member.fname.charAt(0) : ''}
                              {member.lname ? member.lname.charAt(0) : ''}
                            </div>
                            <div className="ml-2">
                              <div className="text-sm font-medium">{member.fname} {member.lname}</div>
                              <div className="text-xs text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-sm text-gray-500 italic">
                      No available members to assign
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {showTagMenu && (
              <div 
                className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-lg z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 mb-2">Add new tag:</div>
                  <div className="flex">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="w-full p-1 text-sm border border-gray-300 rounded"
                      placeholder="Enter tag name"
                    />
                    <button
                      onClick={handleAddTag}
                      className="ml-2 px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
                
                {tags.length > 0 && (
                  <div className="p-2 border-t border-gray-100">
                    <div className="text-xs font-medium text-gray-500 mb-2">Current tags:</div>
                    <ul>
                      {tags.map(tag => (
                        <li key={tag.tag_id} className="flex justify-between items-center py-1">
                          <span className="text-sm">{tag.tag_name}</span>
                          <button
                            onClick={() => handleRemoveTag(tag.tag_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Assigned Members */}
      {assignedMembers.length > 0 && (
        <div className="mt-2">
          <div className="flex flex-wrap">
            {assignedMembers.map(member => (
              <div 
                key={member.user_id} 
                className="flex items-center bg-blue-50 rounded-full px-2 py-1 text-xs mr-1 mb-1"
                title={`${member.fname} ${member.lname} - ${member.email}`}
              >
                <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-1">
                  {member.fname ? member.fname.charAt(0) : ''}
                </span>
                <span className="truncate max-w-[80px]">
                  {member.fname} {member.lname ? member.lname.charAt(0) : ''}
                </span>
                <button
                  onClick={() => handleRemoveMember(member.user_id)}
                  className="ml-1 text-gray-500 hover:text-red-500"
                  title="Remove member"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap">
          {tags.map(tag => (
            <span 
              key={tag.tag_id} 
              className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-medium text-gray-700 mr-1 mb-1"
            >
              #{tag.tag_name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default Task;
