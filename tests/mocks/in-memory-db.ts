// Lightweight in-memory "database" used by the database-tier tests. It models
// the persistence behaviour the app would rely on if it had a real backend:
// primary-key uniqueness, CRUD, and transactions with rollback. This is test
// infrastructure only — the application itself ships a static mock-data store.

export class UniqueConstraintError extends Error {
  constructor(id: string) {
    super(`duplicate primary key: ${id}`);
    this.name = "UniqueConstraintError";
  }
}

export class NotFoundError extends Error {
  constructor(id: string) {
    super(`row not found: ${id}`);
    this.name = "NotFoundError";
  }
}

export interface Row {
  id: string;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export class InMemoryTable<T extends Row> {
  private rows = new Map<string, T>();

  constructor(seed: readonly T[] = []) {
    for (const row of seed) this.insert(row);
  }

  insert(row: T): T {
    if (this.rows.has(row.id)) throw new UniqueConstraintError(row.id);
    this.rows.set(row.id, clone(row));
    return clone(row);
  }

  findById(id: string): T | undefined {
    const row = this.rows.get(id);
    return row ? clone(row) : undefined;
  }

  all(): T[] {
    return [...this.rows.values()].map(clone);
  }

  where(predicate: (row: T) => boolean): T[] {
    return this.all().filter(predicate);
  }

  count(): number {
    return this.rows.size;
  }

  update(id: string, patch: Partial<T>): T {
    const existing = this.rows.get(id);
    if (!existing) throw new NotFoundError(id);
    const updated = { ...existing, ...patch, id } as T;
    this.rows.set(id, clone(updated));
    return clone(updated);
  }

  delete(id: string): void {
    if (!this.rows.delete(id)) throw new NotFoundError(id);
  }

  /**
   * Run a unit of work atomically. If `work` throws, every change is rolled
   * back to the pre-transaction snapshot.
   */
  transaction<R>(work: (table: InMemoryTable<T>) => R): R {
    const snapshot = new Map(this.rows);
    try {
      return work(this);
    } catch (err) {
      this.rows = snapshot;
      throw err;
    }
  }
}
