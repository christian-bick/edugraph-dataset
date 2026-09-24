import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {CountingTenOffsetGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('counting-ten-offset spec', () => {
    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Scope.StepsOf10]));
        expect(new CountingTenOffsetGenerator().schema).not.toHaveProperty('stepMagnitude');
    });

    it('keeps the same payload family even when the target omits its family labels', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(new CountingTenOffsetGenerator(), [Scope.NumbersSmaller1000])!.data;
            expect(data.stepSize).toBe(10);
        }
    });
});
