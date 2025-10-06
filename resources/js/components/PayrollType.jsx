import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Save, X } from "lucide-react";
import toastr from 'toastr';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PayrollType = ({ authToken }) => {

    const [payrolls, setPayrolls] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    return (
        <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-4">  
            {/* Search Input */}
            <div className="mb-4">
                <div className="flex items-center gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Search payroll type..."
                        value={search}
                        onChange={handleSearch}
                        className="flex-grow border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default PayrollType;