import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Edit, Plus, Save, X, } from "lucide-react";
import toastr from 'toastr';
import Swal from "sweetalert2";

const ReturnsToSupplier = () => {
    const [categories, setCategories] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [categoryModal, setCategoryModal] = useState(false);
    const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false);
    const [selectedSubCategories, setSelectedSubCategories] = useState([]);
    const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
    const [selectedExpenses, setSelectedExpenses] = useState([]);
    const [category, setCategory] = useState({
        id: null,
        name: null,
        remarks: null
    });

    useEffect(() => {
        fetchCategories();
    }, [search, page, sortColumn, sortOrder]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const fetchCategories = async () => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/expenses/categories`, {
                params: {
                    search,
                    page,
                    sort_column: sortColumn,
                    sort_order: sortOrder,
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setCategories(response.data.data);
            setMeta(response.data.meta);
        } catch (error) {
            
        }
    };

    const handleSort = (column) => {
        const newSortOrder = 
            sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    
        setSortColumn(column);
        setSortOrder(newSortOrder);
    };
    
    const handleCategoryModal = (category) => {
        setCategory(category);
        setCategoryModal(true);
    };
    
    const handleCloseCategoryModal = () => {
        setCategory({
            id: null,
            name: null,
            remarks: null
        });
        setCategoryModal(false);
    };

    const handleCategoryModalSubmit = async () => {
        if (!category.name) {
            toastr.error("Please input Category name!");
            return;
        }

        try {            
            const formData = {
                id: category.id,
                name: category.name,
                remarks: category.remarks
            };
            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/expenses/categories/manage`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);
                fetchCategories();
                setCategory({
                    id: null,
                    name: null,
                    remarks: null
                });
                setCategoryModal(false);                
            }else{
                toastr.error("Error! There is something wrong in saving new category.");
            }
        } catch (error) {
            toastr.error("Error!", error.response?.data);
        }
    };

    const handleViewSubCategories = (subCategories) => {
        setSelectedSubCategories(subCategories || []);
        setIsSubCategoryModalOpen(true);
    };      

    const handleViewExpenses = (expenses) => {
        setSelectedExpenses(expenses || []);
        setIsExpensesModalOpen(true);
    };
    
    return (
            <div>
                {/* Header Section */}
                <div className="flex justify-end items-center mb-6">
                    <button
                        onClick={() => handleCategoryModal(category)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        <Plus size={18} /> New Category
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search category..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                {/* Category Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Sub Categories</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Expenses</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Remarks</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories?.length > 0 ? (
                                categories.map((category, index) => (
                                    <tr key={category.id}>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {category.name}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {category.sub_category_list && category.sub_category_list.length > 0 && (
                                                <button 
                                                    onClick={() => handleViewSubCategories(category.sub_category_list)}
                                                    className="w-full p-1 flex justify-center items-center bg-indigo-500 text-white rounded hover:bg-indigo-600 transition"
                                                >
                                                    {category.sub_category_list.length}
                                                </button>
                                            )}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {category.expense_list && category.expense_list.length > 0 && (
                                                <button 
                                                    onClick={() => handleViewExpenses(category.expense_list)}
                                                    className="w-full p-1 flex justify-center items-center bg-orange-500 text-white rounded hover:bg-orange-600 transition"
                                                >
                                                    {category.expense_list.length}
                                                </button>
                                            )}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">{category.remarks}</td>
                                        <td className="border border-gray-300 px-4 py-2 gap-2">
                                            <button onClick={() => handleCategoryModal(category)}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline">
                                                <Edit size={16} /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="border border-gray-300 px-4 py-2 text-center">
                                        No Category found.
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

                {categoryModal && (
                    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative">
                            {/* Header */}
                            <div className="flex justify-between">
                                <h2 className="text-xl font-semibold">
                                    {category.id ? "Edit Category" : "New Category"}
                                </h2>
                                <button 
                                    onClick={handleCloseCategoryModal} 
                                    className="text-gray-500 hover:text-gray-700 transition"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                                {/* Category Name */}
                                <label className="block text-sm font-medium">Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={category.name}
                                        onChange={(e) =>
                                            setCategory((prev) => ({
                                              ...prev,
                                              name: e.target.value,
                                            }))
                                        }
                                        className="w-full p-2 border rounded"
                                        placeholder="Category Name..."
                                    />
                                </div>

                                {/* Category Remarks */}
                                <label className="block text-sm font-medium mt-4">Remarks</label>
                                <div className="relative">
                                    <textarea
                                        value={category.remarks || ""}
                                        onChange={(e) =>
                                        setCategory((prev) => ({
                                            ...prev,
                                            remarks: e.target.value,
                                        }))
                                        }
                                        className="w-full p-2 border rounded"
                                        placeholder="Remarks..."
                                        rows={4}
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="button"
                                    onClick={handleCategoryModalSubmit} 
                                    className="mt-4 p-2 flex items-center bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                                >
                                    <Save size={16} />  Save Category
                                </button>

                        </div>
                    </div>
                )}

                {isSubCategoryModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Subcategories</h2>
                            <button
                            onClick={() => setIsSubCategoryModalOpen(false)}
                            className="text-gray-500 hover:text-gray-700"
                            >
                            <X size={20} />
                            </button>
                        </div>

                        {selectedSubCategories.length > 0 ? (
                            <table className="w-full border border-gray-300 text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-3 py-2 text-left">#</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Name</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Expenses</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSubCategories.map((sub, index) => (
                                        <tr key={sub.id || index}>
                                            <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                                            <td className="border border-gray-300 px-3 py-2">{sub.name}</td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {sub.expense_list && sub.expense_list.length > 0 && (
                                                    <button 
                                                        onClick={() => handleViewExpenses(sub.expense_list)}
                                                        className="w-full p-1 flex justify-center items-center bg-orange-500 text-white rounded hover:bg-orange-600 transition"
                                                    >
                                                        {sub.expense_list.length}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-gray-500 text-sm">No subcategories available.</p>
                        )}
                        </div>
                    </div>
                )}


                {isExpensesModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-xxl w-full max-h-[90vh] overflow-y-auto relative">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Expenses List</h2>
                            <button
                                onClick={() => setIsExpensesModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                            <X size={20} />
                            </button>
                        </div>

                        {selectedExpenses.length > 0 ? (
                            <table className="w-full border border-gray-300 text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-3 py-2 text-left">#</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Category</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">SubCategory</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Name</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Amount</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">TIN</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">OR</th>
                                        <th className="border border-gray-300 px-3 py-2 text-left">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedExpenses.map((exp, index) => (
                                        <tr key={exp.id || index}>
                                            <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                                            <td className="border border-gray-300 px-4 py-2">{exp.category?.name}</td>
                                            <td className="border border-gray-300 px-4 py-2">{exp.sub_category?.name}</td>
                                            <td className="border border-gray-300 px-3 py-2">{exp.expense_name}</td>
                                            <td className="border border-gray-300 px-4 py-2">{exp.amount}</td>
                                            <td className="border border-gray-300 px-4 py-2">{exp.tin}</td>
                                            <td className="border border-gray-300 px-4 py-2">{exp.or}</td>
                                            <td className="border border-gray-300 px-4 py-2">{exp.remarks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-gray-500 text-sm">No expenses available.</p>
                        )}
                        </div>
                    </div>
                )}

            </div>
    );
}

export default ReturnsToSupplier;
