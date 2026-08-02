// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mapConstructor = vi.fn();
const markerConstructor = vi.fn();

vi.mock("maplibre-gl", () => {
  class MapMock {
    constructor(options) {
      mapConstructor(options);
    }

    once() {}
    resize() {}
    jumpTo() {}
    remove() {}
  }

  class MarkerMock {
    constructor(options) {
      markerConstructor(options);
    }

    setLngLat() {
      return this;
    }

    addTo() {
      return this;
    }

    remove() {}
  }

  return { Map: MapMock, Marker: MarkerMock };
});

import { LocationMap } from "../../components/ui/expand-map";

function installMatchMedia({ mobile }) {
  vi.stubGlobal("matchMedia", vi.fn((query) => ({
    matches: query.includes("max-width") ? mobile : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })));
}

describe("LocationMap responsive activation", () => {
  beforeEach(() => {
    mapConstructor.mockClear();
    markerConstructor.mockClear();
    vi.stubGlobal("ResizeObserver", class ResizeObserverMock {
      observe() {}
      disconnect() {}
    });
    vi.stubGlobal("requestAnimationFrame", vi.fn());
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it.each([
    { mobile: false, expectedContainer: "desktop-map" },
    { mobile: true, expectedContainer: "mobile-map" },
  ])("creates only the visible MapLibre instance when mobile=$mobile", async ({ mobile, expectedContainer }) => {
    installMatchMedia({ mobile });

    const { container } = render(
      <>
        <div data-slot="desktop-map">
          <LocationMap viewport="desktop" />
        </div>
        <div data-slot="mobile-map">
          <LocationMap viewport="mobile" />
        </div>
      </>,
    );

    await waitFor(() => expect(mapConstructor).toHaveBeenCalledTimes(1));

    const mapElement = mapConstructor.mock.calls[0][0].container;
    expect(mapElement.closest("[data-slot]")?.dataset.slot).toBe(expectedContainer);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});
