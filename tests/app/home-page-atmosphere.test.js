import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("home page atmosphere markup", () => {
  it("mounts the atmosphere after the depth scene without changing homepage content", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/page.js"), "utf8");
    const avatarSource = fs.readFileSync(
      path.join(process.cwd(), "app/components/HomeAvatar.jsx"),
      "utf8",
    );
    const backgroundSource = fs.readFileSync(
      path.join(process.cwd(), "app/components/HomeBackgroundDepth.tsx"),
      "utf8",
    );

    expect(source).toContain('className="profile profile--atmosphere"');
    expect(source).toContain('import HomeAvatar from "./components/HomeAvatar";');
    expect(source).toContain(
      'import HomeBackgroundDepth from "./components/HomeBackgroundDepth";',
    );
    expect(source).toContain(
      'import HomeAtmosphereLayer from "./components/HomeAtmosphereLayer";',
    );
    expect(source).toContain("<HomeAvatar />");
    expect(source).toContain("<HomeBackgroundDepth />");
    expect(source).toContain("<HomeAtmosphereLayer />");
    expect(source.indexOf("<HomeBackgroundDepth />")).toBeLessThan(
      source.indexOf("<HomeAtmosphereLayer />"),
    );
    expect(source).not.toContain("HomeRainLayer");
    expect(source).not.toContain("profile--rainy-mask");
    expect(source).not.toContain("HomeRainOverlaySlot");
    expect(source).not.toContain('className="profile-avatar-note"');
    expect(source).not.toContain('/images/home/curious-cats-fallen-flower-base.png');
    expect(source).not.toContain('/images/home/curious-cats-fallen-flower-cat.png');
    expect(source).not.toContain('/images/home/curious-cats-wilted-flower-cat.png');
    expect(source).toContain("花似伊，柳似伊");
    expect(source).toContain("Books · Life");
    expect(source).toContain("button-inner\">Posts");
    expect(source).toContain("button-inner\">About");
    expect(source).toContain("button-inner\">Photos");
    expect(source).toContain("button-inner\">Link");

    expect(avatarSource).toContain('className="profile-avatar"');
    expect(avatarSource).toContain('aria-hidden="true"');
    expect(backgroundSource).toContain('"use client"');
    expect(backgroundSource).not.toContain("requestPermission");
  });

  it("keeps the cat artwork and site-native Photos shortcut", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/page.js"), "utf8");
    const avatarAsset = fs.readFileSync(
      path.join(process.cwd(), "public/images/home/avatar-cats-ink-v2.png"),
    );
    const nightAvatarAsset = fs.readFileSync(
      path.join(process.cwd(), "public/images/home/avatar-cats-ink-night-v2.png"),
    );

    expect(avatarAsset.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(avatarAsset[25]).toBe(6);
    expect(nightAvatarAsset.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(nightAvatarAsset[25]).toBe(6);
    expect(source).toContain('<Link className="button" href="/photos/">');
    expect(source).not.toContain('href="/photos/index.html"');
  });

  it("does not retain the old rain implementation in client enhancements", () => {
    const enhancementsSource = fs.readFileSync(
      path.join(process.cwd(), "app/components/ClientEnhancements.js"),
      "utf8",
    );
    const packageSource = fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8");
    const packageLockSource = fs.readFileSync(
      path.join(process.cwd(), "package-lock.json"),
      "utf8",
    );

    expect(enhancementsSource).not.toContain("@arayui/rainy-day");
    expect(enhancementsSource).not.toContain("HomeRainOverlaySlot");
    expect(enhancementsSource).not.toContain("profile__rain-stage");
    expect(packageSource).not.toContain("@arayui/rainy-day");
    expect(packageLockSource).not.toContain("@arayui/rainy-day");
    expect(packageLockSource).not.toContain('"node_modules/three"');
  });
});
