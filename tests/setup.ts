import { config } from "dotenv";
import path from "node:path";
import { vi } from "vitest";

config({ path: path.resolve(__dirname, "../.env.test") });

// Server actions call these Next.js request-context APIs, which only work
// inside a real request. Tests invoke actions directly, so these are
// no-ops here — tests assert on database state instead of cache/redirect
// side effects.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    redirect: vi.fn(),
    notFound: vi.fn(),
  };
});
