import React, { useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = "https://instagramdownloader-imxi.onrender.com";

  const handlePreview = async () => {
    if (!url) return alert("Please enter an Instagram URL");
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, preview: true }),
      });

      const data = await res.json();
      if (data.media && data.media.length) setMediaList(data.media);
      else alert("No media found");
    } catch (err) {
      alert("Error fetching media: " + err.message);
    }
    setLoading(false);
  };

  const handleDownload = (mediaUrl) => {
    const link = document.createElement("a");
    link.href = mediaUrl;
    link.download = ""; // filename optional
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-6">
      <h1 className="text-3xl font-bold mb-6">Instagram Downloader</h1>

      <div className="w-full max-w-md mb-4">
        <input
          type="text"
          placeholder="Enter Instagram URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-2"
        />
        <button
          onClick={handlePreview}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
          disabled={loading}
        >
          {loading ? "Loading..." : "Preview"}
        </button>
      </div>

      <div className="w-full max-w-md grid grid-cols-1 gap-4 mt-4">
        {mediaList.map((media, idx) => (
          <div key={idx} className="bg-white p-2 rounded shadow-md flex flex-col items-center">
            {media.type === "image" ? (
              <img src={media.url} alt="Instagram" className="max-w-full rounded mb-2" />
            ) : (
              <video src={media.url} controls className="max-w-full rounded mb-2" />
            )}
            <button
              onClick={() => handleDownload(media.url)}
              className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 transition"
            >
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
