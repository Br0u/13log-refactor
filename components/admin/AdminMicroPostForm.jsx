import React from "react";

export default function AdminMicroPostForm({
  action,
  initialValue = {},
}) {
  return (
    <form action={action} className="admin-post-form admin-form">
      <label>
        <span>Content</span>
        <textarea name="content" defaultValue={initialValue.content || ""} rows={8} required />
      </label>
      <label>
        <span>Tags</span>
        <input
          name="tags"
          defaultValue={Array.isArray(initialValue.tags) ? initialValue.tags.join(", ") : ""}
          placeholder="mood, notes"
        />
      </label>
      <label>
        <span>Status</span>
        <select name="status" defaultValue={initialValue.status || "DRAFT"}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </label>
      <button type="submit" className="admin-primary-button">Save micro post</button>
    </form>
  );
}
