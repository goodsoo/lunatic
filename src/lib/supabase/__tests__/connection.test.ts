// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe("Supabase connection", () => {
  it("env vars are populated", () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toMatch(
      /^https:\/\/[a-z0-9]+\.supabase\.co$/,
    );
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toMatch(/^eyJ/);
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toMatch(/^eyJ/);
    expect(process.env.OWNER_EMAIL).toMatch(/@/);
  });

  it("anon client reaches the project", async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase.auth.getSession();
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
