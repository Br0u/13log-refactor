"use client";

import React, { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSubmitButton from "./AdminSubmitButton";

const INITIAL_FORM_STATE = {
  error: "",
};

function noopAction(previousState) {
  return previousState;
}

export default function AdminPhotoForm({
  action,
  categories = [],
  albumId = "",
  albumName = "",
  initialValue = null,
  mode = "create",
  createEndpoint = "",
  formState: controlledFormState = null,
  successMessage = "",
  submitLabel = "Save photo",
  pendingLabel = "Saving...",
}) {
  const router = useRouter();
  const [formState, formAction] = useActionState(action || noopAction, INITIAL_FORM_STATE);
  const [clientError, setClientError] = useState("");
  const [clientSuccess, setClientSuccess] = useState("");
  const [clientPending, setClientPending] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const formRef = useRef(null);
  const currentState = controlledFormState || formState;
  const values = {
    title: initialValue?.title || "",
    caption: initialValue?.caption || "",
    sortOrder: initialValue?.sortOrder ?? "",
    categoryId: initialValue?.categoryId || albumId || "",
  };
  const isEditMode = mode === "edit";
  const useClientCreateFlow = Boolean(createEndpoint) && !isEditMode;

  function setQueueFromFiles(files) {
    setUploadQueue(files.map((file) => ({
      fileName: file.name,
      status: "queued",
      message: "Queued",
    })));
  }

  function updateQueueItem(index, nextState) {
    setUploadQueue((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...nextState } : item
    )));
  }

  async function uploadSingleFile(file, index) {
    updateQueueItem(index, { status: "uploading", message: "Uploading..." });

    if (!String(file.type || "").startsWith("image/")) {
      const result = { ok: false, fileName: file.name, message: "Only image uploads are supported." };
      updateQueueItem(index, { status: "failed", message: result.message });
      return result;
    }

    const uploadFormData = new FormData();
    uploadFormData.set("file", file);

    const uploadResponse = await fetch("/api/admin/uploads/image", {
      method: "POST",
      body: uploadFormData,
    });

    const uploadBody = await uploadResponse.json().catch(() => ({}));
    if (!uploadResponse.ok) {
      const result = {
        ok: false,
        fileName: file.name,
        message: uploadBody?.message || "Image upload failed.",
      };
      updateQueueItem(index, { status: "failed", message: result.message });
      return result;
    }

    const result = {
      ok: true,
      fileName: file.name,
      url: String(uploadBody?.url || ""),
      pathname: String(uploadBody?.pathname || ""),
    };
    updateQueueItem(index, { status: "uploaded", message: "Uploaded" });
    return result;
  }

  async function uploadFilesWithConcurrency(files, concurrency = 3) {
    const results = new Array(files.length);
    let cursor = 0;

    async function worker() {
      while (cursor < files.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await uploadSingleFile(files[index], index);
      }
    }

    const workerCount = Math.min(concurrency, files.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return results;
  }

  async function handleClientCreateSubmit(event) {
    event.preventDefault();

    if (!useClientCreateFlow || clientPending) {
      return;
    }

    const form = event.currentTarget;
    const submission = new FormData(form);
    const fileInput = form.querySelector('input[name="file"]');
    const files = Array.from(fileInput?.files || []).filter((entry) => entry instanceof File && entry.size > 0);

    if (!files.length) {
      setClientError("Only image uploads are supported.");
      return;
    }

    setClientPending(true);
    setClientError("");
    setClientSuccess("");
    setQueueFromFiles(files);

    try {
      const uploadResults = await uploadFilesWithConcurrency(files);
      const uploads = uploadResults
        .filter((result) => result?.ok)
        .map((result) => ({
          url: result.url,
          pathname: result.pathname,
          fileName: result.fileName,
        }));
      const failedUploads = uploadResults
        .filter((result) => result && !result.ok)
        .map((result) => ({ fileName: result.fileName, message: result.message }));

      if (!uploads.length) {
        throw new Error(failedUploads[0]?.message || "Unable to save photo right now.");
      }

      const createResponse = await fetch(createEndpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          categoryId: String(submission.get("categoryId") || ""),
          title: String(submission.get("title") || ""),
          caption: String(submission.get("caption") || ""),
          sortOrder: String(submission.get("sortOrder") || ""),
          uploads,
        }),
      });

      const createBody = await createResponse.json().catch(() => ({}));
      if (!createResponse.ok) {
        throw new Error(createBody?.message || "Unable to save photo right now.");
      }

      const failedCreates = Array.isArray(createBody?.failed) ? createBody.failed : [];
      const allFailures = [...failedUploads, ...failedCreates];
      const createdCount = Number(createBody?.created) || uploads.length;

      form.reset();
      setUploadQueue((current) => current.map((item) => {
        const failure = allFailures.find((entry) => entry.fileName === item.fileName);
        return failure
          ? { ...item, status: "failed", message: failure.message }
          : { ...item, status: "saved", message: "Saved" };
      }));
      setClientSuccess(allFailures.length ? `${createdCount} 张已保存，${allFailures.length} 张失败` : "Photos saved.");
      router.refresh();
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "Unable to save photo right now.");
    } finally {
      setClientPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={useClientCreateFlow ? undefined : formAction}
      onSubmit={useClientCreateFlow ? handleClientCreateSubmit : undefined}
      className="admin-post-form admin-form admin-card"
    >
      <div className="admin-card__header">
        <p className="admin-eyebrow">{isEditMode ? "Manage" : "Upload"}</p>
        <h2>{isEditMode ? "Edit photo" : "Upload photo"}</h2>
        <p className="admin-page-copy">
          {isEditMode
            ? "Adjust metadata and ordering for this photo."
            : "Import an image, add metadata, and place it into the gallery."}
        </p>
      </div>
      {successMessage || clientSuccess ? <p className="admin-form-notice">{successMessage || clientSuccess}</p> : null}
      {currentState?.error || clientError ? <p className="admin-form-notice">{currentState?.error || clientError}</p> : null}
      {uploadQueue.length ? (
        <ul className="admin-upload-queue">
          {uploadQueue.map((item) => (
            <li key={item.fileName} className={`admin-upload-queue__item admin-upload-queue__item--${item.status}`}>
              {`${item.fileName} — ${item.message}`}
            </li>
          ))}
        </ul>
      ) : null}
      {!isEditMode ? (
        <label>
          <span>Image</span>
          <input
            name="file"
            type="file"
            accept="image/*"
            multiple
            required
            onChange={(event) => setQueueFromFiles(Array.from(event.target.files || []))}
          />
          <small className="admin-form-hint">You can choose multiple images at once on mobile or desktop.</small>
        </label>
      ) : null}
      <label>
        <span>Title</span>
        <input name="title" defaultValue={values.title} />
        {!isEditMode ? (
          <small className="admin-form-hint">Leave title empty to reuse each file name during batch upload.</small>
        ) : null}
      </label>
      <label>
        <span>Caption</span>
        <textarea name="caption" rows={3} defaultValue={values.caption} />
      </label>
      {albumId ? (
        <label>
          <span>Album</span>
          <input value={albumName} readOnly />
          <input type="hidden" name="categoryId" value={albumId} />
        </label>
      ) : (
        <label>
          <span>Album</span>
          <select name="categoryId" defaultValue={values.categoryId} required>
            <option value="">Select album</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        <span>Sort Order</span>
        <input name="sortOrder" type="number" defaultValue={values.sortOrder} />
        <small className="admin-form-hint">
          {isEditMode ? "Use a smaller number to move this photo earlier in the album." : "Leave empty to append after existing photos in this album."}
        </small>
      </label>
      {useClientCreateFlow ? (
        <button type="submit" className="admin-primary-button" disabled={clientPending} aria-busy={clientPending}>
          {clientPending ? pendingLabel : submitLabel}
        </button>
      ) : (
        <AdminSubmitButton label={submitLabel} pendingLabel={pendingLabel} />
      )}
    </form>
  );
}
