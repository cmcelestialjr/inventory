import React, { useState, useEffect } from "react";
import axios from "axios";
import { Check, CheckCircle, Plus, Save, X, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import toastr from "toastr";
import 'toastr/build/toastr.min.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PayrollViewEmployees from "./PayrollViewEmployees";

const PayrollLists = ({ authToken }) => {

    const [payrolls, setPayrolls] = useState([]);
    const [payroll, setPayroll] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfData, setPdfData] = useState('');
    const currentYear = new Date().getFullYear();
    const startYear = 2025;
    const maxYear = Math.max(startYear, currentYear);
    const minYear = Math.min(startYear, currentYear);
    const years = [];
    for(let y = maxYear; y >= minYear; y--) {
        years.push(y);
    }
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchPayrolls();
    }, [search, year]);

    const fetchPayrolls = async () => {
        try {            
            const response = await axios.get(`/api/payroll`, {
                params: {
                    search: search,
                    year: year
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setPayrolls(response.data.data);
        } catch (error) {
            // console.error("Error fetching damaged:", error);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleView = (payroll) => {
        setPayroll(payroll);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const handleDate = async (id, dateToBank) => {
        
        const { value: newDate } = await Swal.fire({
            title: 'Update Payroll Date Paid',
            input: 'date',
            inputLabel: 'Select a date',
            inputValue: dateToBank || '',
            showCancelButton: true,
            confirmButtonText: 'Update',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to select a date for paid!';
                }
            }
        });

        if (newDate) {
            try {
                const response = await axios.put(
                    `/api/payroll/${id}`, 
                    { date_to_bank: newDate }, 
                    {
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                        },
                    }
                );

                if (response.status === 200) {
                    toastr.success('Payroll date paid updated!');
                    fetchPayrolls();
                }
            } catch (error) {
                toastr.error('Error updating payroll date paid');
                console.error(error);
            }
        }
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Delete Payroll?",
            text: "This action cannot be undone",
            icon: "warning",
            showCancelButton: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                await axios.delete(`/api/payroll/${id}`, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });
                toastr.success("Payroll deleted!");
                fetchPayrolls();
            }
        });
    };

    const handlePdf = async (payroll) => {
        try {
            const response = await axios.post(`/api/payroll-generate-pdf`, 
                    { payroll }, 
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${authToken}`,
                        },
                    }
            );

            // Get base64 encoded PDF string
            if (response.data.pdf) {
                setPdfData(response.data.pdf); // Set the base64 PDF
                setShowPdfModal(true); // Show the modal
            } else {
                console.error('Failed to generate PDF');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const closePdfModal = () => {
        setShowPdfModal(false);
        setPdfData('');
    };

    return (
        <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end mb-4">
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
            </div>

            {/* Search Input */}
            <div className="mb-4">
                <div className="flex items-center gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Search payroll..."
                        value={search}
                        onChange={handleSearch}
                        className="flex-grow border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {payrolls.map((payroll, index) => (
                    <div
                        key={payroll.id}
                        className="border p-4 rounded-lg shadow-md bg-white hover:bg-gray-50 transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                        <div className="flex items-start">
                            <div className="flex flex-col w-full">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-xl font-semibold text-gray-900">{payroll.etal} ({payroll.employees_count})</h4>
                                        <p className="text-sm text-gray-700">Code: <span className="font-medium">{payroll.code}</span></p>
                                        <p className="text-sm text-gray-700">Type: <span className="font-medium">{payroll.payroll_type?.name}</span></p>
                                        <p className="text-sm text-gray-700">Period: <span className="font-medium">{payroll.period}</span></p>
                                        
                                        {payroll.date_to_bank ? (
                                            <p className="text-sm text-gray-700">
                                                Paid: <span className="font-medium">{new Date(payroll.date_to_bank).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}</span>
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-700">
                                                Paid: <span className="text-red-600"> Not Yet</span>
                                            </p>
                                        )}                                        
                                    </div>
                                    <div className="flex flex-col justify-center items-center space-y-2">
                                        {payroll.date_to_bank ? (
                                            <div className="text-green-600">
                                                <CheckCircle className="w-10 h-10" />
                                                <span className="text-xs text-gray-600">Confirmed</span>
                                            </div>
                                        ) : (
                                            <div className="text-red-600">
                                                <XCircle className="w-10 h-10" />
                                                <span className="text-xs text-gray-600">Pending</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                            
                        <div className="flex space-x-4 mt-2">
                            <button
                                className="bg-blue-500 text-white py-1 px-3 rounded-lg text-xs hover:bg-blue-600 transition-colors"
                                onClick={() => handleView(payroll)}
                            >
                                View
                            </button>
                            <button
                                className="bg-yellow-500 text-white py-1 px-3 rounded-lg text-xs hover:bg-yellow-600 transition-colors"
                                onClick={() => handleDate(payroll.id,payroll.date_to_bank)} 
                            >
                                Date Paid
                            </button>
                            <button
                                className={`text-white py-1 px-3 rounded-lg text-xs transition-colors ${
                                    (payroll.date_to_bank != null)
                                    ? 'bg-red-400 opacity-50 cursor-not-allowed'
                                    : 'bg-red-700 hover:bg-red-600'
                                }`}
                                onClick={() => handleDelete(payroll.id)}
                                disabled={payroll.date_to_bank != null}
                            >
                                Delete
                            </button>
                            <button
                                className="bg-green-500 text-white py-1 px-3 rounded-lg text-xs hover:bg-green-600 transition-colors"
                                onClick={() => handlePdf(payroll)} 
                            >
                                Pdf
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {showModal && 
                <PayrollViewEmployees 
                    payroll={payroll} 
                    search={search}
                    year={year}
                    setSearch={setSearch}
                    setYear={setYear}
                    setPayroll={setPayroll}
                    closeModal={closeModal} />}

            {showPdfModal && (
                <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 shadow-lg max-w-[90vw] w-full max-h-[90vh] overflow-y-auto relative">
                        <div className="bg-white p-6 rounded-lg w-full">
                            <button
                                onClick={closePdfModal}
                                className="text-black text-xl absolute top-2 right-2"
                            >
                                X
                            </button>
                            <h3 className="text-center text-lg mb-4">Employee Payroll PDF</h3>
                            <iframe
                                src={`data:application/pdf;base64,${pdfData}`}
                                width="100%"
                                height="600px"
                                title="Payroll PDF"
                                allowfullscreen="false"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollLists;