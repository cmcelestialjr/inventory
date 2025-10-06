import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import toastr from "toastr";
import 'toastr/build/toastr.min.css';
import Layout from "./Layout";
import { CheckCircle, Edit, Plus, Trash2, XCircle } from "lucide-react";
import PayrollLists from "./PayrollLists";
import PayrollNew from "./PayrollNew";
import PayrollEmployees from "./PayrollEmployees";
import PayrollType from "./PayrollType";

const Payroll = () => {
    const authToken = localStorage.getItem("token");
    const [activeTab, setActiveTab] = useState("Lists");

    const didFetch = useRef(false);
    
    useEffect(() => {
        if (didFetch.current) return;
        didFetch.current = true;
            
    }, []);


    return (
        <Layout>
            <div className="w-full mt-11 mx-auto">
                {/* Tabs */}
                <div className="mt-16 flex gap-4 mb-4">
                {/* {["Lists", "Employees", "New Payroll", "Type"].map((tab) => ( */}
                {["Lists", "New Payroll"].map((tab) => (
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

                {activeTab === "Lists" && <PayrollLists authToken={authToken} />}
                {activeTab === "Employees" && <PayrollEmployees authToken={authToken} />}
                {activeTab === "New Payroll" && <PayrollNew authToken={authToken} />}
                {activeTab === "Type" && <PayrollType authToken={authToken} />}
                
            </div>
        </Layout>
    );
};

export default Payroll;
