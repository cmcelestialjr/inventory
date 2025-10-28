import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Save, X } from "lucide-react";
import toastr from 'toastr';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DeductionEmployee = ({}) => {

    const [deductions, setDeductions] = useState([]);    
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [deductionYear, setDeductionYear] = useState([]);
    const [deductionYearTotal, setDeductionYearTotal] = useState([]);
    const [selectedDeduction, setSelectedDeduction] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeductionIncluded, setIsDeductionIncluded] = useState(false);
    const [amount, setAmount] = useState(0);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const currentYear = new Date().getFullYear();
    const startYear = 2025;
    const maxYear = Math.max(startYear, currentYear);
    const minYear = Math.min(startYear, currentYear);
    const [payrollPeriod, setPayrollPeriod] = useState(null);
    const [deductionPeriod, setDeductionPeriod] = useState([]);
    const years = [];
    for(let y = maxYear; y >= minYear; y--) {
        years.push(y);
    }
    const months = [
        { value: 1, label: "January" },
        { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" },
    ];
    
    
    useEffect(() => {
        fetchDeductions();
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchEmployees(search);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [search]);

    useEffect(() => {
        fetchDeductionPeriod();
    }, [year, month, payrollPeriod, selectedEmployee]);

    useEffect(() => {
        if(selectedDeduction){
            const isIncluded = deductionPeriod?.some(
                (period) => period.deduction_id === selectedDeduction.id
            );
            if (isIncluded) {
                setIsDeductionIncluded(true);
            }
        }
    }, [selectedDeduction, deductionPeriod]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };    

    const handleSelectEmployee = (employee) => {
        setSelectedEmployee(employee);
        const employeeNoPrefix = employee.employee_no ? `${employee.employee_no}-` : '';
        const formattedName = `${employeeNoPrefix}${employee.lastname}, ${employee.firstname}`;
        
        const updatedDeductions = deductions.map((deduction) => {
            const empDeduction = employee.deductions?.find(
                (d) => d.deduction_id === deduction.id
            );

            return {
                ...deduction,
                amount: empDeduction?.amount ?? 0
            };
        });

        const defaultSelected = updatedDeductions[0] ?? null;

        setSelectedDeduction(defaultSelected);
        setAmount(defaultSelected.amount);

        setDeductions(updatedDeductions);

        setSearch(formattedName);
        setEmployees([]);
    };

    const handleDeductionClick = (deduction, isIncluded) => {
        setSelectedDeduction(deduction);
        setIsDeductionIncluded(isIncluded);
        fetchDeductionYear(deduction, year);
    };
    
    const fetchDeductions = async () => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/deductions`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setDeductions(response.data.data);
        } catch (error) {
            // console.error("Error fetching deduction:", error);
        }
    };    

    const fetchEmployees = async (searchTerm) => {
        // if (searchTerm.length <= 1) {
        //     setEmployees([]);
        //     return;
        // }

        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/employeeDeductions`, {
                params: {
                    search: searchTerm
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setEmployees(response.data.data);
        } catch (error) {
            // toastr.error("Error fetching employee data.");
            // console.error("Error fetching employee data:", error);
        }
    };    

    const fetchDeductionYear = async (deduction, year) => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/employeeDeductions/${selectedEmployee.id}`, {
                params: {
                    deduction_id: deduction.id,
                    year: year,
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setDeductionYear(response.data.data);
            setDeductionYearTotal(response.data.total);
        } catch (error) {
            // toastr.error("Error fetching data.");
            // console.error("Error fetching data:", error);
        }
    };

    const fetchDeductionPeriod = async () => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/employeeDeductionPeriods`, {
                params: {
                    id: selectedEmployee.id,
                    year: year,
                    month: month,
                    period: payrollPeriod
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setDeductionPeriod(response.data.data);
        } catch (error) {
            // toastr.error("Error fetching data.");
            // console.error("Error fetching data:", error);
        }
    };

    const handleSaveAmount = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("token");

            const response = await axios.put(`/api/employeeDeductions/${selectedEmployee.id}`, 
                {
                    deduction_id: selectedDeduction.id,
                    amount: amount,
                },
                {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);                
                const updatedDeduction = {
                    ...selectedDeduction,
                    amount: amount ?? 0
                };
                setSelectedDeduction(updatedDeduction);

                const updatedDeductions = deductions.map((deduction) =>
                    selectedDeduction.id === deduction.id
                        ? { ...deduction, amount: amount ?? 0 }
                        : deduction
                );
                setDeductions(updatedDeductions);
                setIsEditing(false);
            }else{
                toastr.error("Error! There is something wrong in updating deduction.");
            }

        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'An unexpected error occurred.';
            toastr.error(message);
        }
    };

    const handleChangeYear = (e) => {
        const newYear = Number(e.target.value);
        setYear(newYear);
        fetchDeductionYear(selectedDeduction, newYear);
    };

    const handleIncludeDeduction = async (e) => { 
        e.preventDefault();

        if(payrollPeriod == ''){
            toastr.error("Please select Period."); 
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const response = await axios.put(`/api/employeeDeductionPeriods/${selectedEmployee.id}`, 
                {
                    deduction_id: selectedDeduction.id,
                    year: year,
                    month: month,
                    period: payrollPeriod,
                    isDeductionIncluded:isDeductionIncluded
                },
                {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);                
                setIsDeductionIncluded(!isDeductionIncluded);
                fetchDeductionPeriod();
            }else{
                toastr.error("Error! There is something wrong in updating deduction.");
            }

        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'An unexpected error occurred.';
            toastr.error(message);
        }
    };

    return (
        <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-4">  
            {/* Search Input */}
            <div className="mb-1">
                <div className="grid grid-cols-[18%_18%_18%_40%] gap-4 mt-4">                    
                    <div className="flex flex-col">
                        <label htmlFor="year" className="mb-1 font-semibold text-gray-700">Year</label>
                        <select
                            id="year"
                            value={year}
                            onChange={e => setYear(Number(e.target.value))}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="month" className="mb-1 font-semibold text-gray-700">Month</label>
                        <select
                            id="month"
                            value={month}
                            onChange={e => setMonth(Number(e.target.value))}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                        {months.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="period" className="mb-1 font-semibold text-gray-700">Period</label>
                        <select
                            id="period"
                            name="period"
                            value={payrollPeriod}
                            onChange={(e) => setPayrollPeriod(e.target.value)}
                            className="border px-3 py-2 rounded-lg w-full"
                        >
                            <option value="">Please select..</option>
                            <option value="1-15">1-15</option>
                            <option value="16-30">16-30</option>
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="employee" className="mb-1 font-semibold text-gray-700">Employee</label>
                        <input
                            id="employee"
                            name="employee"
                            type="text"
                            placeholder="Search employee..."
                            value={search}
                            onChange={handleSearch}
                            className="flex-grow border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {employees.length > 0 && (
                <ul className="w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {employees.map((emp) => (
                        <li
                            key={emp.id}
                            onClick={() => handleSelectEmployee(emp)}
                            className="p-3 cursor-pointer hover:bg-gray-100"
                        >
                            {emp.employee_no ? `${emp.employee_no}-` : ''}
                            {emp.lastname}, {emp.firstname}
                        </li>
                    ))}
                </ul>
            )}

            {selectedEmployee && deductions.length > 0 && (
                <div className="grid grid-cols-[35%_65%] gap-4 mt-4">
                    <div className="p-2 border border-blue-200 rounded-lg bg-blue-50 flex flex-col space-y-2 max-h-[40em] overflow-y-auto">
                        {deductions.map((deduction) => {
                            const isIncluded = deductionPeriod?.some(
                                (period) => period.deduction_id === deduction.id
                            );

                            return (
                                <div
                                    key={deduction.id}
                                    onClick={() => handleDeductionClick(deduction, isIncluded)}
                                    className={`p-3 bg-white border rounded-lg shadow-sm text-sm text-gray-700 cursor-pointer transition-all
                                        ${
                                            selectedDeduction?.id === deduction.id
                                                ? 'bg-blue-100 border-blue-500'
                                                : 'hover:bg-blue-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium">
                                            {deduction.name} {deduction.group || ""}
                                        </div>

                                        {/* Status Badge */}
                                        {isIncluded && (
                                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                                Included
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-blue-600 font-semibold mt-1">
                                        Amount:{" "}
                                        {deduction.amount > 0
                                            ? new Intl.NumberFormat("en-PH", {
                                                style: "currency",
                                                currency: "PHP",
                                            }).format(deduction.amount)
                                            : 0}
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                    
                    {/* Right column: Year selector (normal background) */}
                    <div className="flex flex-col pl-4 pr-4">

                        {/* ✅ Included Status + Checkbox */}
                        <div
                            onClick={(e) => handleIncludeDeduction(e)}
                            className={`flex items-center mb-2 mt-2 gap-2 px-3 py-1.5 rounded-md border transition-colors cursor-pointer select-none
                                ${
                                    isDeductionIncluded
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={isDeductionIncluded}
                                readOnly
                                className="h-4 w-4 text-green-600 border-green-400 rounded focus:ring-0 pointer-events-none"
                            />
                            <span
                                className={`text-sm font-medium ${
                                    isDeductionIncluded ? 'text-green-700' : 'text-gray-600'
                                }`}
                            >
                                {isDeductionIncluded ? 'Included' : 'Include'}
                            </span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <p className="font-semibold text-gray-700">
                                {selectedDeduction.name} {selectedDeduction.group || ""}
                                </p>

                                <div className="text-blue-600 font-semibold">
                                {isEditing ? (
                                    <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="border border-gray-300 px-2 py-1 rounded-md w-32"
                                    />
                                ) : (
                                    <>
                                    Amount:{" "}
                                    {new Intl.NumberFormat("en-PH", {
                                        style: "currency",
                                        currency: "PHP",
                                    }).format(selectedDeduction.amount)}
                                    </>
                                )}
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="flex gap-2">
                                <button
                                    className="bg-gray-500 text-white py-1 px-3 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setAmount(selectedDeduction.amount);
                                    }}
                                >
                                    Close
                                </button>
                                <button
                                    className="bg-green-600 text-white py-1 px-3 rounded-lg text-sm hover:bg-green-700 transition-colors"
                                    onClick={handleSaveAmount}
                                >
                                    Save
                                </button>
                                </div>
                            ) : (
                                <button
                                className="bg-yellow-500 text-white py-1 px-3 rounded-lg text-sm hover:bg-yellow-600 transition-colors self-start md:self-auto"
                                onClick={() => setIsEditing(true)}
                                >
                                Edit
                                </button>
                            )}
                        </div>

                        <div className="flex items-center mt-2 gap-4">
                            
                            <select
                                id="year"
                                value={year}
                                onChange={handleChangeYear}
                                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                            </select>
                            <label htmlFor="year" className="mb-1 text-sm font-semibold text-gray-700">Total: {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(deductionYearTotal)}</label>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 max-h-[33em] overflow-y-auto">
                            {months.map((month) => {
                                const match = deductionYear.find((item) => parseInt(item.month) === month.value);
                                const amount = match ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(match.total_amount) : '0.00';

                                return (
                                <div
                                    key={month.value}
                                    className="border p-2 rounded-lg shadow-md bg-white hover:bg-gray-50 flex items-between justify-between"
                                >
                                    <span>{month.label}</span>
                                    <span className="font-semibold text-blue-600"> {amount}</span>
                                </div>
                                );
                            })}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default DeductionEmployee;