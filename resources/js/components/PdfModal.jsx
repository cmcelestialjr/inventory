import React, { useState } from "react";
import { Document, Page } from "react-pdf";

const PdfModal = ({ pdfUrl, show, handleClose }) => {
  const [numPages, setNumPages] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 ${
        show ? "block" : "hidden"
      }`}
    >
      <div className="bg-white w-full max-w-4xl p-4 rounded-lg shadow-xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2 className="text-xl font-semibold">View PDF</h2>
          <button
            onClick={handleClose}
            className="text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            X
          </button>
        </div>

        {/* Modal Body: Render PDF */}
        <div className="relative overflow-auto max-h-96">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            className="w-full"
          >
            {[...Array(numPages)].map((_, index) => (
              <Page key={index} pageNumber={index + 1} />
            ))}
          </Document>
        </div>

        {/* Modal Footer with Print button */}
        <div className="flex justify-between mt-4">
          <button
            onClick={handleClose}
            className="bg-gray-300 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-400"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfModal;
