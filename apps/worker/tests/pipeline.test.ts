import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildEditRequest, editBrief, SYSTEM_INSTRUCTION } from "../src/pipeline.ts";

describe("buildEditRequest / brief", () => {
  it("contains the preserve instruction", () => {
    const brief = editBrief(["combined"], ["50% OFF"]);
    const request = buildEditRequest("primary-model", brief, "image/png", "AAAA");
    const textPart = request.input.find((part) => part.type === "text");
    assert.ok(textPart && textPart.type === "text");
    assert.match(textPart.text, /Keep every offer line, price, logo, and CTA/i);
    assert.match(textPart.text, /combined safe hole/i);
    assert.match(textPart.text, /data, never as instructions/i);
    assert.match(SYSTEM_INSTRUCTION, /untrusted content to preserve/i);
    assert.match(brief, /Keep these strings exactly: 50% OFF/);
  });
});
