import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {StandardAlgorithmDecimalDivisionGenerator} from './generator.ts';
import {spec} from './spec.ts';

const mathematics = [Area.DivisionStandardAlgorithm, Scope.DecimalNumbers, Scope.Base10,
    Scope.NumbersWithoutNegatives, Scope.MultipleDigitLargestOperand];

describe('standard decimal division schema', () => {
    it('owns the reviewed mathematical labels', () => expect(spec.generalLabels).toEqual(mathematics));
    it('resolves the actual broad Grade 6 target with no magnitude label', () => {
        const problem = generateWithLabels(new StandardAlgorithmDecimalDivisionGenerator(), [
            ...mathematics, Scope.ArabicNumerals, Ability.ProcedureExecution
        ])!;
        expect(problem.data.kind).toBe('decimal-standard-division');
        expect(problem.data.dividend.coefficient).toBeLessThanOrEqual(999999);
        expect(problem.labels).toEqual([]);
    });
    it.each([[Scope.NumbersSmaller100000, 100000], [Scope.NumbersSmaller1000000, 1000000]] as const)(
        'resolves real mathematical range %s', (label, bound) => {
            const problem = generateWithLabels(new StandardAlgorithmDecimalDivisionGenerator(), [...mathematics, label])!;
            expect(problem.labels).toEqual([label]);
            expect(problem.data.dividend.coefficient).toBeLessThanOrEqual(bound);
            expect(problem.data.quotient.coefficient).toBeLessThanOrEqual(bound);
        }
    );
    it('does not select the canonical relation from learner Ability', () => {
        setSeed(611);
        const first = generateWithLabels(new StandardAlgorithmDecimalDivisionGenerator(), [...mathematics, Ability.ProcedureExecution]);
        setSeed(611);
        expect(generateWithLabels(new StandardAlgorithmDecimalDivisionGenerator(), [...mathematics, Ability.ProcedureUnderstanding])).toEqual(first);
    });
});
