import { describe, expect, it, vi } from "vitest";
import { createIdempotentFinalizer } from "@/features/export/core/finalization";

describe("createIdempotentFinalizer", () => {
  it("finalizes an export resource exactly once across competing completion paths", () => {
    const cleanup = vi.fn();
    const finalize = createIdempotentFinalizer(cleanup);

    finalize();
    finalize();

    expect(cleanup).toHaveBeenCalledOnce();
  });
});
