import {beforeEach, describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {setSeed} from '../../../lib/random.ts';
import {CountingSequenceGenerator} from './generator.ts';

describe('CountingSequenceGenerator spec integration', () => {
    let generator: CountingSequenceGenerator;

    beforeEach(() => {
        generator = new CountingSequenceGenerator();
        setSeed(42);
    });

    it('resolves count-by-ones labels', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Scope.NumbersSmaller20,
            Scope.AdditiveCount
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.stepSize).toBe(1);
        expect(stub!.tags).toContain(Scope.AdditiveCount);
    });

    it('resolves skip-count-by-tens labels', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Scope.NumbersSmaller100,
            Scope.MultiplesOf10
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.stepSize).toBe(10);
        expect(stub!.tags).toContain(Scope.MultiplesOf10);
    });
});
