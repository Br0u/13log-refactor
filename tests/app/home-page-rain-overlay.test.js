import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("home page rain overlay markup", () => {
  it("adds the rainy mask hook without changing the existing homepage content labels", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/page.js"), "utf8");

    expect(source).toContain('className="profile profile--rainy-mask"');
    expect(source).toContain('className="profile-avatar-card"');
    expect(source).toContain('className="profile-avatar-scene"');
    expect(source).toContain('className="profile-avatar-image profile-avatar-image--base"');
    expect(source).toContain('className="profile-avatar-image profile-avatar-image--hover"');
    expect(source).not.toContain('className="profile-avatar-note"');
    expect(source).toContain('/images/home/avatar-cats-ink.png');
    expect(source).toContain('/images/home/avatar-cats-ink-hover.png');
    expect(source).not.toContain('/images/home/curious-cats-fallen-flower-base.png');
    expect(source).not.toContain('/images/home/curious-cats-fallen-flower-cat.png');
    expect(source).not.toContain('/images/home/curious-cats-wilted-flower-cat.png');
    expect(source).toContain("花似伊，柳似伊");
    expect(source).toContain("Books · Life");
    expect(source).toContain("button-inner\">Posts");
    expect(source).toContain("button-inner\">About");
    expect(source).toContain("button-inner\">Photos");
    expect(source).toContain("button-inner\">Link");
  });

  it("uses the new cat ink avatar artwork", () => {
    const avatarAssetPath = path.join(process.cwd(), "public/images/home/avatar-cats-ink.png");
    const hoverAssetPath = path.join(process.cwd(), "public/images/home/avatar-cats-ink-hover.png");
    const avatarAsset = fs.readFileSync(avatarAssetPath);
    const hoverAsset = fs.readFileSync(hoverAssetPath);

    expect(avatarAsset.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(hoverAsset.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(avatarAsset[25]).toBe(6);
    expect(hoverAsset[25]).toBe(6);
  });

  it("points the Photos shortcut at the site-native photos index", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/page.js"), "utf8");

    expect(source).toContain('<Link className="button" href="/photos/">');
    expect(source).not.toContain('href="/photos/index.html"');
  });

  it("does not mount a dedicated rainy-day client overlay into the homepage anymore", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/page.js"), "utf8");
    const enhancementsSource = fs.readFileSync(path.join(process.cwd(), "app/components/ClientEnhancements.js"), "utf8");

    expect(source).not.toContain("HomeRainOverlaySlot");
    expect(enhancementsSource).not.toContain("HomeRainOverlaySlot");
    expect(enhancementsSource).not.toContain('return pathname === "/" ? <HomeRainOverlaySlot /> : null;');
  });

  it("does not keep a rainy-day image source component in the homepage flow", () => {
    const enhancementsSource = fs.readFileSync(path.join(process.cwd(), "app/components/ClientEnhancements.js"), "utf8");

    expect(enhancementsSource).not.toContain("@arayui/rainy-day");
    expect(enhancementsSource).not.toContain("profile__rain-stage");
  });
});
