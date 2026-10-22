import {GeneratorValidationError} from '../../lib/errors.ts';
import type {ArithmeticOperation, ExactNumericExpressionConstraints, ExactNumericNodeValue, ExactNumericPath,
    ExactNumericPrecedenceWitness, ExactNumericReduction, ExactNumericReductionEvidence, ExactNumericValue,
    ExactNumericalExpressionNode, ExactPowerFact, NumericalPowerExpressionProblem} from '../../types/problems.ts';
import {isCoordinateNotation} from '../coordinate/coordinate-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';

type Node = ExactNumericalExpressionNode;
type OperationNode = Exclude<Node, {kind: 'number'}>;
type Selection = Readonly<{targetNodeId: string; path: ExactNumericPath}>;
type Entry = {node: Node; path: ExactNumericPath; context: string; groups: readonly string[]};
const helperId = 'numerical-power-expressions';
const fail = (message: string): never => { throw new GeneratorValidationError(helperId, message); };
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0);
const dense = (value: readonly unknown[]): boolean => {
    for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
};
const sized = (value: unknown, length: number): value is unknown[] => Array.isArray(value) && value.length === length && dense(value);
const same = (a: ExactNumericValue, b: ExactNumericValue): boolean => a.numerator === b.numerator && a.denominator === b.denominator;
const operations: readonly ArithmeticOperation[] = ['addition', 'subtraction', 'multiplication', 'division'];
const rank = (node: Node): number => node.kind === 'binary'
    ? node.operation === 'addition' || node.operation === 'subtraction' ? 1 : 2
    : node.kind === 'negation' ? 3 : node.kind === 'power' ? 4 : 5;

function rational(numerator: bigint, denominator: bigint): ExactNumericValue {
    if (denominator === 0n) return fail('Division by zero is undefined.');
    if (denominator < 0n) { numerator = -numerator; denominator = -denominator; }
    let a = numerator < 0n ? -numerator : numerator;
    let b = denominator;
    while (b !== 0n) [a, b] = [b, a % b];
    const n = Number(numerator / a);
    const d = Number(denominator / a);
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d)) return fail('The reduced exact result exceeds safe rational components.');
    return {numerator: n === 0 ? 0 : n, denominator: d};
}

function calculate(operation: ArithmeticOperation, a: ExactNumericValue, b: ExactNumericValue): ExactNumericValue {
    const an = BigInt(a.numerator), ad = BigInt(a.denominator), bn = BigInt(b.numerator), bd = BigInt(b.denominator);
    if (operation === 'addition') return rational(an * bd + bn * ad, ad * bd);
    if (operation === 'subtraction') return rational(an * bd - bn * ad, ad * bd);
    return operation === 'multiplication' ? rational(an * bn, ad * bd) : rational(an * bd, ad * bn);
}

function children(node: Node): readonly (readonly [ExactNumericPath[number], Node])[] {
    switch (node.kind) {
        case 'number': return [];
        case 'binary': return [['left', node.left], ['right', node.right]];
        case 'group': return [['expression', node.expression]];
        case 'negation': return [['operand', node.operand]];
        case 'power': return [['base', node.base]];
    }
}

/** Validate the written grammar before evaluation; occurrence identity is a tree, never a DAG. */
function inspect(expression: unknown, constraints?: ExactNumericExpressionConstraints): Entry[] {
    const entries: Entry[] = [];
    const ids = new Set<string>();
    function visit(value: unknown, path: ExactNumericPath, groups: readonly string[]): void {
        if (!record(value) || typeof value.id !== 'string' || !value.id || value.id.trim() !== value.id || ids.has(value.id)) {
            return fail('Every syntax occurrence needs a unique nonempty identifier in a finite tree.');
        }
        ids.add(value.id);
        if (constraints && (ids.size > constraints.maximumNodes || path.length + 1 > constraints.maximumDepth)) {
            return fail('The expression exceeds the explicit node/depth policy.');
        }
        if (value.kind === 'number') {
            if (!isCanonicalSignedRational(value.value) || !isCoordinateNotation(value.value, value.notation)) {
                return fail('Every literal needs a safe exact value and equivalent supplied notation.');
            }
        } else if (value.kind === 'binary') {
            if (!operations.includes(value.operation as ArithmeticOperation)) return fail('Unsupported arithmetic operation.');
        } else if (value.kind === 'power') {
            if (!integer(value.exponent) || value.exponent < 0 || (constraints && value.exponent > constraints.maximumExponent)) {
                return fail('A power needs a nonnegative safe integer exponent within the explicit policy.');
            }
        } else if (value.kind !== 'group' && value.kind !== 'negation') return fail('Unsupported numeric syntax node.');
        const node = value as Node;
        entries.push({node, path, context: groups.at(-1) ?? '', groups});
        for (const [key, child] of children(node)) visit(child, [...path, key], node.kind === 'group' ? [...groups, node.id] : groups);
        if (node.kind === 'power' && node.base.kind !== 'number' && node.base.kind !== 'group') {
            return fail('A compound power base requires an explicit group.');
        }
        if (node.kind === 'negation' && node.operand.kind === 'binary') {
            return fail('This unary operand requires an explicit group.');
        }
        if (node.kind === 'binary' && (rank(node.left) < rank(node) || rank(node.right) < rank(node)
            || (node.right.kind === 'binary' && rank(node.right) === rank(node)))) {
            return fail('Written binary association requires an explicit group.');
        }
    }
    visit(expression, [], []);
    return entries;
}

function next(expression: Node, path: ExactNumericPath = []): Selection | null {
    if (expression.kind === 'number') return null;
    // Parentheses precede outside operations. Complete the leftmost innermost group first.
    function group(node: Node, location: ExactNumericPath): Selection | null {
        for (const [key, child] of children(node)) {
            const found = group(child, [...location, key]);
            if (found) return found;
        }
        return node.kind === 'group' ? next(node.expression, [...location, 'expression']) ?? {targetNodeId: node.id, path: location} : null;
    }
    const grouped = group(expression, path);
    if (grouped) return grouped;
    let selected: {node: Node; path: ExactNumericPath} | undefined;
    function ready(node: Node, location: ExactNumericPath): void {
        for (const [key, child] of children(node)) ready(child, [...location, key]);
        if (node.kind !== 'number' && children(node).every(([, child]) => child.kind === 'number')
            && (!selected || rank(node) > rank(selected.node))) selected = {node, path: location};
    }
    ready(expression, path);
    const candidate = selected!; // A validated finite nonliteral tree always has a ready redex.
    return {targetNodeId: candidate.node.id, path: candidate.path};
}

/** Select by written grouping/precedence, not by generic AST postorder readiness. */
export function selectNextNumericReduction(expression: Node): Selection | null {
    inspect(expression);
    return next(expression);
}

function at(node: Node, path: ExactNumericPath): Node {
    for (const key of path) {
        const child = children(node).find(([field]) => field === key);
        if (!child) return fail('A reduction path does not resolve in the current tree.');
        node = child[1];
    }
    return node;
}

function replace(node: Node, path: ExactNumericPath, replacement: Node): Node {
    if (path.length === 0) return replacement;
    const [key, ...rest] = path;
    return {...node, [key!]: replace(at(node, [key!]), rest, replacement)} as Node;
}

function literal(id: string, value: ExactNumericValue): Node {
    return {id, kind: 'number', value: {...value}, notation: value.denominator === 1
        ? {kind: 'integer', numeral: String(value.numerator)}
        : {kind: 'fraction', numerator: value.numerator, denominator: value.denominator}};
}

function evidence(node: OperationNode, values: ReadonlyMap<string, ExactNumericValue>): ExactNumericReductionEvidence {
    const result = values.get(node.id)!;
    switch (node.kind) {
        case 'binary': return {kind: 'binary', operation: node.operation, operands: [values.get(node.left.id)!, values.get(node.right.id)!], result};
        case 'power': return {kind: 'power', baseValue: values.get(node.base.id)!, exponent: node.exponent, result};
        case 'negation': return {kind: 'negation', operand: values.get(node.operand.id)!, result};
        case 'group': return {kind: 'group', enclosedValue: values.get(node.expression.id)!, result};
    }
}

function candidates(entries: readonly Entry[], reductions: readonly ExactNumericReduction[]): ExactNumericPrecedenceWitness[] {
    const steps = new Map(reductions.map((step, index) => [step.targetNodeId, index]));
    const operators = entries.filter(({node}) => node.kind !== 'number' && node.kind !== 'group');
    const witnesses: ExactNumericPrecedenceWitness[] = [];
    for (const high of operators) for (const low of operators) {
        const higherPriorityStep = steps.get(high.node.id)!;
        const lowerPriorityStep = steps.get(low.node.id)!;
        if (higherPriorityStep >= lowerPriorityStep) continue;
        let reason: ExactNumericPrecedenceWitness['reason'] | undefined;
        const ancestor = low.path.length < high.path.length && low.path.every((part, index) => high.path[index] === part);
        if (!ancestor) continue;
        if (high.groups.some(id => !low.groups.includes(id))) {
            reason = 'inner-group-before-outer-operation';
        } else {
            if (high.node.kind === 'power' && low.node.kind === 'binary') reason = 'power-before-product-or-sum';
            else if (high.node.kind === 'binary' && rank(high.node) === 2 && low.node.kind === 'binary' && rank(low.node) === 1) reason = 'product-before-sum';
            // Only a genuine same-tier left-associated binary chain supplies this binding witness.
            else if (high.node.kind === 'binary' && low.node.kind === 'binary' && rank(high.node) === rank(low.node)
                && high.path.slice(low.path.length).every(part => part === 'left')) {
                reason = 'equal-priority-left-to-right';
            }
        }
        if (reason) witnesses.push({higherPriorityNodeId: high.node.id, lowerPriorityNodeId: low.node.id,
            higherPriorityStep, lowerPriorityStep, reason});
    }
    return witnesses;
}

function policy(constraints: ExactNumericExpressionConstraints): (value: ExactNumericValue) => void {
    if (!record(constraints) || !['rational', 'nonnegative-rational', 'integer', 'nonnegative-integer'].includes(constraints.domain)
        || !isCanonicalSignedRational(constraints.maximumAbsoluteValue) || constraints.maximumAbsoluteValue.numerator < 0
        || !integer(constraints.maximumNodes) || constraints.maximumNodes < 1 || !integer(constraints.maximumDepth) || constraints.maximumDepth < 1
        || !integer(constraints.maximumExponent) || constraints.maximumExponent < 0) return fail('A complete explicit numeric construction policy is required.');
    return value => {
        if ((constraints.domain.startsWith('nonnegative') && value.numerator < 0)
            || (constraints.domain.endsWith('integer') && value.denominator !== 1)
            || BigInt(Math.abs(value.numerator)) * BigInt(constraints.maximumAbsoluteValue.denominator)
                > BigInt(constraints.maximumAbsoluteValue.numerator) * BigInt(value.denominator)) return fail('A mathematical quantity violates the explicit numeric policy.');
    };
}

function evaluate(expression: Node, suppliedFacts?: ReadonlyMap<string, ExactPowerFact>, check?: (value: ExactNumericValue) => void): {
    values: Map<string, ExactNumericValue>; facts: ExactPowerFact[];
} {
    const values = new Map<string, ExactNumericValue>();
    const facts: ExactPowerFact[] = [];
    function visit(node: Node): ExactNumericValue {
        const operands = children(node).map(([, child]) => visit(child));
        let value: ExactNumericValue;
        if (node.kind === 'number') value = {...node.value};
        else if (node.kind === 'binary') value = calculate(node.operation, operands[0]!, operands[1]!);
        else if (node.kind === 'negation') value = rational(-BigInt(operands[0]!.numerator), BigInt(operands[0]!.denominator));
        else if (node.kind === 'group') value = {...operands[0]!};
        else {
            const base = operands[0]!;
            check?.({numerator: node.exponent, denominator: 1});
            if (node.exponent === 0 && base.numerator === 0) return fail('Zero to the zeroth power is undefined.');
            const supplied = suppliedFacts?.get(node.id);
            // A fact count is checked BEFORE exponent-sized construction/power arithmetic on unknown data.
            if (suppliedFacts && (!supplied || !integer(supplied.exponent) || supplied.exponent !== node.exponent || !same(supplied.baseValue, base)
                || (node.exponent === 0 ? supplied.kind !== 'zero-exponent' || supplied.nonzeroBase !== true
                    : supplied.kind !== 'positive-exponent' || !sized(supplied.factors, node.exponent)
                    || !sized(supplied.cumulativeProducts, node.exponent - 1)))) {
                return fail('The complete power fact must agree with the original exponent and base.');
            }
            value = {numerator: 1, denominator: 1};
            const factors: ExactNumericValue[] = [];
            const cumulativeProducts: ExactNumericValue[] = [];
            for (let index = 0; index < node.exponent; index++) {
                value = calculate('multiplication', value, base);
                check?.(value);
                if (supplied?.kind === 'positive-exponent' && (!isCanonicalSignedRational(supplied.factors[index]) || !same(supplied.factors[index]!, base)
                    || (index > 0 && (!isCanonicalSignedRational(supplied.cumulativeProducts[index - 1]) || !same(supplied.cumulativeProducts[index - 1]!, value))))) {
                    return fail('Power factors and cumulative products must prove repeated multiplication.');
                }
                factors.push({...base});
                if (index > 0) cumulativeProducts.push({...value});
            }
            if (supplied && (!isCanonicalSignedRational(supplied.result) || !same(supplied.result, value))) return fail('The power result is false.');
            facts.push(node.exponent === 0 ? {nodeId: node.id, baseValue: base, exponent: 0, result: value, kind: 'zero-exponent', nonzeroBase: true}
                : {nodeId: node.id, baseValue: base, exponent: node.exponent, result: value, kind: 'positive-exponent',
                    factors: factors as [ExactNumericValue, ...ExactNumericValue[]], cumulativeProducts});
        }
        check?.(value);
        values.set(node.id, value);
        return value;
    }
    visit(expression);
    return {values, facts};
}

/** Construct complete exact evidence from literal numeric syntax under an explicit local policy. */
export function buildNumericalPowerExpressionProblem(expression: Node, constraints: ExactNumericExpressionConstraints): NumericalPowerExpressionProblem {
    const check = policy(constraints);
    const entries = inspect(expression, constraints);
    if (!entries.some(({node}) => node.kind === 'power')) return fail('A numerical power expression needs at least one power.');
    const {values, facts} = evaluate(expression, undefined, check);
    const reductions: ExactNumericReduction[] = [];
    let current = expression;
    let selected: Selection | null;
    while ((selected = next(current))) {
        const target = at(current, selected.path);
        const replacement = literal(target.id, values.get(target.id)!);
        current = replace(current, selected.path, replacement);
        reductions.push({...selected, evidence: evidence(target as OperationNode, values), after: current});
    }
    const nodeValues: ExactNumericNodeValue[] = entries.map(({node}) => ({nodeId: node.id, value: values.get(node.id)!}));
    return {kind: 'numerical-power-expression', expression, nodeValues: nodeValues as [ExactNumericNodeValue, ...ExactNumericNodeValue[]],
        powerFacts: facts as [ExactPowerFact, ...ExactPowerFact[]], reductions: reductions as [ExactNumericReduction, ...ExactNumericReduction[]],
        finalValue: values.get(expression.id)!, precedenceWitness: candidates(entries, reductions)[0] ?? null};
}

/** Compare declared mathematical fields, independent of object-key order or reference identity. */
function equal(first: unknown, second: unknown): boolean {
    if (Object.is(first, second)) return true;
    if (Array.isArray(first)) return sized(second, first.length) && first.every((item, index) => equal(item, second[index]));
    if (!record(first) || !record(second)) return false;
    return Object.keys(first).every(key => Object.hasOwn(second, key) && equal(first[key], second[key]));
}

/** Broad, total guard: exact supplied replacement spelling is accepted; sampler limits are absent. */
export function isNumericalPowerExpressionProblem(value: unknown): value is NumericalPowerExpressionProblem {
    try {
        if (!record(value) || value.kind !== 'numerical-power-expression') return false;
        const entries = inspect(value.expression);
        const powers = entries.filter(({node}) => node.kind === 'power');
        if (powers.length === 0 || !sized(value.nodeValues, entries.length) || !sized(value.powerFacts, powers.length)
            || !sized(value.reductions, entries.filter(({node}) => node.kind !== 'number').length)) return false;
        const suppliedValues = new Map<string, ExactNumericValue>();
        for (const row of value.nodeValues) {
            if (!record(row) || typeof row.nodeId !== 'string' || suppliedValues.has(row.nodeId) || !isCanonicalSignedRational(row.value)) return false;
            suppliedValues.set(row.nodeId, row.value);
        }
        const suppliedFacts = new Map<string, ExactPowerFact>();
        for (const row of value.powerFacts) {
            if (!record(row) || typeof row.nodeId !== 'string' || suppliedFacts.has(row.nodeId) || !isCanonicalSignedRational(row.baseValue)) return false;
            suppliedFacts.set(row.nodeId, row as ExactPowerFact);
        }
        const expression = value.expression as Node;
        const {values} = evaluate(expression, suppliedFacts);
        if (!entries.every(({node}) => suppliedValues.has(node.id) && same(suppliedValues.get(node.id)!, values.get(node.id)!))) return false;
        let current = expression;
        for (const raw of value.reductions) {
            if (!record(raw)) return false;
            const selected = next(current);
            if (!selected || raw.targetNodeId !== selected.targetNodeId || !equal(selected.path, raw.path)) return false;
            const target = at(current, selected.path);
            if (!equal(evidence(target as OperationNode, values), raw.evidence)) return false;
            inspect(raw.after);
            const after = raw.after as Node;
            const replacement = at(after, selected.path);
            if (replacement.kind !== 'number' || replacement.id !== target.id || !same(replacement.value, values.get(target.id)!)) return false;
            if (!equal(replace(current, selected.path, replacement), after)) return false;
            current = after;
        }
        if (current.kind !== 'number' || !isCanonicalSignedRational(value.finalValue) || !same(current.value, value.finalValue)
            || !same(value.finalValue, values.get(expression.id)!)) return false;
        const validWitnesses = candidates(entries, value.reductions as ExactNumericReduction[]);
        return value.precedenceWitness === null ? validWitnesses.length === 0
            : validWitnesses.some(witness => equal(witness, value.precedenceWitness));
    } catch {
        return false;
    }
}
