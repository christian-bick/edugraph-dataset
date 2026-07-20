import {beforeEach, describe, expect, it} from 'vitest';
import {PlaceValueTeenGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../lib/utils.ts';

describe('PlaceValueTeenGenerator Spec Integration', () => {
    let generator: PlaceValueTeenGenerator;

    beforeEach(() => {
        generator = new PlaceValueTeenGenerator();
        setSeed(42);
    });

    it('should generate place value teen problems from general labels', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.Difference,
                Scope.NumbersSmaller20
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.ones).toBeGreaterThanOrEqual(1);
            expect(stub!.data.ones).toBeLessThanOrEqual(9);
            expect(stub!.data.target).toBe(10 + stub!.data.ones);
        }
    });
});
