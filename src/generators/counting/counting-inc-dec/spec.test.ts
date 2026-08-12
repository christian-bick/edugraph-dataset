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
            Scope.NumbersSmaller10,
            Scope.AdditiveCount,
            Scope.StepsOf1
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('inc');
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects + 1);
        expect(stub!.tags).toContain(Scope.AdditiveCount);
        expect(stub!.tags).toContain(Scope.StepsOf1);
    });

    it('resolves a decrement-by-one problem', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Scope.NumbersSmaller20,
            Scope.SubtractiveCount,
            Scope.StepsOf1
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('dec');
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects - 1);
        expect(stub!.tags).toContain(Scope.SubtractiveCount);
    });

    it('resolves a subsequent position as an increment', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Scope.NumbersSmaller20,
            Scope.After,
            Scope.StepsOf1
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('inc');
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects + 1);
        expect(stub!.tags).toContain(Scope.After);
    });

    it('resolves a preceding position as a decrement', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Scope.NumbersSmaller20,
            Scope.Before,
            Scope.StepsOf1
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('dec');
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects - 1);
        expect(stub!.tags).toContain(Scope.Before);
    });

    it('resolves direction and steps of ten independently through 100', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Area.Increment,
            Scope.NumbersLarger10,
            Scope.NumbersSmaller100,
            Scope.StepsOf10
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('inc');
        expect(stub!.data.stepSize).toBe(10);
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects + 10);
        expect(stub!.data.startPlaceValue.ones).toBe(stub!.data.resultPlaceValue.ones);
        expect(stub!.tags).toContain(Area.Increment);
        expect(stub!.tags).toContain(Scope.StepsOf10);
    });

    it('resolves a one-hundred step through 1000', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Area.Increment,
            Scope.NumbersLarger100,
            Scope.NumbersSmaller1000,
            Scope.StepsOf100
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.stepSize).toBe(100);
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects + 100);
        expect(stub!.data.resultPlaceValue.tens).toBe(stub!.data.startPlaceValue.tens);
        expect(stub!.data.resultPlaceValue.ones).toBe(stub!.data.startPlaceValue.ones);
        expect(stub!.tags).toContain(Scope.StepsOf100);
    });
});
