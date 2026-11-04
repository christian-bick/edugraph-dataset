import { beforeEach, describe, expect, it } from 'vitest';
import { CountingBasicGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Area, Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('CountingBasicGenerator Spec Integration', () => {
    let generator: CountingBasicGenerator;

    beforeEach(() => {
        generator = new CountingBasicGenerator();
        setSeed(42);
    });

    it('should generate correct counting stubs using labels', () => {
        const stub = generateWithLabels(generator, [
            Scope.NumbersSmaller10
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.numObjects).toBeGreaterThan(5);
        expect(stub!.data.numObjects).toBeLessThanOrEqual(10);
        expect(stub!.data.simpleAnswer).toBe(stub!.data.numObjects);
    });

    it('should respect range boundaries from labels', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.numObjects).toBeGreaterThan(10);
            expect(stub!.data.numObjects).toBeLessThanOrEqual(20);
        }
    });

    it('retains all positive through-five counts with a canonical no-lower profile', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Scope.NumbersSmaller5
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.numObjects).toBeGreaterThanOrEqual(1);
            expect(stub!.data.numObjects).toBeLessThanOrEqual(5);
            expect(stub!.data.countingNumbers).toEqual(Array.from({length: stub!.data.numObjects}, (_, index) => index + 1));
        }
    });

    it('resolves collection divisibility areas and complementary number scopes into matching counts', () => {
        for (const [area, scope, parity] of [
            [Area.EvenDivisibility, Scope.EvenNumbers, 'even'],
            [Area.UnevenDivisibility, Scope.OddNumbers, 'odd']
        ] as const) {
            const stub = generateWithLabels(generator, [
                area,
                scope,
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.parity).toBe(parity);
            expect(stub!.data.numObjects % 2).toBe(parity === 'even' ? 0 : 1);
            expect(stub!.labels).toEqual(expect.arrayContaining([area, scope]));
        }
    });

    it('rejects contradictory collection divisibility and number-scope labels', () => {
        expect(() => generateWithLabels(generator, [
            Area.EvenDivisibility,
            Scope.OddNumbers,
            Scope.NumbersSmaller20
        ])).toThrow();
    });

    it('resolves an unqualified request to a complete feasible mathematical configuration', () => {
        const stub = generateWithLabels(generator, [])!;
        expect(stub.data.kind).toBe('counting-enumeration');
        expect(stub.data.countingNumbers[0]).toBe(1);
        expect(stub.data.countingNumbers.at(-1)).toBe(stub.data.numObjects);
        expect(stub.labels.filter(label => [Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20]
            .includes(label as Scope))).toHaveLength(1);
        expect(stub.labels).not.toContain(Scope.NumbersLargerZero);
    });
});
