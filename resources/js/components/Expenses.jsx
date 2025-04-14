import Layout from "./Layout";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash, X } from "lucide-react";
import moment from "moment";
import Swal from 'sweetalert2';
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ExpenseCategories from "./ExpenseCategories";
import ExpenseSubCategories from "./ExpenseSubCategories";
import Select from 'react-select';

const Expenses = () => {
    const [activeTab, setActiveTab] = useState("expenses");
    const [expensesList, setExpensesList] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [categoriesModal, setCategoriesModal] = useState([]);
    const [subCategoriesModal, setSubCategoriesModal] = useState([]);
    const [selectedCategoryModal, setSelectedCategoryModal] = useState(1);
    const [selectedSubCategoryModal, setSelectedSubCategoryModal] = useState(null);
    const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
    const [expenseName, setExpenseName] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 16));
    const [expenseRemarks, setExpenseRemarks] = useState("");
    const [expenseTin, setExpenseTin] = useState("");
    const [expenseOr, setExpenseOr] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [allExpensesName, setAllExpensesName] = useState([]);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");
    const [dateRange, setDateRange] = useState([
        new Date(),
        new Date(),
    ]);
    const [startDate, endDate] = dateRange;    

    useEffect(() => {
        fetchExpenses();
    }, [search, page, dateRange, sortColumn, sortOrder, selectedCategory, selectedSubCategory]);

    useEffect(() => {
        fetchSubCategories();
    }, [selectedCategory]);

    useEffect(() => {
        fetchSubCategoriesModal();
    }, [selectedCategoryModal]);
    
    useEffect(() => {
        fetchExpensesNames();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (expenseName.trim() !== "" && Array.isArray(allExpensesName)) {
            setSuggestions(
                allExpensesName.filter((name) =>
                    name.toLowerCase().includes(expenseName.toLowerCase())
                )
            );
        } else {
            setSuggestions([]);
        }
    }, [expenseName, allExpensesName]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleSelectExpense = (name) => {
        setExpenseName(name);
        setSuggestions([]);
    };

    const fetchExpenses = async () => {
        try {
            const numericSelectedCategory = (selectedCategory || []).map((item) => Number(item.value));
            const numericSelectedSubCategory = (selectedSubCategory || []).map((item) => Number(item.value));
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/expenses`, {
                params: {
                    search,
                    page,
                    start_date: startDate ? startDate.toISOString().split("T")[0] : null,
                    end_date: endDate ? endDate.toISOString().split("T")[0] : null,
                    sort_column: sortColumn, 
                    sort_order: sortOrder,
                    numericSelectedCategory: numericSelectedCategory,
                    numericSelectedSubCategory: numericSelectedSubCategory,
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setExpensesList(response.data.data);
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

    const fetchCategories = async () => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/expenses/categories/fetchAll`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            setCategories(response.data);

            setCategoriesModal(response.data);

            if (response.data.length > 0) {
                setSelectedCategoryModal(response.data[0].id);
            }

        } catch (error) {
            
        }
    };

    const fetchSubCategories = async () => {
        try {
            const numericSelectedCategory = (selectedCategory || []).map((item) => Number(item.value));
            const authToken = localStorage.getItem("token");
            const response = await axios.post(
                `/api/expenses/subCategories/fetchByCategory`,
                { selectedCategory: numericSelectedCategory },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            setSubCategories(response.data);

        } catch (error) {
            
        }
    };

    const fetchSubCategoriesModal = async () => {
        try {
            const numericSelectedCategory = [Number(selectedCategoryModal)];
            const authToken = localStorage.getItem("token");
            const response = await axios.post(
                `/api/expenses/subCategories/fetchByCategory`,
                { selectedCategory: numericSelectedCategory },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            setSubCategoriesModal(response.data);

            if (response.data.length > 0) {
                setSelectedSubCategoryModal(response.data[0].id);
            } else {
                setSelectedSubCategoryModal(null);
            }

        } catch (error) {
            
        }
    };

    const fetchExpensesNames = async () => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/expenses/names`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (Array.isArray(response.data)) {
                setAllExpensesName(response.data);
            } else if (Array.isArray(response.data.data)) {
                setAllExpensesName(response.data.data); 
            } else {
                setAllExpensesName([]);
            }
        } catch (error) {
            
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!expenseName || !expenseAmount || expenseAmount <= 0 || !expenseDate) {
            toastr.error("Please input Expense name and amount!");
            return;
        }

        try {            
            const formData = {
                categoryId: selectedCategoryModal,
                subCategoryId: selectedSubCategoryModal,
                name: expenseName,
                amount: expenseAmount,
                dateTime: expenseDate,
                remarks: expenseRemarks,
                tin: expenseTin,
                or: expenseOr
            };
            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/expenses/store`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);
                fetchExpenses();
                setExpenseName("");
                setExpenseAmount("");
                setExpenseRemarks("");
                setExpenseTin("");
                setExpenseOr("");
                setIsNewExpenseModalOpen(false);
            }else{
                toastr.error("Error! There is something wrong in saving new expense.");
            }
        } catch (error) {
            toastr.error("Error!", error.response?.data);
        }

    };

    const handleDelete = (expenseId) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"
        }).then( async (result) => {
            if (result.isConfirmed) {
                
                try {
                    const authToken = localStorage.getItem("token");
                    const response = await axios.post("/api/expenses/delete",
                        { expenseId: expenseId },
                        {
                            headers: { Authorization: `Bearer ${authToken}` }
                        }
                    );
                    if (response.status === 200 || response.status === 201) {
                        Swal.fire("Deleted!", response.data.message, "success");

                        setExpensesList((prevList) =>
                            prevList.filter((item) => item.id !== expenseId)
                        );
                    }else{
                        Swal.fire("Error!", "There was a problem", "success");
                        
                    }
                } catch (error) {
                    Swal.fire("Error!", "There was a problem", "error");
                }
            }
        });
    };

    const categoryOptions = categories.map((c) => ({
        value: c.id,
        label: c.name,
    }));

    const subCategoryOptions = subCategories.map((c) => ({
        value: c.id,
        label: c.name,
    }));

    const categoryOptionsModal = categoriesModal.map((c) => ({
        value: c.id,
        label: c.name,
    }));

    const subCategoryOptionsModal = subCategoriesModal.map((c) => ({
        value: c.id,
        label: c.name,
    }));

    return (
        <Layout>
            <div className="w-full mt-10 mx-auto">
                {/* Tabs */}
                <div className="mt-15 flex gap-4 mb-4">
                    {["expenses", "categories", "subcategories"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                            activeTab === tab
                                ? "bg-blue-600 text-white shadow"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-4">
                    {/* Header Section */}
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-800 capitalize">
                            {activeTab}
                        </h1>
                        {activeTab === "expenses" && (
                            <button
                                onClick={() => setIsNewExpenseModalOpen(true)}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                            >
                                <Plus size={18} /> New Expense
                            </button>
                        )}
                    </div>
                    
                    {activeTab === "expenses" &&
                        <div>
                            <div className="grid grid-cols-4 gap-4 mb-4">
                                {/* Search Input */}
                                <input
                                    type="text"
                                    placeholder="Search expenses..."
                                    value={search}
                                    onChange={handleSearch}
                                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                <Select
                                    options={categoryOptions}
                                    isMulti
                                    value={selectedCategory}
                                    onChange={(selected) => setSelectedCategory(selected)}
                                    className="w-full"
                                    placeholder="Categories..."
                                />

                                <Select
                                    options={subCategoryOptions}
                                    isMulti
                                    value={selectedSubCategory}
                                    onChange={(selected) => setSelectedSubCategory(selected)}
                                    className="w-full"
                                    placeholder="Sub Categories..."
                                />

                                {/* Single Calendar for Date Range */}
                                <DatePicker
                                    selected={startDate}
                                    onChange={(update) => setDateRange(update)}
                                    startDate={startDate}
                                    endDate={endDate}
                                    selectsRange
                                    isClearable
                                    placeholderText="Select duration"
                                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Sales Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr className="bg-gray-100 text-gray-700">
                                            <th
                                                className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                                onClick={() => handleSort("date_time_of_expense")}
                                            >
                                                <div className="flex items-center">
                                                    <span>DateTime</span>
                                                    <span className="ml-1">
                                                        {sortColumn === "date_time_of_expense" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                                    </span>
                                                </div>
                                            </th>
                                            <th
                                                className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                                onClick={() => handleSort("category_id")}
                                            >
                                                <div className="flex items-center">
                                                    <span>Category</span>
                                                    <span className="ml-1">
                                                        {sortColumn === "category_id" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                                    </span>
                                                </div>
                                            </th>
                                            <th
                                                className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                                onClick={() => handleSort("sub_category_id")}
                                            >
                                                <div className="flex items-center">
                                                    <span>SubCategory</span>
                                                    <span className="ml-1">
                                                        {sortColumn === "sub_category_id" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                                    </span>
                                                </div>
                                            </th>
                                            {/* <th
                                                className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                                onClick={() => handleSort("code")}
                                            >
                                                <div className="flex items-center">
                                                    <span>Code</span>
                                                    <span className="ml-1">
                                                        {sortColumn === "code" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                                    </span>
                                                </div>
                                            </th> */}
                                            <th
                                                className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                                onClick={() => handleSort("expense_name")}
                                            >
                                                <div className="flex items-center">
                                                    <span>Name of Expense</span>
                                                    <span className="ml-1">
                                                        {sortColumn === "expense_name" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                                    </span>
                                                </div>
                                            </th>
                                            <th
                                                className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                                onClick={() => handleSort("amount")}
                                            >
                                                <div className="flex items-center">
                                                    <span>Amount</span>
                                                    <span className="ml-1">
                                                        {sortColumn === "amount" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                                    </span>
                                                </div>
                                            </th>
                                            <th
                                                className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                                onClick={() => handleSort("tin")}
                                            >
                                                <div className="flex items-center">
                                                    <span>TIN</span>
                                                    <span className="ml-1">
                                                        {sortColumn === "tin" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                                    </span>
                                                </div>
                                            </th>
                                            <th
                                                className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                                onClick={() => handleSort("or")}
                                            >
                                                <div className="flex items-center">
                                                    <span>OR</span>
                                                    <span className="ml-1">
                                                        {sortColumn === "or" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                                    </span>
                                                </div>
                                            </th>
                                            <th
                                                className="border border-gray-300 px-4 py-2 text-center cursor-pointer"
                                                onClick={() => handleSort("remarks")}
                                            >
                                                <div className="flex items-center">
                                                    <span>Remarks</span>
                                                    <span className="ml-1">
                                                        {sortColumn === "remarks" ? (sortOrder === "asc" ? "🔼" : "🔽") : "↕️"}
                                                    </span>
                                                </div>
                                            </th>
                                            <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expensesList.length > 0 ? (
                                            expensesList.map((expense, index) => (
                                                <tr key={expense.id}>                 
                                                    <td className="border border-gray-300 px-4 py-2">
                                                        {moment(expense.date_time_of_expense).format("MMM D, YY h:mma")}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-2">{expense.category?.name}</td>
                                                    <td className="border border-gray-300 px-4 py-2">{expense.sub_category?.name}</td>
                                                    {/* <td className="border border-gray-300 px-4 py-2">{expense.code}</td> */}
                                                    <td className="border border-gray-300 px-4 py-2">{expense.expense_name}</td>
                                                    <td className="border border-gray-300 px-4 py-2">{expense.amount}</td>
                                                    <td className="border border-gray-300 px-4 py-2">{expense.tin}</td>
                                                    <td className="border border-gray-300 px-4 py-2">{expense.or}</td>
                                                    <td className="border border-gray-300 px-4 py-2">{expense.remarks}</td>
                                                    <td className="border border-gray-300 px-4 py-2 gap-2">
                                                        <button 
                                                                onClick={() => handleDelete(expense.id)}
                                                                className="flex items-center gap-2 px-3 py-1 text-white bg-red-600 border border-red-600 
                                                                        rounded-lg shadow transition duration-200 
                                                                        hover:bg-white hover:text-red-600 hover:border-red-600"
                                                            >
                                                                <Trash size={16} />
                                                                {/* <span>Delete</span> */}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="10" className="border border-gray-300 px-4 py-2 text-center">
                                                    No Expenses found.
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
                    }
                    {activeTab === "categories" && <ExpenseCategories />}
                    {activeTab === "subcategories" && <ExpenseSubCategories />}
                </div>
            </div>
            {isNewExpenseModalOpen && (
                <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto relative">
                        {/* Header */}
                        <div className="flex justify-between">
                            <h2 className="text-xl font-semibold">New Sale</h2>
                            <button 
                                onClick={() => setIsNewExpenseModalOpen(false)} 
                                className="text-gray-500 hover:text-gray-700 transition"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        {/* Form */}
                        <form onSubmit={handleSubmit} className="mt-4">

                            <label className="block text-sm font-medium">Categories</label>
                            <div className="relative">
                                <Select
                                    options={categoryOptionsModal}
                                    value={categoryOptionsModal.find(option => option.value === selectedCategoryModal)}
                                    onChange={(selected) => setSelectedCategoryModal(selected?.value || null)}
                                    className="w-full"
                                    placeholder="Categories..."
                                />
                            </div>

                            <label className="block mt-3 text-sm font-medium">Sub Categories</label>
                            <div className="relative">
                                <Select
                                    options={subCategoryOptionsModal}
                                    value={
                                        subCategoryOptionsModal.find(option => option.value === selectedSubCategoryModal) || null
                                    }
                                    onChange={(selected) => setSelectedSubCategoryModal(selected?.value || null)}
                                    className="w-full"
                                    placeholder="Sub Categories..."
                                />
                            </div>

                            {/* Expense Name with Suggestions */}
                            <label className="block mt-3 text-sm font-medium">Expense Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={expenseName}
                                    onChange={(e) => setExpenseName(e.target.value)}
                                    className="w-full p-2 border rounded"
                                    placeholder="Type to search..."
                                />
                                {suggestions.length > 0 && (
                                    <ul className="absolute bg-white border rounded w-full mt-1 shadow-lg max-h-40 overflow-auto z-50">
                                        {suggestions.map((name) => (
                                            <li
                                                key={name}
                                                onClick={() => handleSelectExpense(name)}
                                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                            >
                                                {name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Amount */}
                            <label className="block mt-3 text-sm font-medium">Amount</label>
                            <input
                                type="number"
                                value={expenseAmount}
                                onChange={(e) => setExpenseAmount(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="Enter amount"
                            />

                            {/* TIN */}
                            <label className="block mt-3 text-sm font-medium">TIN</label>
                            <input
                                type="text"
                                value={expenseTin}
                                onChange={(e) => setExpenseTin(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="Enter TIN"
                            />

                            {/* OR */}
                            <label className="block mt-3 text-sm font-medium">OR</label>
                            <input
                                type="text"
                                value={expenseOr}
                                onChange={(e) => setExpenseOr(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="Enter OR"
                            />

                            {/* Date */}
                            <label className="block mt-3 text-sm font-medium">Date & Time</label>
                            <input
                                type="datetime-local"
                                value={expenseDate}
                                onChange={(e) => setExpenseDate(e.target.value)}
                                className="w-full p-2 border rounded"
                            />

                            {/* Remarks */}
                            <label className="block text-sm font-medium text-gray-700">Remarks:</label>
                            <textarea 
                                value={expenseRemarks || ""}
                                onChange={(e) => setExpenseRemarks(e.target.value)}
                                className="mt-1 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                rows={3}
                                placeholder="Enter remarks here..."
                            ></textarea>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                                Save Expense
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Expenses;