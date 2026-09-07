import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assetKey, assertAllowedR2Key, isAllowedR2Key, outputKey } from "../src/lib/r2Keys.ts";

describe("r2 key helper", () => {
  it("allows assets/ and outputs/ prefixes only", () => {
    assert.equal(isAllowedR2Key("assets/stub-user/01HZX.png"), true);
    assert.equal(isAllowedR2Key("outputs/stub-user/job1.png"), true);
    assert.equal(isAllowedR2Key("scratch/stub-user/job1.png"), false);
    assert.equal(isAllowedR2Key("tmp/file.png"), false);
    assert.equal(isAllowedR2Key("assets/../secret.png"), false);
    assert.equal(isAllowedR2Key("/assets/stub-user/x.png"), false);
    assert.throws(() => assertAllowedR2Key("public/file.png"), /invalid_r2_key/);
  });

  it("builds server-generated keys under the allowed prefixes", () => {
    assert.equal(assetKey("stub-user", "01HZXTESTKEY00000000000000", "png"), "assets/stub-user/01HZXTESTKEY00000000000000.png");
    assert.equal(outputKey("stub-user", "01HZXTESTJOB00000000000000"), "outputs/stub-user/01HZXTESTJOB00000000000000.png");
    assert.ok(isAllowedR2Key(assetKey("stub-user", "abc_1", "webp")));
    assert.ok(isAllowedR2Key(outputKey("user1", "job1")));
  });
});
