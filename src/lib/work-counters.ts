export interface WorkCounters {
    add(name: string, amount?: number): void;
    get(name: string): number;
    snapshot(): Readonly<Record<string, number>>;
}

/**
 * Creates an operation-local counter set for complexity assertions and diagnostics.
 * Callers pass it explicitly so instrumentation never creates hidden process state.
 */
export function createWorkCounters(
    initial: Readonly<Record<string, number>> = {}
): WorkCounters {
    const values = new Map<string, number>(Object.entries(initial));

    return {
        add(name, amount = 1) {
            if (!Number.isFinite(amount)) {
                throw new Error(`Invalid work-counter amount for "${name}": ${amount}`);
            }
            values.set(name, (values.get(name) ?? 0) + amount);
        },
        get(name) {
            return values.get(name) ?? 0;
        },
        snapshot() {
            return Object.freeze(Object.fromEntries(
                [...values.entries()].sort(([left], [right]) => left.localeCompare(right))
            ));
        }
    };
}
