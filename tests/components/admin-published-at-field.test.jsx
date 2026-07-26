// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminPublishedAtField from "../../components/admin/AdminPublishedAtField";

afterEach(() => {
  cleanup();
});

describe("AdminPublishedAtField", () => {
  it("canonicalizes an explicit-offset initial value", () => {
    render(<AdminPublishedAtField initialValue="2026-03-16T05:30:00-04:00" />);

    expect(document.querySelector('input[type="hidden"][name="publishedAt"]').value)
      .toBe("2026-03-16T09:30:00.000Z");
  });

  it("submits visible local edits as canonical UTC without naming the visible field", () => {
    render(<AdminPublishedAtField initialValue="2026-03-16T09:30:00.000Z" />);

    const visible = screen.getByLabelText(/Published At/);
    const hidden = document.querySelector('input[type="hidden"][name="publishedAt"]');
    expect(visible.getAttribute("name")).toBeNull();
    expect(visible.getAttribute("aria-describedby")).toBeTruthy();
    expect(document.getElementById(visible.getAttribute("aria-describedby")).textContent)
      .toBe("Edit using your local time.");

    fireEvent.change(visible, { target: { value: "2026-06-17T14:45" } });

    expect(hidden.value).toBe(new Date(2026, 5, 17, 14, 45).toISOString());
    expect(new Date(hidden.value).getTime()).toBe(new Date(2026, 5, 17, 14, 45).getTime());
  });

  it("syncs visible and hidden values only when the normalized initial value changes", () => {
    const { rerender } = render(
      <AdminPublishedAtField initialValue="2026-03-16T09:30:00.000Z" />
    );
    const visible = screen.getByLabelText(/Published At/);
    const hidden = document.querySelector('input[type="hidden"][name="publishedAt"]');

    fireEvent.change(visible, { target: { value: "2026-06-17T14:45" } });
    const editedUtc = new Date(2026, 5, 17, 14, 45).toISOString();
    expect(hidden.value).toBe(editedUtc);

    rerender(<AdminPublishedAtField initialValue="2026-03-16T05:30:00-04:00" />);
    expect(visible.value).toBe("2026-06-17T14:45");
    expect(hidden.value).toBe(editedUtc);

    rerender(<AdminPublishedAtField initialValue="2026-04-01T12:00:00.000Z" />);
    const replacement = new Date("2026-04-01T12:00:00.000Z");
    const pad = (part) => String(part).padStart(2, "0");
    expect(visible.value).toBe(
      `${replacement.getFullYear()}-${pad(replacement.getMonth() + 1)}-${pad(replacement.getDate())}`
      + `T${pad(replacement.getHours())}:${pad(replacement.getMinutes())}`
    );
    expect(hidden.value).toBe("2026-04-01T12:00:00.000Z");

    rerender(<AdminPublishedAtField initialValue="" />);
    expect(visible.value).toBe("");
    expect(hidden.value).toBe("");
  });

  it("rejects nonexistent DST wall times but accepts an ambiguous fall-back time", () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = "America/New_York";

    try {
      const submit = vi.fn((event) => event.preventDefault());
      const field = (initialValue = "") => (
        <form aria-label="Publication form" onSubmit={submit}>
          <AdminPublishedAtField initialValue={initialValue} />
        </form>
      );
      const { rerender } = render(field());
      const visible = screen.getByLabelText(/Published At/);
      const hidden = document.querySelector('input[type="hidden"][name="publishedAt"]');
      const form = screen.getByRole("form", { name: "Publication form" });

      fireEvent.change(visible, { target: { value: "2026-03-08T02:30" } });
      expect(hidden.value).toBe("");
      expect(visible.checkValidity()).toBe(false);
      expect(form.checkValidity()).toBe(false);
      expect(visible.validationMessage).toBe("This local time does not exist in your timezone.");
      expect(visible.getAttribute("aria-invalid")).toBe("true");
      expect(screen.getByRole("alert").textContent)
        .toBe("This local time does not exist in your timezone.");
      form.requestSubmit();
      expect(submit).not.toHaveBeenCalled();

      rerender(field("2026-03-16T09:30:00.000Z"));
      expect(visible.checkValidity()).toBe(true);
      expect(form.checkValidity()).toBe(true);
      expect(visible.validationMessage).toBe("");
      expect(visible.getAttribute("aria-invalid")).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
      form.requestSubmit();
      expect(submit).toHaveBeenCalledTimes(1);

      fireEvent.change(visible, { target: { value: "2026-03-08T02:30" } });
      expect(visible.checkValidity()).toBe(false);

      fireEvent.change(visible, { target: { value: "2026-11-01T01:30" } });
      expect(hidden.value).toBe("2026-11-01T05:30:00.000Z");
      expect(visible.checkValidity()).toBe(true);
      expect(form.checkValidity()).toBe(true);
      expect(visible.validationMessage).toBe("");
      expect(visible.getAttribute("aria-invalid")).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();

      fireEvent.change(visible, { target: { value: "" } });
      expect(hidden.value).toBe("");
      expect(visible.checkValidity()).toBe(true);
      expect(form.checkValidity()).toBe(true);
      expect(visible.getAttribute("aria-invalid")).toBeNull();
    } finally {
      if (previousTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = previousTimezone;
      }
    }
  });

  it("clears the submitted UTC value for empty or invalid local input without throwing", () => {
    render(<AdminPublishedAtField initialValue="2026-03-16T09:30:00.000Z" />);

    const visible = screen.getByLabelText(/Published At/);
    const hidden = document.querySelector('input[type="hidden"][name="publishedAt"]');

    expect(() => fireEvent.change(visible, { target: { value: "" } })).not.toThrow();
    expect(hidden.value).toBe("");
    expect(() => fireEvent.change(visible, { target: { value: "not-a-date" } })).not.toThrow();
    expect(hidden.value).toBe("");
  });
});
