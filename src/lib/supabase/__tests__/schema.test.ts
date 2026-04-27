// @vitest-environment node
// Post-migration schema verification.
// Skip if migrations haven't been applied yet (table count = 0 → graceful skip).
import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

describe("Schema landed", () => {
  it("dancers_public view is queryable by anon", async () => {
    const { error } = await supabase
      .from("dancers_public")
      .select("dancer_name")
      .limit(1);
    expect(error).toBeNull();
  });

  it("anon cannot read members directly", async () => {
    const { data, error } = await supabase
      .from("members")
      .select("id")
      .limit(1);
    // Either denied by RLS (empty data, no error) or 401/403.
    // The point: no row leaks.
    expect(data ?? []).toEqual([]);
    if (error) expect(error.message).toMatch(/permission|policy|denied/i);
  });

  it("validate_invite_code RPC rejects bogus codes", async () => {
    const { data, error } = await supabase.rpc("validate_invite_code", {
      p_code: "definitely-not-a-real-code",
    });
    expect(error).toBeNull();
    expect(data).toBe(false);
  });
});
