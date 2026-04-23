import crypto from "node:crypto";

export function computeSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyRiipenSignature(payload: string, expectedSignature: string | undefined, secret: string): boolean {
  if (!expectedSignature) {
    return false;
  }

  const actual = computeSignature(payload, secret);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
