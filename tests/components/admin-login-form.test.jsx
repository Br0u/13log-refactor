// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminLoginForm from "../../components/admin/AdminLoginForm";

vi.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: vi.fn(),
      refresh: vi.fn(),
    };
  },
}));

describe("AdminLoginForm", () => {
  it("renders field labels with colons for clearer separation", () => {
    render(<AdminLoginForm />);

    expect(screen.getByText("Username:")).toBeTruthy();
    expect(screen.getByText("Password:")).toBeTruthy();
  });
});
