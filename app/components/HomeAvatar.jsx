"use client";

import React from "react";

export default function HomeAvatar() {
  return <button type="button" className="profile-avatar pixel-cat-summon" data-cat-home aria-label="叫小猫出门" onClick={() => window.dispatchEvent(new CustomEvent("pixel-cat:summon"))} />;
}
