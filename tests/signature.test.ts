import { describe, expect, it } from "vitest";
import { computeSignature, verifyRiipenSignature } from "../src/integrations/riipen/signature";

describe("riipen webhook signature", () => {
  it("verifies valid signatures", () => {
    const payload = JSON.stringify({ hello: "world" });
    const secret = "top-secret";
    const signature = computeSignature(payload, secret);

    expect(verifyRiipenSignature(payload, signature, secret)).toBe(true);
  });

  it("rejects invalid signatures", () => {
    const payload = JSON.stringify({ hello: "world" });
    expect(verifyRiipenSignature(payload, "invalid", "top-secret")).toBe(false);
  });
});
