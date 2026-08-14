import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db/prisma";
import { verifyCredentials } from "@/lib/auth/verify-credentials";

describe("login workflow (verifyCredentials)", () => {
  const email = "login-test@healthtutor.com";
  const password = "Correct123!";

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.user.create({
      data: {
        name: "Login Test User",
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: "TUTOR",
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
  });

  it("returns the user for correct credentials", async () => {
    const user = await verifyCredentials({ email, password });
    expect(user).not.toBeNull();
    expect(user?.email).toBe(email);
    expect(user?.role).toBe("TUTOR");
  });

  it("returns null for a wrong password", async () => {
    const user = await verifyCredentials({ email, password: "WrongPassword1" });
    expect(user).toBeNull();
  });

  it("returns null for an unknown email", async () => {
    const user = await verifyCredentials({ email: "nobody@healthtutor.com", password });
    expect(user).toBeNull();
  });

  it("returns null for a disabled account", async () => {
    await prisma.user.update({ where: { email }, data: { isActive: false } });
    const user = await verifyCredentials({ email, password });
    expect(user).toBeNull();
    await prisma.user.update({ where: { email }, data: { isActive: true } });
  });

  it("returns null for missing fields", async () => {
    expect(await verifyCredentials({ email })).toBeNull();
    expect(await verifyCredentials({})).toBeNull();
  });
});
