"use client";

import React, { useActionState } from "react";
import { createPostAction } from "../../app/admin/actions";
import AdminPostForm from "./AdminPostForm";

const INITIAL_FORM_STATE = {
  error: "",
};

export default function AdminPostCreateForm({ categories = [] }) {
  const [formState, formAction] = useActionState(createPostAction, INITIAL_FORM_STATE);

  return (
    <AdminPostForm
      action={formAction}
      categories={categories}
      formState={formState}
    />
  );
}
