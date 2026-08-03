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
            Scope.AdditiveCount
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('inc');
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects + 1);
        expect(stub!.tags).toContain(Scope.AdditiveCount);
    });

    it('resolves a decrement-by-one problem', () => {
        const stub = generateWithLabels(generator, [
            Area.NumerationWithIntegers,
            Scope.NumbersSmaller20,
            Scope.SubtractiveCount
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.incDecType).toBe('dec');
        expect(stub!.data.incDecAnswer).toBe(stub!.data.numObjects - 1);
        expect(stub!.tags).toContain(Scope.SubtractiveCount);
    });
});
