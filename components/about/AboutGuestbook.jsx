"use client";

import React, { useState } from "react";
import { LoaderCircle } from "lucide-react";

export default function AboutGuestbook() {
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setSubmitted(false);
    setError("");

    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ nickname, content }),
      });

      if (!response.ok) throw new Error("Request failed");

      setNickname("");
      setContent("");
      setSubmitted(true);
    } catch {
      setError("未能寄出，内容已保留，请稍后重试。");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="about-guestbook" aria-label="留一言">
      <div className="about-guestbook__header">
        <p className="about-guestbook__copy">
          留一言，见字如面。
          <br />
          若盼回信，请留下邮箱。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="about-guestbook__form">
        <label>
          <span>昵称 / 邮箱</span>
          <input
            name="nickname"
            autoComplete="nickname"
            maxLength={40}
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
            maxLength={1000}
            aria-describedby="about-message-limit"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
          />
        </label>
        <span id="about-message-limit" className="about-guestbook__limit">最多 1000 字</span>
        <button type="submit" disabled={pending} aria-busy={pending}>
          寄出<LoaderCircle className="about-guestbook__spinner" size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <p className="about-guestbook__hint" role="status" data-error={error ? true : undefined}>
          {pending ? "正在寄出…" : error || (submitted ? "信已寄出，谢谢你的留言。" : "")}
        </p>
      </form>
    </section>
  );
}
