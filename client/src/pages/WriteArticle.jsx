import { Edit, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const WriteArticle = () => {
  const articleLength = [
    { length: 800, text: 'Short (500-800 words)' },
    { length: 1200, text: 'Medium (800-1200 words)' },
    { length: 1600, text: 'Long (1200-1600 words)' },
  ];

  const [selectedLength, setSelectedLength] = useState(articleLength[0]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!input.trim()) {
      toast.error('Please enter a topic.');
      return;
    }
    try {
      setLoading(true);

      const prompt = `Write an article about ${input} in ${selectedLength.text}`;

      const { data } = await axios.post(
        '/api/ai/generate-article',
        { prompt, length: selectedLength.length },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        setContent(data.content);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Something went wrong!');
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
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-800">Article Configuration</h2>
        </div>

        <div className="flex flex-col mt-4 gap-2">
          <label className="text-sm font-medium text-gray-700">Article Topic</label>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setContent('');
            }}
            placeholder="The future of Artificial Intelligence is..."
            className="w-full p-3 text-sm border rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
            required
          />
        </div>

        <div className="flex flex-col mt-4 gap-2">
          <label className="text-sm font-medium text-gray-700">Article Length</label>
          <div className="flex gap-3 flex-wrap">
            {articleLength.map((item) => (
              <span
                key={item.text}
                onClick={() => setSelectedLength(item)}
                className={`cursor-pointer px-4 py-2 rounded-full text-sm border transition ${
                  selectedLength.text === item.text
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {item.text}
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium py-3 rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
          ) : (
            <Edit className="w-5 h-5" />
          )}
          Generate Article
        </button>
      </form>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 p-6 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Edit className="w-5 h-5 text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-800">Generated Article</h2>
        </div>

        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <span className="w-6 h-6 border-2 border-t-transparent border-gray-300 rounded-full animate-spin"></span>
          </div>
        ) : !content ? (
          <div className="flex-1 flex flex-col justify-center items-center text-gray-400 text-sm text-center gap-4">
            <Edit className="w-9 h-9" />
            <p>Enter a topic and click "Generate Article" to get started.</p>
          </div>
        ) : (
          <div className="overflow-y-auto text-sm text-gray-700 prose prose-sm max-h-[600px]">
            <Markdown>{content}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default WriteArticle;
