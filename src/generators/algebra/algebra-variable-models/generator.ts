import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {AlgebraicNotation, AlgebraicScalar, AlgebraVariableMeaningProblem, ExactSymbolicExpressionNode as Node,
    VariableMeaningDomain, VariableMeaningQuantity} from '../../../types/problems.ts';
import {makeCoordinateNotation} from '../../coordinate/coordinate-helpers.ts';
import {makeSignedRational} from '../../number/signed-rational-helpers.ts';
import {addAffineScalars, multiplyAffineScalars} from '../algebra-affine-helpers.ts';
import {buildAlgebraVariableMeaningProblem} from '../algebra-variable-meaning-helpers.ts';
import {AlgebraVariableModelsGeneratorSchema, type AlgebraVariableModelsGeneratorConfig} from './spec.ts';

const generatorId = 'algebra-variable-models';
const integer = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));
const q = (numerator: number, denominator = 1): AlgebraicScalar => makeSignedRational(numerator, denominator);
const names = ['rational-numbers', 'integers', 'nonnegative-rational-numbers', 'nonnegative-integers'] as const;
const quantities = [
    {kind: 'number', referent: 'mathematical-number', unit: 'none'},
    {kind: 'count', referent: 'tokens-in-a-bag', unit: 'tokens'},
    {kind: 'length', referent: 'segment-length', unit: 'meters'}
] as const satisfies readonly VariableMeaningQuantity[];
const spelling = (value: AlgebraicScalar): AlgebraicNotation => {
    const form = integer(0, 2);
    if (form === 0 && value.denominator === 1) return makeCoordinateNotation(value, 'integer');
    if (form === 1) return makeCoordinateNotation(value, 'decimal', 2);
    return {kind: 'fraction', numerator: value.numerator * 2, denominator: value.denominator * 2};
};
const variable = (id: string, symbolId: string): Node => ({id, kind: 'variable', symbolId});
const number = (id: string, value: AlgebraicScalar, notation = spelling(value)): Node => ({id, kind: 'number', value, notation});
const add = (id: string, left: Node, right: Node): Node => ({id, kind: 'binary', operation: 'addition', left, right});
const multiply = (id: string, left: Node, right: Node): Node => ({id, kind: 'binary', operation: 'multiplication', left, right});

export class AlgebraVariableModelsGenerator implements ProblemGenerator<AlgebraVariableMeaningProblem, AlgebraVariableModelsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = AlgebraVariableModelsGeneratorSchema;

    generate(config: AlgebraVariableModelsGeneratorConfig): ProblemStub<AlgebraVariableMeaningProblem> {
        validateConfigFields(generatorId, config, ['role']);
        if (!config.role || !['particular-unknown', 'arbitrary-generalized-number'].includes(config.role)) {
            throw new GeneratorValidationError(generatorId, 'Choose a particular-value condition or an every-member claim.');
        }
        const quantity = quantities[integer(0, quantities.length - 1)]!;
        const name: VariableMeaningDomain['name'] = quantity.kind === 'count' ? 'nonnegative-integers'
            : quantity.kind === 'length' ? 'nonnegative-rational-numbers' : names[integer(0, names.length - 1)]!;
        const nonnegative = name.startsWith('nonnegative-'), integral = name.endsWith('integers');
        const domain: VariableMeaningDomain = {domainId: 'named-values', name, set: {kind: integral ? 'integer' : 'rational',
            lower: nonnegative ? {value: q(0), inclusive: true} : null, upper: null, excludedValues: []}};
        const symbol = {symbolId: 'primary-variable', symbol: quantity.kind === 'count' ? 'n' : 'x'};
        const atom = (id: string): Node => variable(id, symbol.symbolId);
        const parameter = q(integer(quantity.kind === 'count' ? 0 : -4, 6), quantity.kind === 'count' ? 1 : [1, 2, 4][integer(0, 2)]!);
        const parameterNotation = spelling(parameter), family = integer(0, 2);
        let left: Node, right: Node;
        if (config.role === 'particular-unknown') {
            const chosen = q(integer(nonnegative ? 0 : -4, 6), integral ? 1 : [1, 2, 4][integer(0, 2)]!);
            const coefficient = integer(2, 5), secondCoefficient = integer(1, coefficient - 1);
            if (family === 0) {
                left = add('left-sum', atom('left-variable'), number('left-parameter', parameter, parameterNotation));
                right = number('right-total', addAffineScalars(chosen, parameter));
            } else if (family === 1) {
                left = multiply('left-product', number('left-coefficient', q(coefficient)), atom('left-variable'));
                right = number('right-total', multiplyAffineScalars(q(coefficient), chosen));
            } else {
                left = add('left-sum', multiply('left-product', number('left-coefficient', q(coefficient)), atom('left-variable')),
                    number('left-parameter', parameter, parameterNotation));
                right = add('right-sum', multiply('right-product', number('right-coefficient', q(secondCoefficient)), atom('right-variable')),
                    number('right-total', addAffineScalars(multiplyAffineScalars(q(coefficient - secondCoefficient), chosen), parameter)));
            }
        } else if (family === 0) {
            left = add('left-sum', atom('left-variable'), number('left-parameter', parameter, parameterNotation));
            right = add('right-sum', number('right-parameter', parameter, parameterNotation), atom('right-variable'));
        } else if (family === 1) {
            left = add('left-sum', atom('left-first'), atom('left-second'));
            right = multiply('right-product', number('right-coefficient', q(2)), atom('right-variable'));
        } else {
            left = add('left-sum', atom('left-first'), {id: 'left-group', kind: 'group',
                expression: add('left-inner-sum', atom('left-second'), number('left-one', q(1)))});
            right = add('right-sum', multiply('right-product', number('right-coefficient', q(2)), atom('right-variable')),
                number('right-one', q(1)));
        }
        return {data: buildAlgebraVariableMeaningProblem({domain, symbol, quantity, role: config.role,
            expressions: [{expressionId: 'left-expression', root: left}, {expressionId: 'right-expression', root: right}]})};
    }
}
