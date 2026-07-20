import {beforeEach, describe, expect, it} from 'vitest';
import {WritingGenerator} from './generator.ts';
import {setSeed} from '../../lib/random.ts';
import {Area, Scope} from 'edugraph-ts';
import {generateWithLabels} from '../../lib/utils.ts';

describe('WritingGenerator Spec Integration', () => {
    let generator: WritingGenerator;

    beforeEach(() => {
        generator = new WritingGenerator();
        setSeed(42);
    });

    it('should generate writing problems matching general labels and spec ranges', () => {
        for (let i = 0; i < 20; i++) {
            const stub = generateWithLabels(generator, [
                Area.DigitNotation,
                Scope.NumbersSmaller10
            ]);
            expect(stub).not.toBeNull();
            expect(stub!.data.number).toBeGreaterThanOrEqual(1);
            expect(stub!.data.number).toBeLessThanOrEqual(9);
        }
    });
});
