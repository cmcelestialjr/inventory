import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Save, X } from "lucide-react";
import toastr from 'toastr';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import EmployeeWageBySalary from "./EmployeeWageBySalary";
import EmployeeWageByService from "./EmployeeWageByService";

const EmployeeWages = ({ wagesModal, setWagesModal, wages, fetchEmployees }) => {
    if (!wagesModal) return null;

    const [activeTab, setActiveTab] = useState("By Salary");


    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between mb-5">
                    <h2 className="text-lg font-semibold">Wage of {wages.lastname}, {wages.firstname} {wages.extname} {wages.middlename}</h2>
                    <button
                        onClick={() => setWagesModal(false)}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex gap-4 mb-4">
                    {["By Salary", "By Service"].map((tab) => (
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

                <EmployeeWageBySalary
                    activeTab={activeTab}
                    wages={wages}
                    fetchEmployees={fetchEmployees}
                    setWagesModal={setWagesModal}
                />

                <EmployeeWageByService
                    activeTab={activeTab}
                    wages={wages}
                    fetchEmployees={fetchEmployees}
                    setWagesModal={setWagesModal}
                />
                
            </div>
        </div>
    );
};

export default EmployeeWages;