import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {AlgebraicExpressionContext, AlgebraicExpressionProblem, AlgebraicScalar, AlgebraicStructuralRelation,
    AlgebraicSymbolDeclaration, AlgebraicUnit, ArithmeticOperation, ExactSymbolicExpressionNode} from '../../../types/problems.ts';
import {makeSignedRational} from '../../number/signed-rational-helpers.ts';
import {buildAlgebraicExpressionProblem} from '../algebra-expression-helpers.ts';
import {AlgebraExpressionsGeneratorSchema, type AlgebraExpressionsGeneratorConfig} from './spec.ts';
import {inputsMeetNumericProfile, profilesForRelation, type ExpressionInputs} from './numeric-profiles.ts';
import {numericExpressionCaseCount, numericExpressionInputsAt} from './numeric-domain.ts';

const generatorId = 'algebra-expressions';
const integer = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));
const value = (numerator: number, denominator = 1): AlgebraicScalar => makeSignedRational(numerator, denominator);
const notation = (n: AlgebraicScalar) => n.denominator === 1
    ? {kind: 'integer' as const, numeral: String(n.numerator)} : {kind: 'fraction' as const, ...n};
const literal = (id: string, n: number): ExactSymbolicExpressionNode => ({id, kind: 'number', value: value(n), notation: notation(value(n))});
const variable = (id: string, symbolId = 'x'): ExactSymbolicExpressionNode => ({id, kind: 'variable', symbolId});
const group = (id: string, expression: ExactSymbolicExpressionNode): ExactSymbolicExpressionNode => ({id, kind: 'group', expression});
const binary = (id: string, operation: ArithmeticOperation, left: ExactSymbolicExpressionNode,
    right: ExactSymbolicExpressionNode): ExactSymbolicExpressionNode => ({id, kind: 'binary', operation, left, right});
const symbol = (id = 'x', nonnegative = false): AlgebraicSymbolDeclaration => ({symbolId: id, symbol: id,
    domain: {kind: 'rational', lower: nonnegative ? {value: value(0), inclusive: true} : null, upper: null, excludedValues: []}});
const parameters = (symbolId = 'x'): AlgebraicExpressionContext => ({kind: 'parameter-description',
    parameters: [{symbolId, meaning: 'number'}], resultMeaning: 'number'});
const unit = (subject: AlgebraicUnit['subject'], name: string, currency = 0, time = 0): AlgebraicUnit =>
    ({subject, name, dimensions: {currency, time, count: 0, length: 0}});

/** Quantities define the same expression and a connected, dimensionally exact purchase relation. */
function purchase(): AlgebraicExpressionProblem {
    const fixed = literal('fixed', integer(1, 8)), rate = literal('rate', integer(1, 5));
    const duration = group('duration-group', variable('duration', 't'));
    const expression = binary('total', 'addition', fixed, binary('variable-charge', 'multiplication', rate, duration));
    const dollars = unit('money', 'dollars', 1), hours = unit('time', 'hours', 0, 1);
    const context: AlgebraicExpressionContext = {kind: 'quantitative-system', setting: 'purchase', quantities: [
        {quantityId: 'fixed', meaning: 'fixed-charge', unit: dollars, expression: fixed},
        {quantityId: 'rate', meaning: 'rate', unit: unit('money', 'dollars per hour', 1, -1), expression: rate},
        {quantityId: 'duration', meaning: 'duration', unit: hours, expression: duration},
        {quantityId: 'total', meaning: 'total-amount', unit: dollars, expression}
    ], relations: [{kind: 'fixed-and-proportional', resultId: 'total', fixedId: 'fixed', rateId: 'rate', inputId: 'duration'}],
    outputQuantityId: 'total', variableQuantities: [{symbolId: 't', quantityId: 'duration'}]};
    const input = value(integer(0, 12), integer(1, 4));
    return buildAlgebraicExpressionProblem({expression, symbols: [symbol('t', true)],
        bindings: [{symbolId: 't', value: input, notation: notation(input)}], structuralKind: 'symbolic', relation: 'sum', context});
}

function drawInputs(relation: string): ExpressionInputs {
    const inputs: ExpressionInputs = {a: integer(2, 9), b: integer(1, 6), c: integer(1, 5),
        input: value(integer(-8, 8), integer(1, 4))};
    if (relation === 'plain') inputs.operation = (['addition', 'subtraction', 'multiplication', 'division'] as const)[integer(0, 3)]!;
    return inputs;
}

function mathematicalInstance(config: Required<Pick<AlgebraExpressionsGeneratorConfig, 'relation' | 'power' | 'numericProfile'>>,
    inputs?: ExpressionInputs): AlgebraicExpressionProblem {
    if (config.relation === 'modeling') return purchase();
    const {a, b, c} = inputs!;
    let {input} = inputs!;
    let expression: ExactSymbolicExpressionNode;
    let relation: AlgebraicStructuralRelation['kind'];
    const groupedInput = () => group('input-group', variable('input'));
    if (config.relation === 'plain') {
        const operation = inputs!.operation!;
        if (operation === 'division' && input.numerator === 0) input = value(1, 2);
        expression = binary('root', operation, literal('constant', a), groupedInput());
        relation = operation === 'division' ? 'quotient' : operation === 'multiplication' ? 'product' : 'additive-components';
    } else if (config.relation.endsWith('-terms')) {
        expression = binary('sum', 'addition', binary('difference', 'subtraction',
            binary('first-product', 'multiplication', literal('first-coefficient', a), variable('first-x')),
            binary('second-product', 'multiplication', literal('second-coefficient', b), groupedInput())), literal('constant', c));
        relation = 'additive-components';
    } else if (config.relation === 'symbolic-coefficient') {
        const coefficient = ([-3, -1, 0, 1, 2, 5] as const)[integer(0, 5)]!;
        const term = coefficient === 1 ? variable('input') : coefficient === -1
            ? {id: 'negative-input', kind: 'negation' as const, operand: variable('input')}
            : binary('term-product', 'multiplication', literal('coefficient', coefficient), variable('input'));
        expression = binary('difference', 'subtraction', term, group('constant-group', literal('constant', b)));
        relation = 'coefficient';
    } else if (config.relation.endsWith('-sum')) {
        expression = binary('sum', 'addition', literal('constant', a), groupedInput());
        relation = 'sum';
    } else if (config.relation.endsWith('-quotient')) {
        if (input.numerator === 0) input = value(-1, 2);
        expression = binary('quotient', 'division', literal('numerator', a), groupedInput());
        relation = 'quotient';
    } else if (config.relation === 'substitution') {
        const inner = binary('inner-sum', 'addition', variable('first-x'), literal('offset', b));
        const base = group('base-group', inner);
        const exponent = integer(config.power === 'positive' ? 1 : 0, 3);
        if (config.power !== 'none' && exponent === 0 && input.numerator === -b * input.denominator) input = value(1, 2);
        const factor: ExactSymbolicExpressionNode = config.power === 'none' ? base : {id: 'power', kind: 'power', base, exponent};
        expression = binary('sum', 'addition', binary('product', 'multiplication', literal('coefficient', c), factor), variable('second-x'));
        relation = 'sum';
    } else {
        expression = binary('product', 'multiplication', literal('multiplier', a),
            group('sum-group', binary('inner-sum', 'addition', variable('input'), literal('offset', b))));
        relation = config.relation.endsWith('-factors') ? 'multiplicative-components' : 'product';
    }
    return buildAlgebraicExpressionProblem({expression, symbols: [symbol()], bindings: [{symbolId: 'x', value: input, notation: notation(input)}],
        structuralKind: config.relation.startsWith('numeric-') ? 'numeric' : 'symbolic', relation, context: parameters()});
}

export class AlgebraExpressionsGenerator implements ProblemGenerator<AlgebraicExpressionProblem, AlgebraExpressionsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = AlgebraExpressionsGeneratorSchema;

    generate(config: AlgebraExpressionsGeneratorConfig): ProblemStub<AlgebraicExpressionProblem> | null {
        validateConfigFields(generatorId, config, ['relation', 'power', 'numericProfile']);
        if (!config.relation || !config.power || !['plain', 'numeric-terms', 'symbolic-terms', 'numeric-factors', 'symbolic-factors', 'symbolic-coefficient',
            'numeric-sum', 'symbolic-sum', 'numeric-product', 'symbolic-product', 'numeric-quotient', 'symbolic-quotient',
            'numeric-grouped', 'symbolic-grouped', 'substitution', 'modeling'].includes(config.relation)
            || !['none', 'allow-zero', 'positive'].includes(config.power) || (config.relation !== 'substitution' && config.power !== 'none')
            || !profilesForRelation(config.relation).includes(config.numericProfile!)) {
            throw new GeneratorValidationError(generatorId, 'Choose a supported expression relation and its compatible power domain.');
        }
        const complete = {relation: config.relation, power: config.power, numericProfile: config.numericProfile!};
        if (config.relation.startsWith('numeric-')) {
            validateConfigFields(generatorId, config, ['range']);
            if (!config.range) throw new GeneratorValidationError(generatorId, 'Choose a feasible canonical structural numeric range.');
            const count = numericExpressionCaseCount(config.relation, config.numericProfile!, config.range);
            if (!count) throw new GeneratorValidationError(generatorId, 'Choose a feasible canonical structural numeric range.');
            const inputs = numericExpressionInputsAt(config.relation, config.numericProfile!,
                config.range, Math.floor(random() * count));
            return {data: mathematicalInstance(complete, inputs)};
        }
        if (config.range !== undefined && config.range !== false) {
            throw new GeneratorValidationError(generatorId, 'Symbolic expressions have no adopted numeric range.');
        }
        if (config.relation === 'modeling') return {data: mathematicalInstance(complete)};
        // The writer formerly selected its two conditional samplers through
        // sign/zero annotations. Keep their 50/50 mathematical mixture private
        // now that algebraic examples do not carry those classification labels.
        const numericProfile = config.relation === 'plain' && config.numericProfile === 0
            ? random() < 0.5 ? 3 : 4 : config.numericProfile!;
        // Condition the original raw draws before constructing a payload. The complete
        // finite parameter-domain proof establishes acceptance >= 1/100 for every profile.
        for (let attempt = 0; attempt < 4096; attempt++) {
            const inputs = drawInputs(config.relation);
            if (inputsMeetNumericProfile(config.relation, inputs, numericProfile)) {
                return {data: mathematicalInstance(complete, inputs)};
            }
        }
        return null;
    }
}
