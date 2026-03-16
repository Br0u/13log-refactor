"use client";

import React, { useState } from "react";

export default function AboutGuestbook() {
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setSubmitted(false);

    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ nickname, content }),
      });

      if (!response.ok) {
        return;
      }

      setNickname("");
      setContent("");
      setSubmitted(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="about-guestbook" aria-label="Guestbook">
      <div className="about-guestbook__header">
        <p className="about-guestbook__copy">
          可留一言，藏于此间，仅君与我知。
          <br />
          若愿有复，请署一信函之所。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="about-guestbook__form">
        <label>
          <span>昵称 / 邮箱</span>
          <input
            name="nickname"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            required
          />
        </label>
        <label>
          <span>内容</span>
          <textarea
            name="content"
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={pending}>提交</button>
        {submitted ? <p className="about-guestbook__hint">已收到，仅你我可见。</p> : null}
      </form>
    </section>
  );
}
