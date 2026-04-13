import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("home page rain overlay markup", () => {
  it("adds the rainy mask hook without changing the existing homepage content labels", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/page.js"), "utf8");

    expect(source).toContain('className="profile profile--rainy-mask"');
    expect(source).toContain('className="profile-avatar-card"');
    expect(source).toContain('className="profile-avatar-scene"');
    expect(source).toContain('className="profile-avatar-popout profile-avatar-popout--base"');
    expect(source).toContain('className="profile-avatar-popout profile-avatar-popout--hover"');
    expect(source).not.toContain('className="profile-avatar-note"');
    expect(source).toContain('/images/home/curious-cats-fallen-flower-base.png');
    expect(source).not.toContain('/images/home/curious-cats-wilted-flower-base.png');
    expect(source).toContain('/images/home/curious-cats-fallen-flower-cat.png');
    expect(source).toContain('/images/home/curious-cats-wilted-flower-cat.png');
    expect(source).toContain("花似伊，柳似伊");
    expect(source).toContain("Books · Life");
    expect(source).toContain("button-inner\">Posts");
    expect(source).toContain("button-inner\">About");
    expect(source).toContain("button-inner\">Photos");
    expect(source).toContain("button-inner\">Link");
  });

  it("uses one corrected transparent base artwork without the duplicated black cat face", () => {
    const fallenAssetPath = path.join(process.cwd(), "public/images/home/curious-cats-fallen-flower-base.png");
    const fallenAsset = fs.readFileSync(fallenAssetPath);
    const fallenChecksum = crypto.createHash("sha256").update(fallenAsset).digest("hex");

    expect(fallenChecksum).not.toBe("6868fc20755fabe3260e1f44f6e0dd94924958e54cd78a6743129373850c67a7");
    expect(fallenChecksum).not.toBe("c71e1d9bc6d97f7ccc638f7a27254e2e64596185220db23e2838c6011d48aacf");
    expect(fallenAsset[25]).toBe(6);
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
