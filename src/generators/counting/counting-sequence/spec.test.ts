import {beforeEach, describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {setSeed} from '../../../lib/random.ts';
import {CountingSequenceGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('CountingSequenceGenerator spec integration', () => {
    let generator: CountingSequenceGenerator;

    beforeEach(() => {
        generator = new CountingSequenceGenerator();
        setSeed(42);
    });

    it('declares its invariant forward sequence direction', () => {
        expect(spec.generalLabels).toContain(Scope.After);
    });

    it('resolves steps-of-one labels independently from direction', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Scope.After,
            Scope.StepsOf1,
            Scope.NumbersSmaller120
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.stepSize).toBe(1);
        expect(stub!.data.sequence.at(-1)).toBeLessThanOrEqual(120);
        expect(stub!.tags).toContain(Scope.StepsOf1);
    });

    it('resolves steps-of-ten labels independently from direction', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Scope.After,
            Scope.NumbersSmaller100,
            Scope.StepsOf10,
            Scope.MultiplesOf10
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.stepSize).toBe(10);
        expect(stub!.data.sequence.every(value => value % 10 === 0)).toBe(true);
        expect(stub!.tags).toContain(Scope.StepsOf10);
        expect(stub!.tags).toContain(Scope.MultiplesOf10);
    });
});
