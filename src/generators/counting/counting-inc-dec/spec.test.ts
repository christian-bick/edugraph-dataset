import {beforeEach, describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {setSeed} from '../../../lib/random.ts';
import {CountingIncDecGenerator} from './generator.ts';

describe('CountingIncDecGenerator spec integration', () => {
    let generator: CountingIncDecGenerator;

    beforeEach(() => {
        generator = new CountingIncDecGenerator();
        setSeed(42);
    });

    it('resolves an increment-by-one problem', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Area.Increment,
            Scope.NumbersSmaller10,
            Scope.AdditiveCount
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('inc');
        expect(stub!.data.stepSize).toBe(1);
        expect(stub!.tags).toEqual(expect.arrayContaining([Area.Increment, Scope.AdditiveCount]));
    });

    it('resolves a decrement-by-one problem', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Area.Decrement,
            Scope.NumbersSmaller20,
            Scope.SubtractiveCount
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('dec');
        expect(stub!.data.stepSize).toBe(1);
    });

    it('resolves increment and decrement by ten within 100', () => {
        for (const direction of [Area.Increment, Area.Decrement]) {
            const stub = generateWithLabels(generator, [
                Area.NumerationWithIntegers,
                direction,
                Scope.NumbersSmaller100,
                Scope.DerivedCount
            ]);

            expect(stub).not.toBeNull();
            expect(stub!.data.stepSize).toBe(10);
            expect(Math.abs(stub!.data.incDecAnswer - stub!.data.numObjects)).toBe(10);
        }
    });
});
