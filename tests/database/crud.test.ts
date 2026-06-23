import { beforeEach, describe, expect, it } from "vitest";
import {
  InMemoryTable,
  NotFoundError,
  UniqueConstraintError,
} from "../mocks/in-memory-db";
import { users } from "@/shared/api/mock-data";
import { makeUser, resetFactorySeq } from "../fixtures/factories";
import type { User } from "@/shared/types";

describe("CRUD against an in-memory table seeded from mock data", () => {
  let table: InMemoryTable<User>;

  beforeEach(() => {
    resetFactorySeq();
    table = new InMemoryTable<User>(users);
  });

  it("seeds every row", () => {
    expect(table.count()).toBe(users.length);
    expect(table.findById("u1")?.name).toBe("Alex Morgan");
  });

  it("creates a new row", () => {
    const created = table.insert(makeUser({ id: "u99", name: "New Hire" }));
    expect(created.name).toBe("New Hire");
    expect(table.count()).toBe(users.length + 1);
    expect(table.findById("u99")).toBeDefined();
  });

  it("enforces primary-key uniqueness", () => {
    expect(() => table.insert(makeUser({ id: "u1" }))).toThrow(UniqueConstraintError);
    expect(table.count()).toBe(users.length);
  });

  it("reads return isolated copies (no store mutation via the returned object)", () => {
    const row = table.findById("u1")!;
    row.name = "Mutated";
    expect(table.findById("u1")?.name).toBe("Alex Morgan");
  });

  it("updates a row and keeps the id stable", () => {
    const updated = table.update("u2", { title: "VP Engineering" });
    expect(updated.id).toBe("u2");
    expect(updated.title).toBe("VP Engineering");
    expect(table.findById("u2")?.title).toBe("VP Engineering");
  });

  it("throws when updating a missing row", () => {
    expect(() => table.update("missing", { name: "x" })).toThrow(NotFoundError);
  });

  it("deletes a row", () => {
    table.delete("u3");
    expect(table.findById("u3")).toBeUndefined();
    expect(table.count()).toBe(users.length - 1);
  });

  it("throws when deleting a missing row", () => {
    expect(() => table.delete("missing")).toThrow(NotFoundError);
  });

  it("supports filtered queries", () => {
    const admins = table.where((u) => u.role === "admin");
    expect(admins.length).toBeGreaterThan(0);
    expect(admins.every((u) => u.role === "admin")).toBe(true);
  });
});
