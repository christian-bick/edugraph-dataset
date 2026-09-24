import {spec} from './spec.ts';
import {spec as tenSpec} from '../counting-ten-offset/spec.ts';
import {spec as hundredSpec} from '../counting-hundred-offset/spec.ts';
import {CountingTenOffsetGenerator} from '../counting-ten-offset/generator.ts';
import {CountingHundredOffsetGenerator} from '../counting-hundred-offset/generator.ts';
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
        expect([...spec.generalLabels, ...stub!.labels]).toContain(Scope.AdditiveCount);
        expect([...spec.generalLabels, ...stub!.labels]).not.toContain(Area.Increment);
        expect([...spec.generalLabels, ...stub!.labels]).not.toContain(Scope.After);
        expect([...spec.generalLabels, ...stub!.labels]).toContain(Scope.StepsOf1);
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
        expect([...spec.generalLabels, ...stub!.labels]).toContain(Scope.SubtractiveCount);
        expect([...spec.generalLabels, ...stub!.labels]).not.toContain(Area.Decrement);
        expect([...spec.generalLabels, ...stub!.labels]).not.toContain(Scope.Before);
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
        expect([...spec.generalLabels, ...stub!.labels]).toContain(Scope.After);
    });

    it('preserves the complete successor-principle direction bundle', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Scope.NumbersSmaller20,
            Scope.AdditiveCount,
            Area.Increment,
            Scope.After,
            Scope.StepsOf1
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('inc');
        expect([...spec.generalLabels, ...stub!.labels]).toEqual(expect.arrayContaining([
            Scope.AdditiveCount,
            Area.Increment,
            Scope.After
        ]));
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
        expect([...spec.generalLabels, ...stub!.labels]).toContain(Scope.Before);
    });

    it('resolves direction and steps of ten independently through 100', () => {
        const stub = generateWithLabels(new CountingTenOffsetGenerator(), [
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
        expect([...tenSpec.generalLabels, ...stub!.labels]).toContain(Area.Increment);
        expect([...tenSpec.generalLabels, ...stub!.labels]).toContain(Scope.After);
        expect([...tenSpec.generalLabels, ...stub!.labels]).not.toContain(Scope.AdditiveCount);
        expect([...tenSpec.generalLabels, ...stub!.labels]).toContain(Scope.StepsOf10);
    });

    it('resolves a one-hundred step through 1000', () => {
        const stub = generateWithLabels(new CountingHundredOffsetGenerator(), [
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
        expect([...hundredSpec.generalLabels, ...stub!.labels]).toContain(Scope.StepsOf100);
    });
});
