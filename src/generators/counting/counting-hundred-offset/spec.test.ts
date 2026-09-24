import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {CountingHundredOffsetGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('counting-hundred-offset spec', () => {
    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Scope.StepsOf100]));
        expect(new CountingHundredOffsetGenerator().schema).not.toHaveProperty('stepMagnitude');
    });

    it('keeps the same payload family even when the target omits its family labels', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(new CountingHundredOffsetGenerator(), [Scope.NumbersSmaller1000])!.data;
            expect(data.stepSize).toBe(100);
        }
    });
});
