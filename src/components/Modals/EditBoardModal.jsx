// Modals/EditBoardModal.jsx
import React from 'react';
import Modal from './Modal';

const EditBoardModal = ({ isOpen, onClose, boardName, onChange, onSubmit }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(boardName);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Edit Board"
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="editBoardName" className="block text-sm font-medium text-gray-700 mb-1">
            Board Name
          </label>
          <input
            type="text"
            id="editBoardName"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter board name"
            value={boardName}
            onChange={(e) => onChange(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditBoardModal;
