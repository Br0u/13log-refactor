import React from "react";
import MarkdownEditorField from "./MarkdownEditorField";
import AdminSubmitButton from "./AdminSubmitButton";
import AdminPublishedAtField from "./AdminPublishedAtField";

export default function AdminPostForm({
  action,
  categories = [],
  initialValue = {},
  formState = null,
  successMessage = "",
  submitLabel = "Save post",
  pendingLabel = "Saving...",
}) {
  return (
    <form action={action} className="admin-post-form admin-form">
      {successMessage ? <p className="admin-form-notice">{successMessage}</p> : null}
      {formState?.error ? <p className="admin-form-notice">{formState.error}</p> : null}
      <label>
        <span>Title</span>
        <input name="title" defaultValue={initialValue.title || ""} required />
      </label>
      <label>
        <span>Slug</span>
        <input name="slug" defaultValue={initialValue.slug || ""} required />
      </label>
      <label>
        <span>Summary</span>
        <textarea name="summary" defaultValue={initialValue.summary || ""} rows={3} />
      </label>
      <MarkdownEditorField
        name="markdown"
        label="Markdown"
        initialValue={initialValue.markdown || ""}
        rows={18}
        required
        mode="post"
      />
      <label>
        <span>Cover Image</span>
        <input name="coverImage" defaultValue={initialValue.coverImage || ""} />
      </label>
      <label>
        <span>Category</span>
        <select name="categoryId" defaultValue={initialValue.categoryId || ""}>
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Tags</span>
        <input
          name="tags"
          defaultValue={Array.isArray(initialValue.tags) ? initialValue.tags.join(", ") : ""}
          placeholder="backend, database"
        />
      </label>
      <label>
        <span>Status</span>
        <select name="status" defaultValue={initialValue.status || "DRAFT"}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </label>
      {initialValue.status === "PUBLISHED" ? (
        <AdminPublishedAtField initialValue={initialValue.publishedAt || ""} />
      ) : (
        <p className="admin-form-hint">Publication time becomes editable after the post is published.</p>
      )}
      <AdminSubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}
