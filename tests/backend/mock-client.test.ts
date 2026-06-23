import { afterEach, describe, expect, it, vi } from "vitest";
import { delay, mockFetch } from "@/shared/api/mock-client";

describe("mock API client", () => {
  afterEach(() => vi.useRealTimers());

  it("delay resolves after the requested time", async () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    delay(100).then(spy);
    await vi.advanceTimersByTimeAsync(99);
    expect(spy).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("mockFetch returns data deep-equal to the source", async () => {
    const source = { id: "1", nested: { value: 42 }, list: [1, 2, 3] };
    const result = await mockFetch(source, 0);
    expect(result).toEqual(source);
  });

  it("mockFetch returns an isolated deep clone (caller cannot mutate the store)", async () => {
    const source = { id: "1", nested: { value: 42 } };
    const result = await mockFetch(source, 0);

    expect(result).not.toBe(source);
    expect(result.nested).not.toBe(source.nested);

    result.nested.value = 999;
    expect(source.nested.value).toBe(42);
  });

  it("mockFetch honours its delay", async () => {
    vi.useFakeTimers();
    const promise = mockFetch({ ok: true }, 250);
    let settled = false;
    promise.then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(249);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(settled).toBe(true);
  });
});
