import React, { useState, useEffect } from "react";
import api from "../../services/api";
import Column from "./Column";
import AddColumnModal from "../Modals/AddColumnModal";

const BoardView = ({ board, onBack }) => {
	const [columns, setColumns] = useState([]);
	const [showAddColumn, setShowAddColumn] = useState(false);
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [showMemberPanel, setShowMemberPanel] = useState(false);
	const [allUsers, setAllUsers] = useState([]);
	const [boardMembers, setBoardMembers] = useState([]);
	const [selectedUser, setSelectedUser] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [inviteError, setInviteError] = useState("");

	useEffect(() => {
		fetchColumns();
		fetchBoardMembers();
		fetchAllUsers();
	}, [board.board_id]);
	// Filter users who are not already board members
	const availableUsers = allUsers.filter(
		(user) => !boardMembers.some((member) => member.id === user.id)
	);

	// Filter users based on search term
	const filteredUsers = availableUsers.filter(
		(user) =>
			user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(user.fname &&
				user.fname.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(user.lname &&
				user.lname.toLowerCase().includes(searchTerm.toLowerCase()))
	);
	const fetchColumns = async () => {
		try {
			const response = await api.get(`/columns/board/${board.board_id}`);
			setColumns(response.data);
		} catch (error) {
			console.error("Failed to fetch columns:", error);
			setColumns([]);
		}
	};

	const fetchBoardMembers = async () => {
		try {
			// First, get the board which contains member relationship records
			const boardResponse = await api.get(`/boards/${board.board_id}`);
			console.log("Board response:", boardResponse.data);

			// Check if we have the board data structure
			if (
				!boardResponse.data ||
				!boardResponse.data.board ||
				!boardResponse.data.board.members
			) {
				console.error("Unexpected board data structure:", boardResponse.data);
				setBoardMembers([]);
				return;
			}

			// Extract user_ids from the members array
			const memberRelationships = boardResponse.data.board.members;
			console.log("Member relationships:", memberRelationships);

			if (memberRelationships.length === 0) {
				console.log("No members found for this board");
				setBoardMembers([]);
				return;
			}

			// Get the user_ids from the member relationships
			const memberUserIds = memberRelationships.map((member) => member.user_id);
			console.log("Member user IDs:", memberUserIds);

			// Fetch all users to get full user information
			const usersResponse = await api.get("/user");
			console.log("All users:", usersResponse.data);

			if (!usersResponse.data || !Array.isArray(usersResponse.data)) {
				console.error(
					"Failed to fetch users or unexpected format:",
					usersResponse.data
				);
				setBoardMembers([]);
				return;
			}

			// Filter users to only include board members based on user_id
			const fullMemberData = usersResponse.data.filter((user) =>
				memberUserIds.includes(user.id)
			);

			console.log("Full member data:", fullMemberData);
			setBoardMembers(fullMemberData);
		} catch (error) {
			console.error("Failed to fetch board members:", error);
			console.error("Error details:", {
				message: error.message,
				response: error.response?.data,
				status: error.response?.status,
			});
			setBoardMembers([]);
		}
	};

	const fetchAllUsers = async () => {
		try {
			const response = await api.get("/user");
			setAllUsers(response.data || []);
		} catch (error) {
			console.error("Failed to fetch users:", error);
			setAllUsers([]);
		}
	};

	// Add a new column
	const handleAddColumn = async (columnName) => {
		if (!columnName.trim() || !board) return;

		try {
			const response = await api.post("/columns", {
				columnName: columnName,
				boardId: board.board_id,
			});
			setColumns([...columns, response.data]);
			setIsAddModalOpen(false);
		} catch (error) {
			console.error("Failed to add column:", error);
		}
	};

	// Edit a column
	const handleEditColumn = async (columnId, newName) => {
		try {
			await api.patch("/columns", { columnId, columnName: newName });
			setColumns((prevColumns) =>
				prevColumns.map((column) =>
					column.column_id === columnId
						? { ...column, column_name: newName }
						: column
				)
			);
		} catch (error) {
			console.error("Failed to edit column:", error);
		}
	};

	// Delete a column
	const handleDeleteColumn = async (columnId) => {
		if (!window.confirm("Are you sure you want to delete this column?")) return;

		try {
			await api.delete(`/columns/${columnId}`);
			setColumns((prevColumns) =>
				prevColumns.filter((column) => column.column_id !== columnId)
			);
		} catch (error) {
			console.error("Failed to delete column:", error);
		}
		window.location.reload();
	};

	// Handle task operations
	const handleAddTask = async (columnId, taskName) => {
		if (!taskName || !taskName.trim()) return;

		try {
			const response = await api.post("/tasks", {
				taskName,
				columnId,
			});

			setColumns((prevColumns) =>
				prevColumns.map((column) =>
					column.column_id === columnId
						? {
								...column,
								tasks: [...(column.tasks || []), response.data],
						  }
						: column
				)
			);
		} catch (error) {
			console.error("Failed to add task:", error);
		}
	};

	const handleEditTask = async (taskId, newName) => {
		try {
			await api.patch(`/tasks/${taskId}/name`, { taskName: newName });
			setColumns((prevColumns) =>
				prevColumns.map((column) => ({
					...column,
					tasks: (column.tasks || []).map((task) =>
						task.task_id === taskId ? { ...task, task_name: newName } : task
					),
				}))
			);
		} catch (error) {
			console.error("Failed to edit task:", error);
		}
	};

	const handleDeleteTask = async (taskId) => {
		if (!window.confirm("Are you sure you want to delete this task?")) return;

		try {
			await api.delete(`/tasks/${taskId}`);
			setColumns((prevColumns) =>
				prevColumns.map((column) => ({
					...column,
					tasks: (column.tasks || []).filter((task) => task.task_id !== taskId),
				}))
			);
		} catch (error) {
			console.error("Failed to delete task:", error);
		}
	};

	const handleMoveTask = async (taskId, newColumnId) => {
		try {
			await api.patch(`/tasks/${taskId}/move`, { columnId: newColumnId });

			// Find the task in current columns
			let taskToMove = null;
			let sourceColumnId = null;

			for (const column of columns) {
				if (!column.tasks) continue;

				const task = column.tasks.find((t) => t.task_id === taskId);
				if (task) {
					taskToMove = task;
					sourceColumnId = column.column_id;
					break;
				}
			}

			if (taskToMove && sourceColumnId) {
				setColumns((prevColumns) =>
					prevColumns.map((column) => ({
						...column,
						tasks:
							column.column_id === sourceColumnId
								? (column.tasks || []).filter((t) => t.task_id !== taskId)
								: column.column_id === newColumnId
								? [...(column.tasks || []), taskToMove]
								: column.tasks || [],
					}))
				);
			}
		} catch (error) {
			console.error("Failed to move task:", error);
		}
	};

	const handleAddMember = async () => {
		if (!selectedUser) {
			setInviteError("Please select a user to invite");
			return;
		}

		// Debug the selected user
		console.log("Selected user value:", selectedUser);

		setIsLoading(true);
		setInviteError("");

		try {
			const token = localStorage.getItem("token");

			if (!token) {
				setInviteError("You need to be logged in to add members");
				setIsLoading(false);
				return;
			}

			// Log the exact request we're sending
			console.log("Adding member with request:", {
				endpoint: `/board-member/${board.board_id}/members`,
				body: { userId: selectedUser },
			});

			const response = await api.post(
				`/board-member/${board.board_id}/members`,
				{ userId: selectedUser }
			);

			console.log("Response:", response);

			if (response.status === 200 || response.status === 201) {
				await fetchBoardMembers();
				setSelectedUser("");
				setSearchTerm("");
				alert("Member successfully added to the board");
			} else {
				setInviteError("Failed to add member. Please try again.");
			}
		} catch (error) {
			console.error("Failed to add member to board:", error);
			console.error("Error details:", {
				message: error.message,
				response: error.response?.data,
				status: error.response?.status,
			});

			const errorMessage =
				error.response?.data?.message ||
				"Failed to add member. Please try again.";
			setInviteError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	// Remove member from board
	const handleRemoveMember = async (userId) => {
		if (
			!window.confirm(
				"Are you sure you want to remove this member from the board?"
			)
		) {
			return;
		}

		setIsLoading(true);

		try {
			await api.delete(`/board-member/${board.board_id}/members/${userId}`);
			await fetchBoardMembers();
		} catch (error) {
			console.error("Failed to remove member from board:", error);
			console.error("Error details:", {
				message: error.message,
				response: error.response?.data,
				status: error.response?.status,
			});
			alert("Failed to remove member. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};
	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
			<div className="mb-6 flex justify-between items-center">
				<button
					onClick={onBack}
					className="flex items-center text-blue-600 hover:text-blue-800"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5 mr-1"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fillRule="evenodd"
							d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
							clipRule="evenodd"
						/>
					</svg>
					Back to Boards
				</button>
				<h2 className="text-2xl font-bold text-gray-800">{board.board_name}</h2>
				<div className="flex space-x-2">
					<button
						onClick={() => setShowMemberPanel(!showMemberPanel)}
						className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
					>
						{showMemberPanel ? "Hide Members" : "Manage Members"}
					</button>
					<button
						onClick={() => setIsAddModalOpen(true)}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						+ Add Column
					</button>
				</div>
			</div>

			{/* Board Members Panel */}
			{showMemberPanel && (
				<div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-fadeIn">
					<div className="mb-4 flex justify-between items-center">
						<h3 className="text-lg font-medium text-gray-900">Board Members</h3>
						<span className="text-sm text-gray-500">
							{boardMembers.length} members
						</span>
					</div>

					{/* Current Members List */}
					<div className="mb-6">
						<h4 className="text-sm font-medium text-gray-700 mb-2">
							Current Members:
						</h4>
						{boardMembers.length > 0 ? (
							<ul className="divide-y divide-gray-200">
								{boardMembers.map((member) => (
									<li
										key={member.id}
										className="py-3 flex justify-between items-center"
									>
										<div>
											<p className="text-sm font-medium text-gray-900">
												{member.fname} {member.lname}
											</p>
											<p className="text-sm text-gray-500">{member.email}</p>
										</div>
										<button
											onClick={() => handleRemoveMember(member.id)}
											className="ml-2 text-red-600 hover:text-red-800 text-sm"
											disabled={isLoading}
										>
											Remove
										</button>
									</li>
								))}
							</ul>
						) : (
							<p className="text-sm text-gray-500 italic">No members found</p>
						)}
					</div>

					{/* Add New Member Section */}
					<div>
						<h4 className="text-sm font-medium text-gray-700 mb-2">
							Add New Member:
						</h4>

						<div className="mb-3">
							<input
								type="text"
								placeholder="Search by email or name..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full p-2 border border-gray-300 rounded text-sm"
							/>
						</div>

						<div className="mb-3">
							{/* Fix for the select options - the first option needs a key */}
							<select
								value={selectedUser}
								onChange={(e) => setSelectedUser(e.target.value)}
								className="w-full p-2 border border-gray-300 rounded text-sm"
								disabled={isLoading || filteredUsers.length === 0}
							>
								<option key="default-option" value="">
									Select a user...
								</option>
								{filteredUsers.map((user) => (
									<option key={user.id} value={user.id}>
										{user.email} ({user.fname} {user.lname})
									</option>
								))}
							</select>
						</div>

						{inviteError && (
							<p className="text-sm text-red-600 mb-2">{inviteError}</p>
						)}

						<button
							onClick={handleAddMember}
							className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:bg-blue-300"
							disabled={isLoading || !selectedUser}
						>
							{isLoading ? "Adding..." : "Add Member to Board"}
						</button>

						{filteredUsers.length === 0 && searchTerm && (
							<p className="text-sm text-gray-500 mt-2">
								No matching users found. Try a different search term.
							</p>
						)}
					</div>
				</div>
			)}

			{/* Columns Grid */}
			{columns.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{columns.map((column) => (
						<Column
							key={column.column_id}
							column={column}
							allColumns={columns}
							boardId={board.board_id}
							boardMembers={boardMembers}
							onEditColumn={handleEditColumn}
							onDeleteColumn={handleDeleteColumn}
							onAddTask={handleAddTask}
							onEditTask={handleEditTask}
							onDeleteTask={handleDeleteTask}
							onMoveTask={handleMoveTask}
						/>
					))}
				</div>
			) : (
				<div className="bg-white rounded-lg shadow-md p-8 text-center">
					<p className="text-gray-500 mb-4">
						No columns available. Add your first column to get started.
					</p>
					<button
						onClick={() => setIsAddModalOpen(true)}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						+ Add Column
					</button>
				</div>
			)}

			{/* Add Column Modal */}
			<AddColumnModal
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				onSubmit={handleAddColumn}
			/>
		</div>
	);
};

export default BoardView;
