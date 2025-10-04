import { FileText, Sparkles } from 'lucide-react';
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const ReviewResume = () => {
  const [input, setInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const dropRef = useRef();

  const { getToken } = useAuth();

  const handleFile = (file) => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    setInput(file);
    setFileName(file.name);
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!input) return toast.error('Please upload a PDF resume');
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('resume', input);

      const { data } = await axios.post('/api/ai/resume-review', formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) setContent(data.content);
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.message || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col lg:flex-row gap-6 bg-gray-50">
      {/* Left Column */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full lg:w-1/2 p-6 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col gap-4"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-teal-500" />
          <h2 className="text-2xl font-semibold text-gray-800">Resume Review</h2>
        </div>

        {/* Drag & Drop Area */}
        <div
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="mt-4 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-teal-400 transition"
          onClick={() => document.getElementById('resumeInput').click()}
        >
          {!fileName ? (
            <p className="text-gray-500 text-center">
              Drag & drop your PDF resume here, or click to select
            </p>
          ) : (
            <p className="text-gray-700 font-medium">{fileName}</p>
          )}
          <input
            type="file"
            id="resumeInput"
            accept="application/pdf"
            onChange={(e) => handleFile(e.target.files[0])}
            className="hidden"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-medium py-3 rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
          ) : (
            <FileText className="w-5 h-5" />
          )}
          Review Resume
        </button>
      </form>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 p-6 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col min-h-[400px]">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-teal-500" />
          <h2 className="text-2xl font-semibold text-gray-800">Analysis Results</h2>
        </div>

        {!content ? (
          <div className="flex flex-1 justify-center items-center">
            <div className="flex flex-col text-sm items-center gap-5 text-gray-400 text-center">
              <FileText className="w-9 h-9" />
              <p>Upload a PDF resume and click "Review Resume" to get started.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto text-sm text-slate-600">
            <div className='reset-tw'>
              <Markdown>{content}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewResume;
