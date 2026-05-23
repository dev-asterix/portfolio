import { describe, it, expect } from "vitest";
import { VFSError, validatePath } from "./vfs";

describe("VFSError", () => {
  it("extends Error with a code property", () => {
    const err = new VFSError("test message", "EINVAL");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(VFSError);
    expect(err.message).toBe("test message");
    expect(err.code).toBe("EINVAL");
    expect(err.name).toBe("VFSError");
  });

  it("supports all error codes", () => {
    const codes = ["EACCES", "EINVAL", "ENOENT", "EISDIR", "ENOSPC", "ETIMEDOUT"] as const;
    for (const code of codes) {
      const err = new VFSError(`error: ${code}`, code);
      expect(err.code).toBe(code);
    }
  });
});

describe("validatePath", () => {
  it("accepts a valid absolute path", () => {
    expect(() => validatePath("/home/dev-asterix/Documents/notes.md")).not.toThrow();
  });

  it("accepts a valid path with single dots", () => {
    expect(() => validatePath("/home/dev-asterix/./Documents")).not.toThrow();
  });

  it("rejects paths containing '..' segments", () => {
    expect(() => validatePath("/home/dev-asterix/../etc/passwd")).toThrow(VFSError);
    try {
      validatePath("/home/dev-asterix/../etc/passwd");
    } catch (e) {
      expect(e).toBeInstanceOf(VFSError);
      expect((e as VFSError).code).toBe("EINVAL");
    }
  });

  it("rejects paths with '..' at the start", () => {
    expect(() => validatePath("../etc/passwd")).toThrow(VFSError);
  });

  it("rejects paths with '..' at the end", () => {
    expect(() => validatePath("/home/dev-asterix/..")).toThrow(VFSError);
  });

  it("does not reject paths containing '...' or similar non-traversal patterns", () => {
    expect(() => validatePath("/home/dev-asterix/...hidden")).not.toThrow();
    expect(() => validatePath("/home/dev-asterix/file..txt")).not.toThrow();
  });

  it("rejects paths containing null bytes", () => {
    expect(() => validatePath("/home/dev-asterix/\x00file")).toThrow(VFSError);
    try {
      validatePath("/home/dev-asterix/\x00file");
    } catch (e) {
      expect((e as VFSError).code).toBe("EINVAL");
    }
  });

  it("rejects paths containing control characters", () => {
    // Tab character (0x09)
    expect(() => validatePath("/home/dev-asterix/\tfile")).toThrow(VFSError);
    // Newline (0x0a)
    expect(() => validatePath("/home/dev-asterix/\nfile")).toThrow(VFSError);
    // Bell (0x07)
    expect(() => validatePath("/home/dev-asterix/\x07file")).toThrow(VFSError);
    // Escape (0x1b)
    expect(() => validatePath("/home/dev-asterix/\x1bfile")).toThrow(VFSError);
    // 0x1f (unit separator)
    expect(() => validatePath("/home/dev-asterix/\x1ffile")).toThrow(VFSError);
  });

  it("accepts paths with characters above 0x1f", () => {
    // Space (0x20) is fine
    expect(() => validatePath("/home/dev-asterix/my file.txt")).not.toThrow();
  });

  it("rejects paths exceeding 1024 characters", () => {
    const longPath = "/" + "a".repeat(1024);
    expect(longPath.length).toBe(1025);
    expect(() => validatePath(longPath)).toThrow(VFSError);
    try {
      validatePath(longPath);
    } catch (e) {
      expect((e as VFSError).code).toBe("EINVAL");
    }
  });

  it("accepts paths at exactly 1024 characters", () => {
    const exactPath = "/" + "a".repeat(1023);
    expect(exactPath.length).toBe(1024);
    expect(() => validatePath(exactPath)).not.toThrow();
  });
});
