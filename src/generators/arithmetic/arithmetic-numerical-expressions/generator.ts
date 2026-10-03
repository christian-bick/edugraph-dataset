import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {NumericalExpressionNode, NumericalExpressionProblem} from '../../../types/problems.ts';
import {
    ArithmeticNumericalExpressionsGeneratorConfig,
    ArithmeticNumericalExpressionsGeneratorSchema
} from './spec.ts';

type ExpressionOperation = 'addition' | 'subtraction' | 'multiplication';

const randomInteger = (min: number, max: number): number =>
    min + Math.floor(random() * (max - min + 1));

const number = (value: number): NumericalExpressionNode => ({kind: 'number', value});

const operation = (
    kind: ExpressionOperation,
    left: NumericalExpressionNode,
    right: NumericalExpressionNode
): NumericalExpressionNode => ({
    kind: 'operation',
    operation: kind,
    left,
    right,
    value: kind === 'addition' ? left.value + right.value
        : kind === 'subtraction' ? left.value - right.value : left.value * right.value
});

const group = (expression: NumericalExpressionNode): NumericalExpressionNode => ({
    kind: 'group', expression, value: expression.value
});

/** The group changes precedence: factor × (a ± b) differs from factor × a ± b. */
function groupedExpression(): NumericalExpressionProblem {
    const factor = randomInteger(2, 5);
    const first = randomInteger(16, 70);
    const second = randomInteger(2, Math.min(30, first - 2));
    const innerOperation = random() < 0.5 ? 'addition' : 'subtraction';
    const reference = operation(innerOperation, number(first), number(second));
    return {
        expression: operation('multiplication', number(factor), group(reference)),
        multiplicativeComparison: {reference, factor}
    };
}

/** A two-step calculation with no grouping claim or evaluation-order override. */
function ungroupedExpression(): NumericalExpressionProblem {
    const first = number(randomInteger(2, 10));
    const second = number(randomInteger(2, 10));
    const third = number(randomInteger(2, 10));
    const reference = operation('multiplication', second, third);
    return {
        expression: operation('multiplication', first, reference),
        multiplicativeComparison: {reference, factor: first.value}
    };
}

export class ArithmeticNumericalExpressionsGenerator implements ProblemGenerator<
    NumericalExpressionProblem,
    ArithmeticNumericalExpressionsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticNumericalExpressionsGeneratorSchema;

    generate(config: ArithmeticNumericalExpressionsGeneratorConfig): ProblemStub<NumericalExpressionProblem> | null {
        validateConfigFields('arithmetic-numerical-expressions', config, ['structure']);
        if (config.structure === 'grouped') return {data: groupedExpression()};
        if (config.structure === 'ungrouped') return {data: ungroupedExpression()};
        return null;
    }
}
