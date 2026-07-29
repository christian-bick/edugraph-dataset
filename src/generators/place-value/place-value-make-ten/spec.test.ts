import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {PlaceValueMakeTenGenerator} from './generator.ts';

describe('PlaceValueMakeTenGenerator Spec Integration', () => {
    const generator = new PlaceValueMakeTenGenerator();

    it('should resolve NumbersWithZero into a zero addend every time', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [Area.Difference, Scope.NumbersWithZero]);
            expect(stub).not.toBeNull();
            expect([stub!.data.givenNumber, stub!.data.missingNumber]).toContain(0);
            expect(stub!.tags).toContain(Scope.NumbersWithZero);
        }
    });

    it('should resolve NumbersWithoutZero into nonzero addends every time', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, [Area.Difference, Scope.NumbersWithoutZero]);
            expect(stub).not.toBeNull();
            expect(stub!.data.givenNumber).toBeGreaterThanOrEqual(1);
            expect(stub!.data.missingNumber).toBeGreaterThanOrEqual(1);
            expect(stub!.tags).toContain(Scope.NumbersWithoutZero);
        }
    });
});
