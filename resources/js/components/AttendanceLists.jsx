import React, { useState, useEffect } from "react";
import axios from "axios";
import { AlertTriangle, Check, CheckCheck, CheckCircle, Plus, Save, X, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import toastr from "toastr";
import 'toastr/build/toastr.min.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AttendanceSelectedDay from "./AttendanceSelectedDay";

const AttendanceLists = ({}) => {
    const currentYear = new Date().getFullYear();
    const startYear = 2025;
    const maxYear = Math.max(startYear, currentYear);
    const minYear = Math.min(startYear, currentYear);
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

    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedDay, setSelectedDay] = useState([]);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfData, setPdfData] = useState('');
    const [formModal, setFormModal] = useState(false);
    const [form, setForm] = useState({
            employee_id: "",
            salary: 0,
            date: "",
            schedules: [],
            attendance: [],
            otAttendance: []
    });

    useEffect(() => {
        fetchEmployees();
    }, [search, month, year]);

    const fetchEmployees = async () => {
        try {            
            const authToken = localStorage.getItem("token");
            const response = await axios.get(`/api/attendances`, {
                params: {
                    search: search,
                    month: month,
                    year: year
                },
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setEmployees(response.data.data);
        } catch (error) {
            // console.error("Error fetching:", error);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const getDaysInMonth = (year, month) => {
        return new Date(year, month, 0).getDate(); 
    };

    const generateDayColumns = (daysInMonth) => {
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const bgColor = isWeekEnd(i, month - 1, year) ? 'bg-blue-500 text-white' : '';
            days.push(<th key={i} className={`${bgColor} px-3 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-l border-gray-200`}>{i}</th>);
        }
        return days;
    };

    function isWeekEnd(date, month = 1, year = 2025) {
        const weekEnd = new Date(year, month, date).getDay();
        return  weekEnd === 0 || weekEnd === 6; 
    }

    const daysInMonth = getDaysInMonth(year, month);

    const handlePdf = async (payroll) => {
        try {
            const response = await axios.post(`/api/attendances/generate-pdf`, 
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

    const handleDailyClick  = (employee_id, salary, schedules, date, attendance, otAttendance) => {
        setForm({
            employee_id: employee_id,
            salary: salary,
            date: date,
            schedules: schedules,
            attendance: attendance,
            otAttendance: otAttendance
        })
        setFormModal(true);
    };

    return (
        <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 items-end mb-4">
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
            </div>

            {/* Search Input */}
            <div className="mb-4">
                <div className="flex items-center gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Search employee..."
                        value={search}
                        onChange={handleSearch}
                        className="flex-grow border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 shadow-lg">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        {/* Header Row 1 - Main Categories */}
                        <tr>
                            <th className="px-3 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200" rowSpan="2">#</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200" rowSpan="2">Name</th>
                            
                            {/* DATE Column Header */}
                            <th colSpan={daysInMonth} className="px-3 py-2 text-center text-sm font-semibold text-gray-800 bg-blue-50 border-x border-gray-200">
                                Attendance Dates (Day.Hour.Minute)
                            </th>
                            
                            {/* Summary Columns */}
                            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 tracking-wider border-l border-gray-200" rowSpan="2">OT (h.m)</th>
                            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 tracking-wider border-l border-gray-200" rowSpan="2">TOTAL (d.h.m)</th>
                            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 tracking-wider border-l border-gray-200" rowSpan="2">1st_P (d.h.m)</th>
                            <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 tracking-wider border-l border-gray-200" rowSpan="2">2nd_P (d.h.m)</th>
                        </tr>
                        
                        {/* Header Row 2 - Day Numbers */}
                        <tr className="border-b border-gray-300">
                            {/* Dynamically generate day columns (1-31 or 1-30 depending on the month) */}
                            {generateDayColumns(daysInMonth)}
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {employees.map((emp, index) => {
                        
                            // 1. Create a lookup map for quick attendance checking (O(1) complexity)
                            const attendanceMap = (emp.regular_attendances || []).reduce((acc, att) => {
                                // If emp.regularAttendances is undefined, it uses an empty array []
                                acc[att.date] = att;
                                return acc;
                            }, {});
                            const otAttendanceMap = (emp.overtime_attendances || []).reduce((acc, att) => {
                                // If emp.regularAttendances is undefined, it uses an empty array []
                                acc[att.date] = att;
                                return acc;
                            }, {});

                            const paddedMonth = String(month).padStart(2, '0');

                            let totalDays = 0;
                            let totalHours = 0;
                            let totalMinutes = 0;
                            let totalDays1p = 0;
                            let totalHours1p = 0;
                            let totalMinutes1p = 0;
                            let totalDays2p = 0;
                            let totalHours2p = 0;
                            let totalMinutes2p = 0;

                            const calculateAttendanceTotals = (attendance) => {
                                if (attendance) {
                                    totalDays += attendance.day || 0;
                                    totalHours += attendance.hour || 0;
                                    totalMinutes += attendance.minute || 0;
                                }
                            };

                            const calculateAttendanceTotals1p = (attendance) => {
                                if (attendance) {
                                    totalDays1p += attendance.day || 0;
                                    totalHours1p += attendance.hour || 0;
                                    totalMinutes1p += attendance.minute || 0;
                                }
                            };

                            const calculateAttendanceTotals2p = (attendance) => {
                                if (attendance) {
                                    totalDays2p += attendance.day || 0;
                                    totalHours2p += attendance.hour || 0;
                                    totalMinutes2p += attendance.minute || 0;
                                }
                            };

                            // Loop over days in the month to calculate totals
                            Array.from({ length: daysInMonth }).forEach((_, dayIndex) => {
                                const day = dayIndex + 1;
                                const paddedDay = String(day).padStart(2, '0');
                                const fullDate = `${year}-${paddedMonth}-${paddedDay}`;
                                const attendance = attendanceMap[fullDate];

                                if (attendance && attendance.actual_in && attendance.actual_out) {
                                    // Full attendance (Clocked In and Out)
                                    calculateAttendanceTotals(attendance);

                                    if(day >= 1 && day <= 15){
                                        calculateAttendanceTotals1p(attendance);
                                    }

                                    if(day >= 16 && day <= daysInMonth){
                                        calculateAttendanceTotals2p(attendance);
                                    }
                                }
                            });

                            // Convert total minutes to hours if totalMinutes >= 60
                            if (totalMinutes >= 60) {
                                totalHours += Math.floor(totalMinutes / 60); // Add the hours
                                totalMinutes = totalMinutes % 60; // Get the remaining minutes
                            }

                            // Convert total hours to days if totalHours >= 60
                            if (totalHours >= 8) {
                                totalDays += Math.floor(totalHours / 8); // Add the days
                                totalHours = totalHours % 8; // Get the remaining hours
                            }

                            if (totalMinutes1p >= 60) {
                                totalHours1p += Math.floor(totalMinutes1p / 60); // Add the hours
                                totalMinutes1p = totalMinutes1p % 60; // Get the remaining minutes
                            }

                            if (totalHours1p >= 8) {
                                totalDays1p += Math.floor(totalHours1p / 8); // Add the days
                                totalHours1p = totalHours1p % 8; // Get the remaining hours
                            }

                            if (totalMinutes2p >= 60) {
                                totalHours2p += Math.floor(totalMinutes2p / 60); // Add the hours
                                totalMinutes2p = totalMinutes2p % 60; // Get the remaining minutes
                            }

                            // Convert total hours to days if totalHours >= 60
                            if (totalHours2p >= 8) {
                                totalDays2p += Math.floor(totalHours2p / 8); // Add the days
                                totalHours2p = totalHours2p % 8; // Get the remaining hours
                            }

                            let totalOTDays = 0;
                            let totalOThours = 0;
                            let totalOTMinutes = 0;

                            // Function to calculate total OT hours and minutes
                            const calculateOvertimeTotals = (overtimeAttendance) => {
                                if (overtimeAttendance) {
                                    totalOThours += overtimeAttendance.hour || 0;
                                    totalOTMinutes += overtimeAttendance.minute || 0;
                                }
                            };

                            (emp.over_time_attendances || []).forEach((overtime) => {
                                calculateOvertimeTotals(overtime);
                            });

                            // Convert total minutes to hours if totalMinutes >= 60
                            if (totalOTMinutes >= 60) {
                                totalOThours += Math.floor(totalOTMinutes / 60); // Add the hours
                                totalOTMinutes = totalOTMinutes % 60; // Get the remaining minutes
                            }

                            return (
                                <tr key={emp.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                    {/* Index and Name */}
                                    <td className="px-3 py-2 text-sm text-center text-gray-500 font-medium border-r border-gray-200">{index + 1}</td>
                                    <td className="px-3 py-2 text-sm font-medium text-gray-900 whitespace-nowrap border-r border-gray-200">
                                        {emp.lastname}, {emp.firstname}
                                        {emp.extname ? ` ${emp.extname}` : ''} 
                                        {emp.middlename ? ` ${emp.middlename.charAt(0)}.` : ''}    
                                    </td>
                                    
                                    {/* Daily Data Cells */}
                                    {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                                        const day = dayIndex + 1;
                                        const paddedDay = String(day).padStart(2, '0');
                                        
                                        const fullDate = `${year}-${paddedMonth}-${paddedDay}`;
                                        
                                        const attendance = attendanceMap[fullDate];
                                        const otAttendance = otAttendanceMap[fullDate];
                                        // Check if both actual_in and actual_out have non-null/non-empty values
                                        const hasFullAttendance = attendance && attendance.actual_in && attendance.actual_out;
                                        
                                        // Check if there is any attendance record at all
                                        const hasAnyAttendance = !!attendance; 
                                        
                                        let cellContent = '';
                                        let cellColorClass = 'text-gray-700';

                                        if (hasFullAttendance) {
                                            // Full attendance (Clocked In and Out)
                                            cellContent = (
                                                <label className="text-sm text-green-500 cursor-pointer">
                                                    {attendance ? `${attendance.day || 0}.${attendance.hour || 0}.${attendance.minute || 0}` : '0.0.0'}
                                                </label>
                                            );

                                        } else if (hasAnyAttendance && attendance.is_absent == 0) {
                                            // Partial attendance (e.g., clocked in but not out, or just one entry)
                                            cellContent = <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />;
                                        } else {
                                            // No attendance record for this day
                                            cellContent = <X className="h-4 w-4 text-red-500 mx-auto" />;
                                            // Optional: Highlight weekend days or non-working days if you have that data
                                        }

                                        return (
                                            <td 
                                                key={dayIndex} 
                                                className={`text-center text-xs px-1 py-1 cursor-pointer border-l border-gray-200 hover:bg-gray-200 transition duration-100 ${cellColorClass}`}
                                                onClick={() => handleDailyClick(emp.id, emp.salary, emp.schedules, fullDate, attendance, otAttendance)}
                                            >
                                                {cellContent}
                                            </td>
                                        );
                                    })}
                                    
                                    
                                    {/* Summary Data - Replaced {emp.name} with placeholders for structure */}
                                    <td className="px-3 py-2 text-sm text-center font-semibold text-gray-700 border-l border-gray-200">{totalOThours}.{totalOTMinutes}</td>
                                    <td className="px-3 py-2 text-sm text-center font-bold text-blue-600 border-l border-gray-200">{totalDays}.{totalHours}.{totalMinutes}</td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-700 border-l border-gray-200">{totalDays1p}.{totalHours1p}.{totalMinutes1p}</td>
                                    <td className="px-3 py-2 text-sm text-center text-gray-70 border-l border-gray-200">{totalDays2p}.{totalHours2p}.{totalMinutes2p}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <AttendanceSelectedDay
                formModal={formModal}
                setFormModal={setFormModal}
                form={form}
                setForm={setForm}
                fetchEmployees={fetchEmployees}
            />

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

export default AttendanceLists;