// @vitest-environment jsdom
import React, { act } from "react";
import { fireEvent } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import AdminMicroPostForm from "../../components/admin/AdminMicroPostForm";

vi.mock("../../components/admin/AdminSubmitButton", () => ({
  default: ({ label }) => <button type="submit">{label}</button>,
}));

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("admin micro post form", () => {
  it.each([
    ["ISO string", "2026-03-16T09:30:00.000Z"],
    ["Date", new Date("2026-03-16T09:30:00.000Z")],
  ])("round-trips a published micro-post timestamp from SSR through hydration for a %s", async (_kind, publishedAt) => {
    const element = (
      <AdminMicroPostForm
        initialValue={{
          content: "A note",
          status: "PUBLISHED",
          publishedAt,
          tags: [],
        }}
      />
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const container = document.createElement("div");
    container.innerHTML = renderToString(element);
    document.body.append(container);

    const visibleBeforeHydration = container.querySelector('input[type="datetime-local"]');
    const hiddenBeforeHydration = container.querySelector('input[type="hidden"][name="publishedAt"]');
    expect(visibleBeforeHydration?.getAttribute("name")).toBeNull();
    expect(visibleBeforeHydration?.value).toBe("");
    expect(hiddenBeforeHydration?.value).toBe("2026-03-16T09:30:00.000Z");

    let root;
    await act(async () => {
      root = hydrateRoot(container, element);
    });

    const expectedLocal = new Date("2026-03-16T09:30:00.000Z");
    const pad = (part) => String(part).padStart(2, "0");
    const visibleAfterHydration = container.querySelector('input[type="datetime-local"]');
    expect(visibleAfterHydration.value).toBe(
      `${expectedLocal.getFullYear()}-${pad(expectedLocal.getMonth() + 1)}-${pad(expectedLocal.getDate())}`
      + `T${pad(expectedLocal.getHours())}:${pad(expectedLocal.getMinutes())}`
    );

    await act(async () => {
      fireEvent.change(visibleAfterHydration, { target: { value: "2026-06-17T14:45" } });
    });
    const submittedUtc = container.querySelector('input[type="hidden"][name="publishedAt"]').value;
    expect(submittedUtc.endsWith("Z")).toBe(true);
    expect(new Date(submittedUtc).getTime()).toBe(new Date(2026, 5, 17, 14, 45).getTime());

    expect(() => {
      fireEvent.change(visibleAfterHydration, { target: { value: "" } });
    }).not.toThrow();
    expect(container.querySelector('input[type="hidden"][name="publishedAt"]').value).toBe("");

    expect(() => {
      fireEvent.change(visibleAfterHydration, { target: { value: "not-a-date" } });
    }).not.toThrow();
    expect(container.querySelector('input[type="hidden"][name="publishedAt"]').value).toBe("");
    expect(consoleError).not.toHaveBeenCalled();

    await act(async () => root.unmount());
    consoleError.mockRestore();
  });
});
