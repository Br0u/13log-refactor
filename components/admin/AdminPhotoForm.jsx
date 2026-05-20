"use client";

import React, { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import AdminSubmitButton from "./AdminSubmitButton";
import { buildAdminImagePath, inferImageContentType, isSupportedAdminImageFile } from "../../lib/admin-image-files";

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
    setUploadQueue(files.map((file, index) => ({
      id: `${index}-${file.name}-${file.size}-${file.lastModified || 0}`,
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

    const clientId = `${index}-${file.name}-${file.size}-${file.lastModified || 0}`;
    if (!isSupportedAdminImageFile(file)) {
      const result = { ok: false, clientId, fileName: file.name, message: "Only image uploads are supported." };
      updateQueueItem(index, { status: "failed", message: result.message });
      return result;
    }

    try {
      const contentType = inferImageContentType(file);
      const uploaded = await upload(buildAdminImagePath(file.name || "image"), file, {
        access: "public",
        handleUploadUrl: "/api/admin/uploads/image/client",
        contentType,
        multipart: true,
        onUploadProgress(progress) {
          const percentage = Math.max(0, Math.min(100, Math.round(progress?.percentage || 0)));
          updateQueueItem(index, { status: "uploading", message: `Uploading ${percentage}%` });
        },
      });

      const result = {
        ok: true,
        clientId,
        fileName: file.name,
        url: String(uploaded?.url || ""),
        pathname: String(uploaded?.pathname || ""),
        mimeType: contentType,
        size: file.size || 0,
      };
      updateQueueItem(index, { status: "uploaded", message: "Uploaded" });
      return result;
    } catch (error) {
      const result = {
        ok: false,
        clientId,
        fileName: file.name,
        message: error instanceof Error ? error.message : "Image upload failed.",
      };
      updateQueueItem(index, { status: "failed", message: result.message });
      return result;
    }
  }

  async function uploadFiles(files) {
    const results = new Array(files.length);
    for (let index = 0; index < files.length; index += 1) {
      results[index] = await uploadSingleFile(files[index], index);
    }
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
    const categoryId = String(submission.get("categoryId") || "").trim();

    if (!files.length) {
      setClientError("Choose at least one image.");
      return;
    }

    if (!categoryId) {
      setClientError("Album is required.");
      return;
    }

    setClientPending(true);
    setClientError("");
    setClientSuccess("");
    setQueueFromFiles(files);

    try {
      const uploadResults = await uploadFiles(files);
      const uploads = uploadResults
        .filter((result) => result?.ok)
        .map((result) => ({
          clientId: result.clientId,
          url: result.url,
          pathname: result.pathname,
          fileName: result.fileName,
          mimeType: result.mimeType,
          size: result.size,
        }));
      const failedUploads = uploadResults
        .filter((result) => result && !result.ok)
        .map((result) => ({ clientId: result.clientId, fileName: result.fileName, message: result.message }));

      if (!uploads.length) {
        throw new Error(failedUploads[0]?.message || "Unable to save photo right now.");
      }

      const createResponse = await fetch(createEndpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          categoryId,
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
        const failure = allFailures.find((entry) => (
          entry.clientId ? entry.clientId === item.id : entry.fileName === item.fileName
        ));
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
            <li key={item.id} className={`admin-upload-queue__item admin-upload-queue__item--${item.status}`}>
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
            accept="image/*,.heic,.heif"
            multiple
            required
            onChange={(event) => setQueueFromFiles(Array.from(event.target.files || []))}
          />
          <small className="admin-form-hint">Choose one or many images. Mobile HEIC/HEIF files are accepted.</small>
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
