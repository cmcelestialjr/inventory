import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Save, X } from "lucide-react";
import toastr from 'toastr';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const EmployeeWageBySalary = ({ activeTab, wages, fetchEmployees, setWagesModal }) => {
    if (activeTab!='By Salary') return null;

    const [editingId, setEditingId] = useState(null);
    const [editTimeIn, setEditTimeIn] = useState(null);
    const [editTimeOut, setEditTimeOut] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [selectedDays, setSelectedDays] = useState([]);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const formatTime = (time) => {
        if (!time) return 'None';

        return time.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatTime12 = (time) => {
        if (!time) return '';

        const dateString = `1970-01-01T${time}`;
        const date = new Date(dateString);

        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const parseTimeToDate = (time) => {
        if (!time) return null;
        return new Date(`1970-01-01T${time}`);
    };


    const handleSaveClick = async (id) => {

        const formData = {
            id: id,
            time_in: formatTime(editTimeIn),
            time_out: formatTime(editTimeOut),
            days: selectedDays,
        };
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(`/api/employee/schedule/update`, 
                formData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.status === 200 || response.status === 201) {
                toastr.success(response.data.message);
                setEditingId(null);
                setEditTimeIn(null);
                setEditTimeOut(null);
                fetchSchedules();
            }else{
                toastr.error("Error! There is something wrong in updating schedule.");
            }
            
        } catch (err) {
            toastr.error("Failed to update schedule");
        }
    };

    const fetchSchedules = async () => {
        try {
            const authToken = localStorage.getItem("token");
            const response = await axios.get(
                `/api/employee/schedule/index`, { 
                params: {
                    id: wages.id                    
                }, 
                headers: { Authorization: `Bearer ${authToken}` } }
            );

            setSchedules(response.data);

        } catch (error) {
            
        }
    };

    const handleEditClick = (id) => {
        if (editingId === id) {
            // Save logic here
            // Maybe update schedules state if needed
            setEditingId(null);
        } else {
            const current = schedules.find((t) => t.id === id);
            setEditTimeIn(parseTimeToDate(current.time_in));
            setEditTimeOut(parseTimeToDate(current.time_out));
            setSelectedDays(current?.days?.map(day => day.shorten) || []);
            setEditingId(id);
        }
    };

    const handleDayChange = (day) => {
        setSelectedDays((prevDays) =>
            prevDays.includes(day)
                ? prevDays.filter((d) => d !== day)
                : [...prevDays, day]
        );
    };

    return (
        <div className="mt-5">
            <form className="space-y-4">
                <div>
                    <label htmlFor="salary">Salary per day</label>
                    <input 
                        type="text"
                        id="salary"
                        name="salary"
                        value={wages.salary}
                        className="border px-3 py-2 rounded-lg w-full"
                        disabled
                    />
                </div>
                {schedules.map((schedule) => (
                    <div key={schedule.id} className="border rounded-lg p-4 mb-4 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-lg">{schedule.pay_types?.name}</h3>
                                <p className="text-sm text-gray-600">Multiplier: {schedule.pay_types?.pay_multiplier}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                type="button"
                                onClick={() =>
                                    editingId === schedule.id
                                    ? handleSaveClick(schedule.id)
                                    : handleEditClick(schedule.id)
                                }
                                className={`px-4 py-2 rounded text-white ${
                                    editingId === schedule.id
                                    ? "bg-green-500 hover:bg-green-600"
                                    : "bg-blue-500 hover:bg-blue-600"
                                }`}
                                >
                                {editingId === schedule.id ? "Save" : "Edit"}
                                </button>

                                {editingId === schedule.id && (
                                <button
                                    type="button"
                                    onClick={() => setEditingId(null)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                >
                                    Cancel
                                </button>
                                )}
                            </div>
                        </div>

                        {editingId === schedule.id ? (
                        <div>
                            <div className="mt-4 flex justify-between items-center">
                                <div>
                                    <label className="block mb-1">
                                        <strong>Time In:</strong>
                                    </label>
                                    <DatePicker
                                        selected={editTimeIn}
                                        onChange={(time) => setEditTimeIn(time)}
                                        showTimeSelect
                                        showTimeSelectOnly
                                        timeIntervals={15}
                                        timeCaption="Time In"
                                        dateFormat="h:mm aa"
                                        className="border px-3 py-2 rounded-lg w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1">
                                        <strong>Time Out:</strong>
                                    </label>
                                    <DatePicker
                                        selected={editTimeOut}
                                        onChange={(time) => setEditTimeOut(time)}
                                        showTimeSelect
                                        showTimeSelectOnly
                                        timeIntervals={15}
                                        timeCaption="Time Out"
                                        dateFormat="h:mm aa"
                                        className="border px-3 py-2 rounded-lg w-full"
                                    />
                                </div>                            
                            </div>
                            {schedule.schedule_pay_type_id === 1 && (
                                <div className="mt-4">
                                    <h4 className="font-semibold text-lg">Days:</h4>
                                    <div className="grid grid-cols-7 sm:grid-cols-7 gap-4 mt-2">
                                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                                            <div key={index} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={day}
                                                    checked={selectedDays.includes(day)}
                                                    onChange={() => handleDayChange(day)}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor={day} className="ml-1 text-sm font-medium text-gray-700">{day}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        ) : (
                        <div className="mt-4">
                            <p><strong>Time In:</strong> {formatTime12(schedule.time_in)}</p>
                            <p><strong>Time Out:</strong> {formatTime12(schedule.time_out)}</p>
                            {schedule.schedule_pay_type_id === 1 && (
                                <p>
                                <strong className="mr-1">Days:</strong>
                                {schedule?.days.map((day, index) => (
                                    <>
                                    <span>{day.shorten}</span>
                                    {index < schedule.days.length - 1 && ", "}
                                    </>
                                ))}
                                </p>
                            )}
                        </div>
                        )}
                    </div>
                ))}

                {/* <div>
                    <label htmlFor="payTypeId">Pay Type</label>
                    <select
                        id="payTypeId"
                        name="payTypeId"
                        value={payTypeId}
                        onChange={(e) => setPayTypeId(Number(e.target.value))}
                        className="border px-3 py-2 rounded-lg w-full"
                    >
                        {payTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.name} ({type.pay_multiplier})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="time_in">Time In</label><br></br>
                    <DatePicker
                        id="time_in"
                        selected={timeIn}
                        onChange={(time) => setTimeIn(time)} 
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Time In"
                        dateFormat="h:mm aa"
                        className="border px-3 py-2 rounded-lg w-full"
                        wrapperClassName="w-full"
                    />
                </div>
                <div>
                    <label htmlFor="time_out">Time Out</label><br></br>
                    <DatePicker
                        id="time_out"
                        selected={timeOut}
                        onChange={(time) => setTimeOut(time)} 
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Time Out"
                        dateFormat="h:mm aa"
                        className="border px-3 py-2 rounded-lg w-full"
                        wrapperClassName="w-full"
                    />
                </div> */}
                <div className="mt-2 mb-4">
                    <button 
                        type="button" 
                        onClick={() => setWagesModal(false)}
                        className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg flex items-center gap-1
                                hover:bg-white hover:text-gray-800 hover:border hover:border-gray-800 transition"
                    >
                        <X size={18} />
                        Close
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmployeeWageBySalary;