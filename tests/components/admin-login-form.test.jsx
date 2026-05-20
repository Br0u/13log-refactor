// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AdminLoginForm from "../../components/admin/AdminLoginForm";

const { pushMock, refreshMock, fetchMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: pushMock,
      refresh: refreshMock,
    };
  },
}));

describe("AdminLoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders field labels with colons for clearer separation", () => {
    render(<AdminLoginForm />);

    expect(screen.getByText("Username:")).toBeTruthy();
    expect(screen.getByText("Password:")).toBeTruthy();
  });

  it("loads /admin after a successful login so the session cookie is read server-side", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
    });
    const assignMock = vi.fn();
    vi.stubGlobal("location", { assign: assignMock });

    render(<AdminLoginForm />);

    fireEvent.change(screen.getByRole("textbox", { name: "Username:" }), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("Password:"), {
      target: { value: "correct-password" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form"));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/admin");
    });
    expect(pushMock).not.toHaveBeenCalled();
  });
});
