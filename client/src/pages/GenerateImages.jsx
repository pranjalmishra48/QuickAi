import { Image, Sparkles, Download, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const GenerateImages = () => {
  const imageStyle = [
    'Realistic',
    'Ghibli style',
    'Anime style',
    'Cartoon style',
    'Fantasy style',
    '3D style',
    'Portrait style',
  ];

  const [selectedStyle, setSelectedStyle] = useState('Realistic');
  const [input, setInput] = useState('');
  const [publish, setPublish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');

  const { getToken } = useAuth();

  const generateImage = async (prompt, publishFlag) => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        '/api/ai/generate-image',
        { prompt, publish: publishFlag },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        setContent(data.content);
        setLastPrompt(prompt);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error generating image');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!input.trim()) return toast.error('Please describe your image.');
    const prompt = `Generate an image of ${input.trim()} in the style ${selectedStyle}`;
    generateImage(prompt, publish);
  };

  const handleRegenerate = async () => {
    if (!lastPrompt) return toast.error('No prompt to regenerate.');
    generateImage(lastPrompt, publish);
  };

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col lg:flex-row gap-6 bg-gray-50">
      {/* Left Column */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full lg:w-1/2 p-6 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col gap-4"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-semibold text-gray-800">AI Image Generator</h2>
        </div>

        <label className="mt-4 text-sm font-medium text-gray-700">Describe Your Image</label>
        <textarea
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe what you want to see in the image..."
          className="w-full p-3 text-sm border rounded-lg border-gray-300 focus:ring-2 focus:ring-green-400 focus:outline-none transition"
          required
        />

        <label className="mt-4 text-sm font-medium text-gray-700">Style</label>
        <div className="mt-2 flex gap-3 flex-wrap">
          {imageStyle.map((item) => (
            <span
              key={item}
              onClick={() => setSelectedStyle(item)}
              className={`cursor-pointer px-4 py-1 text-sm rounded-full border transition ${
                selectedStyle === item
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
              }`}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="my-6 flex items-center gap-2">
          <label className="relative cursor-pointer">
            <input
              type="checkbox"
              onChange={(e) => setPublish(e.target.checked)}
              checked={publish}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-green-500 transition" />
            <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5" />
          </label>
          <p className="text-sm">Make this image Public</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center items-center gap-2 bg-gradient-to-r from-green-600 to-green-400 text-white font-medium py-3 rounded-lg transition ${
            loading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'
          }`}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Generating...
            </>
          ) : (
            <>
              <Image className="w-5" /> Generate Image
            </>
          )}
        </button>
      </form>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 p-6 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col min-h-[400px]">
        <div className="flex items-center gap-3 mb-4">
          <Image className="w-5 h-5 text-green-600" />
          <h2 className="text-2xl font-semibold text-gray-800">Generated Image</h2>
        </div>

        {!content ? (
          <div className="flex flex-1 justify-center items-center">
            <div className="flex flex-col items-center gap-5 text-gray-400 text-center text-sm">
              <Image className="w-9 h-9" />
              <p>Enter a description and click "Generate Image" to get started.</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex-1 flex flex-col items-center justify-center gap-4">
            <img
              src={content}
              alt="Generated"
              className="w-full max-h-[400px] rounded-lg border object-contain"
            />

            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateImages;
