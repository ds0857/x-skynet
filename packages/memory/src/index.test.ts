import { describe, it, expect } from "vitest";
import { InMemoryProvider } from "./index";

describe("InMemoryProvider", () => {
  it("reads what it writes", async () => {
    const mem = new InMemoryProvider();
    await mem.write("k", 42);
    expect(await mem.read("k")).toBe(42);
    await mem.delete("k");
    expect(await mem.read("k")).toBeUndefined();
  });
});
