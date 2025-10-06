import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Save, X } from "lucide-react";
import toastr from 'toastr';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const EmployeeWageByServiceForm = ({ formModal, setFormModal, form, setForm, fetchEmployees, fetchServiceRates }) => {
    if (!formModal) return null;

    const [title, setTitle] = useState("Edit");
    const [errors, setErrors] = useState({});
    const [services, setServices] = useState([]);
    const [searchService, setSearchService] = useState(null);
    const [showDropdownServices, setShowDropdownServices] = useState(false);

    useEffect(() => {
        if (form.id === "") {
            setTitle("New");
        }else{
            setSearchService(`${form.service?.name} (${form.service?.price})`);
        }

    }, []);    

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!form.service_id) newErrors.service_id = true;
        if (!form.rate_type) newErrors.service_id = true;

        if(form.rate_type==="amount"){
            if (!form.service_amount_rate) newErrors.service_amount_rate = true;
        }else if(form.rate_type==="percentage"){
            if (!form.service_percentage_rate) newErrors.service_percentage_rate = true;
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toastr.error("Please fill in all required fields.");
            return;
        }

        try {
            const authToken = localStorage.getItem("token");

            const formData = {
                id: form.id,
                employee_id: form.employee_id,
                service_id: form.service_id,
                service_amount_rate: form.service_amount_rate,
                service_percentage_rate: form.service_amount_rate,
                rate_type: form.rate_type,
            };

            if (form.rate_type === "amount") {
                formData.service_percentage_rate = 0.0;
            } else if (form.rate_type === "percentage") {
                formData.service_amount_rate = 0.0;
            }
            
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            };

            if (form.id) {
                await axios.put(`/api/employee-services-rate/${form.id}`, formData, config);
                toastr.success("Employee Service Rate updated!");
            } else {
                await axios.post("/api/employee-services-rate", formData, config);
                toastr.success("Employee Service Rate added!");

                setForm({
                    id: "",
                    employee_id: form.employee_id,
                    service_id: "",
                    service_amount_rate: 0.00,
                    service_percentage_rate: 0.00,
                    rate_type: "amount",
                });
            }
            
            fetchEmployees();
            fetchServiceRates();
            setFormModal(false);
        } catch (err) {
            toastr.error("Error saving data"+err);
        }
    };

    const handleServiceSearch = async (e) => {
        const search = e.target.value;
        setSearchService(search);
        if (search.length > 1) {
            try {
                const authToken = localStorage.getItem("token");
                const response = await axios.get("/api/fetch-services", {
                    params: { search: search },
                    headers: { Authorization: `Bearer ${authToken}` },
                });
                setServices(response.data);
                setShowDropdownServices(true);
            } catch (error) {
                // console.error("Error fetching products:", error);
            }
        } else {
            setServices([]);
            setShowDropdownServices(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prevForm => ({
            ...prevForm,
            [name]: value
        }));
    };

    const handleSelectService = (service) => {
        
        setSearchService(`${service.name} (${service.price})`);
        setForm((prev) => ({
            ...prev,
            service_id: service.id,
        }));
        
        setShowDropdownServices(false);
    };

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between">
                    <h2 className="text-xl font-semibold">{title} Employee Service Rate</h2>
                    <button
                        onClick={() => setFormModal(false)}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mt-3 grid grid-cols-1 gap-2">
                        <div>
                            <label htmlFor="service_id">Service<span className="text-red-600">*</span></label>
                            <div className="relative">
                                <input 
                                    type="text"
                                    id="service_id"
                                    placeholder="Search Service"
                                    value={searchService}
                                    onChange={handleServiceSearch}
                                    className="border px-3 py-2 rounded-lg w-full"
                                />
                                {/* Dropdown */}
                                {showDropdownServices && services?.length > 0 && (
                                    <ul className="absolute left-0 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto z-10">
                                        {services.map((service) => (
                                            <li 
                                                key={service.id} 
                                                className="p-2 cursor-pointer hover:bg-gray-200"
                                                onClick={() => handleSelectService(service)}
                                            >
                                                {service.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="rate_type">Type<span className="text-red-600">*</span></label>
                            <select
                                id="rate_type"
                                name="rate_type"
                                value={form.rate_type}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.rate_type ? "border-red-600" : ""}`}
                            >
                                <option value="amount">By Amount</option>
                                <option value="percentage">By Percentage</option>
                            </select>
                        </div>
                        <div className={form.rate_type === "percentage" ? "" : "hidden"}>
                            <label htmlFor="service_percentage_rate">
                                Percentage %<span className="text-red-600">*</span>
                            </label>
                            <input 
                                type="number"
                                id="service_percentage_rate"
                                name="service_percentage_rate"
                                value={form.service_percentage_rate}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.service_percentage_rate ? "border-red-600" : ""}`}
                            />
                        </div>

                        <div className={form.rate_type === "amount" ? "" : "hidden"}>
                            <label htmlFor="service_amount_rate">
                                Rate<span className="text-red-600">*</span>
                            </label>
                            <input
                                type="number"
                                id="service_amount_rate"
                                name="service_amount_rate"
                                value={form.service_amount_rate}
                                onChange={handleChange}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between mt-2">
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

export default EmployeeWageByServiceForm;