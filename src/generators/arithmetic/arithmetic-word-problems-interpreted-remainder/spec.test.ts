import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticWordProblemsInterpretedRemainderGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('arithmetic-word-problems-interpreted-remainder spec', () => {
    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Area.ImperfectDivisibility, Area.Modulo, Area.Division]));
        expect(new ArithmeticWordProblemsInterpretedRemainderGenerator().schema).not.toHaveProperty('task');
        expect(spec.generalLabels).not.toContain(Scope.MultiLevelComposition);
    });

    it('keeps the same payload family even when the target omits its family labels', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(new ArithmeticWordProblemsInterpretedRemainderGenerator(), [])!.data;
            expect(data.kind).toBe('interpreted-remainder');
        }
    });
});
