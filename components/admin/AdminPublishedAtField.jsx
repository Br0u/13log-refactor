"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { formatDateTimeLocal, normalizePublishedAt } from "./publication-utils";

const NONEXISTENT_LOCAL_TIME_MESSAGE = "This local time does not exist in your timezone.";

export default function AdminPublishedAtField({ initialValue = "" }) {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const inputRef = useRef(null);
  const initialUtc = normalizePublishedAt(initialValue);
  const [localValue, setLocalValue] = useState("");
  const [utcValue, setUtcValue] = useState(initialUtc);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    setLocalValue(formatDateTimeLocal(initialUtc));
    setUtcValue(initialUtc);
    setValidationError("");
    inputRef.current?.setCustomValidity("");
  }, [initialUtc]);

  function handleChange(event) {
    const nextLocalValue = event.target.value;
    setLocalValue(nextLocalValue);

    if (!nextLocalValue) {
      setUtcValue("");
      setValidationError("");
      event.currentTarget.setCustomValidity("");
      return;
    }

    const parsed = new Date(nextLocalValue);
    const isExactLocalTime =
      !Number.isNaN(parsed.getTime()) && formatDateTimeLocal(parsed) === nextLocalValue;
    const nextError = isExactLocalTime ? "" : NONEXISTENT_LOCAL_TIME_MESSAGE;
    setUtcValue(isExactLocalTime ? parsed.toISOString() : "");
    setValidationError(nextError);
    event.currentTarget.setCustomValidity(nextError);
  }

  return (
    <label htmlFor={inputId}>
      <span>Published At</span>
      <input
        ref={inputRef}
        id={inputId}
        aria-describedby={validationError ? `${hintId} ${errorId}` : hintId}
        aria-invalid={validationError ? "true" : undefined}
        type="datetime-local"
        value={localValue}
        onChange={handleChange}
        step="60"
      />
      <input type="hidden" name="publishedAt" value={utcValue} readOnly />
      <small id={hintId} className="admin-form-hint">Edit using your local time.</small>
      {validationError ? (
        <small id={errorId} role="alert" className="admin-markdown-field__error">
          {validationError}
        </small>
      ) : null}
    </label>
  );
}
