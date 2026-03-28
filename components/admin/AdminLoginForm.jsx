"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setPending(false);

    if (!response.ok) {
      setError("用户名或密码错误");
      return;
    }

    router.push("/admin");
  }

  return (
    <form onSubmit={handleSubmit} className="admin-login-form admin-form">
      <label>
        <span>Username:</span>
        <input value={username} onChange={(event) => setUsername(event.target.value)} name="username" />
      </label>
      <label>
        <span>Password:</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          name="password"
        />
      </label>
      {error ? <p className="admin-form__error">{error}</p> : null}
      <button type="submit" disabled={pending} className="admin-primary-button">
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
