import React, { useState, useEffect } from "react";
import axios from "axios";
import { Check, CheckCircle, Plus, Save, X, XCircle } from "lucide-react";
import Swal from "sweetalert2";
import toastr from "toastr";
import 'toastr/build/toastr.min.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import InputMask from "react-input-mask";

const AttendanceSelectedDay = ({ formModal, setFormModal, form, setForm, fetchEmployees }) => {
    if (!formModal) return null;

    const [errors, setErrors] = useState({});
    const [regularTimeIn, setRegularTimeIn] = useState("");
    const [regularTimeOut, setRegularTimeOut] = useState("");
    const [actualTimeIn, setActualTimeIn] = useState("");
    const [actualTimeOut, setActualTimeOut] = useState("");
    const [overTimeIn, setOverTimeIn] = useState("");
    const [overTimeOut, setOverTimeOut] = useState("");
    const [sameTimeChecked, setSameTimeChecked] = useState(false);
    const [earned, setEarned] = useState(0);
    const [otEarned, setOtEarned] = useState(0);
    const [totalEarned, setTotalEarned] = useState(0);
    const [day, setDay] = useState(0);
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0);
    const [otHour, setOtHour] = useState(0);
    const [otMinute, setOtMinute] = useState(0);
    const [lates, setLates] = useState(0);
    const [underTime, setUnderTime] = useState(0);

    useEffect(() => {
        if (form.attendance?.schedule_in && form.attendance.schedule_in.trim() !== "" &&
            form.attendance?.schedule_out && form.attendance.schedule_out.trim() !== "") {
            setRegularTimeIn(parseTimeToDate(form.attendance.schedule_in));
            setRegularTimeOut(parseTimeToDate(form.attendance.schedule_out));

        } else if (Array.isArray(form.schedules)) {
            const sched = form.schedules.find(s => s.schedule_pay_type_id === 1 && s.time_in && s.time_out);
            if (sched) {
                setRegularTimeIn(parseTimeToDate(sched.time_in));
                setRegularTimeOut(parseTimeToDate(sched.time_out));
            } else {
                setRegularTimeIn("");
                setRegularTimeOut("");
            }
        }

        if (form.otAttendance?.schedule_in && form.otAttendance.schedule_in.trim() !== "" &&
            form.otAttendance?.schedule_out && form.otAttendance.schedule_out.trim() !== "") {
            setOverTimeIn(parseTimeToDate(form.otAttendance.schedule_in));
            setOverTimeOut(parseTimeToDate(form.otAttendance.schedule_out));

        } else if (Array.isArray(form.schedules)) {
            const sched = form.schedules.find(s => s.schedule_pay_type_id === 2 && s.time_in && s.time_out);
            if (sched) {
                setOverTimeIn(parseTimeToDate(sched.time_in));
                setOverTimeOut(parseTimeToDate(sched.time_out));
            } else {
                setOverTimeIn("");
                setOverTimeOut("");
            }
        }

        if (form.attendance?.actual_in && form.attendance.actual_in.trim() !== "" &&
            form.attendance?.actual_out && form.attendance.actual_out.trim() !== "") {
            setActualTimeIn(parseTimeToDate(form.attendance.actual_in));
            setActualTimeOut(parseTimeToDate(form.attendance.actual_out));
        }

        let totalEarned1 = 0;

        if (form.attendance?.earned) {
            const attendanceEarned = parseFloat(form.attendance.earned);
            if (!isNaN(attendanceEarned)) {
                totalEarned1 += attendanceEarned;
            }
        }

        if (form.otAttendance?.earned) {
            const otEarned = parseFloat(form.otAttendance.earned);
            if (!isNaN(otEarned)) {
                totalEarned1 += otEarned;
            }
        }

        setTotalEarned(totalEarned1);

    }, [form.attendance, form.schedules]);

    useEffect(() => {
        if (!regularTimeIn || !regularTimeOut) return;

        const minuteDiff = (a, b) => (b - a) / (1000 * 60); // difference in minutes
        const hourRate = form.salary / 8;

        // ✅ Normalize all times into valid Date objects
        const safeDate = (time) => {
            if (!time) return null;
            const t = new Date(time);
            return new Date(1970, 0, 1, t.getHours(), t.getMinutes(), t.getSeconds(), 0);
        };

        const actualIn = safeDate(actualTimeIn);
        const actualOut = safeDate(actualTimeOut);
        const regularIn = safeDate(regularTimeIn);
        const regularOut = safeDate(regularTimeOut);
        const otIn = safeDate(overTimeIn);
        const otOut = safeDate(overTimeOut);

        if (!actualIn || !actualOut || !regularIn || !regularOut) return;

        // --- REGULAR TIME COMPUTATION ---
        const regularStart = actualIn > regularIn ? actualIn : regularIn;
        const regularEnd = actualOut < regularOut ? actualOut : regularOut;

        let regularMinutes = 0;
        if (regularEnd > regularStart) {
            regularMinutes = minuteDiff(regularStart, regularEnd);

            // --- LUNCH BREAK DEDUCTION ---
            const lunchStart = new Date(regularStart);
            lunchStart.setHours(12, 0, 0, 0);
            const lunchEnd = new Date(regularStart);
            lunchEnd.setHours(13, 0, 0, 0);

            if (regularStart < lunchStart && regularEnd > lunchEnd) {
            regularMinutes -= 60;
            }
        }
        
        // 🔹 CAP regular work to 8 hours MAX
        if (regularMinutes > 480) regularMinutes = 480;

        // 🔹 Compute late minutes
        let lateMinutes = 0;
        if (actualIn > regularIn) {
            lateMinutes = minuteDiff(regularIn, actualIn);
        }

        // 🔹 Compute undertime minutes
        let underTimeMinutes = 0;
        if (regularOut > actualOut) {
            underTimeMinutes = minuteDiff(actualOut, regularOut);
        }

        // 🔹 Ensure valid payable minutes
        let payableMinutes = Math.max(0, regularMinutes);

        const regHours = Math.floor(payableMinutes / 60);
        const regMins = Math.floor(payableMinutes % 60);
        const regEarned = hourRate * (payableMinutes / 60);

        // --- OVERTIME COMPUTATION ---
        let otMinutes = 0;
        if (otIn && otOut && actualOut && actualOut > otIn) {
            const otStart = actualIn > otIn ? actualIn : otIn;
            const otEnd = actualOut < otOut ? actualOut : otOut;

            if (otEnd > otStart) {
            otMinutes = minuteDiff(otStart, otEnd);
            }
        }

        const otHours = Math.floor(otMinutes / 60);
        const otMins = Math.floor(otMinutes % 60);
        const otEarned = hourRate * 1 * (otMinutes / 60); // (replace 1 with multiplier if needed)

        // --- TOTAL DAY/HOUR LOGIC ---
        if (payableMinutes >= 480) {
            setDay(1);
            setHour(0);
        } else {
            setDay(0);
            setHour(regHours);
        }

        setMinute(regMins);
        setEarned(regEarned.toFixed(2));
        setOtHour(otHours);
        setOtMinute(otMins);
        setOtEarned(otEarned.toFixed(2));
        setTotalEarned((regEarned + otEarned).toFixed(2));
        setLates(lateMinutes);
        setUnderTime(underTimeMinutes);
    }, [
        actualTimeIn,
        actualTimeOut,
        regularTimeIn,
        regularTimeOut,
        overTimeIn,
        overTimeOut,
    ]);


    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!form.employee_id) newErrors.employee_id = true;
        if (!form.date) newErrors.date = true;

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toastr.error("Please fill in all required fields.");
            return;
        }

        try {
            const authToken = localStorage.getItem("token");

            const formData = {
                employee_id: form.employee_id,
                date: form.date,
                salary: form.salary,
                regularTimeIn: regularTimeIn ? formatTime(regularTimeIn) : '',
                regularTimeOut: regularTimeOut ? formatTime(regularTimeOut) : '',
                actualTimeIn: actualTimeIn ? formatTime(actualTimeIn) : '',
                actualTimeOut: actualTimeOut ? formatTime(actualTimeOut) : '',
                overTimeIn: overTimeIn ? formatTime(overTimeIn) : '',
                overTimeOut: overTimeOut ? formatTime(overTimeOut) : '',
                earned,
                otEarned,
                totalEarned,
                day,
                hour,
                minute,
                otHour,
                otMinute,
                lates,
                underTime
            };

            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            };

            await axios.put(`/api/attendances/${form.employee_id}`, formData, config);

            setForm({
                employee_id: "",
                salary: form.salary,
                date: "",
                schedules: [],
                attendance: [],
                otAttendance: [],
            });
            
            fetchEmployees();
            setFormModal(false);
        } catch (err) {
            toastr.error("Error saving data"+err);
        }
    };

    const parseTimeToDate = (time) => {
        if (!time) return null;
        return new Date(`1970-01-01T${time}`);
    };

    const handleCheckboxChange = () => {
        setSameTimeChecked(!sameTimeChecked);
        if (!sameTimeChecked) {
            setActualTimeIn(regularTimeIn);
            setActualTimeOut(regularTimeOut);
        } else {
            if (form.attendance?.actual_in && form.attendance.actual_in.trim() !== "" &&
                form.attendance?.actual_out && form.attendance.actual_out.trim() !== "") {
                setActualTimeIn(parseTimeToDate(form.attendance.actual_in));
                setActualTimeOut(parseTimeToDate(form.attendance.actual_out));
            } else {
                setActualTimeIn(null);
                setActualTimeOut(null);
            }
            
        }
    };

    const formatTime = (time) => {
        if (!time) return 'None';

        return time.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between">
                    <h2 className="text-xl font-semibold">
                        {form.date
                        ? new Intl.DateTimeFormat("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "2-digit",
                        }).format(new Date(form.date))
                        : ""}
                    </h2>
                    <button
                        onClick={() => setFormModal(false)}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="mt-1 p-4 bg-white shadow-md rounded-lg">
                    <div className="text-gray-700 text-sm mb-2">
                        <label className="font-medium">Salary per Day:</label>
                        <span className="ml-2 font-semibold text-gray-800">{form.salary}</span>
                    </div>

                    <div className="text-gray-700 text-sm mb-2">
                        <label className="font-medium">per Hour:</label>
                        <span className="ml-2 font-semibold text-gray-800">
                            {(form.salary / 8).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>


                    <div className="text-gray-700 text-sm mb-2">
                        <label className="font-medium">Regular:</label>
                        <span className="ml-2 font-semibold text-gray-800">{day}.{hour}.{minute} | {earned}</span>
                    </div>

                    <div className="text-gray-700 text-sm mb-2">
                        <label className="font-medium">Overtime (OT):</label>
                        <span className="ml-2 font-semibold text-gray-800">{otHour}.{otMinute} | {otEarned}</span>
                    </div>

                    <div className="text-gray-700 text-sm">
                        <label className="font-medium">Total Earned:</label>
                        <span className="ml-2 font-semibold text-gray-800">{totalEarned}</span>
                    </div>
                </div>


                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mt-3 grid grid-cols-1 gap-2">
                        <div className="mt-4 flex items-center">
                            <div className="flex items-center space-x-1">
                                <label className="text-sm font-medium text-gray-700">
                                    Daily Schedule
                                </label>
                            </div>
                        </div>
                        <div className="mt-1 flex justify-between items-center">
                            <div>
                                <label className="block mb-1">
                                    <strong>Schedule Time In:</strong>
                                </label>
                                <DatePicker
                                    selected={regularTimeIn}
                                    onChange={(time) => setRegularTimeIn(time)}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    timeCaption="Time In"
                                    dateFormat="hh:mm aa"
                                    className="border px-2 py-2 rounded-lg w-full"
                                    customInput={
                                        <InputMask
                                            mask="99:99 aa"
                                            maskChar=" "
                                            value={regularTimeIn ? regularTimeIn.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const date = new Date();
                                                const [hours, minutes] = value.split(':');
                                                if (hours && minutes) {
                                                    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                    setRegularTimeIn(date);
                                                }
                                            }}
                                        >
                                            {(inputProps) => <input {...inputProps} />}
                                        </InputMask>
                                    }
                                />
                            </div>
                            <div>
                                <label className="block mb-1">
                                    <strong>Schedule Time Out:</strong>
                                </label>
                                <DatePicker
                                    selected={regularTimeOut}
                                    onChange={(time) => setRegularTimeOut(time)}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    timeCaption="Time Out"
                                    dateFormat="hh:mm aa"
                                    className="border px-2 py-2 rounded-lg w-full"
                                    customInput={
                                        <InputMask
                                            mask="99:99 aa"
                                            maskChar=" "
                                            value={regularTimeOut ? regularTimeOut.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const date = new Date();
                                                const [hours, minutes] = value.split(':');
                                                if (hours && minutes) {
                                                    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                    setRegularTimeOut(date);
                                                }
                                            }}
                                        >
                                            {(inputProps) => <input {...inputProps} />}
                                        </InputMask>
                                    }
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center">
                            <div className="flex items-center space-x-3">
                                <label className="text-sm font-medium text-gray-700">
                                    OverTime Schedule
                                </label>
                            </div>
                        </div>
                        <div className="mt-1 flex justify-between items-center">
                            <div>
                                <label className="block mb-1">
                                    <strong>Over-Time In:</strong>
                                </label>
                                <DatePicker
                                    selected={overTimeIn || null}
                                    onChange={(time) => setOverTimeIn(time)}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    timeCaption="Time In"
                                    dateFormat="hh:mm aa"
                                    className="border px-3 py-2 rounded-lg w-full"
                                    customInput={
                                        <InputMask
                                            mask="99:99 aa"
                                            maskChar=" "
                                            value={overTimeIn ? overTimeIn.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : ''}
                                            onChange={(e) => {
                                                const value = e.target.value;

                                                if (value === '') {
                                                    setOverTimeOut(null); 
                                                    return;
                                                }

                                                const date = new Date();
                                                const [hours, minutes] = value.split(':');
                                                if (hours && minutes && !isNaN(hours) && !isNaN(minutes)) {
                                                    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                    setOverTimeIn(date);
                                                }
                                            }}
                                        >
                                            {(inputProps) => <input {...inputProps} />}
                                        </InputMask>
                                    }
                                />
                            </div>
                            <div>
                                <label className="block mb-1">
                                    <strong>Over-Time Out:</strong>
                                </label>
                                <DatePicker
                                    selected={overTimeOut || null}
                                    onChange={(time) => setOverTimeOut(time)}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    timeCaption="Time Out"
                                    dateFormat="hh:mm aa"
                                    className="border px-3 py-2 rounded-lg w-full"
                                    customInput={
                                        <InputMask
                                            mask="99:99 aa"
                                            maskChar=" "
                                            value={overTimeOut ? overTimeOut.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : ''}
                                            onChange={(e) => {
                                                const value = e.target.value;

                                                if (value === '') {
                                                    setOverTimeOut(null); 
                                                    return;
                                                }
                                                
                                                const date = new Date();
                                                const [hours, minutes] = value.split(':');
                                                if (hours && minutes && !isNaN(hours) && !isNaN(minutes)) {
                                                    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                    setOverTimeOut(date);
                                                }
                                            }}
                                        >
                                            {(inputProps) => <input {...inputProps} />}
                                        </InputMask>
                                    }
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={sameTimeChecked}
                                    onChange={handleCheckboxChange}
                                    id="same-time-checkbox"
                                    className="h-5 w-5 text-blue-600 border-gray-300 rounded-md focus:ring-blue-500"
                                />
                                <label htmlFor="same-time-checkbox" className="text-sm font-medium text-gray-700">
                                    Set Actual Time Same as Schedule Time
                                </label>
                            </div>
                        </div>
                        <div className="mt-2 mb-4 flex justify-between items-center">
                            <div>
                                <label className="block mb-1">
                                    <strong>Actual Time In:</strong>
                                </label>
                                <DatePicker
                                    selected={actualTimeIn || null}
                                    onChange={(time) => setActualTimeIn(time)}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    timeCaption="Time In"
                                    dateFormat="hh:mm aa"
                                    className="border px-3 py-2 rounded-lg w-full"
                                    customInput={
                                        <InputMask
                                            mask="99:99 aa"
                                            maskChar=" "
                                            value={actualTimeIn ? actualTimeIn.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const date = new Date();
                                                const [hours, minutes] = value.split(':');
                                                if (hours && minutes) {
                                                    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                    setActualTimeIn(date);
                                                }
                                            }}
                                        >
                                            {(inputProps) => <input {...inputProps} />}
                                        </InputMask>
                                    }
                                />
                            </div>
                            <div>
                                <label className="block mb-1">
                                    <strong>Actual Time Out:</strong>
                                </label>
                                <DatePicker
                                    selected={actualTimeOut || null}
                                    onChange={(time) => setActualTimeOut(time)}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    timeCaption="Time Out"
                                    dateFormat="hh:mm aa"
                                    className="border px-3 py-2 rounded-lg w-full"
                                    customInput={
                                        <InputMask
                                            mask="99:99 aa"
                                            maskChar=" "
                                            value={actualTimeOut ? actualTimeOut.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const date = new Date();
                                                const [hours, minutes] = value.split(':');
                                                if (hours && minutes) {
                                                    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                                                    setActualTimeOut(date);
                                                }
                                            }}
                                        >
                                            {(inputProps) => <input {...inputProps} />}
                                        </InputMask>
                                    }
                                />
                            </div>
                        </div>                        
                    </div>
                    <div className="flex justify-between">
                        <button 
                            type="button"
                            onClick={() => setFormModal(false)}
                            className="px-3 py-2 bg-gray-200 text-md text-gray-800 rounded-lg flex items-center gap-1
                                hover:bg-white hover:text-gray-800 hover:border hover:border-gray-800 transition"
                        >
                            <X size={14} />
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-3 py-2 bg-blue-600 text-md text-white rounded-lg flex items-center gap-1
                                hover:bg-white hover:text-blue-600 hover:border hover:border-blue-600 transition"
                        >
                            <Save size={14} />
                            Save
                        </button>
                    </div>
                </form>

            </div>            
        </div>
    );
};

export default AttendanceSelectedDay;