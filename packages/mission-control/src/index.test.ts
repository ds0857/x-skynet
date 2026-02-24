import { describe, it, expect } from "vitest";
import { MissionControl } from "./index";
import type { Step, RunContext, StepResult, ID, ISODateTime, Artifact } from "@xskynet/contracts";

describe("MissionControl", () => {
  it("runs a registered executor", async () => {
    const mc = new MissionControl();
    mc.register({
      kind: "noop",
      async execute(_step: Step, _ctx: RunContext): Promise<StepResult> {
        const output: Artifact = {
          id: "a" as unknown as ID,
          kind: "log",
          createdAt: "now" as unknown as ISODateTime,
          name: "ok",
        };
        return { status: "succeeded", output };
      },
    });

    const result = await mc.runStep(
      "noop",
      {
        id: "s1" as unknown as ID,
        name: "s",
        status: "running",
        createdAt: "now" as unknown as ISODateTime,
      },
      { runId: "r1" as unknown as ID, planId: "p1" as unknown as ID },
    );
    expect(result.status).toBe("succeeded");
  });
});
