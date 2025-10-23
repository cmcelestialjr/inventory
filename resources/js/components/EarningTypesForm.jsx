import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Save, X } from "lucide-react";
import toastr from 'toastr';

const EarningTypesForm = ({ formEtModal, setFormEtModal, formEt, setFormEt, fetchEarningTypes }) => {
    if (!formEtModal) return null;

    const [title, setTitle] = useState("Edit");
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (formEt.id === "") {
            setTitle("New");
        }
    }, []);    

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formEt.name.trim()) newErrors.name = true;
        if (!formEt.type.trim()) newErrors.type = true;

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toastr.error("Please fill in all required fields.");
            return;
        }

        try {
            const authToken = localStorage.getItem("token");

            const formData = {
                id: formEt.id,
                name: formEt.name,
                type: formEt.type,
            };
            
            const config = {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            };

            if (formEt.id) {
                await axios.put(`/api/earning-types/${formEt.id}`, formData, config);
                toastr.success("Earning Type updated!");
            } else {
                await axios.post("/api/earning-types", formData, config);
                toastr.success("Earning Type added!");

                setFormEt({
                    id: "",
                    name: "",
                    type: "",
                });
            }
            
            fetchEarningTypes();
            setFormEtModal(false);
        } catch (err) {
            toastr.error("Error saving data"+err);
        }
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormEt(prevForm => ({
            ...prevForm,
            [name]: value
        }));
    };

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex justify-center items-center z-80">
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto relative">
                <div className="flex justify-between">
                    <h2 className="text-xl font-semibold">{title} Earning Type</h2>
                    <button
                        onClick={() => setFormEtModal(false)}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mt-3 grid grid-cols-1 gap-2">
                        <div>
                            <label htmlFor="name">Name<span className="text-red-600">*</span></label>
                            <div className="relative">
                                <input 
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formEt.name}
                                    onChange={handleChange}
                                    className={`border px-3 py-2 rounded-lg w-full ${errors.name ? "border-red-600" : ""}`}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="type">Type<span className="text-red-600">*</span></label>
                            <select
                                id="type"
                                name="type"
                                value={formEt.type}
                                onChange={handleChange}
                                className={`border px-3 py-2 rounded-lg w-full ${errors.type ? "border-red-600" : ""}`}
                            >
                                <option value="">Please select...</option>
                                <option value="daily">Daily</option>
                                {/* <option value="hourly">Hourly</option> */}
                                <option value="fixed">Fixed</option>
                            </select>
                        </div>                        
                    </div>
                    <div className="flex justify-between mt-2">
                        <button 
                            type="button" 
                            onClick={() => setFormEtModal(false)}
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

export default EarningTypesForm;