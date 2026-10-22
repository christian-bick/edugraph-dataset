import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AlgebraicScalar, AlgebraicSymbolDeclaration, AlgebraicVariableDomain,
    ArithmeticOperation, ExactSymbolicExpressionNode} from '../../types/problems.ts';
import {isCoordinateNotation} from '../coordinate/coordinate-helpers.ts';
import {compareSignedRationals, isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';

type Node = ExactSymbolicExpressionNode;
const fail = (message: string): never => { throw new GeneratorValidationError('algebra-expressions', message); };
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.trim() === value;
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0);
const dense = (value: unknown): value is unknown[] => {
    if (!Array.isArray(value)) return false;
    for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
};
const key = (value: AlgebraicScalar): string => `${value.numerator}/${value.denominator}`;
const floor = (value: AlgebraicScalar): bigint => {
    const n = BigInt(value.numerator), d = BigInt(value.denominator);
    return n / d - (n < 0n && n % d !== 0n ? 1n : 0n);
};

/** Exact membership includes open endpoints, integer lattices and excluded values. */
export function isAlgebraicDomainMember(value: AlgebraicScalar, domain: AlgebraicVariableDomain): boolean {
    try {
        if (!isCanonicalSignedRational(value) || !isAlgebraicVariableDomain(domain)) return false;
        return (domain.kind !== 'integer' || value.denominator === 1)
            && (!domain.lower || compareSignedRationals(value, domain.lower.value) > (domain.lower.inclusive ? -1 : 0))
            && (!domain.upper || compareSignedRationals(value, domain.upper.value) < (domain.upper.inclusive ? 1 : 0))
            && !domain.excludedValues.some(excluded => compareSignedRationals(value, excluded) === 0);
    } catch { return false; }
}

/** Domains denote nonempty mathematical sets, independently of one selected assignment. */
export function isAlgebraicVariableDomain(value: unknown): value is AlgebraicVariableDomain {
    try { return validDomain(value); } catch { return false; }
}
function validDomain(value: unknown): value is AlgebraicVariableDomain {
    if (!record(value) || !['rational', 'integer'].includes(value.kind as string) || !dense(value.excludedValues)) return false;
    for (const bound of [value.lower, value.upper]) {
        if (bound !== null && (!record(bound) || !isCanonicalSignedRational(bound.value) || typeof bound.inclusive !== 'boolean')) return false;
    }
    if (!value.excludedValues.every(isCanonicalSignedRational)
        || new Set(value.excludedValues.map(key)).size !== value.excludedValues.length) return false;
    const domain = value as AlgebraicVariableDomain;
    if (domain.lower && domain.upper) {
        const comparison = compareSignedRationals(domain.lower.value, domain.upper.value);
        if (comparison > 0 || (comparison === 0 && (!domain.lower.inclusive || !domain.upper.inclusive))) return false;
        if (domain.kind === 'rational') return comparison < 0 || !domain.excludedValues.some(excluded => compareSignedRationals(excluded, domain.lower!.value) === 0);
        const low = floor(domain.lower.value) + (domain.lower.inclusive && domain.lower.value.denominator === 1 ? 0n : 1n);
        const high = floor(domain.upper.value) - (!domain.upper.inclusive && domain.upper.value.denominator === 1 ? 1n : 0n);
        const removed = domain.excludedValues.filter(excluded => excluded.denominator === 1
            && BigInt(excluded.numerator) >= low && BigInt(excluded.numerator) <= high).length;
        return high - low + 1n > BigInt(removed);
    }
    return true;
}

export function isAlgebraicDeclarations(value: unknown): value is readonly [AlgebraicSymbolDeclaration, ...AlgebraicSymbolDeclaration[]] {
    try {
        // A displayed variable is one letter-led identifier, never a numeral or operator expression.
        return dense(value) && value.length > 0 && value.every(item => record(item) && text(item.symbolId) && text(item.symbol)
            && /^\p{L}[\p{L}\p{N}_]*$/u.test(item.symbol)
            && isAlgebraicVariableDomain(item.domain))
            && new Set(value.map(item => (item as AlgebraicSymbolDeclaration).symbolId)).size === value.length
            && new Set(value.map(item => (item as AlgebraicSymbolDeclaration).symbol)).size === value.length;
    } catch { return false; }
}

export function algebraicChildren(node: Node): readonly Node[] {
    if (node.kind === 'binary') return [node.left, node.right];
    if (node.kind === 'group') return [node.expression];
    if (node.kind === 'negation') return [node.operand];
    return node.kind === 'power' ? [node.base] : [];
}
const rank = (node: Node): number => node.kind === 'binary'
    ? node.operation === 'addition' || node.operation === 'subtraction' ? 1 : 2
    : node.kind === 'negation' ? 3 : node.kind === 'power' ? 4 : 5;

/** Broad syntax inspection: variable occurrences are unassigned, and explicit groups carry binding. */
export function inspectAlgebraicExpression(expression: unknown, symbols: readonly AlgebraicSymbolDeclaration[]): readonly Node[] {
    if (!isAlgebraicDeclarations(symbols)) return fail('Expected coherent symbol declarations and nonempty domains.');
    const entries: Node[] = [], ids = new Set<string>(), declared = new Set(symbols.map(symbol => symbol.symbolId));
    const operations: readonly ArithmeticOperation[] = ['addition', 'subtraction', 'multiplication', 'division'];
    function visit(value: unknown): void {
        if (!record(value) || !text(value.id) || ids.has(value.id)) return fail('Every syntax occurrence needs a unique identifier in a finite tree.');
        ids.add(value.id);
        if (value.kind === 'number') {
            if (!isCanonicalSignedRational(value.value) || !isCoordinateNotation(value.value, value.notation)) return fail('Invalid exact numeric literal.');
        } else {
            if (Object.hasOwn(value, 'value')) return fail('Unassigned symbolic operators and variables cannot carry evaluated values.');
            if (value.kind === 'variable') {
                if (typeof value.symbolId !== 'string' || !declared.has(value.symbolId)) return fail('A variable must refer to a declared symbol.');
            } else if (value.kind === 'binary') {
                if (!operations.includes(value.operation as ArithmeticOperation)) return fail('Unsupported arithmetic operation.');
            } else if (value.kind === 'power') {
                if (!integer(value.exponent) || value.exponent < 0) return fail('A power requires a nonnegative integer exponent.');
            } else if (value.kind !== 'group' && value.kind !== 'negation') return fail('Unsupported symbolic syntax.');
        }
        const node = value as Node;
        entries.push(node);
        for (const child of algebraicChildren(node)) visit(child);
        if (node.kind === 'power' && !['number', 'variable', 'group'].includes(node.base.kind)) return fail('A compound power base requires an explicit group.');
        if (node.kind === 'negation' && node.operand.kind === 'binary') return fail('A binary unary operand requires an explicit group.');
        if (node.kind === 'binary' && (rank(node.left) < rank(node) || rank(node.right) < rank(node)
            || (node.right.kind === 'binary' && rank(node.right) === rank(node)))) return fail('Written binary association requires an explicit group.');
    }
    visit(expression);
    return entries;
}

export function isAlgebraicExpressionSyntax(value: unknown, symbols: readonly AlgebraicSymbolDeclaration[]): value is Node {
    try { inspectAlgebraicExpression(value, symbols); return true; } catch { return false; }
}

/** Ignore occurrence ids only; literal spelling and every grouping/operation remain exact. */
export function sameAlgebraicSyntax(first: Node, second: Node): boolean {
    if (first.kind !== second.kind) return false;
    if (first.kind === 'number' && second.kind === 'number') {
        return compareSignedRationals(first.value, second.value) === 0
            && Object.keys(first.notation).length === Object.keys(second.notation).length
            && Object.entries(first.notation).every(([field, value]) => (second.notation as unknown as Record<string, unknown>)[field] === value);
    }
    if (first.kind === 'variable' && second.kind === 'variable') return first.symbolId === second.symbolId;
    if (first.kind === 'power' && second.kind === 'power' && first.exponent !== second.exponent) return false;
    if (first.kind === 'binary' && second.kind === 'binary' && first.operation !== second.operation) return false;
    const left = algebraicChildren(first), right = algebraicChildren(second);
    return left.length === right.length && left.every((child, index) => sameAlgebraicSyntax(child, right[index]));
}
