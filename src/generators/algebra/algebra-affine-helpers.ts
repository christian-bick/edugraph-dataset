import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AffineComponentArithmetic, AffineExpression, AffineNormalizationProof, AffineNormalizationStep,
    AlgebraicScalar, ArithmeticOperation, CommonAffineDomain, ExactAffineNormalForm, ExactCoefficientArithmetic,
    ExactSymbolicExpressionNode} from '../../types/problems.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';
import {algebraicChildren, inspectAlgebraicExpression, isAlgebraicDeclarations} from './algebra-syntax-helpers.ts';

const fail = (message: string): never => { throw new GeneratorValidationError('algebra-expression-equivalence', message); };
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.trim() === value;
const dense = (value: unknown): value is unknown[] => {
    if (!Array.isArray(value)) return false;
    for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
};
const zero: AlgebraicScalar = {numerator: 0, denominator: 1};
const one = {numerator: 1, denominator: 1} as const;
const minusOne: AlgebraicScalar = {numerator: -1, denominator: 1};

/** Reduce before conversion: unsafe unreduced BigInt intermediates may have safe exact results. */
export function affineScalar(numerator: bigint, denominator: bigint): AlgebraicScalar {
    if (typeof numerator !== 'bigint' || typeof denominator !== 'bigint' || denominator === 0n) return fail('Expected exact rational components and a nonzero denominator.');
    if (denominator < 0n) { numerator = -numerator; denominator = -denominator; }
    let a = numerator < 0n ? -numerator : numerator, b = denominator;
    while (b !== 0n) [a, b] = [b, a % b];
    const n = numerator / a, d = denominator / a, maximum = BigInt(Number.MAX_SAFE_INTEGER);
    if (n < -maximum || n > maximum || d > maximum) return fail('The reduced rational exceeds safe exact components.');
    return {numerator: Number(n), denominator: Number(d)};
}

function canonical(value: AlgebraicScalar): void {
    if (!isCanonicalSignedRational(value)) fail('Expected a reduced canonical rational with safe components.');
}
export function equalAffineScalars(first: AlgebraicScalar, second: AlgebraicScalar): boolean {
    canonical(first); canonical(second);
    return first.numerator === second.numerator && first.denominator === second.denominator;
}
export function compareAffineScalars(first: AlgebraicScalar, second: AlgebraicScalar): -1 | 0 | 1 {
    canonical(first); canonical(second);
    const difference = BigInt(first.numerator) * BigInt(second.denominator) - BigInt(second.numerator) * BigInt(first.denominator);
    return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}
export function addAffineScalars(first: AlgebraicScalar, second: AlgebraicScalar): AlgebraicScalar {
    canonical(first); canonical(second);
    return affineScalar(BigInt(first.numerator) * BigInt(second.denominator) + BigInt(second.numerator) * BigInt(first.denominator),
        BigInt(first.denominator) * BigInt(second.denominator));
}
export function subtractAffineScalars(first: AlgebraicScalar, second: AlgebraicScalar): AlgebraicScalar {
    return addAffineScalars(first, negateAffineScalar(second));
}
export function multiplyAffineScalars(first: AlgebraicScalar, second: AlgebraicScalar): AlgebraicScalar {
    canonical(first); canonical(second);
    return affineScalar(BigInt(first.numerator) * BigInt(second.numerator), BigInt(first.denominator) * BigInt(second.denominator));
}
export function divideAffineScalars(first: AlgebraicScalar, second: AlgebraicScalar): AlgebraicScalar {
    canonical(first); canonical(second);
    return affineScalar(BigInt(first.numerator) * BigInt(second.denominator), BigInt(first.denominator) * BigInt(second.numerator));
}
export function negateAffineScalar(value: AlgebraicScalar): AlgebraicScalar {
    canonical(value);
    return {numerator: value.numerator === 0 ? 0 : -value.numerator, denominator: value.denominator};
}
export function affineCoefficientArithmetic(operation: ArithmeticOperation, left: AlgebraicScalar,
    right: AlgebraicScalar): ExactCoefficientArithmetic {
    const result = operation === 'addition' ? addAffineScalars(left, right)
        : operation === 'subtraction' ? subtractAffineScalars(left, right)
        : operation === 'multiplication' ? multiplyAffineScalars(left, right)
        : operation === 'division' ? divideAffineScalars(left, right) : fail('Unsupported exact arithmetic operation.');
    return {kind: 'binary', operation, operands: [left, right], result};
}

export function isCommonAffineDomain(value: unknown): value is CommonAffineDomain {
    try {
        return record(value) && text(value.domainId) && value.kind === 'independent-rational-variables'
            && isAlgebraicDeclarations(value.symbols) && value.symbols.every(symbol => symbol.domain.kind === 'rational'
                && symbol.domain.lower === null && symbol.domain.upper === null && symbol.domain.excludedValues.length === 0);
    } catch { return false; }
}

function normalForm(value: unknown, symbols: ReadonlySet<string>): value is ExactAffineNormalForm {
    if (!record(value) || !isCanonicalSignedRational(value.constant) || !dense(value.coefficients)) return false;
    let previous: string | undefined;
    for (const row of value.coefficients) {
        if (!record(row) || typeof row.symbolId !== 'string' || !symbols.has(row.symbolId)
            || (previous !== undefined && previous >= row.symbolId) || !isCanonicalSignedRational(row.coefficient)
            || row.coefficient.numerator === 0) return false;
        previous = row.symbolId;
    }
    return true;
}
export function isExactAffineNormalForm(value: unknown, domain: CommonAffineDomain): value is ExactAffineNormalForm {
    try { return isCommonAffineDomain(domain) && normalForm(value, new Set(domain.symbols.map(symbol => symbol.symbolId))); }
    catch { return false; }
}
export function equalAffineNormalForms(first: ExactAffineNormalForm, second: ExactAffineNormalForm): boolean {
    return equalAffineScalars(first.constant, second.constant) && first.coefficients.length === second.coefficients.length
        && first.coefficients.every((row, index) => row.symbolId === second.coefficients[index]!.symbolId
            && equalAffineScalars(row.coefficient, second.coefficients[index]!.coefficient));
}

type Normalized = {result: ExactAffineNormalForm; symbols: readonly string[]};
const coefficient = (value: ExactAffineNormalForm, symbolId: string | null): AlgebraicScalar => symbolId === null ? value.constant
    : value.coefficients.find(row => row.symbolId === symbolId)?.coefficient ?? zero;
const fromComponents = (components: readonly AffineComponentArithmetic[]): ExactAffineNormalForm => ({
    constant: components[0]!.arithmetic.result,
    coefficients: components.slice(1).filter(row => row.arithmetic.result.numerator !== 0)
        .map(row => ({symbolId: row.symbolId!, coefficient: row.arithmetic.result}))
});

/** Universal coefficient induction, never evaluation at one assignment. Every subtree must be affine. */
export function normalizeAffineExpression(expression: AffineExpression, domain: CommonAffineDomain): AffineNormalizationProof {
    if (!isCommonAffineDomain(domain) || !record(expression) || !text(expression.expressionId) || expression.domainId !== domain.domainId) {
        return fail('An affine expression needs the same named unrestricted rational domain.');
    }
    const nodes = inspectAlgebraicExpression(expression.root, domain.symbols);
    if (nodes.some(node => node.kind === 'power')) return fail('The affine arithmetic grammar has no power nodes.');
    const steps: AffineNormalizationStep[] = [];
    const visit = (node: ExactSymbolicExpressionNode): Normalized => {
        if (node.kind === 'number') {
            const result = {constant: node.value, coefficients: []};
            steps.push({nodeId: node.id, result, kind: 'literal', value: node.value});
            return {result, symbols: []};
        }
        if (node.kind === 'variable') {
            const result = {constant: zero, coefficients: [{symbolId: node.symbolId, coefficient: one}]};
            steps.push({nodeId: node.id, result, kind: 'variable', symbolId: node.symbolId, unitCoefficient: one});
            return {result, symbols: [node.symbolId]};
        }
        if (node.kind === 'group') {
            const inner = visit(node.expression);
            steps.push({nodeId: node.id, result: inner.result, kind: 'group', innerNodeId: node.expression.id});
            return inner;
        }
        if (node.kind === 'negation') {
            const operand = visit(node.operand);
            const components = [null, ...operand.symbols].map(symbolId => ({symbolId,
                arithmetic: affineCoefficientArithmetic('multiplication', minusOne, coefficient(operand.result, symbolId))}));
            const result = fromComponents(components);
            steps.push({nodeId: node.id, result, kind: 'negation', operandNodeId: node.operand.id, components});
            return {result, symbols: operand.symbols};
        }
        if (node.kind !== 'binary') return fail('Unsupported affine syntax.');
        const left = visit(node.left), right = visit(node.right);
        // Keep original child symbols even when a child already canceled them to exact zero.
        const symbols = [...new Set([...left.symbols, ...right.symbols])].sort();
        const keys = [null, ...symbols];
        if (node.operation === 'addition' || node.operation === 'subtraction') {
            const components = keys.map(symbolId => ({symbolId,
                arithmetic: affineCoefficientArithmetic(node.operation, coefficient(left.result, symbolId), coefficient(right.result, symbolId))}));
            const result = fromComponents(components);
            steps.push({nodeId: node.id, result, kind: node.operation === 'addition' ? 'add' : 'subtract', leftNodeId: node.left.id,
                rightNodeId: node.right.id, components});
            return {result, symbols};
        }
        if (node.operation === 'multiplication') {
            const leftConstant = left.result.coefficients.length === 0;
            if (!leftConstant && right.result.coefficients.length !== 0) return fail('Every multiplication needs a proved constant child.');
            // If both children are constant, consistently use the left child as the constant factor.
            const constant = leftConstant ? left : right, affine = leftConstant ? right : left;
            const constantFactor = constant.result.constant;
            const components = keys.map(symbolId => ({symbolId,
                arithmetic: affineCoefficientArithmetic('multiplication', constantFactor, coefficient(affine.result, symbolId))}));
            const result = fromComponents(components);
            steps.push({nodeId: node.id, result, kind: 'multiply', constantNodeId: leftConstant ? node.left.id : node.right.id,
                affineNodeId: leftConstant ? node.right.id : node.left.id, constantFactor, components});
            return {result, symbols};
        }
        if (right.result.coefficients.length !== 0 || right.result.constant.numerator === 0) return fail('Division needs a proved nonzero constant denominator.');
        const nonzeroDenominator = right.result.constant;
        const components = keys.map(symbolId => ({symbolId,
            arithmetic: affineCoefficientArithmetic('division', coefficient(left.result, symbolId), nonzeroDenominator)}));
        const result = fromComponents(components);
        steps.push({nodeId: node.id, result, kind: 'divide', numeratorNodeId: node.left.id,
            constantDenominatorNodeId: node.right.id, nonzeroDenominator, components});
        return {result, symbols};
    };
    const rootNormalForm = visit(expression.root).result;
    return {expressionId: expression.expressionId, steps: steps as [AffineNormalizationStep, ...AffineNormalizationStep[]], rootNormalForm};
}

/** Constant-only canceled sides and unused common declarations are valid members. */
export function isAffineExpression(value: unknown, domain: CommonAffineDomain): value is AffineExpression {
    try { normalizeAffineExpression(value as AffineExpression, domain); return true; } catch { return false; }
}

function sameScalar(value: unknown, expected: AlgebraicScalar): boolean {
    return isCanonicalSignedRational(value) && equalAffineScalars(value, expected);
}
function sameArithmetic(value: unknown, expected: ExactCoefficientArithmetic): boolean {
    return record(value) && value.kind === 'binary' && value.operation === expected.operation
        && Array.isArray(value.operands) && value.operands.length === 2 && dense(value.operands)
        && sameScalar(value.operands[0], expected.operands[0]) && sameScalar(value.operands[1], expected.operands[1]) && sameScalar(value.result, expected.result);
}
function sameComponents(value: unknown, expected: readonly AffineComponentArithmetic[]): boolean {
    if (!Array.isArray(value) || value.length !== expected.length || !dense(value)) return false;
    const unused = new Map(expected.map(row => [row.symbolId, row.arithmetic]));
    for (const row of value) {
        if (!record(row) || (row.symbolId !== null && typeof row.symbolId !== 'string')) return false;
        const arithmetic = unused.get(row.symbolId);
        if (!arithmetic || !sameArithmetic(row.arithmetic, arithmetic)) return false;
        unused.delete(row.symbolId);
    }
    return true;
}
function sameStep(value: Record<string, unknown>, expected: AffineNormalizationStep, symbols: ReadonlySet<string>): boolean {
    if (value.kind !== expected.kind || !normalForm(value.result, symbols) || !equalAffineNormalForms(value.result, expected.result)) return false;
    if (expected.kind === 'literal') return sameScalar(value.value, expected.value);
    if (expected.kind === 'variable') return value.symbolId === expected.symbolId && sameScalar(value.unitCoefficient, one);
    if (expected.kind === 'group') return value.innerNodeId === expected.innerNodeId;
    if (!sameComponents(value.components, expected.components)) return false;
    if (expected.kind === 'negation') return value.operandNodeId === expected.operandNodeId;
    if (expected.kind === 'add' || expected.kind === 'subtract') return value.leftNodeId === expected.leftNodeId && value.rightNodeId === expected.rightNodeId;
    if (expected.kind === 'multiply') return value.constantNodeId === expected.constantNodeId && value.affineNodeId === expected.affineNodeId
        && sameScalar(value.constantFactor, expected.constantFactor);
    return expected.kind === 'divide' && value.numeratorNodeId === expected.numeratorNodeId && value.constantDenominatorNodeId === expected.constantDenominatorNodeId
        && sameScalar(value.nonzeroDenominator, expected.nonzeroDenominator);
}

/** Accept any complete dependency-respecting induction order and complete component order. */
export function isAffineNormalizationProof(value: unknown, expression: AffineExpression,
    domain: CommonAffineDomain): value is AffineNormalizationProof {
    try {
        const expected = normalizeAffineExpression(expression, domain);
        if (!record(value) || value.expressionId !== expression.expressionId || !Array.isArray(value.steps)
            || value.steps.length !== expected.steps.length || !dense(value.steps)) return false;
        const symbols = new Set(domain.symbols.map(symbol => symbol.symbolId));
        if (!normalForm(value.rootNormalForm, symbols) || !equalAffineNormalForms(value.rootNormalForm, expected.rootNormalForm)) return false;
        const byId = new Map(expected.steps.map(step => [step.nodeId, step]));
        const dependencies = new Map(inspectAlgebraicExpression(expression.root, domain.symbols)
            .map(node => [node.id, algebraicChildren(node).map(child => child.id)]));
        const seen = new Set<string>();
        for (const step of value.steps) {
            if (!record(step) || typeof step.nodeId !== 'string' || seen.has(step.nodeId)) return false;
            const reference = byId.get(step.nodeId);
            if (!reference || !dependencies.get(step.nodeId)!.every(id => seen.has(id)) || !sameStep(step, reference, symbols)) return false;
            seen.add(step.nodeId);
        }
        return true;
    } catch { return false; }
}
