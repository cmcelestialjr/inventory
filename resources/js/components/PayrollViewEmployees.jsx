import React, { useState } from "react";
import { Edit, PlusSquare, X, XSquare } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import toastr from "toastr";
import 'toastr/build/toastr.min.css';
import PayrollViewEmployeeEdit from "./PayrollViewEmployeeEdit";
import PayrollViewDeductionAdd from "./PayrollViewDeductionAdd";
import PayrollViewDeductionEdit from "./PayrollViewDeductionEdit";

const PayrollViewEmployees = ({ payroll, search, year, setSearch, setYear, setPayroll, fetchPayrolls, closeModal }) => {
    const [searchEmployee, setSearchEmployee] = useState('');
    const [employee, setEmployee] = useState([]);
    const [deduction, setDeduction] = useState([]);
    const [deductionOption, setDeductionOption] = useState([]);
    const [showViewEmployeeModal, setShowViewEmployeeModal] = useState(false);
    const [addDeductionModal, setAddDeductionModal] = useState(false);
    const [editDeductionModal, setEditDeductionModal] = useState(false);

    const handleSearch = (e) => {
        setSearchEmployee(e.target.value);
    };

    const filteredEmployees = payroll?.employees.filter((employee) => {
        // Assuming you want to search by employee's name or position
        const searchTerm = searchEmployee.toLowerCase();
        return (
            employee.lastname.toLowerCase().includes(searchTerm) ||
            employee.firstname.toLowerCase().includes(searchTerm) ||
            employee.position.toLowerCase().includes(searchTerm) ||
            employee.salary.toLowerCase().includes(searchTerm)
        );
    });

    const employeesToDisplay = searchEmployee ? filteredEmployees : payroll?.employees;

    const handleEdit = (employee) => {
        setEmployee(employee);
        setShowViewEmployeeModal(true);
    };

    const closeViewEmployeeModal = () => {
        setShowViewEmployeeModal(false);
    };

    const handleAddDeduction = (employee) => {
        setEmployee(employee);
        setAddDeductionModal(true);
    };

    const closeAddDeductionModal = () => {
        setAddDeductionModal(false);
    };

    const handleEditDeduction = (deduction,option) => {
        setDeduction(deduction);
        setDeductionOption(option);
        setEditDeductionModal(true);
    };

    const closeEditDeductionModal = () => {
        setEditDeductionModal(false);
    };

    const handleDeleteDeduction = async (id) => {
        Swal.fire({
            title: "Delete Deduction?",
            text: "This action cannot be undone",
            icon: "warning",
            showCancelButton: true,
        }).then(async (result) => {
            if (result.isConfirmed) {

                const token = localStorage.getItem("token");
                const response = await axios.delete(`/api/payrollDeduction/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 200 || response.status === 201) {
                    toastr.success(response.data.message);
                    setSearch(search);
                    setYear(year);
                    setPayroll(response.data.data);
                }else{
                    toastr.error("Error! There is something wrong in deleting deduction.");
                }
            }
        });
    };

    const handleDelete = async (employee) => {
        Swal.fire({
                title: `Delete ${employee.lastname}, ${employee.firstname} in the Payroll?`,
                text: "This action cannot be undone",
                icon: "warning",
                showCancelButton: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                const token = localStorage.getItem("token");
                const response = await axios.delete(`/api/payroll/deleteEmployee/${employee.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                toastr.success("Employee deleted!");
                setPayroll(response.data.data);
                fetchPayrolls();
            }
        });
    };

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-[90vw] w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Employee List</h2>
                    <button
                        className="text-red-500 font-semibold"
                        onClick={closeModal}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex justify-between items-center mb-2">
                    <div>
                        <h4 className="text-xl font-semibold text-gray-900">{payroll.etal} ({payroll.employees_count})</h4>
                        <p className="text-sm text-gray-700">Code: <span className="font-medium">{payroll.code}</span></p>
                        {payroll.date_to_bank && (
                            <p className="text-sm text-gray-700">
                                Paid:  <span className="font-medium">{new Date(payroll.date_to_bank).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}</span>
                            </p>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-gray-700">Type: <span className="font-medium">{payroll.payroll_type?.name}</span></p>
                        <p className="text-sm text-gray-700">Period: <span className="font-medium">{payroll.period}</span></p>
                    </div>                    
                </div>

                <div className="mb-1">
                    <div className="flex items-center gap-4 mb-2">
                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchEmployee}
                            onChange={handleSearch}
                            className="flex-grow border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>                    
                        {employeesToDisplay.length === 0 ? (
                            <div className="text-center p-4">
                                No Employees found
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                                {employeesToDisplay.map((employee) => {
                                    const middlename = employee.middlename ? ' ' + employee.middlename[0] + '.' : '';
                                    const extname = employee.extname ? ' ' + employee.extname : '';
                                    const name = `${employee.lastname}, ${employee.firstname}${extname}${middlename}`;
                                    return (
                                        <div
                                            key={employee.id}
                                            className="border p-4 rounded-lg shadow-md bg-white hover:bg-gray-50 flex items-start transition-all duration-300 ease-in-out transform hover:scale-105"
                                        >
                                            <div className="flex flex-col ml-4 w-full">
                                                <div className="flex justify-between gap-4">
                                                    <div>
                                                        <h4 className="text-lg font-medium text-gray-800">{name}</h4>
                                                        <p className="text-sm font-bold text-gray-600">{employee.position}</p>
                                                    </div>
                                                    <div className="flex justify-between gap-x-1">
                                                        <button
                                                            className="text-yellow-500 py-1 px-2 rounded-lg text-sm hover:text-yellow-600 transition-colors"
                                                            onClick={() => handleEdit(employee)}
                                                        >
                                                            <Edit size={24} />
                                                        </button>
                                                        <button
                                                            className="text-red-500 py-1 px-2 rounded-lg text-sm hover:text-red-600 transition-colors"
                                                            onClick={() => handleDelete(employee)}
                                                        >
                                                            <X size={24} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between mt-2">
                                                    <p className="text-sm text-gray-800">
                                                            Salary: ₱{parseFloat(employee.salary)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>
                                                        <p className="text-sm font-medium text-blue-600">
                                                            Present (Days-Hours): {employee.day}-{employee.hour}
                                                        </p>
                                                </div>
                                                <div className="flex justify-between mb-2 border-t mt-1 pt-1">
                                                    <div>
                                                        <p className="text-sm text-gray-800">
                                                            Basic Pay: ₱{parseFloat(employee.basic_pay)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>

                                                        <p className="text-sm text-blue-500">
                                                            Overtime: ₱{parseFloat(employee.overtime)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>

                                                        {employee.other_earned?.length > 0 &&
                                                            employee.other_earned.map((earning) => (
                                                                <p key={earning.id} className="text-sm text-purple-600">
                                                                {earning.earning_type?.name}: ₱{parseFloat(earning.total)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </p>
                                                            ))
                                                        }
                                                    </div>
                                                    {/* Right Column: Deductions and Netpay */}
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-blue-600">
                                                            Earned: ₱{parseFloat(employee.earned)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>

                                                        <p className="text-sm font-medium text-red-600">
                                                            Deductions: ₱{parseFloat(employee.deduction)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>

                                                        <p className="text-sm font-semibold text-green-600">
                                                            Net Pay: ₱{parseFloat(employee.netpay)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <div className="flex justify-between">
                                                        <h5 className="text-sm font-medium text-gray-700">Deductions</h5>
                                                        <button
                                                            className="text-blue-500 py-1 px-3 rounded-lg text-sm hover:text-blue-600 transition-colors"
                                                            onClick={() => handleAddDeduction(employee)} 
                                                        >
                                                            <PlusSquare size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="mt-1 max-h-20 overflow-y-auto border-t border-gray-200 pt-2">
                                                        <div key="0" className="flex justify-between text-xs text-gray-600">
                                                            <div>
                                                                Lates: {employee.lates_absences}
                                                            </div>
                                                            <div>
                                                                <button
                                                                    className="text-yellow-500 py-1 px-1 rounded-lg text-sm hover:text-yellow-600 transition-colors"
                                                                    onClick={() => handleEditDeduction(employee,'lates')} 
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {employee.deduction_list && employee.deduction_list.length > 0 ? (
                                                            employee.deduction_list.map((deduction, index) => (
                                                                <div key={index} className="flex justify-between text-xs text-gray-600">
                                                                    <div>
                                                                        {deduction.deduction?.name} {deduction.deduction?.group && deduction.deduction?.group !== 'null' ? deduction.deduction?.group : ''}: {deduction.amount}
                                                                    </div>
                                                                    <div>
                                                                        <button
                                                                            className="text-yellow-500 py-1 px-1 rounded-lg text-sm hover:text-yellow-600 transition-colors"
                                                                            onClick={() => handleEditDeduction(deduction,'deduction')} 
                                                                        >
                                                                            <Edit size={16} />
                                                                        </button>
                                                                        <button
                                                                            className="text-red-500 py-1 px-1 rounded-lg text-sm hover:text-red-600 transition-colors"
                                                                            onClick={() => handleDeleteDeduction(deduction.id)} 
                                                                        >
                                                                            <XSquare size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <li className="text-sm text-gray-600"> </li>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                </div>
            </div>

            {showViewEmployeeModal && 
                <PayrollViewEmployeeEdit 
                    employee={employee} 
                    search={search}
                    year={year}
                    setSearch={setSearch}
                    setYear={setYear}
                    setPayroll={setPayroll} 
                    closeViewEmployeeModal={closeViewEmployeeModal} />}

            {addDeductionModal && 
                <PayrollViewDeductionAdd 
                    employee={employee} 
                    search={search}
                    year={year}
                    setSearch={setSearch}
                    setYear={setYear}
                    setPayroll={setPayroll}
                    closeAddDeductionModal={closeAddDeductionModal} />}

            {editDeductionModal && 
                <PayrollViewDeductionEdit
                    deduction={deduction} 
                    option={deductionOption} 
                    search={search}
                    year={year}
                    setSearch={setSearch}
                    setYear={setYear}
                    setPayroll={setPayroll}
                    closeEditDeductionModal={closeEditDeductionModal} />}

        </div>
    );
};

export default PayrollViewEmployees;
