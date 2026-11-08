import { describe, expect, it } from "vitest";

import { isProbablyUrl } from "../../../src/lib/utils";

describe("isProbablyUrl", () => {
  it("accepts web links with or without an explicit scheme", () => {
    expect(isProbablyUrl("https://example.com/video")).toBe(true);
    expect(isProbablyUrl("example.com/video")).toBe(true);
    expect(isProbablyUrl("  https://media.example.org/watch?v=1  ")).toBe(true);
  });

  it("rejects non-web schemes and incomplete hosts", () => {
    expect(isProbablyUrl("javascript://example.com/payload")).toBe(false);
    expect(isProbablyUrl("file://example.com/video.mp4")).toBe(false);
    expect(isProbablyUrl("localhost/video")).toBe(false);
    expect(isProbablyUrl("")).toBe(false);
  });

  it("rejects links with embedded credentials", () => {
    expect(isProbablyUrl("https://user:secret@example.com/video")).toBe(false);
    expect(isProbablyUrl("https://user@example.com/video")).toBe(false);
  });

  it("rejects local and private network targets like the backend", () => {
    expect(isProbablyUrl("http://127.0.0.1/video.mp4")).toBe(false);
    expect(isProbablyUrl("http://192.168.1.20/video.mp4")).toBe(false);
    expect(isProbablyUrl("http://10.0.0.5/video.mp4")).toBe(false);
    expect(isProbablyUrl("http://172.16.4.2/video.mp4")).toBe(false);
    expect(isProbablyUrl("http://169.254.10.2/video.mp4")).toBe(false);
    expect(isProbablyUrl("http://printer.local/video.mp4")).toBe(false);
    expect(isProbablyUrl("http://media.internal/video.mp4")).toBe(false);
    expect(isProbablyUrl("http://[::1]/video.mp4")).toBe(false);
    expect(isProbablyUrl("http://[fe80::1]/video.mp4")).toBe(false);
    expect(isProbablyUrl("http://[fec0::1]/video.mp4")).toBe(false);
    expect(isProbablyUrl("http://[feff::1]/video.mp4")).toBe(false);
    expect(isProbablyUrl("http://[2001:db8::1]/video.mp4")).toBe(false);
    expect(isProbablyUrl("http://[::ffff:192.168.0.2]/video.mp4")).toBe(false);
  });

  it("keeps public addresses and documentation-free hosts", () => {
    expect(isProbablyUrl("http://93.184.216.34/video.mp4")).toBe(true);
    expect(isProbablyUrl("https://[2606:4700:4700::1111]/video.mp4")).toBe(true);
    expect(isProbablyUrl("https://sub.example.co.uk/gallery")).toBe(true);
  });
});
