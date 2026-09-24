import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {IntegerSubtractionCountingBackGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('integer-subtraction-counting-back spec', () => {
    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Area.SubtractionCountingBack]));
        expect(new IntegerSubtractionCountingBackGenerator().schema).not.toHaveProperty('strategy');
    });

    it('keeps the same payload family even when the target omits its family labels', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(new IntegerSubtractionCountingBackGenerator(), [])!.data;
            expect(data.strategy).toBe('subtraction-counting-back');
        }
    });
});
