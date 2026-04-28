import { describe, it, expect } from "vitest";
import { buildDailyStack, STACK_MIN, STACK_MAX } from "../src/daily-stack.js";
import { makeProfile, makePool } from "./fixtures.js";

describe("daily stack", () => {
  it("returns at most STACK_MAX candidates", () => {
    const viewer = makeProfile({ userId: "viewer" });
    const pool = makePool(50);
    const stack = buildDailyStack(viewer, pool, { day: "2026-04-28" });
    expect(stack.length).toBeLessThanOrEqual(STACK_MAX);
  });

  it("respects requested size within bounds", () => {
    const viewer = makeProfile({ userId: "viewer" });
    const pool = makePool(50);
    const stack = buildDailyStack(viewer, pool, { day: "2026-04-28", size: 12 });
    expect(stack.length).toBe(12);
    const tooSmall = buildDailyStack(viewer, pool, { day: "2026-04-28", size: 5 });
    expect(tooSmall.length).toBe(STACK_MIN);
  });

  it("excludes the viewer themselves and previously-shown ids", () => {
    const viewer = makeProfile({ userId: "viewer" });
    const pool = [
      ...makePool(15),
      makeProfile({
        userId: "viewer",
        gender: "female",
        seekingGender: "male",
      }),
    ];
    const exclude = new Set(["u-0", "u-1", "u-2"]);
    const stack = buildDailyStack(viewer, pool, {
      day: "2026-04-28",
      excludeUserIds: exclude,
    });
    const ids = stack.map((s) => s.candidateUserId);
    expect(ids).not.toContain("viewer");
    expect(ids).not.toContain("u-0");
    expect(ids).not.toContain("u-1");
    expect(ids).not.toContain("u-2");
  });

  it("two distinct viewers produce distinct stacks", () => {
    // Acceptance: "Test users get distinct, sensible daily stacks."
    const viewerA = makeProfile({
      userId: "alpha",
      faith: {
        denomination: "catholic",
        churchAttendance: "weekly",
        baptized: true,
        marriageIntent: "within_1y",
        spiritualGifts: ["teaching"],
      },
    });
    const viewerB = makeProfile({
      userId: "beta",
      agePreference: { minAge: 24, maxAge: 32 },
      faith: {
        denomination: "protestant",
        churchAttendance: "monthly",
        baptized: true,
        marriageIntent: "open_timeline",
        spiritualGifts: ["service"],
      },
    });
    const pool = makePool(40);
    const a = buildDailyStack(viewerA, pool, { day: "2026-04-28" });
    const b = buildDailyStack(viewerB, pool, { day: "2026-04-28" });
    const idsA = a.map((s) => s.candidateUserId);
    const idsB = b.map((s) => s.candidateUserId);
    // Stacks must not be identical in order or composition.
    expect(idsA).not.toEqual(idsB);
  });

  it("is deterministic for the same viewer/day", () => {
    const viewer = makeProfile({ userId: "viewer" });
    const pool = makePool(40);
    const a = buildDailyStack(viewer, pool, { day: "2026-04-28" });
    const b = buildDailyStack(viewer, pool, { day: "2026-04-28" });
    expect(a.map((s) => s.candidateUserId)).toEqual(
      b.map((s) => s.candidateUserId),
    );
  });

  it("changes between days for the same viewer", () => {
    const viewer = makeProfile({ userId: "viewer" });
    const pool = makePool(40);
    const day1 = buildDailyStack(viewer, pool, { day: "2026-04-28" });
    const day2 = buildDailyStack(viewer, pool, { day: "2026-04-29" });
    // Top of stack can be the same person — but order shouldn't be identical.
    expect(day1.map((s) => s.candidateUserId)).not.toEqual(
      day2.map((s) => s.candidateUserId),
    );
  });

  it("ranks faith-aligned candidates higher", () => {
    const viewer = makeProfile({
      userId: "viewer",
      faith: {
        denomination: "catholic",
        churchAttendance: "weekly",
        baptized: true,
        marriageIntent: "within_1y",
        spiritualGifts: ["teaching"],
      },
    });
    // pool[0] is catholic + within_1y by construction; lower indices = better fit
    const pool = makePool(20);
    const stack = buildDailyStack(viewer, pool, { day: "2026-04-28" });
    expect(stack.length).toBeGreaterThanOrEqual(STACK_MIN);
    // The top candidate should be catholic (denomination is dominant factor).
    const top = stack[0]!;
    const topProfile = pool.find((p) => p.userId === top.candidateUserId)!;
    expect(topProfile.faith.denomination).toBe("catholic");
  });
});
