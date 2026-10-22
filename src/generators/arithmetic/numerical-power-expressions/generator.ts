import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {ArithmeticOperation, ExactNumericalExpressionNode, ExactNumericExpressionConstraints, NumericalPowerExpressionProblem, SignedRational} from '../../../types/problems.ts';
import {makeSignedRational} from '../../number/signed-rational-helpers.ts';
import {buildNumericalPowerExpressionProblem} from '../numerical-power-helpers.ts';
import {NumericalPowerExpressionsGeneratorSchema, type NumericalPowerExpressionsGeneratorConfig} from './spec.ts';

const generatorId = 'numerical-power-expressions';
const constraints: ExactNumericExpressionConstraints = {domain: 'rational', maximumAbsoluteValue: {numerator: 100, denominator: 1},
    maximumNodes: 25, maximumDepth: 8, maximumExponent: 3};
const integer = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));
const literal = (id: string, value: SignedRational): ExactNumericalExpressionNode => ({id, kind: 'number', value,
    notation: value.denominator === 1 ? {kind: 'integer', numeral: String(value.numerator)} : {kind: 'fraction', ...value}});
const binary = (id: string, operation: ArithmeticOperation, left: ExactNumericalExpressionNode,
    right: ExactNumericalExpressionNode): ExactNumericalExpressionNode => ({id, kind: 'binary', operation, left, right});

function smallValue(maximum = 3, nonzero = false): SignedRational {
    const denominator = integer(1, 4);
    return makeSignedRational(integer(nonzero ? 1 : 0, maximum * denominator) * (random() < 0.5 ? -1 : 1), denominator);
}

function power(id: string, exponent: number, maximum = 3): ExactNumericalExpressionNode {
    return {id, kind: 'power', base: literal(`${id}-base`, smallValue(maximum, exponent === 0)), exponent};
}

function mixedExpression(positive: boolean): ExactNumericalExpressionNode {
    const exponent = integer(positive ? 1 : 0, 3);
    const scenario = integer(0, 5);
    if (scenario === 0) return binary('sum', 'addition', literal('a', smallValue()),
        binary('product', 'multiplication', literal('b', smallValue()), power('power', exponent)));
    if (scenario === 1) return binary('sum', 'addition',
        binary('left-sum', 'addition', literal('a', smallValue()), literal('b', smallValue())),
        binary('product', 'multiplication', literal('k', smallValue(2)), power('power', exponent)));
    if (scenario === 2) {
        const sign = random() < 0.5 ? -1 : 1;
        const first = smallValue(2, true), second = smallValue(2, true);
        const base = binary('base-sum', 'addition', literal('a', {...first, numerator: Math.abs(first.numerator) * sign}),
            literal('b', {...second, numerator: Math.abs(second.numerator) * sign}));
        return binary('difference', 'subtraction', {id: 'power', kind: 'power', base: {id: 'base-group', kind: 'group', expression: base}, exponent},
            literal('c', smallValue()));
    }
    if (scenario === 3) {
        const divisors = [makeSignedRational(1, 2), makeSignedRational(1, 1), makeSignedRational(3, 2), makeSignedRational(2, 1), makeSignedRational(3, 1)];
        return binary('sum', 'addition', binary('quotient', 'division', power('power', exponent),
            literal('divisor', divisors[integer(0, divisors.length - 1)]!)), literal('b', smallValue()));
    }
    if (scenario === 4) return binary('sum', 'addition',
        binary('left-sum', 'addition', literal('a', smallValue()), binary('product', 'multiplication', literal('b', smallValue(2)),
            power('first-power', positive ? exponent : 0, 2))), power('second-power', integer(1, 3)));
    return binary('sum', 'addition', power('power', exponent), binary('product', 'multiplication',
        binary('quotient', 'division', literal('b', smallValue()), literal('divisor', makeSignedRational(integer(1, 3), 2))),
        literal('k', smallValue())));
}

export class NumericalPowerExpressionsGenerator implements ProblemGenerator<NumericalPowerExpressionProblem, NumericalPowerExpressionsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = NumericalPowerExpressionsGeneratorSchema;

    generate(config: NumericalPowerExpressionsGeneratorConfig): ProblemStub<NumericalPowerExpressionProblem> {
        validateConfigFields(generatorId, config, ['structure', 'exponents']);
        if ((config.structure !== 'single-power' && config.structure !== 'mixed-precedence')
            || (config.exponents !== 'allow-zero' && config.exponents !== 'positive')) {
            throw new GeneratorValidationError(generatorId, 'Choose a supported mathematical expression structure and exponent domain.');
        }
        const positive = config.exponents === 'positive';
        const expression = config.structure === 'single-power' ? power('power', integer(positive ? 1 : 0, 3)) : mixedExpression(positive);
        return {data: buildNumericalPowerExpressionProblem(expression, constraints)};
    }
}
