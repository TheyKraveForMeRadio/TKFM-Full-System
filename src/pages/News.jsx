import React, { useEffect, useState } from "react";

export default function News() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    fetch("/.netlify/functions/public-get-news")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setNews(data.news);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="page news-page">
      <h1>Latest News</h1>
      {news.length === 0 ? (
        <p>No news yet.</p>
      ) : (
        news.map((item) => (
          <div className="news-item" key={item.id}>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </div>
        ))
      )}
    </div>
  );
}
