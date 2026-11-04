import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {CountingTotalGenerator} from './generator.ts';

describe('CountingTotalGenerator label resolution', () => {
    const generator = new CountingTotalGenerator();

    it.each([
        {label: Scope.NumbersSmaller5, lower: undefined, first: 1, last: 4},
        {label: Scope.NumbersSmaller10, lower: Scope.NumbersLarger5, first: 6, last: 9},
        {label: Scope.NumbersSmaller20, lower: Scope.NumbersLarger10, first: 11, last: 19}
    ])('completes the strongest lower profile for $label before sampling', ({label, lower, first, last}) => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [label])!;
            expect(stub.data.kind).toBe('counting-total');
            expect(stub.data.numObjects).toBeGreaterThanOrEqual(first);
            expect(stub.data.numObjects).toBeLessThanOrEqual(last);
            expect(stub.data.simpleAnswer).toBe(stub.data.numObjects);
            expect(stub.data).not.toHaveProperty('countingNumbers');
            expect(stub.labels).toContain(label);
            if (lower) expect(stub.labels).toContain(lower);
            else expect(stub.labels).not.toContain(Scope.NumbersLarger5);
        }
    });

    it.each([
        [Area.EvenDivisibility, Scope.EvenNumbers, 'even'],
        [Area.UnevenDivisibility, Scope.OddNumbers, 'odd']
    ] as const)('preserves total parity for %s/%s', (area, scope, parity) => {
        const stub = generateWithLabels(generator, [area, scope, Scope.NumbersSmaller20])!;
        expect(stub.data.parity).toBe(parity);
        expect(stub.data.numObjects % 2).toBe(parity === 'even' ? 0 : 1);
        expect(stub.labels).toEqual(expect.arrayContaining([area, scope, Scope.NumbersLarger10]));
    });

    it('supports an unqualified canonical fallback without a hidden enumeration', () => {
        const stub = generateWithLabels(generator, [])!;
        expect(stub.data.kind).toBe('counting-total');
        expect(stub.data).not.toHaveProperty('countingNumbers');
        expect([5, 10, 20]).not.toContain(stub.data.numObjects);
        expect(stub.labels).not.toContain(Scope.NumbersLargerZero);
    });

    it('rejects contradictory total parity claims', () => {
        expect(() => generateWithLabels(generator, [Area.EvenDivisibility, Scope.OddNumbers, Scope.NumbersSmaller10])).toThrow();
    });
});
