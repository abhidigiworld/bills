import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

function BulkUpload() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('success'); // 'success' or 'fail'

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
    if (files.length === 0) {
      setError('Please drop PDF files only.');
      return;
    }
    
    setSelectedFiles(prev => {
      const existing = new Set(prev.map(f => `${f.name}-${f.size}`));
      const newFiles = files.filter(f => !existing.has(`${f.name}-${f.size}`));
      if (newFiles.length < files.length) {
        setError('Duplicate files in selection were skipped.');
      } else {
        setError('');
      }
      return [...prev, ...newFiles];
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
    if (files.length === 0) {
      setError('Please select PDF files only.');
      return;
    }

    setSelectedFiles(prev => {
      const existing = new Set(prev.map(f => `${f.name}-${f.size}`));
      const newFiles = files.filter(f => !existing.has(`${f.name}-${f.size}`));
      if (newFiles.length < files.length) {
        setError('Duplicate files in selection were skipped.');
      } else {
        setError('');
      }
      return [...prev, ...newFiles];
    });
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one PDF invoice file.');
      return;
    }

    setLoading(true);
    setProgress(0);
    setError('');
    setResults(null);

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/api/invoices/bulk-upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        }
      });

      setResults(response.data);
      setSelectedFiles([]); // clear files
    } catch (err) {
      console.error('Error uploading invoices:', err);
      setError(err.response?.data?.error || 'Failed to upload and parse invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {error && (
        <div className="max-w-md mx-auto mb-6 bg-red-100 dark:bg-red-950/40 border border-red-400 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-center text-sm font-medium">
          {error}
        </div>
      )}

      {/* Upload Box */}
      {!loading && !results && (
        <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-6 sm:p-8 transition-colors duration-300">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition duration-300 ${
              isDragging 
                ? 'border-indigo-600 bg-indigo-50/50 dark:border-violet-500 dark:bg-violet-950/10' 
                : 'border-slate-300 dark:border-[#3e3857] hover:bg-slate-50 dark:hover:bg-[#201d2c]/50'
            }`}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input 
              type="file" 
              id="file-input" 
              multiple 
              accept="application/pdf" 
              onChange={handleFileSelect} 
              className="hidden" 
            />
            <svg className="w-12 h-12 text-slate-400 dark:text-[#504970] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-bold text-slate-700 dark:text-gray-200 text-center">
              Drag & drop your PDF invoices here, or <span className="text-indigo-600 dark:text-violet-400">browse</span>
            </p>
            <p className="text-xs text-slate-400 dark:text-[#6f6797] mt-2">Only PDF files are supported</p>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="mt-6 border-t border-slate-100 dark:border-[#262235] pt-4">
              <h4 className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Selected Files ({selectedFiles.length})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-[#201d2c] p-2.5 rounded-lg border border-slate-200/50 dark:border-[#37314e]/60">
                    <div className="flex items-center gap-2 text-xs truncate mr-4">
                      <svg className="w-4 h-4 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                      <span className="font-semibold text-slate-700 dark:text-gray-200 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpload}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-3 rounded-lg shadow transition duration-200 text-sm"
              >
                Upload & Process Invoices
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading Screen */}
      {loading && (
        <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-8 text-center transition-colors duration-300">
          <div className="text-lg font-bold text-indigo-600 dark:text-violet-400 mb-4 animate-pulse">
            Parsing PDF Invoices...
          </div>
          <div className="w-full bg-slate-100 dark:bg-[#201d2c] rounded-full h-2.5 max-w-md mx-auto overflow-hidden">
            <div 
              className="bg-indigo-600 dark:bg-violet-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 dark:text-[#6f6797] mt-2 font-semibold">{progress}% uploaded</p>
        </div>
      )}

      {/* Results Summary */}
      {results && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] p-5 rounded-xl text-center shadow-md">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Total Files</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">{results.totalUploaded}</span>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 p-5 rounded-xl text-center shadow-md">
              <span className="block text-xs font-bold text-green-600/80 dark:text-green-400 uppercase tracking-wide">Imported</span>
              <span className="text-2xl font-black text-green-600 dark:text-green-400 mt-1 block">{results.successCount}</span>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-5 rounded-xl text-center shadow-md">
              <span className="block text-xs font-bold text-red-600/80 dark:text-red-400 uppercase tracking-wide">Failed</span>
              <span className="text-2xl font-black text-red-600 dark:text-red-400 mt-1 block">{results.failedCount}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-[#181622] border border-slate-200 dark:border-[#262235] shadow-xl rounded-xl p-6 transition-colors duration-300">
            <div className="flex gap-4 border-b border-slate-100 dark:border-[#262235] pb-3 mb-4">
              <button
                onClick={() => setActiveTab('success')}
                className={`pb-1 text-sm font-bold transition focus:outline-none ${
                  activeTab === 'success' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-violet-400 dark:border-violet-400' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Successfully Imported ({results.successCount})
              </button>
              <button
                onClick={() => setActiveTab('fail')}
                className={`pb-1 text-sm font-bold transition focus:outline-none ${
                  activeTab === 'fail' 
                    ? 'text-red-600 border-b-2 border-red-600 dark:text-red-400 dark:border-red-400' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Failed Uploads ({results.failedCount})
              </button>
            </div>

            {activeTab === 'success' ? (
              <div className="overflow-x-auto">
                {results.results.length > 0 ? (
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5">File Name</th>
                        <th className="py-2.5 text-center">Invoice No</th>
                        <th className="py-2.5">Company Name</th>
                        <th className="py-2.5 text-right">Grand Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.results.map((res, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-[#262235] hover:bg-slate-50 dark:hover:bg-[#201d2c]/50">
                          <td className="py-3 font-medium text-slate-500">{res.file}</td>
                          <td className="py-3 text-center font-bold text-indigo-600 dark:text-violet-400">{res.invoiceNo}</td>
                          <td className="py-3 font-semibold text-slate-800 dark:text-white">{res.companyName}</td>
                          <td className="py-3 text-right font-bold text-slate-900 dark:text-white">₹{parseFloat(res.grandTotal).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-6 text-slate-400 font-semibold">No invoices were successfully imported.</div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {results.errors.length > 0 ? (
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-[#262235] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5">File Name</th>
                        <th className="py-2.5 text-red-500">Error Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.errors.map((err, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-[#262235]">
                          <td className="py-3 font-medium text-slate-500">{err.file}</td>
                          <td className="py-3 text-red-600 dark:text-red-400 font-semibold">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-6 text-slate-400 font-semibold">No file upload failures.</div>
                )}
              </div>
            )}
          </div>

          {/* Upload More Button */}
          <div className="text-center">
            <button
              onClick={() => setResults(null)}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-violet-600 dark:hover:bg-violet-700 text-white font-bold py-2.5 px-6 rounded-lg shadow transition duration-200 text-sm"
            >
              Upload More Invoices
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkUpload;
