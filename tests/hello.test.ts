import { describe, it, expect } from "vitest";
import { hello } from "../packages/core/src";

describe("hello", () => {
  it("greets by name", () => {
    expect(hello("Dev")).toBe("Hello, Dev!");
  });
});
