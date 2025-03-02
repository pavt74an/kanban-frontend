import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import BoardList from '../components/Dashboard/BoardList';
import BoardView from '../components/Board/BoardView';
import AddBoardModal from '../components/Modals/AddBoardModal';
import EditBoardModal from '../components/Modals/EditBoardModal';

const Dashboard = () => {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [boardName, setBoardName] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/boards');
      console.log('API Response:', response.data);
      if (response.data && Array.isArray(response.data.boards)) {
        setBoards(response.data.boards);
      } else {
        console.error('Expected an array but got:', response.data);
        setBoards([]);
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error);
      setBoards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBoard = async (boardName) => {
    if (boardName.trim()) {
      try {
        const response = await api.post('/boards/add_board', { board_name: boardName });
        setBoards([...boards, response.data]);
        setIsAddModalOpen(false);
        fetchBoards();
      } catch (error) {
        console.error('Failed to add board:', error);
      }
    }
  };

  const handleUpdateBoard = async (boardName) => {
    if (boardName.trim() && currentBoard) {
      try {
        await api.put(`/boards/${currentBoard.board_id}`, { board_name: boardName });
        setIsEditModalOpen(false);
        fetchBoards();
      } catch (error) {
        console.error('Failed to update board:', error);
      }
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบบอร์ดนี้?')) {
      return;
    }
    
    try {
      console.log('กำลังลบบอร์ด:', boardId);
      const response = await api.delete(`/boards/${boardId}`);
      
      // อัพเดทสถานะ UI
      setSelectedBoard(null);
      fetchBoards();
      
      alert('ลบบอร์ดเรียบร้อยแล้ว');
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการลบบอร์ด:', error);
      
      // แสดงข้อความแจ้งเตือนให้ลบข้อมูลภายในก่อน
      alert('ไม่อนุญาตให้ลบบอร์ด โปรดลบคอลัมน์ งาน และสมาชิกทั้งหมดภายในบอร์ดก่อน จึงจะสามารถลบบอร์ดได้');
    }
  };
  const openEditModal = (board) => {
    setCurrentBoard(board);
    setBoardName(board.board_name || '');
    setIsEditModalOpen(true);
  };

  const viewBoard = async (board) => {
    setSelectedBoard(board);
  };

  const handleLogout = () => {
    // Clear the access token from localStorage
    localStorage.removeItem('accessToken');
    // Also clear any other auth-related items if they exist
    localStorage.removeItem('token');
    // Redirect to the login page
    navigate('/');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-blue-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">My Boards</h1>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </header>
      
      {selectedBoard ? (
        // Board View component
        <BoardView 
          board={selectedBoard} 
          onBack={() => setSelectedBoard(null)}
        />
      ) : (
        // Dashboard View
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Actions Bar */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex-1">
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors duration-200"
              >
                <span className="mr-2">+</span>
                Create New Board
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {boards.length} {boards.length === 1 ? 'board' : 'boards'} available
            </div>
          </div>
          
          {/* Board List */}
          <BoardList 
            boards={boards} 
            isLoading={isLoading} 
            onView={viewBoard}
            onEdit={openEditModal}
            onDelete={handleDeleteBoard}
            onCreateNew={() => setIsAddModalOpen(true)}
          />
        </main>
      )}
      
      {/* Add Board Modal */}
      <AddBoardModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddBoard}
      />
      
      {/* Edit Board Modal */}
      <EditBoardModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)}
        boardName={boardName}
        onSubmit={handleUpdateBoard}
        onChange={(newName) => setBoardName(newName)}
      />
    </div>
  );
};

export default Dashboard;
