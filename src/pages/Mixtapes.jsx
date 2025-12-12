import React, { useEffect, useState } from "react";

export default function Mixtapes() {
  const [mixtapes, setMixtapes] = useState([]);

  useEffect(() => {
    fetch("/.netlify/functions/public-get-mixtapes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMixtapes(data.mixtapes);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="page mixtapes-page">
      <h1>Mixtapes</h1>
      {mixtapes.length === 0 ? (
        <p>No mixtapes uploaded yet.</p>
      ) : (
        mixtapes.map((m) => (
          <div className="mixtape-item" key={m.id}>
            <h2>{m.title}</h2>
            <p>Artist: {m.artist}</p>
            <a href={m.file_url} target="_blank" rel="noreferrer">
              Listen / Download
            </a>
          </div>
        ))
      )}
    </div>
  );
}
