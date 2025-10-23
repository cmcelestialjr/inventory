import React, { useState, useEffect, useRef } from "react";
import Layout from "./Layout";
import AttendanceLists from "./AttendanceLists";

const Attendances = () => {
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
                {["Lists"].map((tab) => (
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

                {activeTab === "Lists" && <AttendanceLists />}
                
            </div>
        </Layout>
    );
};

export default Attendances;
