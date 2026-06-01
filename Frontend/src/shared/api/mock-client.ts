export const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export async function mockFetch<T>(data: T, ms = 250): Promise<T> {
  await delay(ms);
  // Return a deep-cloned copy so consumers can't mutate the mock store.
  return JSON.parse(JSON.stringify(data));
}
