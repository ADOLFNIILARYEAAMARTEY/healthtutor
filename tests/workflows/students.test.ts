import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth/auth", () => ({ auth: authMock, signIn: vi.fn(), signOut: vi.fn(), handlers: {} }));

import { prisma } from "@/lib/db/prisma";
import {
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
} from "@/app/(dashboard)/students/actions";

function asAdmin(id: string) {
  authMock.mockResolvedValue({ user: { id, name: "Admin", email: "admin@test.com", role: "ADMIN" } });
}

function asUnauthenticated() {
  authMock.mockResolvedValue(null);
}

function studentForm(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("create student workflow", () => {
  let adminId: string;

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        name: "Workflow Admin",
        email: "workflow-admin-students@healthtutor.com",
        passwordHash: "unused",
        role: "ADMIN",
      },
    });
    adminId = admin.id;
  });

  afterAll(async () => {
    await prisma.student.deleteMany({ where: { studentNumber: { in: ["WF-001", "WF-999"] } } });
    await prisma.user.delete({ where: { id: adminId } });
  });

  it("creates a student with valid data", async () => {
    asAdmin(adminId);
    const result = await createStudentAction(
      {},
      studentForm({
        studentNumber: "WF-001",
        firstName: "Test",
        lastName: "Student",
        email: "wf-001@student.healthtutor.com",
      })
    );

    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);

    const created = await prisma.student.findUnique({ where: { studentNumber: "WF-001" } });
    expect(created).not.toBeNull();
    expect(created?.firstName).toBe("Test");
  });

  it("rejects a duplicate student number with a friendly message", async () => {
    asAdmin(adminId);
    const result = await createStudentAction(
      {},
      studentForm({
        studentNumber: "WF-001",
        firstName: "Another",
        lastName: "Student",
        email: "wf-001-dup@student.healthtutor.com",
      })
    );

    expect(result.success).toBeUndefined();
    expect(result.error).toBe("Student number already exists.");
  });

  it("rejects invalid input with field-level errors", async () => {
    asAdmin(adminId);
    const result = await createStudentAction(
      {},
      studentForm({ studentNumber: "", firstName: "", lastName: "", email: "not-an-email" })
    );

    expect(result.fieldErrors?.studentNumber).toBeTruthy();
    expect(result.fieldErrors?.firstName).toBeTruthy();
    expect(result.fieldErrors?.email).toBeTruthy();
  });

  it("rejects unauthenticated requests", async () => {
    asUnauthenticated();
    const result = await createStudentAction(
      {},
      studentForm({
        studentNumber: "WF-999",
        firstName: "Should",
        lastName: "Fail",
        email: "wf-999@student.healthtutor.com",
      })
    );
    expect(result.error).toBe("You do not have permission to access this page.");

    const created = await prisma.student.findUnique({ where: { studentNumber: "WF-999" } });
    expect(created).toBeNull();
  });

  it("updates an existing student", async () => {
    asAdmin(adminId);
    const student = await prisma.student.findUniqueOrThrow({ where: { studentNumber: "WF-001" } });

    const result = await updateStudentAction(
      student.id,
      {},
      studentForm({
        studentNumber: "WF-001",
        firstName: "Updated",
        lastName: "Student",
        email: "wf-001@student.healthtutor.com",
      })
    );

    expect(result.success).toBe(true);
    const updated = await prisma.student.findUnique({ where: { id: student.id } });
    expect(updated?.firstName).toBe("Updated");
  });

  it("deletes a student with no attendance or score records", async () => {
    asAdmin(adminId);
    const student = await prisma.student.findUniqueOrThrow({ where: { studentNumber: "WF-001" } });

    const result = await deleteStudentAction(student.id);
    expect(result.success).toBe(true);

    const deleted = await prisma.student.findUnique({ where: { id: student.id } });
    expect(deleted).toBeNull();
  });
});
