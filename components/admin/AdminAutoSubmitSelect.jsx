"use client";

import React, { useState } from "react";

export default function AdminAutoSubmitSelect({ name, defaultValue, options = [], ariaLabel }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <select
      className="admin-status-select"
      name={name}
      value={value}
      aria-label={ariaLabel}
      data-status={String(value || "").toLowerCase()}
      onChange={(event) => {
        setValue(event.currentTarget.value);
        event.currentTarget.form?.requestSubmit();
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
