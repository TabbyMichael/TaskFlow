import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryTable } from "../mocks/in-memory-db";
import { users } from "@/shared/api/mock-data";
import { makeUser, resetFactorySeq } from "../fixtures/factories";
import type { User } from "@/shared/types";

describe("transactions", () => {
  let table: InMemoryTable<User>;

  beforeEach(() => {
    resetFactorySeq();
    table = new InMemoryTable<User>(users);
  });

  it("commits all changes when the unit of work succeeds", () => {
    table.transaction((t) => {
      t.insert(makeUser({ id: "a1" }));
      t.insert(makeUser({ id: "a2" }));
      t.update("u1", { title: "Updated" });
    });

    expect(table.findById("a1")).toBeDefined();
    expect(table.findById("a2")).toBeDefined();
    expect(table.findById("u1")?.title).toBe("Updated");
    expect(table.count()).toBe(users.length + 2);
  });

  it("rolls back every change when the unit of work throws", () => {
    const before = table.count();
    expect(() =>
      table.transaction((t) => {
        t.insert(makeUser({ id: "a1" }));
        t.update("u1", { title: "ShouldRevert" });
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(table.findById("a1")).toBeUndefined();
    expect(table.findById("u1")?.title).toBe("Head of Product");
    expect(table.count()).toBe(before);
  });

  it("rolls back on a constraint violation mid-transaction", () => {
    const before = table.count();
    expect(() =>
      table.transaction((t) => {
        t.insert(makeUser({ id: "ok" }));
        t.insert(makeUser({ id: "u1" })); // duplicate -> throws
      }),
    ).toThrow();

    expect(table.findById("ok")).toBeUndefined();
    expect(table.count()).toBe(before);
  });
});
