import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticWordProblemsRoundingGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('arithmetic-word-problems-rounding spec', () => {
    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Area.IntegerRounding]));
        expect(new ArithmeticWordProblemsRoundingGenerator().schema).not.toHaveProperty('task');
    });

    it('keeps the same payload family even when the target omits its family labels', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(new ArithmeticWordProblemsRoundingGenerator(), [Area.Addition, Scope.NumbersSmaller1000])!.data;
            expect(data.kind).toBe('rounding');
        }
    });
});
