import { Scissors, Sparkles, Download } from 'lucide-react';
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const RemoveObject = () => {
  const [input, setInput] = useState(null);
  const [object, setObject] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(null);

  const { getToken } = useAuth();
  const dropRef = useRef();

  const handleFiles = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    setInput(file);
    setPreview(URL.createObjectURL(file));
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!object.trim()) return toast.error('Please enter the object name');
    if (object.trim().split(' ').length > 1) return toast.error('Please enter only one object name');
    if (!input) return toast.error('Please upload an image');

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', input);
      formData.append('object', object);

      const { data } = await axios.post('/api/ai/remove-image-object', formData, {
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
          <Sparkles className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-semibold text-gray-800">Object Remover</h2>
        </div>

        {/* Drag & Drop Area */}
        <div
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="mt-4 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 transition"
          onClick={() => document.getElementById('fileInput').click()}
        >
          {!preview ? (
            <p className="text-gray-500 text-center">
              Drag & drop an image here, or click to select
            </p>
          ) : (
            <img src={preview} alt="Preview" className="w-full h-48 object-contain rounded-md" />
          )}
          <input
            type="file"
            id="fileInput"
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files[0])}
            className="hidden"
          />
        </div>

        {/* Object Name */}
        <label className="mt-4 text-sm font-medium text-gray-700">
          Object Name to Remove (single object only)
        </label>
        <textarea
          value={object}
          onChange={(e) => setObject(e.target.value)}
          rows={3}
          placeholder="e.g., watch or spoon"
          className="w-full p-3 text-sm border rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          required
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium py-3 rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
          ) : (
            <Scissors className="w-5 h-5" />
          )}
          Remove Object
        </button>
      </form>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 p-6 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col min-h-[400px]">
        <div className="flex items-center gap-3 mb-4">
          <Scissors className="w-5 h-5 text-blue-500" />
          <h2 className="text-2xl font-semibold text-gray-800">Processed Image</h2>
        </div>

        {!content ? (
          <div className="flex flex-1 justify-center items-center">
            <div className="flex flex-col text-sm items-center gap-5 text-gray-400 text-center">
              <Scissors className="w-9 h-9" />
              <p>Upload an image and describe what to remove</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center gap-4">
            <img
              src={content}
              alt="Processed"
              className="w-full max-h-[500px] object-contain rounded-lg shadow-sm"
            />
            <a
              href={content}
              download="processed-object.png"
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition"
            >
              <Download className="w-4 h-4" /> Download Image
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemoveObject;
