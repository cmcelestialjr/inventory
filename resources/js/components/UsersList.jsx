import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Layout from "./Layout";
import { Edit, Plus, X } from "lucide-react";
import Swal from "sweetalert2";
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const UsersList = () => {  
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [userModal, setUserModal] = useState(false);
    const [nameOfUser, setNameOfUser] = useState("");
    const [userNameOfUser, setUserNameOfUser] = useState("");
    const [passwordOfUser, setPasswordOfUser] = useState("");
    const [roleOfUser, setRoleOfUser] = useState(2);
    const [idOfUser, setIdOfUser] = useState(null);
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, [search, page]);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/users`, {
                params: {
                    search,
                    page
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setUsers(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            // console.error("Error fetching sales:", error);
        }
    };

    const fetchRoles = async () => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/users/roles`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setRoles(response.data.data);
        } catch (error) {
            // console.error("Error fetching sales:", error);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };
    
    const handleEditUser = (user) => {
        setNameOfUser(user.name);
        setUserNameOfUser(user.username);
        setPasswordOfUser("************");
        setRoleOfUser(user.user_role_id);
        setIdOfUser(user.id);
        setUserModal(true);
    };

    const handleUserSubmit = async () => {
        if(validateForm){
            if(idOfUser==null){
                handleNewUserSubmit();
            }else{
                handleUpdateUserSubmit();
            }
        }
    };

    const validateForm = () => {
        let isValid = false;
        if(nameOfUser==""){
            toastr.success("Name is required!"); 
            isValid = false;
        }
        if(userNameOfUser==""){
            toastr.success("Username is required!"); 
            isValid = false;
        }
        if(passwordOfUser==""){
            toastr.success("Password is required!"); 
            isValid = false;
        }
        return isValid;
    }

    const handleNewUserSubmit = async () => {
        try {
            const formData = {
                name: nameOfUser,
                username: userNameOfUser,
                password: passwordOfUser,
                role: roleOfUser
            };
            const authToken = localStorage.getItem("token");
            const response = await axios.post("/api/users/store", formData, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (response.status === 200 || response.status === 201) {
                toastr.success("User added successfully!"); 
                setNameOfUser("");
                setUserNameOfUser("");
                setPasswordOfUser("");
                setRoleOfUser(2);
                setIdOfUser(null);                
                fetchUsers();
                setUserModal(false);
            } else {
                toastr.error("Unexpected response");
            }
        } catch (error) {
            // console.error("Request failed:", error.response?.data?.message || error.message);
            toastr.error("Failed to add user.");
        }
    };

    const handleUpdateUserSubmit = async () => {
        try {
            const formData = {
                name: nameOfUser,
                username: userNameOfUser,
                password: passwordOfUser,
                role: roleOfUser
            };
            const authToken = localStorage.getItem("token");
            const response = await axios.put(`/api/users/${idOfUser}`, formData, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (response.status === 200 || response.status === 201) {
                toastr.success("User updated successfully!"); 
                setNameOfUser("");
                setUserNameOfUser("");
                setPasswordOfUser("");
                setRoleOfUser(2);
                setIdOfUser(null);
                fetchUsers();
                setUserModal(false);
            } else {
                toastr.error("Unexpected response");
            }
        } catch (error) {
            // console.error("Request failed:", error.response?.data?.message || error.message);
            toastr.error("Failed to update user.");
        }
    };

    const handleUserModalClose  = async () => {
        setNameOfUser("");
        setUserNameOfUser("");
        setPasswordOfUser("");
        setRoleOfUser(2);
        setIdOfUser(null);
        setUserModal(false);
    };

    return (
        <Layout>
            <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto max-w-7xl mt-10">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-800">Users</h1>
                    <button
                        onClick={() => setUserModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        <Plus size={18} /> New User
                    </button>
                </div>

                <div className="mt-4">
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Username</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Role</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map((user, index) => (
                                    <tr key={user.id}>
                                        <td className="border border-gray-300 px-4 py-2">{user.name}</td>
                                        <td className="border border-gray-300 px-4 py-2">{user.username}</td>
                                        <td className="border border-gray-300 px-4 py-2">{user.user_role?.name}</td>
                                        <td className="border border-gray-300 px-4 py-2 gap-2">
                                            <button 
                                                onClick={(e) => handleEditUser(user)}
                                                className="flex items-center gap-1 text-blue-600 hover:underline">
                                                <Edit size={16} /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="border border-gray-300 px-4 py-2 text-center">
                                        No Users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Controls */}
                {meta && (
                    <div className="flex justify-between items-center mt-4">
                        <button
                            disabled={!meta.prev}
                            onClick={() => setPage(page - 1)}
                            className={`px-4 py-2 rounded-lg ${meta.prev ? "text-white bg-blue-600 hover:bg-blue-500" : "bg-gray-200 cursor-not-allowed"}`}
                        >
                            Previous
                        </button>
                        <span>
                            Page {meta.current_page} of {meta.last_page}
                        </span>
                        <button
                            disabled={!meta.next}
                            onClick={() => setPage(page + 1)}
                            className={`px-4 py-2 rounded-lg ${meta.next ? "text-white bg-blue-600 hover:bg-blue-500" : "bg-gray-200 cursor-not-allowed"}`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
            
            {userModal && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
                        <div className="flex justify-between">
                            <h2 className="text-xl font-semibold">User</h2>
                            <button 
                                onClick={handleUserModalClose} 
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-700">Name:</label>
                            <input 
                                type="text"
                                value={nameOfUser}
                                onChange={(e) => setNameOfUser(e.target.value)}
                                className="w-full border px-3 py-2 rounded-lg"
                            />
                            <label className="block text-sm font-medium text-gray-700">Username:</label>
                            <input 
                                type="text"
                                value={userNameOfUser}
                                onChange={(e) => setUserNameOfUser(e.target.value)}
                                className="w-full border px-3 py-2 rounded-lg"
                            />
                            <label className="block text-sm font-medium text-gray-700">Password:</label>
                            <input 
                                type="password"
                                value={passwordOfUser}
                                onChange={(e) => setPasswordOfUser(e.target.value)}
                                className="w-full border px-3 py-2 rounded-lg"
                            />
                            <label className="block text-sm font-medium text-gray-700">Role:</label>
                            <select
                                value={roleOfUser}
                                onChange={(e) => {setRoleOfUser(e.target.value)}}
                                className="w-full border px-3 py-2 rounded-lg flex-1"
                            >
                                {roles.map((role) => (
                                    <option key={role.id} 
                                        value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex justify-between mt-2">
                                <button 
                                    onClick={handleUserModalClose}
                                    className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg shadow mt-2 hover:bg-gray-700 transition">
                                    <X size={18} /> Close
                                </button>
                                <button
                                    onClick={handleUserSubmit}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow mt-2 hover:bg-blue-700 transition"
                                >
                                    <Plus size={18} /> Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );

};

export default UsersList;