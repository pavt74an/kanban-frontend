import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Column from '../components/Column';
import api from '../services/api';

const Board = () => {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [newBoardName, setNewBoardName] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const navigate = useNavigate();

  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    } else {
      fetchBoards();
    }
  }, [navigate]);

  useEffect(() => {
    if (selectedBoard) {
      fetchColumns(selectedBoard.id);
    }
  }, [selectedBoard]);

  const fetchBoards = async () => {
    try {
      const response = await api.get('/boards');
      console.log('Response data:', response.data); // ตรวจสอบค่า response.data
      setBoards(response.data);
    } catch (error) {
      console.error('Failed to fetch boards', error);
      setBoards([]); // กำหนดค่า boards เป็น Array ว่างหากเกิดข้อผิดพลาด
    }
  };

  const fetchColumns = async (boardId) => {
    try {
      const response = await api.get(`/boards/${boardId}/columns`);
      setColumns(response.data);
    } catch (error) {
      console.error('Failed to fetch columns', error);
    }
  };

  const handleCreateBoard = async () => {
    try {
      await api.post('/boards', { name: newBoardName });
      fetchBoards();
      setNewBoardName('');
    } catch (error) {
      console.error('Failed to create board', error);
    }
  };

  const handleDeleteBoard = async (boardId) => {
    try {
      await api.delete(`/boards/${boardId}`);
      fetchBoards();
      setSelectedBoard(null);
    } catch (error) {
      console.error('Failed to delete board', error);
    }
  };

  const handleCreateColumn = async () => {
    try {
      await api.post(`/boards/${selectedBoard.id}/columns`, { name: newColumnName });
      fetchColumns(selectedBoard.id);
      setNewColumnName('');
    } catch (error) {
      console.error('Failed to create column', error);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    try {
      await api.patch(`/tasks/${draggableId}/move`, {
        columnId: destination.droppableId,
        position: destination.index,
      });
      fetchColumns(selectedBoard.id);
    } catch (error) {
      console.error('Failed to move task', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Your Boards</h1>
      <div className="mb-6">
        <input
          type="text"
          placeholder="New Board Name"
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
          className="p-2 border rounded"
        />
        <button onClick={handleCreateBoard} className="ml-2 bg-blue-500 text-white p-2 rounded">
          Create Board
        </button>
      </div>
      <div className="mb-6">
        <select
          onChange={(e) => setSelectedBoard(boards.find((b) => b.id === e.target.value))}
          className="p-2 border rounded"
        >
          <option value="">Select a Board</option>
          {Array.isArray(boards) && boards.map((board) => ( // ตรวจสอบว่า boards เป็น Array
            <option key={board.id} value={board.id}>
              {board.name}
            </option>
          ))}
        </select>
        {selectedBoard && (
          <button
            onClick={() => handleDeleteBoard(selectedBoard.id)}
            className="ml-2 bg-red-500 text-white p-2 rounded"
          >
            Delete Board
          </button>
        )}
      </div>
      {selectedBoard && (
        <>
          <div className="mb-6">
            <input
              type="text"
              placeholder="New Column Name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="p-2 border rounded"
            />
            <button onClick={handleCreateColumn} className="ml-2 bg-green-500 text-white p-2 rounded">
              Create Column
            </button>
          </div>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="columns" direction="horizontal">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex space-x-4"
                >
                  {columns.map((column, index) => (
                    <Draggable key={column.id} draggableId={column.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Column column={column} fetchColumns={() => fetchColumns(selectedBoard.id)} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}
    </div>
  );
};

export default Board;
