import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AlgebraicBinding, AlgebraicDomainRestriction, AlgebraicExpressionContext, AlgebraicExpressionProblem,
    AlgebraicGroupedOperand, AlgebraicNotation, AlgebraicScalar, AlgebraicStructuralRelation, AlgebraicSymbolDeclaration,
    ExactNumericCalculation, ExactNumericalExpressionNode, ExactSymbolicExpressionNode, SignedAlgebraicTerm} from '../../types/problems.ts';
import {buildExactNumericCalculation, isExactNumericCalculation} from '../arithmetic/exact-numeric-calculation-helpers.ts';
import {isCoordinateNotation} from '../coordinate/coordinate-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';
import {isAlgebraicExpressionContext} from './algebra-context-helpers.ts';
import {algebraicChildren, inspectAlgebraicExpression, isAlgebraicDeclarations, isAlgebraicDomainMember,
    isAlgebraicExpressionSyntax, sameAlgebraicSyntax} from './algebra-syntax-helpers.ts';

type Node = ExactSymbolicExpressionNode;
type Relation = AlgebraicStructuralRelation;
type BindingInput = Readonly<{symbolId: string; value: AlgebraicScalar; notation: AlgebraicNotation}>;
export type AlgebraicExpressionInput = Readonly<{
    expression: Node;
    symbols: readonly [AlgebraicSymbolDeclaration, ...AlgebraicSymbolDeclaration[]];
    bindings: readonly BindingInput[];
    structuralKind: 'symbolic' | 'numeric';
    relation: Relation['kind'];
    context: AlgebraicExpressionContext;
}>;
const fail = (message: string): never => { throw new GeneratorValidationError('algebra-expressions', message); };
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const dense = (value: unknown): value is unknown[] => {
    if (!Array.isArray(value)) return false;
    for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
};
const sameValue = (a: AlgebraicScalar, b: AlgebraicScalar): boolean => a.numerator === b.numerator && a.denominator === b.denominator;
const copy = <T>(value: T): T => structuredClone(value);
const notation = (value: AlgebraicScalar): AlgebraicNotation => value.denominator === 1
    ? {kind: 'integer', numeral: String(value.numerator)}
    : {kind: 'fraction', numerator: value.numerator, denominator: value.denominator};
const policy = {domain: 'rational' as const, maximumAbsoluteValue: {numerator: Number.MAX_SAFE_INTEGER, denominator: 1},
    maximumNodes: Number.MAX_SAFE_INTEGER, maximumDepth: Number.MAX_SAFE_INTEGER, maximumExponent: Number.MAX_SAFE_INTEGER};

function restrictions(nodes: readonly Node[]): AlgebraicDomainRestriction[] {
    return nodes.flatMap<AlgebraicDomainRestriction>(node => node.kind === 'binary' && node.operation === 'division'
        ? [{kind: 'nonzero-expression' as const, expressionNodeId: node.right.id, reason: 'division-denominator' as const}]
        : node.kind === 'power' && node.exponent === 0
            ? [{kind: 'nonzero-expression' as const, expressionNodeId: node.base.id, reason: 'zero-exponent-base' as const}] : []);
}

function substitute(node: Node, bindings: ReadonlyMap<string, BindingInput>): ExactNumericalExpressionNode {
    if (node.kind === 'variable') {
        const binding = bindings.get(node.symbolId)!;
        return {id: node.id, kind: 'number', value: copy(binding.value), notation: copy(binding.notation)};
    }
    if (node.kind === 'binary') return {...copy(node), left: substitute(node.left, bindings), right: substitute(node.right, bindings)};
    if (node.kind === 'group') return {...copy(node), expression: substitute(node.expression, bindings)};
    if (node.kind === 'negation') return {...copy(node), operand: substitute(node.operand, bindings)};
    if (node.kind === 'power') return {...copy(node), base: substitute(node.base, bindings)};
    return copy(node);
}

function groups(nodes: readonly Node[]): AlgebraicGroupedOperand[] {
    return nodes.flatMap(parent => {
        const fields = parent.kind === 'binary' ? [['left', parent.left], ['right', parent.right]] as const
            : parent.kind === 'group' || parent.kind === 'variable' || parent.kind === 'number' ? []
                : parent.kind === 'negation' ? [['operand', parent.operand]] as const : [['base', parent.base]] as const;
        return fields.flatMap(([position, child]) => child.kind === 'group' ? [{groupNodeId: child.id,
            innerNodeId: child.expression.id, parentNodeId: parent.id,
            enclosingOperation: parent.kind === 'binary' ? parent.operation : parent.kind as 'negation' | 'power', position}] : []);
    });
}

function freshId(ids: Set<string>, hint: string): string {
    let id = hint;
    while (ids.has(id)) id += '_';
    ids.add(id);
    return id;
}
function terms(node: Node, ids: Set<string>, polarity: 1 | -1 = 1): SignedAlgebraicTerm[] {
    if (node.kind === 'binary' && (node.operation === 'addition' || node.operation === 'subtraction')) {
        return [...terms(node.left, ids, polarity), ...terms(node.right, ids, node.operation === 'addition' ? polarity : -polarity as 1 | -1)];
    }
    if (node.kind === 'negation') return terms(node.operand, ids, -polarity as 1 | -1);
    const operand: Node = node.kind === 'binary' ? {id: freshId(ids, `${node.id}:signed-group`), kind: 'group', expression: copy(node)} : copy(node);
    return [{sourceNodeId: node.id, polarity, signedExpression: polarity === 1 ? copy(node)
        : {id: freshId(ids, `${node.id}:signed`), kind: 'negation', operand}}];
}
function factors(node: Node): Node[] {
    return node.kind === 'binary' && node.operation === 'multiplication' ? [...factors(node.left), ...factors(node.right)] : [node];
}
function variables(node: Node): string[] {
    return node.kind === 'variable' ? [node.symbolId] : algebraicChildren(node).flatMap(variables);
}
function product(values: readonly AlgebraicScalar[], polarity: 1 | -1): AlgebraicScalar {
    let n = BigInt(polarity), d = 1n;
    for (const value of values) { n *= BigInt(value.numerator); d *= BigInt(value.denominator); }
    let a = n < 0n ? -n : n, b = d;
    while (b !== 0n) [a, b] = [b, a % b];
    const numerator = Number(n / a), denominator = Number(d / a);
    if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator)) return fail('Unsafe exact coefficient.');
    return {numerator: numerator === 0 ? 0 : numerator, denominator};
}

/** Every candidate is a syntax proof; constant factors never depend on a supplied variable assignment. */
function structural(nodes: readonly Node[], values: ReadonlyMap<string, AlgebraicScalar>): Relation[] {
    const results: Relation[] = [], sourceIds = new Set(nodes.map(node => node.id));
    for (const node of nodes) {
        const ids = new Set(sourceIds), components = terms(node, ids);
        if (components.length >= 2) results.push({kind: 'additive-components', levelNodeId: node.id,
            terms: components as [SignedAlgebraicTerm, SignedAlgebraicTerm, ...SignedAlgebraicTerm[]]});
        if (node.kind === 'binary' && node.operation === 'multiplication') {
            results.push({kind: 'multiplicative-components', productNodeId: node.id,
                factors: factors(node).map(factor => ({nodeId: factor.id})) as [{nodeId: string}, {nodeId: string}, ...{nodeId: string}[]]});
        }
        for (const term of components) {
            const source = nodes.find(entry => entry.id === term.sourceNodeId)!;
            const allFactors = factors(source), constant = allFactors.filter(factor => variables(factor).length === 0);
            const varying = allFactors.filter(factor => variables(factor).length > 0);
            if (varying.length === 0) continue;
            const constantFactors = constant.map(factor => values.get(factor.id)!);
            let coefficient: AlgebraicScalar;
            try { coefficient = product(constantFactors, term.polarity); } catch { continue; }
            let variablePart = copy(varying[0]);
            for (const factor of varying.slice(1)) variablePart = {id: freshId(ids, `${source.id}:variables`), kind: 'binary',
                operation: 'multiplication', left: variablePart, right: copy(factor)};
            results.push({kind: 'coefficient', additiveLevelNodeId: node.id, term: copy(term), coefficient,
                coefficientNotation: notation(coefficient), variablePart, constantFactors: copy(constantFactors),
                variableSymbolIds: [...new Set(variables(variablePart))] as [string, ...string[]]});
        }
        if (node.kind === 'binary' && node.operation === 'addition') results.push({kind: 'sum', operationNodeId: node.id,
            addends: [{nodeId: node.left.id}, {nodeId: node.right.id}]});
        if (node.kind === 'binary' && node.operation === 'multiplication') results.push({kind: 'product', operationNodeId: node.id,
            factors: [{nodeId: node.left.id}, {nodeId: node.right.id}]});
        if (node.kind === 'binary' && node.operation === 'division') results.push({kind: 'quotient', operationNodeId: node.id,
            numerator: {nodeId: node.left.id}, denominator: {nodeId: node.right.id}});
    }
    return results;
}

/** Compare complete mathematical fields without depending on object-key order. */
function equal(first: unknown, second: unknown): boolean {
    if (Object.is(first, second)) return true;
    if (Array.isArray(first)) return dense(second) && first.length === second.length && first.every((item, index) => equal(item, second[index]));
    if (!record(first) || !record(second)) return false;
    return Object.keys(first).every(field => Object.hasOwn(second, field) && equal(first[field], second[field]));
}
function sameTree(first: Node, second: Node): boolean {
    return first.id === second.id && sameAlgebraicSyntax(first, second)
        && algebraicChildren(first).every((child, index) => sameTree(child, algebraicChildren(second)[index]));
}
function sameDerivedTree(expected: Node, supplied: unknown, ids: Set<string>, symbols: readonly AlgebraicSymbolDeclaration[]): boolean {
    if (!isAlgebraicExpressionSyntax(supplied, symbols) || !sameAlgebraicSyntax(expected, supplied)) return false;
    function check(first: Node, second: Node): boolean {
        return (ids.has(first.id) ? first.id === second.id : !ids.has(second.id))
            && algebraicChildren(first).every((child, index) => check(child, algebraicChildren(second)[index]));
    }
    return check(expected, supplied);
}
function matchesRelation(expected: Relation, value: unknown, ids: Set<string>, symbols: readonly AlgebraicSymbolDeclaration[]): boolean {
    if (!record(value) || value.kind !== expected.kind) return false;
    if (expected.kind === 'additive-components') {
        const suppliedTerms = value.terms;
        return value.levelNodeId === expected.levelNodeId && dense(suppliedTerms) && suppliedTerms.length === expected.terms.length
            && expected.terms.every((term, index) => matchesTerm(term, suppliedTerms[index], ids, symbols));
    }
    if (expected.kind === 'coefficient') {
        return value.additiveLevelNodeId === expected.additiveLevelNodeId && matchesTerm(expected.term, value.term, ids, symbols)
            && isCanonicalSignedRational(value.coefficient) && sameValue(expected.coefficient, value.coefficient)
            && isCoordinateNotation(value.coefficient, value.coefficientNotation)
            && equal(expected.constantFactors, value.constantFactors) && equal(expected.variableSymbolIds, value.variableSymbolIds)
            && sameDerivedTree(expected.variablePart, value.variablePart, ids, symbols);
    }
    return equal(expected, value);
}
function matchesTerm(expected: SignedAlgebraicTerm, value: unknown, ids: Set<string>, symbols: readonly AlgebraicSymbolDeclaration[]): boolean {
    return record(value) && value.sourceNodeId === expected.sourceNodeId && value.polarity === expected.polarity
        && sameDerivedTree(expected.signedExpression, value.signedExpression, ids, symbols);
}

function completeBindings(nodes: readonly Node[], symbols: readonly AlgebraicSymbolDeclaration[], inputs: readonly BindingInput[]): AlgebraicBinding[] {
    if (!dense(inputs) || inputs.length !== symbols.length) return fail('Every declared symbol requires exactly one binding.');
    const byId = new Map<string, BindingInput>();
    for (const input of inputs) {
        if (!record(input) || typeof input.symbolId !== 'string' || byId.has(input.symbolId)
            || !isCanonicalSignedRational(input.value) || !isCoordinateNotation(input.value, input.notation)) return fail('Invalid or repeated binding.');
        byId.set(input.symbolId, input);
    }
    return symbols.map(symbol => {
        const input = byId.get(symbol.symbolId), occurrenceNodeIds = nodes.filter(node => node.kind === 'variable' && node.symbolId === symbol.symbolId).map(node => node.id);
        if (!input || !isAlgebraicDomainMember(input.value, symbol.domain) || occurrenceNodeIds.length === 0) return fail('Binding outside the declared domain or unused declaration.');
        return {...copy(input), occurrenceNodeIds: occurrenceNodeIds as [string, ...string[]]};
    });
}

/** Build the complete linked relation; the requested relation is a mathematical proof family, never a learner task. */
export function buildAlgebraicExpressionProblem(input: AlgebraicExpressionInput): AlgebraicExpressionProblem {
    const nodes = inspectAlgebraicExpression(input.expression, input.symbols);
    const bindings = completeBindings(nodes, input.symbols, input.bindings);
    const substitutedExpression = substitute(input.expression, new Map(bindings.map(binding => [binding.symbolId, binding])));
    const calculation = buildExactNumericCalculation(substitutedExpression, policy);
    const frame = input.structuralKind === 'symbolic' ? copy(input.expression) : copy(substitutedExpression);
    if (!['symbolic', 'numeric'].includes(input.structuralKind)) return fail('Invalid structural frame kind.');
    const frameNodes = inspectAlgebraicExpression(frame, input.symbols);
    const relations = structural(frameNodes, new Map(calculation.nodeValues.map(row => [row.nodeId, row.value])));
    const primary = relations.find(relation => relation.kind === input.relation);
    if (!primary) return fail('The expression does not contain the specified structural relation.');
    const result: AlgebraicExpressionProblem = {
        kind: 'algebra-expressions', expression: copy(input.expression), symbols: copy(input.symbols), restrictions: restrictions(nodes),
        substitution: {bindings: bindings as [AlgebraicBinding, ...AlgebraicBinding[]], substitutedExpression, nodeValues: calculation.nodeValues, powerFacts: calculation.powerFacts,
            reductions: calculation.reductions, finalValue: calculation.finalValue, finalNotation: notation(calculation.finalValue),
            precedenceWitness: calculation.precedenceWitness},
        structuralExpression: input.structuralKind === 'symbolic' ? {kind: 'symbolic', expression: frame} : {kind: 'numeric', expression: frame as ExactNumericalExpressionNode},
        structuralRelations: [primary], groupedOperands: groups(frameNodes) as [AlgebraicGroupedOperand, ...AlgebraicGroupedOperand[]], context: copy(input.context)
    };
    if (!isAlgebraicExpressionProblem(result)) return fail('Incomplete or incoherent algebraic relation, grouping or context.');
    return result;
}

/** Total full-family guard, independent of producer schemas, target tasks and sampler caps. */
export function isAlgebraicExpressionProblem(value: unknown): value is AlgebraicExpressionProblem {
    try {
        if (!record(value) || value.kind !== 'algebra-expressions' || !isAlgebraicDeclarations(value.symbols)) return false;
        const symbols = value.symbols, nodes = inspectAlgebraicExpression(value.expression, symbols), expression = value.expression as Node;
        if (!nodes.some(node => node.kind === 'number' || node.kind === 'power') || !record(value.substitution)) return false;
        const work = value.substitution;
        if (!dense(work.bindings)) return false;
        const expectedBindings = completeBindings(nodes, symbols, work.bindings as BindingInput[]);
        for (const expected of expectedBindings) {
            const supplied = work.bindings.find(binding => record(binding) && binding.symbolId === expected.symbolId) as Record<string, unknown>;
            const occurrences = supplied.occurrenceNodeIds;
            if (!dense(occurrences) || occurrences.length !== expected.occurrenceNodeIds.length
                || new Set(occurrences).size !== occurrences.length
                || !expected.occurrenceNodeIds.every(id => occurrences.includes(id))) return false;
        }
        const expectedRestrictions = restrictions(nodes);
        const suppliedRestrictions = value.restrictions;
        if (!dense(suppliedRestrictions) || suppliedRestrictions.length !== expectedRestrictions.length
            || !expectedRestrictions.every(expected => suppliedRestrictions.filter(item => equal(expected, item)).length === 1)) return false;
        const expectedNumeric = substitute(expression, new Map(expectedBindings.map(binding => [binding.symbolId, binding])));
        const calculation = {expression: work.substitutedExpression, nodeValues: work.nodeValues, powerFacts: work.powerFacts,
            reductions: work.reductions, finalValue: work.finalValue, precedenceWitness: work.precedenceWitness};
        if (!isExactNumericCalculation(calculation) || !sameTree(expectedNumeric, calculation.expression)
            || !isCoordinateNotation(calculation.finalValue, work.finalNotation)) return false;
        if (!record(value.structuralExpression) || !['symbolic', 'numeric'].includes(value.structuralExpression.kind as string)) return false;
        const frame = value.structuralExpression.expression;
        if (!isAlgebraicExpressionSyntax(frame, symbols)
            || !sameTree(value.structuralExpression.kind === 'symbolic' ? expression : calculation.expression, frame)) return false;
        const frameNodes = inspectAlgebraicExpression(frame, symbols), expectedGroups = groups(frameNodes);
        const suppliedGroups = value.groupedOperands;
        if (!dense(suppliedGroups) || expectedGroups.length === 0 || suppliedGroups.length !== expectedGroups.length
            || !expectedGroups.every(expected => suppliedGroups.filter(item => equal(expected, item)).length === 1)) return false;
        const candidates = structural(frameNodes, new Map((calculation as ExactNumericCalculation).nodeValues.map(row => [row.nodeId, row.value])));
        const ids = new Set(frameNodes.map(node => node.id));
        if (!dense(value.structuralRelations) || value.structuralRelations.length === 0
            || !value.structuralRelations.every(relation => candidates.some(candidate => matchesRelation(candidate, relation, ids, symbols)))) return false;
        return isAlgebraicExpressionContext(value.context, expression, symbols, expectedRestrictions);
    } catch { return false; }
}
