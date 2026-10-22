import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {StandardAlgorithmDecimalAddSubtractGenerator} from './generator.ts';
import {spec} from './spec.ts';

const common = [Scope.DecimalNumbers, Scope.Base10, Scope.NumbersWithoutNegatives, Scope.MultipleDigitLargestOperand];

describe('decimal standard add/sub capability resolution', () => {
    it('keeps the reviewed mathematical invariants on the producer', () => {
        expect(spec.generalLabels).toEqual(common);
    });

    it.each([[Area.AdditionStandardAlgorithm, 'addition'], [Area.SubtractionStandardAlgorithm, 'subtraction']] as const)(
        'resolves the actual Grade6 operation %s exactly', (label, operation) => {
            const problem = generateWithLabels(new StandardAlgorithmDecimalAddSubtractGenerator(), [
                ...common, label, Scope.ArabicNumerals, Ability.ProcedureExecution
            ])!;
            expect(problem.data.operation).toBe(operation);
            expect(problem.labels).toContain(label);
            expect(Math.max(problem.data.top.scale, problem.data.bottom.scale)).toBeGreaterThan(0);
        });

    it.each([[Scope.NumbersSmaller100000, 100000], [Scope.NumbersSmaller1000000, 1000000]] as const)(
        'resolves the real magnitude constraint %s', (label, cap) => {
            const problem = generateWithLabels(new StandardAlgorithmDecimalAddSubtractGenerator(), [...common, Area.AdditionStandardAlgorithm, label])!;
            expect(problem.labels).toContain(label);
            expect(problem.data.result.coefficient).toBeLessThanOrEqual(cap);
        });

    it('keeps exact canonical generation independent of the requested learner action', () => {
        setSeed(95);
        const execution = generateWithLabels(new StandardAlgorithmDecimalAddSubtractGenerator(), [...common, Area.AdditionStandardAlgorithm, Ability.ProcedureExecution]);
        setSeed(95);
        expect(generateWithLabels(new StandardAlgorithmDecimalAddSubtractGenerator(), [...common, Area.AdditionStandardAlgorithm, Ability.ProcedureUnderstanding])).toEqual(execution);
    });
});
