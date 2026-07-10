import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { ptBRMessages } from "./messages";
import { enUSMessages } from "./enUSMessages";

function extractKeysFromSource(path: string): string[] {
  const text = readFileSync(path, "utf-8");
  const keys: string[] = [];
  const regex = /^\s*"([^"]+)":/gm;
  let match;
  while ((match = regex.exec(text)) !== null) {
    keys.push(match[1]);
  }
  return keys;
}

function findDuplicates(keys: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) {
      dupes.add(key);
    }
    seen.add(key);
  }
  return [...dupes];
}

describe("i18n key parity", () => {
  const ptKeys = Object.keys(ptBRMessages);
  const enKeys = Object.keys(enUSMessages);

  const ptSet = new Set(ptKeys);
  const enSet = new Set(enKeys);

  const missingInEn = ptKeys.filter((key) => !enSet.has(key));
  const extraInEn = enKeys.filter((key) => !ptSet.has(key));

  it("has no Portuguese keys missing from English", () => {
    if (missingInEn.length > 0) {
      throw new Error(
        `Missing en-US keys:\n${missingInEn.map((k) => `  - ${k}`).join("\n")}`,
      );
    }
  });

  it("has no English keys missing from Portuguese", () => {
    if (extraInEn.length > 0) {
      throw new Error(
        `Extra en-US keys (not in pt-BR):\n${extraInEn.map((k) => `  - ${k}`).join("\n")}`,
      );
    }
  });

  it("has matching key counts", () => {
    expect(ptKeys.length).toBe(enKeys.length);
  });

  it("has no duplicate keys in pt-BR messages", () => {
    const sourceKeys = extractKeysFromSource("src/app/i18n/messages.ts");
    const dupes = findDuplicates(sourceKeys);
    if (dupes.length > 0) {
      throw new Error(
        `Duplicate pt-BR keys:\n${dupes.map((k) => `  - ${k}`).join("\n")}`,
      );
    }
  });

  it("has no duplicate keys in en-US messages", () => {
    const sourceKeys = extractKeysFromSource("src/app/i18n/enUSMessages.ts");
    const dupes = findDuplicates(sourceKeys);
    if (dupes.length > 0) {
      throw new Error(
        `Duplicate en-US keys:\n${dupes.map((k) => `  - ${k}`).join("\n")}`,
      );
    }
  });
});
