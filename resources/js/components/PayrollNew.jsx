import React, { useState, useEffect } from "react";
import { startOfMonth, endOfMonth, addDays, startOfWeek, endOfWeek, isAfter } from "date-fns";
import axios from "axios";
import { FilePlus, Plus, Save, Users, X } from "lucide-react";
import toastr from 'toastr';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function getWeeksInMonth(year, month) {
    const weeks = [];
    let startDate = startOfWeek(startOfMonth(new Date(year, month - 1)), { weekStartsOn: 1 }); // Monday start
    const monthEnd = endOfMonth(new Date(year, month - 1));
    
    while (isAfter(monthEnd, startDate) || startDate.getMonth() === month - 1) {
        const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
        weeks.push({ start: startDate, end: endDate });
        startDate = addDays(endDate, 1);
    }
    
    return weeks;
}

const PayrollNew = ({ authToken }) => {
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
    const [payrollType, setPayrollType] = useState(1);
    const [payrollOption, setPayrollOption] = useState("semi-monthly");
    const [dayRange, setDayRange] = useState("1-15");
    const [weeks, setWeeks] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState("");
    const [endDays, setEndDays] = useState([]);    
    const [includeOt, setIncludeOt] = useState("Yes");
    const [listEmployee, setListEmployee] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState([]);

    useEffect(() => {
        if (payrollOption === "weekly") {
            const weeksInMonth = getWeeksInMonth(year, month);
            setWeeks(weeksInMonth);

            if (weeksInMonth.length > 0) {
                const firstWeek = weeksInMonth[0];
                const firstWeekRange = `${firstWeek.start.toLocaleDateString()} - ${firstWeek.end.toLocaleDateString()}`;
                setSelectedWeek(firstWeekRange);
            }
        }
    }, [year, month, payrollOption]);

    useEffect(() => {
        if (payrollOption === "semi-monthly") {
            const lastDayOfMonth = endOfMonth(new Date(year, month - 1)).getDate();
            const days = [];
            for (let i = 16; i <= lastDayOfMonth; i++) {
                days.push(i);
            }
            setEndDays(days);
        }
    }, [year, month, payrollOption]);

    const handleCheckboxChange = (employee) => {
        setSelectedEmployees((prevSelected) => {
            if (prevSelected.some((e) => e.id === employee.id)) {
                return prevSelected.filter((e) => e.id !== employee.id);
            } else {
                return [...prevSelected, employee];
            }
        });
    };

    const toggleEmployeeSelection = (employee) => {
        handleCheckboxChange(employee);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = {
            year: year,
            month: month,
            payrollType: payrollType,
            payrollOption: payrollOption,
            dayRange: dayRange,
            week: selectedWeek,
            includeOt: includeOt
        };

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/payroll/listEmployee`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 200 || response.status === 201) {
                setListEmployee(response.data.data);
                setSelectedEmployees(response.data.data);
            }else{
                toastr.error("Error! There is something wrong.");
            }            
        } catch (err) {
            toastr.error("Failed!");
        }
    };   

    const handleCreatePayroll = async (e) => {
        e.preventDefault();

        const formData = {
            year: year,
            month: month,
            payrollType: payrollType,
            payrollOption: payrollOption,
            dayRange: dayRange,
            week: selectedWeek,
            includeOt: includeOt,
            employees: selectedEmployees
        };

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/payroll`,
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 200 || response.status === 201) {
                toastr.success("Success! Payroll created.");
                const updatedList = listEmployee.filter(
                    (employee) => !selectedEmployees.some((selected) => selected.id === employee.id)
                );
                setListEmployee(updatedList);
                setSelectedEmployees([]);
            }else{
                toastr.error("Error! There is something wrong.");
            }
        } catch (err) {
            toastr.error("Failed!");
        }
    };

    return (
        <div className="border border-gray-300 shadow-xl rounded-lg p-6 bg-white mx-auto w-full mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-end">
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
                        <label htmlFor="payrollOption" className="mb-1 font-semibold text-gray-700">Payroll Option</label>
                        <select
                            id="payrollOption"
                            value={payrollOption}
                            onChange={e => setPayrollOption(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                        <option value="monthly">Monthly</option>
                        <option value="semi-monthly">Semi-Monthly</option>
                        <option value="weekly">Weekly</option>
                        </select>
                    </div>

                    {payrollOption === "semi-monthly" && (
                        <div className="flex flex-col">
                            <label htmlFor="dayRange" className="mb-1 font-semibold text-gray-700">Day Range</label>
                            <select
                                id="dayRange"
                                value={dayRange}
                                onChange={e => setDayRange(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="1-15">1 - 15</option>
                                <option value={`16-${endDays.length ? endDays[endDays.length - 1] : ''}`}>
                                    {`16 - ${endDays.length ? endDays[endDays.length - 1] : 'End of Month'}`}
                                </option>
                            </select>
                        </div>
                    )}

                    {payrollOption === "weekly" && (
                        <div className="flex flex-col">
                            <label htmlFor="weekRange" className="mb-1 font-semibold text-gray-700">Week Range</label>
                            <select
                                id="weekRange"
                                value={selectedWeek}
                                onChange={e => setSelectedWeek(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                            {weeks.map((week, idx) => {
                                const start = week.start.toLocaleDateString();
                                const end = week.end.toLocaleDateString();
                                return (
                                    <option key={idx} value={`${idx+1}_${start}-${end}`}>
                                        {`${start} - ${end}`}
                                    </option>
                                );
                            })}
                            </select>
                        </div>
                    )}

                    <div className="flex flex-col">
                        <label htmlFor="includeOt" className="mb-1 font-semibold text-gray-700">Include Overtime?</label>
                        <select
                            id="includeOt"
                            value={includeOt}
                            onChange={e => setIncludeOt(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                            <Users className="w-5 h-5" />
                            List Employee
                        </button>
                    </div>
                </div>
            </form>

            <div>
                {listEmployee.length === 0 ? (
                    <div className="flex justify-center items-center h-48 text-gray-500">
                        <p>No employees available.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                        {listEmployee.map((employee, index) => (
                            <div
                                key={employee.id}
                                className={`border p-4 rounded-lg shadow-md bg-white hover:bg-gray-50 cursor-pointer flex items-start`}
                                onClick={() => toggleEmployeeSelection(employee)}
                            >            

                                <div className="flex flex-col ml-4 w-full">
                                    <div className="flex justify-between">
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-800">{employee.name}</h4>
                                            <p className="text-sm font-bold text-gray-600">{employee.position}</p>
                                        </div>

                                        <label 
                                            onClick={e => e.stopPropagation()} 
                                            className="relative cursor-pointer select-none"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployees.some((e) => e.id === employee.id)} 
                                                onChange={() => handleCheckboxChange(employee)}
                                                className="sr-only"
                                            />
                                            <div
                                                className={`w-8 h-8 rounded border-2 border-green-600 flex items-center justify-center
                                                ${selectedEmployees.some((e) => e.id === employee.id) ? 'bg-green-600' : 'bg-white'}`}
                                            >
                                                {selectedEmployees.some((e) => e.id === employee.id) && (
                                                    <svg
                                                        className="w-6 h-6 text-white"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <p className="text-sm text-gray-800">
                                                Salary: ₱{employee.salary?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-sm font-medium text-blue-600">
                                                Days Present: {employee.no_of_day_present}
                                            </p>
                                    </div>
                                    <div className="flex justify-between mb-2 border-t mt-1 pt-1">
                                        <div>
                                            <p className="text-sm text-gray-800">
                                                Basic Pay: ₱{employee.basic_pay?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>

                                            <p className="text-sm text-gray-800">
                                                Overtime: ₱{employee.overtime?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>

                                            {employee.other_earnings?.length > 0 &&
                                                employee.other_earnings.map((earning) => (
                                                    <p key={earning.id} className="text-sm text-purple-600">
                                                    {earning.name}: ₱{earning.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                ))
                                            }
                                        </div>

                                        {/* Right Column: Deductions and Netpay */}
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-blue-600">
                                                Earned: ₱{employee.earned?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>

                                            <p className="text-sm font-medium text-red-600">
                                                Deductions: ₱{employee.deduction?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>

                                            <p className="text-sm font-semibold text-green-600">
                                                Net Pay: ₱{employee.netpay?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {listEmployee.length > 0 && (
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={handleCreatePayroll}
                        className="bg-green-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-green-700 transition w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                        <FilePlus className="w-5 h-5" />
                        Create Payroll
                    </button>
                </div>
            )}
            
        </div>
    );
};

export default PayrollNew;