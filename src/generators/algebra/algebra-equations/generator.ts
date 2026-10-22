import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {AlgebraicEquationProblem, AlgebraicNotation, AlgebraicScalar, AlgebraicUnit, ElementaryEquationContext,
    ExactEquation, StatementAmbientDomain, StatementCandidate} from '../../../types/problems.ts';
import {makeSignedRational} from '../../number/signed-rational-helpers.ts';
import {makeCoordinateNotation} from '../../coordinate/coordinate-helpers.ts';
import {addAffineScalars, divideAffineScalars, multiplyAffineScalars, subtractAffineScalars} from '../algebra-affine-helpers.ts';
import {buildAlgebraicEquationProblem} from '../algebra-statement-helpers.ts';
import {AlgebraEquationsGeneratorSchema, type AlgebraEquationsGeneratorConfig} from './spec.ts';

const generatorId = 'algebra-equations';
const integer = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));
const q = (n: number, d = 1): AlgebraicScalar => makeSignedRational(n, d);
const scalar = (signed: boolean, positive = false): AlgebraicScalar => q(integer(positive ? 1 : signed ? -6 : 0, 8), [1, 2, 4, 5][integer(0, 3)]!);
const notation = (value: AlgebraicScalar): AlgebraicNotation => {
    const form = integer(0, 2);
    if (form === 0 && value.denominator === 1) return makeCoordinateNotation(value, 'integer');
    if (form === 1 && 100 % value.denominator === 0) return makeCoordinateNotation(value, 'decimal', 2);
    return {kind: 'fraction', numerator: value.numerator * 2, denominator: value.denominator * 2};
};
const unit = (subject: AlgebraicUnit['subject'], name: string, currency = 0, time = 0): AlgebraicUnit =>
    ({subject, name, dimensions: {currency, time, count: 0, length: 0}});
const numberUnit = unit('number', 'number'), money = unit('money', 'dollars', 1), duration = unit('time', 'hours', 0, 1), rate = unit('money', 'dollars per hour', 1, -1);
const numericDomain = (nonnegative: boolean): StatementAmbientDomain => ({kind: 'numeric', values: {kind: 'rational',
    lower: nonnegative ? {value: q(0), inclusive: true} : null, upper: null, excludedValues: []}});

export class AlgebraEquationsGenerator implements ProblemGenerator<AlgebraicEquationProblem, AlgebraEquationsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = AlgebraEquationsGeneratorSchema;

    generate(config: AlgebraEquationsGeneratorConfig): ProblemStub<AlgebraicEquationProblem> {
        validateConfigFields(generatorId, config, ['relation']);
        if (!config.relation || !['instantiated-predicate', 'finite-extension', 'nonnegative-sum-preimage', 'nonnegative-product-preimage'].includes(config.relation)) {
            throw new GeneratorValidationError(generatorId, 'Choose an actual elementary equation relation and domain.');
        }
        const quantitative = config.relation.startsWith('nonnegative-');
        let operation: 'addition' | 'multiplication' = config.relation === 'nonnegative-sum-preimage' ? 'addition'
            : config.relation === 'nonnegative-product-preimage' ? 'multiplication' : random() < 0.5 ? 'addition' : 'multiplication';
        let parameter = scalar(!quantitative, quantitative && operation === 'multiplication'), total = scalar(!quantitative);
        if (config.relation === 'finite-extension') {
            const degeneracy = integer(0, 3);
            if (degeneracy < 2) { operation = 'multiplication'; parameter = q(0); total = degeneracy === 0 ? q(0) : q(integer(1, 4)); }
        }
        if (quantitative) {
            const input = scalar(false);
            total = operation === 'addition' ? addAffineScalars(parameter, input) : multiplyAffineScalars(parameter, input);
        }
        const parameterNotation = notation(parameter), totalNotation = notation(total);
        const variable = {symbolId: 'x', symbol: 'x'} as const;
        const atom = {id: 'variable-x', kind: 'variable', symbolId: variable.symbolId} as const;
        const constant = {id: 'parameter', kind: 'number', value: parameter, notation: parameterNotation} as const;
        const statement: ExactEquation = {operator: 'equal', left: {id: 'left-expression', kind: 'binary', operation,
            left: operation === 'addition' ? atom : constant, right: operation === 'addition' ? constant : atom},
        right: {id: 'total', kind: 'number', value: total, notation: totalNotation}};
        const values = quantitative ? [q(0), q(1, 2), q(1), q(3, 2), q(2)] : [q(-2), q(-1, 2), q(0), q(1, 2), q(2)];
        if (random() < 0.65 && (operation === 'addition' || parameter.numerator !== 0)) {
            values.push(operation === 'addition' ? subtractAffineScalars(total, parameter) : divideAffineScalars(total, parameter));
        }
        const unique = [...new Map(values.map(value => [`${value.numerator}/${value.denominator}`, value])).values()];
        const candidates = unique.map((value, index): StatementCandidate => ({id: `candidate-${index}`, value, notation: notation(value)}));
        const candidateUniverse: readonly [StatementCandidate, ...StatementCandidate[]] = [candidates[0]!, ...candidates.slice(1)];
        const given = candidates[integer(0, candidates.length - 1)]!;
        const ambientDomain: StatementAmbientDomain = config.relation === 'finite-extension'
            ? {kind: 'finite', values: [unique[0]!, ...unique.slice(1)]} : numericDomain(quantitative);
        const context: ElementaryEquationContext = !quantitative ? {kind: 'number-relation', relationship: operation === 'addition' ? 'sum' : 'scaled-value',
            variableQuantity: {quantityId: 'input', meaning: 'input-number', unit: numberUnit},
            constantQuantity: {quantityId: 'constant', meaning: operation === 'addition' ? 'added-number' : 'scale-factor', unit: numberUnit, value: parameter, notation: parameterNotation},
            resultQuantity: {quantityId: 'result', meaning: 'resulting-number', unit: numberUnit, value: total, notation: totalNotation}}
            : operation === 'addition' ? {kind: 'combined-amounts', variableQuantity: {quantityId: 'initial', meaning: 'initial-amount', unit: money},
                addedQuantity: {quantityId: 'added', meaning: 'added-amount', unit: money, value: parameter, notation: parameterNotation},
                totalQuantity: {quantityId: 'total', meaning: 'total-amount', unit: money, value: total, notation: totalNotation}}
                : {kind: 'equal-groups', variableQuantity: {quantityId: 'duration', meaning: 'duration', unit: duration},
                    multiplierQuantity: {quantityId: 'rate', meaning: 'rate', unit: rate, value: parameter, notation: parameterNotation},
                    totalQuantity: {quantityId: 'total', meaning: 'total-amount', unit: money, value: total, notation: totalNotation}};
        return {data: buildAlgebraicEquationProblem({variable, ambientDomain, statement, candidateUniverse,
            assignment: {symbolId: variable.symbolId, value: given.value, notation: given.notation}, context})};
    }
}
