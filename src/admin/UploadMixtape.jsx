import React, { useState } from "react";

export default function UploadMixtape() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    setStatus("Uploading...");

    const token = localStorage.getItem("adminToken");
    if (!token) {
      setStatus("ERROR: Not authenticated.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("mixtape", file);

    try {
      const res = await fetch("/.netlify/functions/upload-mixtape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setStatus("✔ Mixtape uploaded successfully!");
      } else {
        setStatus("Upload failed.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Server error.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload Mixtape</h2>

      <form onSubmit={handleUpload}>
        <input
          type="text"
          placeholder="Mixtape Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ display: "block", marginBottom: "10px", padding: "8px" }}
        />

        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files[0])}
          required
          style={{ display: "block", marginBottom: "10px" }}
        />

        <button type="submit">Upload</button>
      </form>

      {status && <p style={{ marginTop: "10px" }}>{status}</p>}
    </div>
  );
}
