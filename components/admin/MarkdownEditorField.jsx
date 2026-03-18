"use client";

import React, { useEffect, useId, useRef, useState } from "react";

function findClipboardImageFile(items = []) {
  for (const item of Array.from(items || [])) {
    if (item?.kind === "file" && String(item.type || "").startsWith("image/")) {
      return item.getAsFile?.() || null;
    }
  }

  return null;
}

function insertTextAtSelection(value, text, start, end) {
  return `${value.slice(0, start)}${text}${value.slice(end)}`;
}

function insertTemplateAtCaret(value, text, textarea) {
  let selectionStart = textarea?.selectionStart ?? value.length;
  let selectionEnd = textarea?.selectionEnd ?? value.length;
  if (selectionStart === selectionEnd && value[selectionStart] === "\n" && selectionStart > 0) {
    selectionStart += 1;
    selectionEnd += 1;
  }
  const nextValue = insertTextAtSelection(value, text, selectionStart, selectionEnd);
  const nextCaret = selectionStart + text.length;
  return { nextValue, nextCaret };
}

function readCaption(promptLabel, fallback) {
  const nextValue = globalThis.prompt?.(promptLabel, fallback);
  return String(nextValue || "").trim() || fallback;
}

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [duoPasteMode, setDuoPasteMode] = useState(false);
  const [pendingDuoPasteFiles, setPendingDuoPasteFiles] = useState([]);
  const [pendingDuoUploadFiles, setPendingDuoUploadFiles] = useState([]);
  const fieldId = useId();
  const previewId = `${fieldId}-preview`;
  const imageInputId = `${fieldId}-image-upload`;
  const duoImageInputId = `${fieldId}-duo-image-upload`;
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const duoImageInputRef = useRef(null);
  const characterCount = value.length;

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

  async function uploadImageAndInsert(file) {
    if (!file || uploadingImage) return;
    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? value.length;
    const selectionEnd = textarea?.selectionEnd ?? value.length;

    setUploadError("");
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/admin/uploads/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Image upload failed.");
      }

      const body = await response.json();
      const url = String(body?.url || "");
      if (!url) {
        throw new Error("Image upload failed.");
      }

      const markdown = `![image](${url})`;
      const nextValue = insertTextAtSelection(value, markdown, selectionStart, selectionEnd);
      setValue(nextValue);

      requestAnimationFrame(() => {
        if (!textareaRef.current) return;
        const nextCaret = selectionStart + markdown.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCaret, nextCaret);
      });
    } catch {
      setUploadError("Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function uploadImage(file) {
    const formData = new FormData();
    formData.set("file", file);

    const response = await fetch("/api/admin/uploads/image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Image upload failed.");
    }

    const body = await response.json();
    const url = String(body?.url || "");
    if (!url) {
      throw new Error("Image upload failed.");
    }

    return url;
  }

  async function handlePaste(event) {
    const file = findClipboardImageFile(event.clipboardData?.items);
    if (!file || uploadingImage) return;

    event.preventDefault();

    if (duoPasteMode) {
      const nextFiles = [...pendingDuoPasteFiles, file].slice(0, 2);
      if (nextFiles.length < 2) {
        setPendingDuoPasteFiles(nextFiles);
        return;
      }

      setDuoPasteMode(false);
      setPendingDuoPasteFiles([]);
      await uploadDuoImages(nextFiles);
      return;
    }

    await uploadImageAndInsert(file);
  }

  async function handleImageSelection(event) {
    const file = event.target.files?.[0] || null;
    await uploadImageAndInsert(file);
    if (event.target) {
      event.target.value = "";
    }
  }

  async function handleDuoImageSelection(event) {
    const files = Array.from(event.target.files || []).filter(Boolean).slice(0, 2);
    if (event.target) {
      event.target.value = "";
    }
    if (!files.length || uploadingImage) return;

    const nextFiles = [...pendingDuoUploadFiles, ...files].slice(0, 2);
    if (nextFiles.length < 2) {
      setPendingDuoUploadFiles(nextFiles);
      return;
    }

    setPendingDuoUploadFiles([]);
    setDuoPasteMode(false);
    setPendingDuoPasteFiles([]);
    await uploadDuoImages(nextFiles);
  }

  async function uploadDuoImages(files) {
    const pair = Array.from(files || []).filter(Boolean).slice(0, 2);
    if (pair.length < 2 || uploadingImage) return;

    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? value.length;
    const selectionEnd = textarea?.selectionEnd ?? value.length;

    setUploadError("");
    setUploadingImage(true);

    try {
      const [leftUrl, rightUrl] = await Promise.all([
        uploadImage(pair[0]),
        uploadImage(pair[1]),
      ]);

      const leftAlt = readCaption("Caption for the left image", "左图说明");
      const rightAlt = readCaption("Caption for the right image", "右图说明");
      const shortcode = `{{< duo_images left="${leftUrl}" leftAlt="${leftAlt}" right="${rightUrl}" rightAlt="${rightAlt}" >}}`;
      const nextValue = insertTextAtSelection(value, shortcode, selectionStart, selectionEnd);
      setValue(nextValue);

      requestAnimationFrame(() => {
        if (!textareaRef.current) return;
        const nextCaret = selectionStart + shortcode.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCaret, nextCaret);
      });
    } catch {
      setUploadError("Image upload failed.");
    } finally {
      setDuoPasteMode(false);
      setPendingDuoPasteFiles([]);
      setPendingDuoUploadFiles([]);
      setUploadingImage(false);
    }
  }

  function insertDuoImagesTemplate() {
    const textarea = textareaRef.current;
    const template = '{{< duo_images left="/images/left.jpg" leftAlt="左图说明" right="/images/right.jpg" rightAlt="右图说明" >}}';
    const { nextValue, nextCaret } = insertTemplateAtCaret(value, template, textarea);
    setValue(nextValue);

    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function enableDuoPasteMode() {
    setUploadError("");
    setDuoPasteMode(true);
    setPendingDuoPasteFiles([]);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }

  return (
    <div className="admin-markdown-field">
      <label htmlFor={fieldId}>{label}</label>
      <div className="admin-markdown-field__actions">
        <p className="admin-form-hint">Paste an image to upload and insert it here.</p>
        <label
          htmlFor={imageInputId}
          className="admin-markdown-field__upload-button"
        >
          + Image
        </label>
        <label
          htmlFor={duoImageInputId}
          className="admin-markdown-field__upload-button"
        >
          + Two Images
        </label>
        <button
          type="button"
          className="admin-markdown-field__upload-button"
          onClick={enableDuoPasteMode}
        >
          + Paste Two Images
        </button>
      </div>
      <input
        ref={imageInputRef}
        id={imageInputId}
        type="file"
        accept="image/*"
        aria-label="Upload image"
        className="admin-markdown-field__file-input"
        onChange={handleImageSelection}
      />
      <input
        ref={duoImageInputRef}
        id={duoImageInputId}
        type="file"
        accept="image/*"
        multiple
        aria-label="Upload two images"
        className="admin-markdown-field__file-input"
        onChange={handleDuoImageSelection}
      />
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
        ref={textareaRef}
        id={fieldId}
        name={name}
        value={value}
        rows={rows}
        required={required}
        className={activeTab === "preview" ? "admin-markdown-field__textarea is-hidden" : "admin-markdown-field__textarea"}
        aria-hidden={activeTab === "preview"}
        onChange={(event) => setValue(event.target.value)}
        onPaste={handlePaste}
      />
      {duoPasteMode && !uploadingImage ? (
        <p className="admin-markdown-field__hint">
          {pendingDuoPasteFiles.length === 0 ? "Paste the first image to start the pair." : "Paste the second image to complete the pair."}
        </p>
      ) : null}
      {!duoPasteMode && pendingDuoUploadFiles.length === 1 && !uploadingImage ? (
        <p className="admin-markdown-field__hint">Choose the second image to complete the pair.</p>
      ) : null}
      {mode === "post" ? <p className="admin-markdown-field__count">字数 {characterCount}</p> : null}
      {uploadingImage ? <p className="admin-markdown-field__hint">Uploading image...</p> : null}
      {uploadError ? <p className="admin-markdown-field__error">{uploadError}</p> : null}

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
