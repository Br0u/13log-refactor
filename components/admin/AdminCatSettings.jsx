"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_SETTINGS } from "../../lib/pixel-cat/contracts";

export default function AdminCatSettings() {
  const [values, setValues] = useState({ ...DEFAULT_SETTINGS, apiKey: "", removeKey: false, hasKey: false });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  async function load() {
    setError("");
    try {
      const response = await fetch("/api/admin/cat", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setValues({ ...data, apiKey: "", removeKey: false }); setReady(true);
    } catch (cause) { setError(cause.message || "无法读取设置，请检查数据库迁移后重试。"); }
  }
  useEffect(() => { void load(); }, []);
  const field = (name, value) => setValues(previous => ({ ...previous, [name]: value }));
  async function submit(operation) {
    if (busy || !ready) return;
    setBusy(true); setNotice(""); setError("");
    try {
      const response = await fetch("/api/admin/cat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values, operation }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNotice(data.message);
      if (operation === "save") setValues({ ...data.settings, apiKey: "", removeKey: false });
    } catch (cause) { setError(cause.message || "操作失败，请稍后重试。"); }
    finally { setBusy(false); }
  }
  return <section className="admin-page">
    <header className="admin-page-header"><div><p className="admin-eyebrow">Companion</p><h1>小猫设置</h1><p className="admin-page-copy">从首页的门里出发，陪读、玩耍，然后回家。</p></div></header>
    <div className="cat-settings-links"><Link href="/playzone/pixel-cat">查看全部动作与连续行为 ↗</Link><Link href="/">去首页试试出入场 ↗</Link></div>
    <form className="admin-post-form admin-card admin-form" onSubmit={event => { event.preventDefault(); void submit("save"); }}>
      <fieldset disabled={!ready || busy} style={{ border: 0, padding: 0, display: "grid", gap: 16 }}>
        <label><span>AI 陪伴</span><select value={String(values.enabled)} onChange={event => field("enabled", event.target.value === "true")}><option value="false">关闭 AI，保留本地动作</option><option value="true">开启 AI 对话和行为</option></select></label>
        <label><span>模型服务地址</span><input type="url" required maxLength={300} value={values.baseUrl} onChange={event => field("baseUrl", event.target.value)} placeholder="https://api.example.com/v1" /></label>
        <p className="admin-form-hint">使用支持 Chat Completions 与 JSON 输出的兼容接口，填写到 /v1 等基础路径。支持公网 HTTP（可自定义端口）和 HTTPS（443 端口）。HTTP 会明文传输密钥和对话。</p>
        <label><span>模型名称</span><input required maxLength={100} value={values.model} onChange={event => field("model", event.target.value)} placeholder="填写服务商提供的模型名称" /></label>
        <label><span>API Key {values.hasKey ? "（已保存 · ••••••••）" : "（可选 · 未配置）"}</span><input type="password" autoComplete="new-password" maxLength={500} value={values.apiKey} onChange={event => field("apiKey", event.target.value)} placeholder={values.hasKey ? "留空保留已保存的密钥" : "接口无需认证时可留空"} /></label>
        <p className="admin-form-hint">未保存密钥时，留空将不发送认证头；已保存密钥时，留空保留原值。如需改为无密钥调用，请选择删除已保存的密钥。</p>
        {values.hasKey && <label><span>已保存的密钥</span><select value={String(values.removeKey)} onChange={event => field("removeKey", event.target.value === "true")}><option value="false">保留，或用上方新密钥替换</option><option value="true">删除，改为无密钥调用</option></select></label>}
        <label><span>小猫的性格</span><textarea required maxLength={800} rows={4} value={values.personality} onChange={event => field("personality", event.target.value)} /></label>
        <label><span>主动说话间隔</span><select value={values.proactiveSeconds} onChange={event => field("proactiveSeconds", Number(event.target.value))}><option value={0}>只在用户提问时说话</option><option value={60}>至少 1 分钟</option><option value={120}>至少 2 分钟</option><option value={300}>至少 5 分钟</option><option value={600}>至少 10 分钟</option></select></label>
        <label><span>全站每日 AI 调用上限（UTC 日界线）</span><input type="number" required min={1} max={10000} value={values.dailyLimit} onChange={event => field("dailyLimit", Number(event.target.value))} /></label>
        <p className="admin-form-hint">每位访客额外限制每分钟 6 次、每天 40 次。失败调用也计数；连接测试独立于访客额度。密钥加密保存，访客无法读取。</p>
        <div className="cat-gallery-toolbar"><button className="admin-primary-button" type="submit">保存设置</button><button className="admin-primary-button" type="button" onClick={event => { if (event.currentTarget.form.reportValidity()) void submit("test"); }}>测试连接，不保存</button></div>
      </fieldset>
      {busy && <p role="status">正在处理…</p>}
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert" className="admin-form__error">{error}</p>}
      {!ready && <button className="admin-primary-button" type="button" onClick={load}>重新读取设置</button>}
    </form>
  </section>;
}
