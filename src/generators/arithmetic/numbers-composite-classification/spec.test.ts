import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {NumbersCompositeClassificationGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('numbers-composite-classification spec', () => {
    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Area.CompositeNumbers]));
        expect(new NumbersCompositeClassificationGenerator().schema).not.toHaveProperty('task');
    });

    it('keeps the same payload family even when the target omits its family labels', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(new NumbersCompositeClassificationGenerator(), [])!.data;
            expect(data.classification).toBe('composite');
        }
    });
});
