"use client";

import React, { useEffect, useId, useState } from "react";

export default function MarkdownEditorField({
  name,
  label,
  initialValue = "",
  rows = 12,
  required = false,
  mode = "post",
}) {
  const [value, setValue] = useState(initialValue || "");
  const [activeTab, setActiveTab] = useState("edit");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const fieldId = useId();
  const previewId = `${fieldId}-preview`;

  useEffect(() => {
    if (activeTab !== "preview") return undefined;

    if (!value.trim()) {
      setPreviewHtml("");
      setPreviewError("");
      setLoadingPreview(false);
      return undefined;
    }

    const controller = new AbortController();

    async function loadPreview() {
      setLoadingPreview(true);
      setPreviewError("");

      try {
        const response = await fetch("/api/admin/markdown-preview", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ value, mode }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Preview failed");
        }

        const body = await response.json();
        setPreviewHtml(body.html || "");
      } catch (error) {
        if (error?.name === "AbortError") return;
        setPreviewError("Preview unavailable right now.");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPreview(false);
        }
      }
    }

    loadPreview();
    return () => controller.abort();
  }, [activeTab, mode, value]);

  return (
    <div className="admin-markdown-field">
      <label htmlFor={fieldId}>{label}</label>
      <div className="admin-markdown-field__toolbar" role="tablist" aria-label={`${label} mode`}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "edit"}
          className={`admin-markdown-field__tab ${activeTab === "edit" ? "is-active" : ""}`}
          onClick={() => setActiveTab("edit")}
        >
          Edit
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "preview"}
          aria-controls={previewId}
          className={`admin-markdown-field__tab ${activeTab === "preview" ? "is-active" : ""}`}
          onClick={() => setActiveTab("preview")}
        >
          Preview
        </button>
      </div>

      <textarea
        id={fieldId}
        name={name}
        value={value}
        rows={rows}
        required={required}
        className={activeTab === "preview" ? "admin-markdown-field__textarea is-hidden" : "admin-markdown-field__textarea"}
        aria-hidden={activeTab === "preview"}
        onChange={(event) => setValue(event.target.value)}
      />

      <div
        id={previewId}
        className={activeTab === "preview" ? "admin-markdown-field__preview" : "admin-markdown-field__preview is-hidden"}
        hidden={activeTab !== "preview"}
      >
        {loadingPreview ? <p className="admin-markdown-field__hint">Rendering preview...</p> : null}
        {!loadingPreview && previewError ? <p className="admin-markdown-field__error">{previewError}</p> : null}
        {!loadingPreview && !previewError && !value.trim() ? (
          <p className="admin-markdown-field__hint">Nothing to preview yet.</p>
        ) : null}
        {!loadingPreview && !previewError && value.trim() ? (
          <div
            data-testid={`${name}-preview-content`}
            className="post-content admin-markdown-field__preview-content"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        ) : null}
      </div>
    </div>
  );
}
