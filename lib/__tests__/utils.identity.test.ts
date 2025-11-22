import { randomUsername } from "@/lib/utils/identity";

describe("identity utils", () => {
  it("randomUsername is deterministic per seed", () => {
    const a = randomUsername("seed-123");
    const b = randomUsername("seed-123");
    const c = randomUsername("seed-456");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
