import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {IntegerAdditionCountingOnGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('integer-addition-counting-on spec', () => {
    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Area.AdditionCountingOn]));
        expect(new IntegerAdditionCountingOnGenerator().schema).not.toHaveProperty('strategy');
    });

    it('keeps the same payload family even when the target omits its family labels', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(new IntegerAdditionCountingOnGenerator(), [])!.data;
            expect(data.strategy).toBe('addition-counting-on');
        }
    });
});
