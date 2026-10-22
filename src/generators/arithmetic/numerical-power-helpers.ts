import {GeneratorValidationError} from '../../lib/errors.ts';
import type {ExactNumericExpressionConstraints, ExactNumericalExpressionNode, NumericalPowerExpressionProblem} from '../../types/problems.ts';
import {buildExactNumericCalculation, isExactNumericCalculation} from './exact-numeric-calculation-helpers.ts';

export {selectNextNumericReduction} from './exact-numeric-calculation-helpers.ts';

/** Strict power-family wrapper; the reusable numeric engine also supports ordinary calculations. */
export function buildNumericalPowerExpressionProblem(expression: ExactNumericalExpressionNode,
    constraints: ExactNumericExpressionConstraints): NumericalPowerExpressionProblem {
    const calculation = buildExactNumericCalculation(expression, constraints);
    if (calculation.powerFacts.length === 0) {
        throw new GeneratorValidationError('numerical-power-expressions', 'A numerical power expression needs at least one power.');
    }
    // Preserve this family's complete serialized contract, including insertion order.
    return {kind: 'numerical-power-expression', expression: calculation.expression, nodeValues: calculation.nodeValues,
        powerFacts: calculation.powerFacts as NumericalPowerExpressionProblem['powerFacts'],
        reductions: calculation.reductions as NumericalPowerExpressionProblem['reductions'], finalValue: calculation.finalValue,
        precedenceWitness: calculation.precedenceWitness};
}

export function isNumericalPowerExpressionProblem(value: unknown): value is NumericalPowerExpressionProblem {
    try {
        // Complete generic power facts already imply a nonempty exact reduction trace.
        return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'numerical-power-expression'
            && isExactNumericCalculation(value) && value.powerFacts.length > 0;
    } catch {
        return false;
    }
}
