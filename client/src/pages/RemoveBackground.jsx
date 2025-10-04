import { Eraser, Sparkles, Download } from 'lucide-react';
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const RemoveBackground = () => {
  const [input, setInput] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const { getToken } = useAuth();

  const onFileChange = (e) => {
    const file = e.target.files[0];
    setInput(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!input) {
      toast.error('Please upload an image.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', input);

      const { data } = await axios.post('/api/ai/remove-image-background', formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setContent(data.content);
      } else {
        toast.error(data.message);
      }
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
          <Sparkles className="w-6 h-6 text-red-500" />
          <h2 className="text-2xl font-semibold text-gray-800">Background Remover</h2>
        </div>

        <div
          className="flex flex-col mt-4 gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 transition cursor-pointer"
          onClick={() => document.getElementById('imageUpload').click()}
        >
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
          {!preview ? (
            <p className="text-gray-500 text-center">Click or drag & drop to upload an image</p>
          ) : (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-contain rounded-md"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-red-500 text-white font-medium py-3 rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
          ) : (
            <Eraser className="w-5 h-5" />
          )}
          Remove Background
        </button>
      </form>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 p-6 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col min-h-[400px]">
        <div className="flex items-center gap-3 mb-4">
          <Eraser className="w-5 h-5 text-red-500" />
          <h2 className="text-2xl font-semibold text-gray-800">Processed Image</h2>
        </div>

        {!content ? (
          <div className="flex flex-1 justify-center items-center">
            <div className="flex flex-col text-sm items-center gap-5 text-gray-400 text-center">
              <Eraser className="w-9 h-9" />
              <p>Upload an image and click "Remove Background" to get started.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto flex flex-col items-center gap-4">
            <img
              src={content}
              alt="Processed"
              className="w-full max-h-[600px] rounded-lg object-contain shadow-sm"
            />
            <a
              href={content}
              download="processed-image.png"
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition"
            >
              <Download className="w-4 h-4" /> Download Image
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemoveBackground;
