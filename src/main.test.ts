import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

describe("keyboard viewport mode bootstrap", () => {
  it("does not force interactive-widget overlays mode in index.html", () => {
    const indexHtml = readFileSync("index.html", "utf-8");

    expect(indexHtml).not.toContain("interactive-widget=overlays-content");
  });

  it("does not enable virtual keyboard overlay mode at startup", () => {
    const mainSource = readFileSync("src/main.tsx", "utf-8");

    expect(mainSource).not.toContain("navigator.virtualKeyboard.overlaysContent = true");
  });
});
