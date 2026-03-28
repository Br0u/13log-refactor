// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminConfirmSubmitButton from "../../components/admin/AdminConfirmSubmitButton";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AdminConfirmSubmitButton", () => {
  it("cancels submission when the user rejects the confirmation", () => {
    const confirmMock = vi.fn(() => false);
    vi.stubGlobal("confirm", confirmMock);
    const onSubmit = vi.fn((event) => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <AdminConfirmSubmitButton
          label="Delete photo"
          confirmMessage="Delete this photo?"
          className="admin-danger-link"
        />
      </form>
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete photo" }));

    expect(confirmMock).toHaveBeenCalledWith("Delete this photo?");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
