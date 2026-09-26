import { describe, expect, it } from "vitest";
import { en } from "./en";
import type { TranslationTree } from "./types";
import { uk } from "./uk";

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

function keys(tree: TranslationTree, prefix = ""): Set<string> {
  const result = new Set<string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = `${prefix}${key}`;
    if (typeof value === "string") {
      result.add(path.replace(PLURAL_SUFFIX, ""));
    } else {
      keys(value, `${path}.`).forEach((nested) => result.add(nested));
    }
  }
  return result;
}

function pluralForms(tree: TranslationTree, key: string): string[] {
  const [group, name] = key.split(".");
  const node = tree[group ?? ""];
  if (typeof node !== "object") {
    return [];
  }
  return Object.keys(node)
    .filter((item) => item.replace(PLURAL_SUFFIX, "") === name && PLURAL_SUFFIX.test(item))
    .map((item) => item.replace(`${name ?? ""}_`, ""));
}

describe("translations", () => {
  it("has the same keys in English and Ukrainian", () => {
    expect([...keys(uk)].sort()).toEqual([...keys(en)].sort());
  });

  it("has all Ukrainian plural forms for plural keys", () => {
    const pluralKeys = [...keys(en)].filter((key) => pluralForms(en, key).length > 0);
    for (const key of pluralKeys) {
      expect(pluralForms(uk, key).sort(), key).toEqual(["few", "many", "one", "other"]);
    }
  });
});
