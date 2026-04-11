"use client";

import React from "react";
import { useEffect, useState } from "react";
import { formatAuditTimestamp } from "../../lib/repositories/access-audit";

export default function AdminLocalTime({ value }) {
  const isoValue = value instanceof Date ? value.toISOString() : String(value || "");
  const [formattedValue, setFormattedValue] = useState(() => formatAuditTimestamp(isoValue, "UTC"));

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setFormattedValue(formatAuditTimestamp(isoValue, timeZone));
  }, [isoValue]);

  return (
    <span
      className="admin-local-time"
      data-iso={isoValue}
      suppressHydrationWarning
      title={isoValue}
    >
      {formattedValue}
    </span>
  );
}
