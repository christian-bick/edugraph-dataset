import {beforeEach, describe, expect, it} from 'vitest';
import {PlaceValueMakeTenGenerator} from './generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../../lib/utils.ts';

describe('PlaceValueMakeTenGenerator Spec Integration', () => {
    let generator: PlaceValueMakeTenGenerator;

    beforeEach(() => {
        generator = new PlaceValueMakeTenGenerator();
        setSeed(42);
    });

    it('should generate make-ten problems with zero when requested', () => {
        let hasZero = false;
        let hasNine = false;

        for (let i = 0; i < 50; i++) {
            const stub = generateWithLabels(generator, [
                Area.Difference,
                Scope.NumbersWithZero
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.givenNumber).toBeGreaterThanOrEqual(0);
            expect(stub!.data.givenNumber).toBeLessThanOrEqual(10);
            if (stub!.data.givenNumber === 0) hasZero = true;
            if (stub!.data.givenNumber === 9) hasNine = true;
        }

        expect(hasZero).toBe(true);
        expect(hasNine).toBe(true);
    });

    it('should generate make-ten problems without zero when requested', () => {
        for (let i = 0; i < 50; i++) {
            const stub = generateWithLabels(generator, [
                Area.Difference,
                Scope.NumbersWithoutZero
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.givenNumber).toBeGreaterThanOrEqual(1);
            expect(stub!.data.givenNumber).toBeLessThanOrEqual(9);
        }
    });
});
