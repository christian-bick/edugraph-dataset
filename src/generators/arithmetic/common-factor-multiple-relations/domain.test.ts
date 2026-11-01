import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {commonRelationDomain} from './domain.ts';

describe('common relation original probability law', () => {
    it('preserves the complete five-scenario probability mass before conditioning by canonical band', () => {
        for (const operation of ['gcd', 'lcm'] as const) {
            const maximum = operation === 'gcd' ? 100 : 12;
            const original = new Map<string, number>();
            const add = (first: number, second: number, weight: number) => {
                const key = `${first}:${second}`;
                original.set(key, (original.get(key) ?? 0) + weight / 5);
            };
            // Independently enumerate the original sampler's scenario paths.
            for (let positive = 1; positive <= maximum; positive++) {
                add(positive, positive, 1 / maximum);
                add(0, positive, 1 / (2 * maximum));
                add(positive, 0, 1 / (2 * maximum));
            }
            if (operation === 'gcd') {
                for (let second = 1; second <= 100; second++) add(100, second, 1 / 100);
                for (let first = 1; first <= 99; first++) add(first, first + 1, 1 / 99);
            } else {
                add(0, 0, 1);
                add(11, 12, 1);
            }
            for (let first = 0; first <= maximum; first++) {
                const minimum = operation === 'gcd' && first === 0 ? 1 : 0;
                for (let second = minimum; second <= maximum; second++) {
                    add(first, second, 1 / ((maximum + 1) * (maximum - minimum + 1)));
                }
            }
            const uppers = operation === 'gcd' ? [5, 10, 20, 100] : [5, 10, 20, 100, 120, 1000];
            const candidates = uppers.flatMap(upper => commonRelationDomain({operation, range: createCanonicalNumericRange(upper)}));
            expect(candidates).toHaveLength(original.size);
            for (const candidate of candidates) expect(candidate.weight).toBeCloseTo(original.get(candidate.inputs.join(':'))!, 14);
            expect(candidates.reduce((sum, candidate) => sum + candidate.weight, 0)).toBeCloseTo(1, 12);
        }
    });
});
