import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {NumbersPrimeClassificationGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('numbers-prime-classification spec', () => {
    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Area.PrimeNumbers]));
        expect(new NumbersPrimeClassificationGenerator().schema).not.toHaveProperty('task');
    });

    it('keeps the same payload family even when the target omits its family labels', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(new NumbersPrimeClassificationGenerator(), [])!.data;
            expect(data.classification).toBe('prime');
        }
    });
});
