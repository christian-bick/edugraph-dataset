import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {StandardAlgorithmDecimalMultiplicationGenerator} from './generator.ts';
import {spec} from './spec.ts';

const mathematics = [Area.MultiplicationStandardAlgorithm, Scope.DecimalNumbers, Scope.Base10,
    Scope.NumbersWithoutNegatives, Scope.MultipleDigitLargestOperand];

describe('standard decimal multiplication schema', () => {
    it('owns the reviewed mathematical labels', () => expect(spec.generalLabels).toEqual(mathematics));
    it('resolves the real broad Grade 6 target without a magnitude label', () => {
        const problem = generateWithLabels(new StandardAlgorithmDecimalMultiplicationGenerator(), [
            ...mathematics, Scope.ArabicNumerals, Ability.ProcedureExecution
        ])!;
        expect(problem.data.kind).toBe('decimal-standard-multiplication');
        expect(problem.data.product.coefficient).toBeLessThanOrEqual(999999);
        expect(problem.labels).toEqual([]);
    });
    it.each([[Scope.NumbersSmaller100000, 100000], [Scope.NumbersSmaller1000000, 1000000]] as const)(
        'resolves real range capability %s', (label, bound) => {
            const problem = generateWithLabels(new StandardAlgorithmDecimalMultiplicationGenerator(), [...mathematics, label])!;
            expect(problem.labels).toEqual([label]);
            expect(problem.data.product.coefficient).toBeLessThanOrEqual(bound);
        }
    );
    it('does not select mathematics from the learner action', () => {
        setSeed(621);
        const first = generateWithLabels(new StandardAlgorithmDecimalMultiplicationGenerator(), [...mathematics, Ability.ProcedureExecution]);
        setSeed(621);
        expect(generateWithLabels(new StandardAlgorithmDecimalMultiplicationGenerator(), [...mathematics, Ability.ProcedureUnderstanding])).toEqual(first);
    });
});
