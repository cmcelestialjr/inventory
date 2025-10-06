import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Save, X } from "lucide-react";
import toastr from 'toastr';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const EmployeeForm = ({ formModal, setFormModal, form, setForm, fetchEmployees }) => {
    if (!formModal) return null;

    const [title, setTitle] = useState("Edit");
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (form.id === "") {
            setTitle("New");
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!form.lastname.trim()) newErrors.lastname = true;
        if (!form.firstname.trim()) newErrors.firstname = true;
        if (!form.position.trim()) newErrors.position = true;
        if (!form.salary) newErrors.salary = true;
        if (!form.sex) newErrors.sex = true;
        if (!form.status) newErrors.status = true;

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toastr.error("Please fill in all required fields.");
            return;
        }

        try {
            const authToken = localStorage.getItem("token");

            const formData = new FormData();
            for (const key in form) {
                const value = form[key];
                formData.append(key, value);
            }
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    // "Content-Type": "multipart/form-data",
                },
            };

            if (form.id) {
                formData.append('_method', 'PUT'); 
                await axios.post(`/api/employees/${form.id}`, formData, config);
                toastr.success("Employee updated!");
            } else {
                await axios.post("/api/employees", formData, config);
                toastr.success("Employee added!");
            }
            setForm({
                id: "",
                employee_no: "",
                lastname: "",
                firstname: "",
                middlename: "",
                extname: "",
                contact_no: "",
                email: "",
                position: "",
                salary: "",
                employment_status: "",
                dob: "",
                status: "Active",
                sex: "Male",
                address: "",
                picture: "",
            });
            fetchEmployees();
            setFormModal(false);
        } catch (err) {
            toastr.error("Error saving data");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prevForm => ({
            ...prevForm,
            [name]: value
        }));
    };

    const handleContactChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 4 && value.length <= 7)
            value = `${value.slice(0, 4)}-${value.slice(4)}`;
        else if (value.length > 7)
            value = `${value.slice(0, 4)}-${value.slice(4, 7)}-${value.slice(7, 11)}`;

        setForm(prev => ({ ...prev, contact_no: value }));
    };

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between">
                    <h2 className="text-xl font-semibold">{title} Employee</h2>
                    <button
                        onClick={() => setFormModal(false)}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="col-span-2 flex flex-col items-center justify-center relative">
                            {/* Clickable Label wrapping the Image */}
                            <label htmlFor="picture" className="cursor-pointer relative">
                            <img
                                src={
                                form.picture
                                    ? typeof form.picture === 'string'
                                    ? `${form.picture}`
                                    : URL.createObjectURL(form.picture)
                                    : '/images/user-icon.jpg'
                                }
                                alt="Preview"
                                className="w-24 h-24 rounded-full object-cover shadow-md ring-2 ring-gray-400 bg-gray-100"
                            />
                            </label>

                            {/* Hidden File Input */}
                            <input
                            type="file"
                            id="picture"
                            name="picture"
                            accept="image/*"
                            onChange={(e) => {
                                setForm(prev => ({
                                ...prev,
                                picture: e.target.files[0]
                                }));
                            }}
                            className="hidden"
                            />

                            <span className="mt-3 text-sm text-gray-600">Click image to upload</span>
                        </div>
                        <div>
                            <label htmlFor="employee_no">Employee No</label>
                            <input 
                                type="text"
                                id="employee_no"
                                name="employee_no"
                                value={form.employee_no}
                                onChange={handleChange}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="lastname">Lastname<span className="text-red-600">*</span></label>
                            <input 
                                type="text"
                                id="lastname"
                                name="lastname"
                                value={form.lastname}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.lastname ? "border-red-600" : ""}`}
                            />
                        </div>
                        <div>
                            <label htmlFor="firstname">Firstname<span className="text-red-600">*</span></label>
                            <input 
                                type="text"
                                id="firstname"
                                name="firstname"
                                value={form.firstname}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.firstname ? "border-red-600" : ""}`}
                            />
                        </div>
                        <div>
                            <label htmlFor="middlename">Middlename</label>
                            <input 
                                type="text"
                                id="middlename"
                                name="middlename"
                                value={form.middlename}
                                onChange={handleChange}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="extname">Extension Name</label>
                            <input 
                                type="text"
                                id="extname"
                                name="extname"
                                value={form.extname}
                                onChange={handleChange}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="contact_no">Contact No.</label>
                            <input 
                                type="text"
                                id="contact_no"
                                name="contact_no"
                                value={form.contact_no}
                                onChange={handleContactChange}
                                pattern="^09\d{2}-\d{3}-\d{4}$"
                                maxLength={13}
                                placeholder="09XX-XXX-XXXX"
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="email">Email</label>
                            <input 
                                type="email"
                                id="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="position">Position<span className="text-red-600">*</span></label>
                            <input 
                                type="text"
                                id="position"
                                name="position"
                                value={form.position}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.position ? "border-red-600" : ""}`}
                            />
                        </div>
                        <div>
                            <label htmlFor="salary">Salary per day<span className="text-red-600">*</span></label>
                            <input 
                                type="number"
                                id="salary"
                                name="salary"
                                value={form.salary}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.salary ? "border-red-600" : ""}`}
                            />
                        </div>
                        <div>
                            <label htmlFor="employment_status">Employment Status</label>
                            <input 
                                type="text"
                                id="employment_status"
                                name="employment_status"
                                value={form.employment_status}
                                onChange={handleChange}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="dob">Date of Birth</label>
                            <DatePicker
                                id="dob"
                                name="dob"
                                selected={form.dob} // Date value will be controlled here
                                onChange={(date) => setForm({ ...form, dob: date })} // Handle the date change
                                isClearable
                                placeholderText="Date of Birth"
                                dateFormat="MM/dd/yyyy"
                                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                wrapperClassName="w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="sex">Sex<span className="text-red-600">*</span></label>
                            <select
                                id="sex"
                                name="sex"
                                value={form.sex}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.sex ? "border-red-600" : ""}`}
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="address">Address</label>
                            <input 
                                type="text"
                                id="address"
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>
                        <div>
                            <label htmlFor="status">Status<span className="text-red-600">*</span></label>
                            <select
                                id="status"
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.status ? "border-red-600" : ""}`}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-between mt-2">
                        <button 
                            type="button" 
                            onClick={() => setFormModal(false)}
                            className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg flex items-center gap-1
                                hover:bg-white hover:text-gray-800 hover:border hover:border-gray-800 transition"
                        >
                            <X size={18} />
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-1
                                hover:bg-white hover:text-blue-600 hover:border hover:border-blue-600 transition"
                        >
                            <Save size={18} />
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeForm;