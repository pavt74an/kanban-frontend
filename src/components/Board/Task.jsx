import React, { useState, useEffect } from "react";
import api from "../../services/api";

const Task = ({ task, onTaskUpdated, columnId, columns, boardMembers }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [taskName, setTaskName] = useState(task.task_name);
	const [showOptions, setShowOptions] = useState(false);
	const [tags, setTags] = useState([]);
	const [newTag, setNewTag] = useState("");
	const [assignedMembers, setAssignedMembers] = useState([]);
	const [selectedMemberId, setSelectedMemberId] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showInvite, setShowInvite] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [assignmentStatus, setAssignmentStatus] = useState({
		message: "",
		type: "",
	});

	useEffect(() => {
		const fetchTaskData = async () => {
			try {
				// Fetch tags for this task
				const tagsResponse = await api.get(`/tags/task/${task.task_id}`);
				if (tagsResponse.data && Array.isArray(tagsResponse.data)) {
					setTags(tagsResponse.data);
				}

				// Fetch task details to get assigned members with detailed logging
				console.log(`Fetching task details for task_id: ${task.task_id}`);
				const taskResponse = await api.get(`/tasks/${task.task_id}`);
				console.log("Task details response:", taskResponse.data);

				if (taskResponse.data) {
					// Check what format assignedUsers is in
					if (taskResponse.data.assignedUsers !== undefined) {
						console.log(
							"Raw assignedUsers data:",
							taskResponse.data.assignedUsers
						);

						let users = taskResponse.data.assignedUsers;

						// Handle potential nested array
						if (
							Array.isArray(users) &&
							users.length > 0 &&
							Array.isArray(users[0])
						) {
							console.log("Detected nested array, flattening...");
							users = users.flat();
						} else if (Array.isArray(users)) {
							console.log(
								"Users is already a flat array with length:",
								users.length
							);
						} else {
							console.log("Users is not an array, type:", typeof users);
							users = Array.isArray(users) ? users : [];
						}

						console.log("Processed users to set in state:", users);
						setAssignedMembers(users);
					} else {
						console.log("No assignedUsers property found in task response");

						// Check if there's an alternative property that might contain assigned users
						console.log(
							"Available properties in task response:",
							Object.keys(taskResponse.data)
						);

						// Try to find assigned users in a different property if available
						const possibleProps = [
							"assigned_users",
							"members",
							"assignees",
							"users",
						];
						for (const prop of possibleProps) {
							if (
								taskResponse.data[prop] &&
								Array.isArray(taskResponse.data[prop])
							) {
								console.log(
									`Found potential assigned users in '${prop}' property:`,
									taskResponse.data[prop]
								);
								setAssignedMembers(taskResponse.data[prop]);
								break;
							}
						}
					}
				}
			} catch (error) {
				console.error("Error fetching task data:", error);
				console.error("Error details:", error.response?.data);
			}
		};

		fetchTaskData();
	}, [task.task_id]);

	const handleSaveTaskName = async () => {
		if (taskName.trim() !== "") {
			setIsLoading(true);
			try {
				await api.patch(`/tasks/${task.task_id}/name`, {
					taskName: taskName,
				});
				setIsEditing(false);
				if (onTaskUpdated) onTaskUpdated();
			} catch (error) {
				console.error("Failed to update task name:", error);
			} finally {
				setIsLoading(false);
			}
		}
		// window.location.reload();
	};

	const handleDeleteTask = async () => {
		if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบงานนี้?")) return;

		setIsLoading(true);
		try {
			console.log(`เริ่มกระบวนการลบงาน: ${task.task_id}`);

			// 1. ตรวจสอบว่ามีการมอบหมายงานให้ผู้ใช้หรือไม่
			console.log("ตรวจสอบการมอบหมายงาน...");
			const taskDetailsResponse = await api.get(`/tasks/${task.task_id}`);

			if (taskDetailsResponse.data && taskDetailsResponse.data.assignedUsers) {
				const assignedUsers = taskDetailsResponse.data.assignedUsers;
				console.log(`พบผู้ใช้ที่ได้รับมอบหมายงาน ${assignedUsers.length} คน`);

				// ยกเลิกการมอบหมายงานทั้งหมด
				for (const user of assignedUsers) {
					const userId = user.user_id || user.id;
					console.log(`กำลังยกเลิกการมอบหมายงานให้ผู้ใช้: ${userId}`);
					await api.patch(`/tasks/${task.task_id}/unassign`, { userId });
				}
			}

			// 3. ลบแท็กทั้งหมดที่เกี่ยวข้องกับงานนี้
			console.log("กำลังลบแท็กที่เกี่ยวข้อง...");
			const tagsResponse = await api.get(`/tags/task/${task.task_id}`);

			if (tagsResponse.data && Array.isArray(tagsResponse.data)) {
				for (const tag of tagsResponse.data) {
					const tagId = tag.tag_id || tag.id;
					console.log(`กำลังลบแท็ก: ${tagId}`);
					await api.delete(`/tags/${tagId}`);
				}
			}

			// 4. สุดท้าย ลบงาน
			console.log("กำลังลบงาน...");
			const deleteResponse = await api.delete(`/tasks/${task.task_id}`);
			console.log("ผลลัพธ์การลบงาน:", deleteResponse);

			// อัพเดท UI
			if (onTaskUpdated) onTaskUpdated();
		} catch (error) {
			console.error("Failed to delete task:", error);

			// แสดงข้อความแจ้งเตือนที่เหมาะสมกับผู้ใช้
			let errorMessage = "ไม่สามารถลบงานได้";

			if (error.response) {
				console.error("Error response data:", error.response.data);
				console.error("Error status:", error.response.status);

				if (error.response.status === 500) {
					errorMessage +=
						" เนื่องจากมีข้อมูลที่เกี่ยวข้องกับงานนี้ที่ต้องลบก่อน";
				} else {
					errorMessage += ` (${error.response.status}: ${
						error.response.data?.message || "Unknown error"
					})`;
				}
			}

			alert(errorMessage);
		} finally {
			setIsLoading(false);
		}

		window.location.reload();
	};

	const handleAddTag = async () => {
		if (newTag.trim() === "") return;

		setIsLoading(true);
		try {
			const response = await api.post("/tags", {
				name: newTag,
				taskId: task.task_id,
			});
			setTags([...tags, response.data]);
			setNewTag("");
		} catch (error) {
			console.error("Failed to add tag:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteTag = async (tagId) => {
		if (!tagId) {
			console.error("Tag ID is undefined. Cannot delete tag.");
			return;
		}

		setIsLoading(true);
		try {
			console.log(`Attempting to delete tag with ID: ${tagId}`);
			const response = await api.delete(`/tags/${tagId}`);
			console.log("Delete tag response:", response);

			setTags(tags.filter((tag) => tag.tag_id !== tagId && tag.id !== tagId));
			console.log("Tags after deletion:", tags);
		} catch (error) {
			console.error("Failed to delete tag:", error);
			alert(`ไม่สามารถลบแท็กได้: ${error.message}`);
		} finally {
			setIsLoading(false);
		}
		window.location.reload();
	};

	// Enhanced handleAssignMember function
	const handleAssignMember = async () => {
		if (!selectedMemberId) {
			console.error("No member selected");
			setAssignmentStatus({
				message: "กรุณาเลือกสมาชิกที่จะมอบหมายงาน",
				type: "error",
			});
			return;
		}

		setIsLoading(true);
		setAssignmentStatus({ message: "กำลังมอบหมายงาน...", type: "info" });

		try {
			console.log("Attempting to assign task to user ID:", selectedMemberId);
			console.log("Task ID:", task.task_id);

			// Check if selectedMemberId is valid
			const selectedMember = boardMembers?.find(
				(member) =>
					member.user_id === selectedMemberId || member.id === selectedMemberId
			);

			if (!selectedMember) {
				console.error("Selected member not found in boardMembers");
				setAssignmentStatus({ message: "ไม่พบสมาชิกที่เลือก", type: "error" });
				setIsLoading(false);
				return;
			}

			console.log("Selected member to assign:", selectedMember);

			// Make the API call with detailed debugging information
			const payload = { userId: selectedMemberId };
			console.log("Assignment request payload:", payload);

			const response = await api.patch(
				`/tasks/${task.task_id}/assign`,
				payload
			);

			console.log("Assignment API full response:", response);

			// Check if the API call was successful
			if (response.status >= 200 && response.status < 300) {
				// Create notification for assigned user
				try {
					await api.post("/notifications", {
						message: `You have been assigned to task: ${task.task_name}`,
						userId: selectedMemberId,
						taskId: task.task_id,
					});
				} catch (notificationError) {
					console.error(
						"Failed to create notification, but task assignment succeeded:",
						notificationError
					);
				}

				// First update state locally for immediate UI feedback
				console.log("Updating UI state with newly assigned member");
				setAssignedMembers((prev) => {
					// Check if member is already in the array to avoid duplicates
					const isMemberAlreadyAssigned = prev.some(
						(m) => m.user_id === selectedMemberId || m.id === selectedMemberId
					);

					if (isMemberAlreadyAssigned) {
						console.log("Member already in assigned list, not adding again");
						return prev;
					}

					console.log("Adding member to assigned list:", selectedMember);
					return [...prev, selectedMember];
				});

				// Still fetch the latest data from the server to ensure consistency
				try {
					console.log("Fetching updated task data after assignment");
					const taskResponse = await api.get(`/tasks/${task.task_id}`);
					console.log("Updated task data received:", taskResponse.data);

					if (taskResponse.data) {
						if (taskResponse.data.assignedUsers !== undefined) {
							let users = taskResponse.data.assignedUsers;

							// Handle potential nested array
							if (
								Array.isArray(users) &&
								users.length > 0 &&
								Array.isArray(users[0])
							) {
								console.log("Detected nested array in refresh, flattening...");
								users = users.flat();
							}

							console.log("Setting assigned members state with:", users);
							setAssignedMembers(users);
						} else {
							console.log(
								"No assignedUsers in refresh response. Available properties:",
								Object.keys(taskResponse.data)
							);
						}
					}
				} catch (fetchError) {
					console.error(
						"Failed to refresh assigned members after assignment:",
						fetchError
					);
				}

				setSelectedMemberId(""); // Reset selectedMemberId after assigning
				setAssignmentStatus({ message: "มอบหมายงานสำเร็จ", type: "success" });

				// Clear success message after 3 seconds
				setTimeout(() => {
					setAssignmentStatus({ message: "", type: "" });
				}, 3000);
			} else {
				setAssignmentStatus({
					message: "ไม่สามารถมอบหมายงานได้",
					type: "error",
				});
			}
		} catch (error) {
			console.error("Failed to assign member:", error);
			console.error("Response data:", error.response?.data);
			console.error("Status code:", error.response?.status);
			setAssignmentStatus({
				message:
					error.response?.data?.message || "เกิดข้อผิดพลาดในการมอบหมายงาน",
				type: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};
	

	const handleUnassignMember = async (userId) => {
		setIsLoading(true);
		try {
			await api.patch(`/tasks/${task.task_id}/unassign`, {
				userId: userId,
			});

			// Immediately update UI by filtering out the unassigned member
			setAssignedMembers((prev) =>
				prev.filter(
					(member) => member.user_id !== userId && member.id !== userId
				)
			);

			// Refresh assigned members from server to ensure consistency
			try {
				const taskResponse = await api.get(`/tasks/${task.task_id}`);
				if (taskResponse.data && taskResponse.data.assignedUsers) {
					setAssignedMembers(taskResponse.data.assignedUsers);
				}
			} catch (fetchError) {
				console.error(
					"Failed to refresh assigned members after unassignment:",
					fetchError
				);
			}

			setAssignmentStatus({
				message: "ยกเลิกการมอบหมายงานสำเร็จ",
				type: "success",
			});

			// Clear success message after 3 seconds
			setTimeout(() => {
				setAssignmentStatus({ message: "", type: "" });
			}, 3000);
		} catch (error) {
			console.error("Failed to unassign member:", error);
			console.error("Response data:", error.response?.data);
			console.error("Status code:", error.response?.status);
			setAssignmentStatus({
				message: "เกิดข้อผิดพลาดในการยกเลิกการมอบหมายงาน",
				type: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleMoveTask = async (targetColumnId) => {
		if (targetColumnId === columnId) return; // Don't do anything if moving to the same column

		setIsLoading(true);
		try {
			await api.patch(`/tasks/${task.task_id}/move`, {
				columnId: targetColumnId,
			});

			if (onTaskUpdated) onTaskUpdated(); // Refresh data after moving task
		} catch (error) {
			console.error("Failed to move task:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleInviteMember = async () => {
		if (!inviteEmail.trim() || !task.board_id) return;

		setIsLoading(true);
		try {
			// First get the user ID from email
			const usersResponse = await api.get("/user");
			const user = usersResponse.data.find((u) => u.email === inviteEmail);

			if (!user) {
				alert("User not found with this email address");
				setIsLoading(false);
				return;
			}

			// Add user to board
			await api.post(`/board-member/${task.board_id}/members`, {
				userId: user.user_id || user.id,
			});

			setInviteEmail("");
			setShowInvite(false);
			alert("Member added to board successfully");
			if (onTaskUpdated) onTaskUpdated();
		} catch (error) {
			console.error("Failed to invite member:", error);
			alert("Failed to add member to board");
		} finally {
			setIsLoading(false);
		}
	};

	// Filter board members who aren't already assigned
	const availableMembers = boardMembers
		? boardMembers.filter((member) => {
				// Check if the member is already assigned
				return !assignedMembers.some(
					(assigned) =>
						// Handle different ID formats
						assigned.user_id === member.user_id ||
						assigned.user_id === member.id ||
						assigned.id === member.user_id ||
						assigned.id === member.id
				);
		  })
		: [];

	// Handle drag operations
	const handleDragStart = (e) => {
		e.dataTransfer.setData("taskId", task.task_id);
		e.dataTransfer.setData("sourceColumnId", columnId);
	};

	// Debugging info about board members and assignments
	console.log("Board members:", boardMembers);
	console.log("Assigned members:", assignedMembers);
	console.log("Available members:", availableMembers);

	return (
		<div
			className="bg-white rounded shadow p-3 mb-2 hover:shadow-md transition-shadow duration-200 cursor-move"
			draggable="true"
			onDragStart={handleDragStart}
		>
			{isEditing ? (
				<div className="mb-2">
					<input
						type="text"
						value={taskName}
						onChange={(e) => setTaskName(e.target.value)}
						className="w-full p-1 border border-gray-300 rounded"
						autoFocus
					/>
					<div className="flex justify-end mt-2">
						<button
							onClick={() => setIsEditing(false)}
							className="px-2 py-1 text-gray-600 hover:text-gray-800 mr-2"
							disabled={isLoading}
						>
							Cancel
						</button>
						<button
							onClick={handleSaveTaskName}
							className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
							disabled={isLoading}
						>
							{isLoading ? "Saving..." : "Save"}
						</button>
					</div>
				</div>
			) : (
				<div className="flex justify-between items-start">
					<h3 className="font-medium text-gray-900 flex-1">{task.task_name}</h3>
					<div className="flex">
						<button
							onClick={() => setIsEditing(true)}
							className="text-blue-600 hover:text-blue-800 ml-2"
							title="Edit task name"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
								/>
							</svg>
						</button>
						<button
							onClick={() => setShowOptions(!showOptions)}
							className="text-blue-600 hover:text-blue-800 ml-2"
							title={showOptions ? "Hide options" : "Show options"}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d={showOptions ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
								/>
							</svg>
						</button>
						<button
							onClick={handleDeleteTask}
							className="text-red-600 hover:text-red-800 ml-2"
							disabled={isLoading}
							title="Delete task"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</div>
				</div>
			)}
			{/* Tags section - always visible */}
			<div className="mt-3">
				<div className="flex flex-wrap gap-2 mb-2">
					{tags.map((tag) => (
						<span
							key={tag.id || tag.tag_id} // Use either id property
							className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center"
						>
							{tag.name}
							<button
								onClick={() => handleDeleteTag(tag.id || tag.tag_id)}
								className="ml-1 text-blue-600 hover:text-blue-800"
								disabled={isLoading}
								title="Remove tag"
							>
								×
							</button>
						</span>
					))}
				</div>
				<div className="flex mt-1">
					<input
						type="text"
						value={newTag}
						onChange={(e) => setNewTag(e.target.value)}
						placeholder="Add tag..."
						className="flex-1 border border-gray-300 rounded-l px-2 py-1 text-sm"
					/>
					<button
						onClick={handleAddTag}
						className="bg-blue-600 text-white px-2 py-1 rounded-r text-sm"
						disabled={!newTag.trim() || isLoading}
						title="Add new tag"
					>
						+
					</button>
				</div>
			</div>
			{/* Assigned members info - always visible */}
			{Array.isArray(assignedMembers) && assignedMembers.length > 0 && (
				<div className="mt-3">
					<div className="flex flex-wrap gap-1">
						{assignedMembers.map((member) => (
							<span
								key={member.user_id || member.id}
								className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
								title={`${member.fname} ${member.lname}`}
							>
								{member.fname} {member.lname[0]}.
							</span>
						))}
					</div>
				</div>
			)}
			{/* Options panel - toggleable */}
			{showOptions && (
				<div className="mt-3 border-t pt-2">
					{/* Move task section */}
					<div className="mb-3">
						<h4 className="text-sm font-medium text-gray-700 mb-2">
							Move Task:
						</h4>
						<select
							onChange={(e) => handleMoveTask(e.target.value)}
							className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
							value={columnId}
							disabled={isLoading}
						>
							<option value="">Select column...</option>
							{columns &&
								columns.map((col) => (
									<option key={col.column_id} value={col.column_id}>
										{col.column_name}
									</option>
								))}
						</select>
					</div>

					{/* Assigned members section */}
					<h4 className="text-sm font-medium text-gray-700 mb-2">
						Assigned Members:
					</h4>
					{assignedMembers.length > 0 ? (
						<ul className="mb-2">
							{assignedMembers.map((member) => (
								<li
									key={member.user_id || member.id}
									className="flex justify-between items-center py-1"
								>
									<span className="text-sm">
										{member.fname} {member.lname}
									</span>
									<button
										onClick={() =>
											handleUnassignMember(member.user_id || member.id)
										}
										className="text-red-600 text-xs hover:text-red-800"
										disabled={isLoading}
										title="Remove assignment"
									>
										Remove
									</button>
								</li>
							))}
						</ul>
					) : (
						<p className="text-sm text-gray-500 italic mb-2">
							No assigned members
						</p>
					)}

					{/* Assignment status message */}
					{assignmentStatus.message && (
						<div
							className={`text-sm mb-2 p-1 rounded ${
								assignmentStatus.type === "success"
									? "bg-green-100 text-green-700"
									: assignmentStatus.type === "error"
									? "bg-red-100 text-red-700"
									: "bg-blue-100 text-blue-700"
							}`}
						>
							{assignmentStatus.message}
						</div>
					)}

					<div className="flex mt-1">
						<select
							value={selectedMemberId}
							onChange={(e) => setSelectedMemberId(e.target.value)}
							className="flex-1 border border-gray-300 rounded-l px-2 py-1 text-sm"
							disabled={
								isLoading || !availableMembers || availableMembers.length === 0
							}
						>
							<option value="">Assign to...</option>
							{availableMembers &&
								availableMembers.map((member) => (
									<option
										key={member.user_id || member.id}
										value={member.user_id || member.id}
									>
										{member.fname} {member.lname}
									</option>
								))}
						</select>
						<button
							onClick={handleAssignMember}
							className="bg-blue-600 text-white px-2 py-1 rounded-r text-sm"
							disabled={!selectedMemberId || isLoading}
							title="Assign member to task"
						>
							{isLoading ? "..." : "Assign"}
						</button>
					</div>

					{availableMembers && availableMembers.length === 0 && (
						<p className="text-xs text-gray-500 mt-1">
							All board members are already assigned to this task.
						</p>
					)}

					{/* Invite to board section */}
					<div className="mt-3">
						{showInvite && (
							<div className="mt-2">
								<input
									type="email"
									value={inviteEmail}
									onChange={(e) => setInviteEmail(e.target.value)}
									placeholder="Enter email address..."
									className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2"
								/>
								<button
									onClick={handleInviteMember}
									className="w-full bg-green-600 text-white py-1 rounded text-sm hover:bg-green-700"
									disabled={!inviteEmail.trim() || isLoading}
								>
									{isLoading ? "Inviting..." : "Invite Member"}
								</button>
							</div>
						)}
					</div>
				</div>
			)}
			{/* Options button hint for new users */}
			{!showOptions && (
				<div className="mt-2 text-xs text-gray-500 text-center">
					<span
						className="hover:text-gray-700 cursor-pointer"
						onClick={() => setShowOptions(true)}
					>
						Click to manage task options and assignments
					</span>
				</div>
			)}
		</div>
	);
};

export default Task;
