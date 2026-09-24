import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticWordProblemsLetterEquationGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('arithmetic-word-problems-letter-equation spec', () => {
    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Area.Equation]));
        expect(new ArithmeticWordProblemsLetterEquationGenerator().schema).not.toHaveProperty('task');
    });

    it('keeps the same payload family even when the target omits its family labels', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(new ArithmeticWordProblemsLetterEquationGenerator(), [Area.Addition, Scope.NumbersSmaller1000])!.data;
            expect(data.kind).toBe('letter-equation');
        }
    });
});
