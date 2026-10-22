import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AffineExpression, AffineNormalizationProof, AlgebraicScalar, AlgebraVariableMeaningProblem,
    CommonAffineDomain, ExactAffineNormalForm, ExactCoefficientArithmetic, VariableMeaningDomain,
    VariableMeaningQuantity, VariableMeaningSymbol} from '../../types/problems.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';
import {affineCoefficientArithmetic, equalAffineNormalForms, equalAffineScalars, isAffineExpression,
    isAffineNormalizationProof, isCommonAffineDomain, isExactAffineNormalForm, negateAffineScalar,
    normalizeAffineExpression} from './algebra-affine-helpers.ts';
import {inspectAlgebraicExpression, isAlgebraicDomainMember, isAlgebraicVariableDomain} from './algebra-syntax-helpers.ts';
import {buildStatementAssignmentCheck, isStatementAssignmentCheck} from './algebra-statement-core-helpers.ts';

export type VariableMeaningExpressionInput = Readonly<Pick<AffineExpression, 'expressionId' | 'root'>>;
export type VariableMeaningBuildInput = Readonly<{
    domain: VariableMeaningDomain;
    symbol: VariableMeaningSymbol;
    quantity: VariableMeaningQuantity;
    expressions: readonly [VariableMeaningExpressionInput, VariableMeaningExpressionInput];
    role: 'particular-unknown' | 'arbitrary-generalized-number';
}>;
type Core = Pick<AlgebraVariableMeaningProblem, 'domain' | 'symbol' | 'quantity' | 'proofDomain' | 'expressions' | 'relation'>;
const fail = (message: string): never => { throw new GeneratorValidationError('algebra-variable-models', message); };
const require: (condition: unknown, message?: string) => asserts condition = (condition, message = 'Invalid exact variable-meaning evidence.') => {
    if (!condition) fail(message);
};
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.trim() === value;
const dense = (value: unknown): value is unknown[] => {
    if (!Array.isArray(value)) return false;
    for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
};
const zero: AlgebraicScalar = {numerator: 0, denominator: 1};
const allRationals = () => ({kind: 'rational' as const, lower: null, upper: null, excludedValues: []});

/** These four infinite sets make the displayed domain and its all-Q inclusion exact. */
function namedDomain(value: unknown): value is VariableMeaningDomain {
    if (!record(value) || !text(value.domainId) || typeof value.name !== 'string' || !isAlgebraicVariableDomain(value.set)) return false;
    const definitions = {
        'rational-numbers': ['rational', false], integers: ['integer', false],
        'nonnegative-rational-numbers': ['rational', true], 'nonnegative-integers': ['integer', true]
    } as const;
    if (!Object.hasOwn(definitions, value.name)) return false;
    const [kind, nonnegative] = definitions[value.name as keyof typeof definitions];
    return value.set.kind === kind && value.set.upper === null && value.set.excludedValues.length === 0
        && (nonnegative ? value.set.lower !== null && value.set.lower.inclusive && equalAffineScalars(value.set.lower.value, zero)
            : value.set.lower === null);
}

function inspectCore(value: unknown): Core {
    require(record(value) && namedDomain(value.domain) && record(value.symbol) && text(value.symbol.symbolId) && text(value.symbol.symbol));
    require(isCommonAffineDomain(value.proofDomain) && value.proofDomain.symbols.length === 1 && value.proofDomain.domainId !== value.domain.domainId);
    const proofDomain = value.proofDomain, declaration = proofDomain.symbols[0];
    require(declaration.symbolId === value.symbol.symbolId && declaration.symbol === value.symbol.symbol);
    require(record(value.quantity));
    const quantity = value.quantity;
    require(quantity.kind === 'number' ? quantity.referent === 'mathematical-number' && quantity.unit === 'none'
        : quantity.kind === 'count' ? quantity.referent === 'tokens-in-a-bag' && quantity.unit === 'tokens' && value.domain.name === 'nonnegative-integers'
            : quantity.kind === 'length' && quantity.referent === 'segment-length' && quantity.unit === 'meters' && value.domain.name === 'nonnegative-rational-numbers');
    require(dense(value.expressions) && value.expressions.length === 2);
    for (const expression of value.expressions) require(isAffineExpression(expression, value.proofDomain));
    const expressions = value.expressions as unknown as Core['expressions'];
    require(expressions[0].expressionId !== expressions[1].expressionId && record(value.relation)
        && value.relation.leftExpressionId === expressions[0].expressionId && value.relation.rightExpressionId === expressions[1].expressionId);
    require(expressions.some(expression => inspectAlgebraicExpression(expression.root, proofDomain.symbols).some(node => node.kind === 'variable')),
        'The original relation must contain its declared primary variable.');
    return value as unknown as Core;
}

const coefficient = (form: ExactAffineNormalForm, symbolId: string): AlgebraicScalar => form.coefficients.find(row => row.symbolId === symbolId)?.coefficient ?? zero;
const statement = (core: Core) => ({operator: 'equal' as const, left: core.expressions[0].root, right: core.expressions[1].root});
const ambient = () => ({kind: 'numeric' as const, values: allRationals()});
function arithmetic(value: unknown, expected: ExactCoefficientArithmetic): boolean {
    return record(value) && value.kind === 'binary' && value.operation === expected.operation && dense(value.operands) && value.operands.length === 2
        && isCanonicalSignedRational(value.operands[0]) && equalAffineScalars(value.operands[0], expected.operands[0])
        && isCanonicalSignedRational(value.operands[1]) && equalAffineScalars(value.operands[1], expected.operands[1])
        && isCanonicalSignedRational(value.result) && equalAffineScalars(value.result, expected.result);
}
function differences(core: Core, left: AffineNormalizationProof, right: AffineNormalizationProof) {
    const coefficientDifference = affineCoefficientArithmetic('subtraction', coefficient(left.rootNormalForm, core.symbol.symbolId), coefficient(right.rootNormalForm, core.symbol.symbolId));
    const constantDifference = affineCoefficientArithmetic('subtraction', left.rootNormalForm.constant, right.rootNormalForm.constant);
    require(coefficientDifference.result.numerator !== 0, 'A particular value requires a nonzero affine difference coefficient.');
    const inverseArithmetic = affineCoefficientArithmetic('division', negateAffineScalar(constantDifference.result), coefficientDifference.result);
    require(isAlgebraicDomainMember(inverseArithmetic.result, core.domain.set), 'The unique rational value must belong to the named domain.');
    return {coefficientDifference, constantDifference, inverseArithmetic};
}

/** Derive quantified meaning from original syntax; no complete old exercise model is manufactured. */
export function buildAlgebraVariableMeaningProblem(input: VariableMeaningBuildInput): AlgebraVariableMeaningProblem {
    require(record(input) && namedDomain(input.domain) && record(input.symbol));
    require(dense(input.expressions) && input.expressions.length === 2 && input.expressions.every(record));
    const proofDomain: CommonAffineDomain = {domainId: `${input.domain.domainId}:rational-proof`, kind: 'independent-rational-variables',
        symbols: [{...input.symbol, domain: allRationals()}]};
    const expressions = input.expressions.map(expression => ({...expression, domainId: proofDomain.domainId})) as unknown as Core['expressions'];
    const core = inspectCore({domain: input.domain, symbol: input.symbol, quantity: input.quantity, proofDomain, expressions,
        relation: {leftExpressionId: expressions[0].expressionId, rightExpressionId: expressions[1].expressionId}});
    const leftNormalization = normalizeAffineExpression(expressions[0], proofDomain), rightNormalization = normalizeAffineExpression(expressions[1], proofDomain);
    if (input.role === 'particular-unknown') {
        const evidence = differences(core, leftNormalization, rightNormalization), uniqueValue = evidence.inverseArithmetic.result;
        const notation = uniqueValue.denominator === 1 ? {kind: 'integer' as const, numeral: String(uniqueValue.numerator)}
            : {kind: 'fraction' as const, ...uniqueValue};
        const verification = buildStatementAssignmentCheck(statement(core), core.symbol, ambient(), {symbolId: core.symbol.symbolId, value: uniqueValue, notation});
        require(verification.comparison.truth);
        return {kind: 'algebra-variable-models', ...core, role: {kind: 'particular-unknown', situation: 'one-fixed-situation',
            uniqueValueWitness: {leftNormalization, rightNormalization, ...evidence, uniqueValue, verification}}};
    }
    require(input.role === 'arbitrary-generalized-number' && equalAffineNormalForms(leftNormalization.rootNormalForm, rightNormalization.rootNormalForm),
        'A universal claim requires identical complete affine maps.');
    return {kind: 'algebra-variable-models', ...core, role: {kind: 'arbitrary-generalized-number', quantifier: 'for-every-domain-member',
        universalProof: {domainId: proofDomain.domainId, leftExpressionId: expressions[0].expressionId, rightExpressionId: expressions[1].expressionId,
            leftNormalization, rightNormalization, commonNormalForm: leftNormalization.rootNormalForm}, domainInclusion: 'named-domain-subset-of-rationals'}};
}

/** Validate all supplied proofs semantically, including legal alternate proof orders and exact spelling. */
export function isAlgebraVariableMeaningProblem(value: unknown): value is AlgebraVariableMeaningProblem {
    try {
        const core = inspectCore(value);
        if (!record(value) || value.kind !== 'algebra-variable-models' || !record(value.role)) return false;
        const role = value.role;
        if (role.kind === 'particular-unknown') {
            if (role.situation !== 'one-fixed-situation' || !record(role.uniqueValueWitness)) return false;
            const witness = role.uniqueValueWitness;
            if (!isAffineNormalizationProof(witness.leftNormalization, core.expressions[0], core.proofDomain)
                || !isAffineNormalizationProof(witness.rightNormalization, core.expressions[1], core.proofDomain)) return false;
            const expected = differences(core, witness.leftNormalization, witness.rightNormalization);
            return arithmetic(witness.coefficientDifference, expected.coefficientDifference) && arithmetic(witness.constantDifference, expected.constantDifference)
                && arithmetic(witness.inverseArithmetic, expected.inverseArithmetic) && isCanonicalSignedRational(witness.uniqueValue)
                && equalAffineScalars(witness.uniqueValue, expected.inverseArithmetic.result)
                && isStatementAssignmentCheck(witness.verification, statement(core), core.symbol, ambient())
                && equalAffineScalars(witness.verification.binding.value, witness.uniqueValue) && witness.verification.comparison.truth;
        }
        if (role.kind !== 'arbitrary-generalized-number' || role.quantifier !== 'for-every-domain-member'
            || role.domainInclusion !== 'named-domain-subset-of-rationals' || !record(role.universalProof)) return false;
        const proof = role.universalProof;
        return proof.domainId === core.proofDomain.domainId && proof.leftExpressionId === core.expressions[0].expressionId
            && proof.rightExpressionId === core.expressions[1].expressionId
            && isAffineNormalizationProof(proof.leftNormalization, core.expressions[0], core.proofDomain)
            && isAffineNormalizationProof(proof.rightNormalization, core.expressions[1], core.proofDomain)
            && isExactAffineNormalForm(proof.commonNormalForm, core.proofDomain)
            && equalAffineNormalForms(proof.leftNormalization.rootNormalForm, proof.commonNormalForm)
            && equalAffineNormalForms(proof.rightNormalization.rootNormalForm, proof.commonNormalForm);
    } catch { return false; }
}
