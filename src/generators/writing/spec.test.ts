import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {setSeed} from '../../lib/random.ts';
import {generateWithLabels} from '../../lib/utils.ts';
import {WritingGenerator} from './generator.ts';

describe('WritingGenerator Spec Integration', () => {
    const generator = new WritingGenerator();

    it('should resolve NumbersWithZero into a zero numeral every time', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.DigitNotation,
                Scope.NumbersWithZero,
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBe(0);
            expect(stub!.tags).toContain(Scope.NumbersWithZero);
        }
    });

    it('should resolve NumbersWithoutZero into a nonzero numeral every time', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.DigitNotation,
                Scope.NumbersWithoutZero,
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThanOrEqual(1);
            expect(stub!.data.number).toBeLessThanOrEqual(20);
            expect(stub!.tags).toContain(Scope.NumbersWithoutZero);
        }
    });

    it('should resolve the inclusive NumbersSmaller120 boundary', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.DigitNotation,
                Scope.NumbersWithoutZero,
                Scope.NumbersSmaller120
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThanOrEqual(1);
            expect(stub!.data.number).toBeLessThanOrEqual(120);
            expect(stub!.tags).toContain(Scope.NumbersSmaller120);
        }
    });

    it('should resolve the inclusive NumbersSmaller1000 boundary', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [
                Area.DigitNotation,
                Scope.NumbersWithoutZero,
                Scope.NumbersSmaller1000
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThanOrEqual(1);
            expect(stub!.data.number).toBeLessThanOrEqual(1000);
            expect(stub!.tags).toContain(Scope.NumbersSmaller1000);
        }
    });
});
