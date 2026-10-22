import {describe, expect, it} from 'vitest';
import type {ArithmeticOperation, ExactNumericExpressionConstraints, ExactNumericNotation, ExactNumericalExpressionNode,
    NumericalPowerExpressionProblem, SignedRational} from '../../types/problems.ts';
import {buildNumericalPowerExpressionProblem as build, isNumericalPowerExpressionProblem as valid,
    selectNextNumericReduction as select} from './numerical-power-helpers.ts';

type Node = ExactNumericalExpressionNode;
const q = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const number = (id: string, numerator: number, denominator = 1, notation?: ExactNumericNotation): Node => ({id, kind: 'number',
    value: q(numerator, denominator), notation: notation ?? (denominator === 1 ? {kind: 'integer', numeral: String(numerator)}
        : {kind: 'fraction', numerator, denominator})});
const binary = (id: string, operation: ArithmeticOperation, left: Node, right: Node): Node => ({id, kind: 'binary', operation, left, right});
const power = (id: string, base: Node, exponent = 2): Node => ({id, kind: 'power', base, exponent});
const group = (id: string, expression: Node): Node => ({id, kind: 'group', expression});
const negate = (id: string, operand: Node): Node => ({id, kind: 'negation', operand});
const policy: ExactNumericExpressionConstraints = {domain: 'rational', maximumAbsoluteValue: q(100), maximumNodes: 100, maximumDepth: 30, maximumExponent: 5};
const make = (node: Node, overrides: Partial<ExactNumericExpressionConstraints> = {}): NumericalPowerExpressionProblem => build(node, {...policy, ...overrides});
// Break cross-snapshot sharing so each mutation challenges its intended evidence boundary.
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
type Mutable = Record<string, any>;
const changed = (problem: NumericalPowerExpressionProblem, edit: (value: Mutable) => void): unknown => {
    const value = clone(problem) as unknown as Mutable;
    edit(value);
    return value;
};
const simple = (): NumericalPowerExpressionProblem => make(power('p', number('n', 3), 3));
const mixed = (): Node => binary('sum', 'addition', binary('left', 'addition', number('a', 1), number('b', 2)),
    binary('product', 'multiplication', number('c', 3), power('power', number('base', 2))));

function freeze<T>(value: T): T {
    if (typeof value === 'object' && value !== null) {
        Object.values(value).forEach(freeze);
        Object.freeze(value);
    }
    return value;
}

describe('exact numerical power builder and conventional scheduler', () => {
    it('builds literal independent values, power facts, paths and full after-snapshots', () => {
        const expression = freeze(power('p', number('a', -1, 2, {kind: 'fraction', numerator: -2, denominator: 4}), 3));
        const before = JSON.stringify(expression);
        const result = make(expression);
        expect(result).toEqual({kind: 'numerical-power-expression', expression,
            nodeValues: [{nodeId: 'p', value: q(-1, 8)}, {nodeId: 'a', value: q(-1, 2)}],
            powerFacts: [{nodeId: 'p', kind: 'positive-exponent', baseValue: q(-1, 2), exponent: 3, result: q(-1, 8),
                factors: [q(-1, 2), q(-1, 2), q(-1, 2)], cumulativeProducts: [q(1, 4), q(-1, 8)]}],
            reductions: [{targetNodeId: 'p', path: [], evidence: {kind: 'power', baseValue: q(-1, 2), exponent: 3, result: q(-1, 8)},
                after: number('p', -1, 8)}], finalValue: q(-1, 8), precedenceWitness: null});
        expect(JSON.stringify(expression)).toBe(before);
        expect(valid(result)).toBe(true);
        expect(select(number('done', 0))).toBeNull();
    });

    it('distinguishes a negative literal base from direct negation of a power without an invented group', () => {
        const base = make(power('p', number('n', -3)));
        const negation = make(negate('neg', power('p', number('n', 3))));
        expect(base.finalValue).toEqual(q(9));
        expect(negation.finalValue).toEqual(q(-9));
        expect(negation.reductions.map(step => step.targetNodeId)).toEqual(['p', 'neg']);
        expect(negation.reductions[1]!.evidence).toEqual({kind: 'negation', operand: q(9), result: q(-9)});
        expect(valid(negation)).toBe(true);
    });

    it('supplies exact zero/one exponent branches, canonical zero and retained decimal precision', () => {
        for (const base of [-3, 3]) {
            const result = make(power('p', number('n', base), 0));
            expect(result.finalValue).toEqual(q(1));
            expect(result.powerFacts).toEqual([{nodeId: 'p', kind: 'zero-exponent', baseValue: q(base), exponent: 0, result: q(1), nonzeroBase: true}]);
            expect(valid(result)).toBe(true);
        }
        const zero = make(negate('neg', power('p', number('n', 0), 1)));
        expect(zero.finalValue).toEqual(q(0));
        expect(zero.powerFacts[0]).toMatchObject({factors: [q(0)], cumulativeProducts: []});
        expect(valid(zero)).toBe(true);
        const decimal = number('n', -3, 4, {kind: 'decimal', coefficient: -750, scale: 3, numeral: '-0.750'});
        expect(make(power('p', decimal, 1)).expression).toEqual(power('p', decimal, 1));
        expect(valid(make(power('p', decimal, 1)))).toBe(true);
    });

    it('uses written precedence instead of reducing a structurally-ready left addition first', () => {
        const expression = freeze(mixed());
        const result = make(expression);
        expect(select(expression)).toEqual({targetNodeId: 'power', path: ['right', 'right']});
        expect(result.reductions.map(({targetNodeId, path}) => ({targetNodeId, path}))).toEqual([
            {targetNodeId: 'power', path: ['right', 'right']}, {targetNodeId: 'product', path: ['right']},
            {targetNodeId: 'left', path: ['left']}, {targetNodeId: 'sum', path: []}]);
        expect(result.reductions.map(step => step.evidence.result)).toEqual([q(4), q(12), q(3), q(15)]);
        expect(result.finalValue).toEqual(q(15));
        expect(result.precedenceWitness).toEqual({higherPriorityNodeId: 'left', lowerPriorityNodeId: 'sum',
            higherPriorityStep: 2, lowerPriorityStep: 3, reason: 'equal-priority-left-to-right'});
        expect(valid(result)).toBe(true);
        const withoutPower = binary('s', 'addition', binary('l', 'addition', number('a', 1), number('b', 2)),
            binary('m', 'multiplication', number('c', 3), number('d', 4)));
        expect(select(withoutPower)).toEqual({targetNodeId: 'm', path: ['right']});
    });

    it('completes leftmost innermost groups, including group removal, before outside work', () => {
        const expression = binary('mul', 'multiplication', group('outer', binary('add', 'addition',
            number('a', 1), group('inner', number('b', 2)))), power('p', number('c', 3)));
        const result = make(expression);
        expect(result.reductions.map(step => step.targetNodeId)).toEqual(['inner', 'add', 'outer', 'p', 'mul']);
        expect(result.reductions[0]!.path).toEqual(['left', 'expression', 'right']);
        expect(result.reductions[0]!.evidence).toEqual({kind: 'group', enclosedValue: q(2), result: q(2)});
        expect(result.precedenceWitness!.reason).toBe('inner-group-before-outer-operation');
        expect(result.finalValue).toEqual(q(27));
        expect(valid(result)).toBe(true);
        const twoGroups = binary('s', 'addition', group('g1', power('p1', number('a', 2))), group('g2', power('p2', number('b', 3))));
        expect(make(twoGroups).reductions.map(step => step.targetNodeId)).toEqual(['p1', 'g1', 'p2', 'g2', 's']);
    });

    it('handles grouped compound power bases, unary compounds and left-to-right product/sum chains', () => {
        const compound = make(power('p', group('g', binary('sub', 'subtraction', number('a', 1), number('b', 3)))));
        expect(compound.reductions.map(step => step.targetNodeId)).toEqual(['sub', 'g', 'p']);
        expect(compound.finalValue).toEqual(q(4));
        const unary = make(negate('n', group('g', binary('sub', 'subtraction', power('p', number('a', 3)), number('b', 10)))));
        expect(unary.finalValue).toEqual(q(1));
        expect(valid(unary)).toBe(true);
        const chain = make(binary('mul', 'multiplication', binary('div', 'division', power('p', number('a', 2), 3), number('b', 2)), number('c', 2)));
        expect(chain.reductions.map(step => step.targetNodeId)).toEqual(['p', 'div', 'mul']);
        expect(chain.finalValue).toEqual(q(8));
        expect(chain.precedenceWitness).not.toBeNull();
        const sub = make(binary('sub2', 'subtraction', binary('sub1', 'subtraction', power('p', number('a', 2), 3), number('b', 3)), number('c', 1)));
        expect(sub.finalValue).toEqual(q(4));
        expect(valid(sub)).toBe(true);
        const negProduct = make(binary('m', 'multiplication', negate('n', number('a', 2)), power('p', number('b', 3))));
        expect(negProduct.reductions.map(step => step.targetNodeId)).toEqual(['p', 'n', 'm']);
        expect(negProduct.finalValue).toEqual(q(-18));
        const nestedNegation = make(negate('outer', negate('inner', power('p', number('a', 3)))));
        expect(nestedNegation.reductions.map(step => step.targetNodeId)).toEqual(['p', 'inner', 'outer']);
        expect(nestedNegation.finalValue).toEqual(q(9));
        expect(valid(nestedNegation)).toBe(true);
    });

    it('uses BigInt arithmetic and reduction before conversion for large safe rational components', () => {
        const max = Number.MAX_SAFE_INTEGER;
        const multiply = binary('m', 'multiplication', power('p', number('a', max, max - 1), 1), number('b', max - 1, max));
        const broad = {maximumAbsoluteValue: q(max)};
        expect(make(multiply, broad).finalValue).toEqual(q(1));
        expect(make(binary('sum', 'addition', power('p', number('a', 1, max), 1), number('b', 1, max)), broad).finalValue).toEqual(q(2, max));
        expect(make(binary('sub', 'subtraction', power('p', number('a', 1, max), 1), number('b', 1, max)), broad).finalValue).toEqual(q(0));
        expect(make(binary('d', 'division', power('p', number('a', 3, 4), 1), number('b', -3, 2))).finalValue).toEqual(q(-1, 2));
        expect(valid(make(multiply, broad))).toBe(true);
        expect(make(power('p', number('a', 11, 4), 3)).finalValue).toEqual(q(1331, 64));
        expect(() => make(power('p', number('a', max), 2), broad)).toThrow(/safe rational/);
    });

    it('matches independent small-domain rational arithmetic oracles over every operation', () => {
        for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) for (const operation of ['addition', 'subtraction', 'multiplication', 'division'] as const) {
            if (operation === 'division' && b === 0) continue;
            const result = make(binary('root', operation, power('p', number('a', a), 1), number('b', b)));
            const expected = operation === 'addition' ? a + b : operation === 'subtraction' ? a - b : operation === 'multiplication' ? a * b : a / b;
            expect(result.finalValue.numerator / result.finalValue.denominator).toBe(expected === 0 ? 0 : expected);
            expect(valid(result)).toBe(true);
        }
    });
});

describe('strict syntax, numerical policy and complete unknown-input validation', () => {
    it('rejects malformed grammar/identity/value/notation without narrowing valid written binding', () => {
        const malformed: unknown[] = [null, {}, {kind: 'other', id: 'x'}, number('', 1), number(' x', 1),
            power('p', number('p', 1)), number('n', -0), number('n', 2, 4), number('n', 1, 0),
            number('n', 1, 2, {kind: 'fraction', numerator: 2, denominator: 3}),
            number('n', 1, 2, {kind: 'decimal', coefficient: 5, scale: 1, numeral: '0.50'}),
            {id: 'b', kind: 'binary', operation: 'remainder', left: number('a', 1), right: number('c', 2)},
            {id: 'b', kind: 'binary', operation: 'addition', left: number('a', 1)},
            power('p', binary('b', 'addition', number('a', 1), number('c', 2))),
            power('p', negate('n', number('a', 1))), power('p', power('p2', number('a', 1))),
            negate('n', binary('b', 'addition', number('a', 1), number('c', 2))),
            binary('m', 'multiplication', binary('s', 'addition', number('a', 1), number('b', 2)), number('c', 3)),
            binary('s', 'addition', number('a', 1), binary('s2', 'addition', number('b', 2), number('c', 3))),
            binary('m', 'multiplication', number('a', 1), binary('m2', 'division', number('b', 2), number('c', 3)))];
        for (const value of malformed) expect(() => select(value as Node)).toThrow();
        for (const exponent of [-1, -0, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
            expect(() => make(power('p', number('n', 2), exponent))).toThrow();
        }
        expect(() => make(number('n', 1))).toThrow(/at least one power/);
        const cycle: Mutable = {id: 'c', kind: 'group'}; cycle.expression = cycle;
        expect(() => select(cycle as Node)).toThrow();
        expect(valid({kind: 'numerical-power-expression', expression: cycle})).toBe(false);
        expect(() => make(power('p', number('n', 0), 0))).toThrow(/zeroth/);
        expect(() => make(binary('d', 'division', power('p', number('n', 2)), group('g', binary('s', 'subtraction', number('a', 1), number('b', 1)))))).toThrow(/zero/);
    });

    it('enforces explicit all-node domains/value bounds and resource policies before construction', () => {
        expect(make(power('p', number('n', 0), 1), {domain: 'nonnegative-integer'}).finalValue).toEqual(q(0));
        expect(make(power('p', number('n', 1, 2), 1), {domain: 'nonnegative-rational'}).finalValue).toEqual(q(1, 2));
        expect(make(power('p', number('n', -3), 2), {domain: 'integer'}).finalValue).toEqual(q(9));
        expect(() => make(power('p', number('n', -3), 2), {domain: 'nonnegative-rational'})).toThrow(/policy/);
        expect(() => make(binary('s', 'addition', power('p', number('n', 1, 2), 1), number('b', 1, 2)), {domain: 'integer'})).toThrow(/policy/);
        expect(() => make(binary('s', 'addition', group('g', binary('d', 'subtraction', power('p', number('n', 1), 1), number('b', 2))), number('c', 2)), {domain: 'nonnegative-integer'})).toThrow(/policy/);
        expect(() => make(binary('s', 'subtraction', power('p', number('a', 9)), power('p2', number('b', 9))), {maximumAbsoluteValue: q(20)})).toThrow(/policy/);
        expect(() => make(power('p', number('n', 1), 5), {maximumAbsoluteValue: q(4)})).toThrow(/policy/);
        expect(() => make(power('p', number('n', 2), 5), {maximumExponent: 4})).toThrow(/exponent/);
        expect(() => make(power('p', number('n', 2)), {maximumNodes: 1})).toThrow(/node/);
        expect(() => make(power('p', number('n', 2)), {maximumDepth: 1})).toThrow(/depth/);
        const invalid: unknown[] = [undefined, {}, {...policy, domain: 'real'}, {...policy, maximumAbsoluteValue: q(-1)},
            {...policy, maximumAbsoluteValue: q(2, 4)}, {...policy, maximumNodes: 0}, {...policy, maximumDepth: 0},
            {...policy, maximumExponent: -1}, {...policy, maximumNodes: -0}, {...policy, maximumDepth: 1.5}, {...policy, maximumExponent: NaN}];
        for (const constraints of invalid) expect(() => build(power('p', number('n', 2)), constraints as ExactNumericExpressionConstraints)).toThrow(/policy/);
    });

    it('accepts reordered complete tables and equivalent replacement notation, independent of property order', () => {
        const original = make(mixed());
        const transformed = changed(original, value => {
            value.nodeValues.reverse(); value.powerFacts.reverse();
            const replacement = {notation: {kind: 'decimal', coefficient: 400, scale: 2, numeral: '4.00'}, value: q(4), kind: 'number', id: 'power'};
            value.reductions[0].after.right.right = replacement;
            value.reductions[1].after.right = {id: 'product', kind: 'number', value: q(12), notation: {kind: 'fraction', numerator: 24, denominator: 2}};
            value.reductions[2].after.right = value.reductions[1].after.right;
        });
        expect(valid(transformed)).toBe(true);
        const anotherWitness = changed(original, value => { value.precedenceWitness = {
            higherPriorityNodeId: 'power', lowerPriorityNodeId: 'product', higherPriorityStep: 0, lowerPriorityStep: 1, reason: 'power-before-product-or-sum'}; });
        expect(valid(anotherWitness)).toBe(true);
        const broad = make(power('p', number('n', 1), 8), {maximumExponent: 8, maximumAbsoluteValue: q(1000)});
        expect(valid(broad)).toBe(true);
        expect(valid(null)).toBe(false);
        expect(valid({...original, kind: 'other'})).toBe(false);
    });

    it('rejects missing, duplicate, sparse, false and unknown original occurrence/value tables', () => {
        const original = simple();
        const edits: ((value: Mutable) => void)[] = [
            v => { v.expression = number('n', 1); }, v => { v.nodeValues = []; }, v => { v.powerFacts = []; }, v => { v.reductions = []; },
            v => { delete v.nodeValues[0]; }, v => { v.nodeValues[0] = null; }, v => { v.nodeValues[0].nodeId = 1; },
            v => { v.nodeValues[0].nodeId = 'unknown'; }, v => { v.nodeValues[1].nodeId = v.nodeValues[0].nodeId; },
            v => { v.nodeValues[0].value = q(1); }, v => { v.nodeValues[0].value = q(-0); },
            v => { v.powerFacts[0] = null; }, v => { v.powerFacts[0].nodeId = 1; }, v => { v.powerFacts[0].nodeId = 'missing'; },
            v => { v.powerFacts[0].baseValue = q(2, 4); }, v => { v.nodeValues = {}; }, v => { v.powerFacts = {}; }, v => { v.reductions = {}; }];
        for (const edit of edits) expect(valid(changed(original, edit))).toBe(false);
        const two = make(binary('s', 'addition', power('p1', number('a', 2)), power('p2', number('b', 3))));
        expect(valid(changed(two, v => { v.powerFacts[1].nodeId = 'p1'; }))).toBe(false);
        expect(valid(changed(original, v => { delete v.powerFacts[0]; }))).toBe(false);
    });

    it('rejects false/malformed power witnesses and huge-exponent count mismatches cheaply', () => {
        const original = simple();
        const edits: ((value: Mutable) => void)[] = [
            v => { v.powerFacts[0].exponent = 2; }, v => { v.powerFacts[0].baseValue = q(4); },
            v => { v.powerFacts[0].kind = 'zero-exponent'; }, v => { v.powerFacts[0].factors = []; },
            v => { delete v.powerFacts[0].factors[0]; }, v => { v.powerFacts[0].cumulativeProducts = []; },
            v => { delete v.powerFacts[0].cumulativeProducts[0]; }, v => { v.powerFacts[0].factors[1] = q(4); },
            v => { v.powerFacts[0].factors[0] = q(2, 4); }, v => { v.powerFacts[0].cumulativeProducts[0] = q(4); },
            v => { v.powerFacts[0].cumulativeProducts[0] = q(-0); }, v => { v.powerFacts[0].result = q(1); },
            v => { v.powerFacts[0].result = q(2, 4); },
            v => { v.expression.exponent = Number.MAX_SAFE_INTEGER; v.powerFacts[0].exponent = Number.MAX_SAFE_INTEGER; }];
        for (const edit of edits) expect(valid(changed(original, edit))).toBe(false);
        const zero = make(power('p', number('n', 2), 0));
        expect(valid(changed(zero, v => { v.powerFacts[0].nonzeroBase = false; }))).toBe(false);
        expect(valid(changed(zero, v => { v.powerFacts[0].kind = 'positive-exponent'; }))).toBe(false);
        expect(valid(changed(zero, v => { v.powerFacts[0].exponent = -0; }))).toBe(false);
        expect(valid(changed(original, v => { v.powerFacts[0].factors = new Array(0xffffffff); }))).toBe(false);
        expect(valid(changed(original, v => { v.nodeValues = new Array(0xffffffff); }))).toBe(false);
        expect(valid(changed(original, v => { v.expression.exponent = 0xffffffff; v.powerFacts[0].exponent = 0xffffffff;
            v.powerFacts[0].factors = new Array(0xffffffff); v.powerFacts[0].cumulativeProducts = new Array(0xfffffffe); }))).toBe(false);
    });

    it('rejects false, skipped, reordered, wrongly located or nonlocal snapshot reductions', () => {
        const original = make(mixed());
        const edits: ((value: Mutable) => void)[] = [
            v => { v.reductions[0] = null; }, v => { v.reductions[0].targetNodeId = 'left'; },
            v => { v.reductions[0].path = ['left']; }, v => { delete v.reductions[0].path[0]; },
            v => { v.reductions[0].evidence.result = q(5); }, v => { v.reductions[0].evidence.baseValue = q(-0); },
            v => { v.reductions[0].after.right.right = number('bad', 4); },
            v => { v.reductions[0].after.right.right = number('power', 5); },
            v => { v.reductions[0].after.right.right = power('power', number('other', 2)); },
            v => { v.reductions[0].after.right.right.notation = {kind: 'integer', numeral: '5'}; },
            v => { v.reductions[0].after.left.left = number('a', 2); },
            v => { v.reductions[0].after = number('power', 4); },
            v => { [v.reductions[0], v.reductions[1]] = [v.reductions[1], v.reductions[0]]; },
            v => { v.reductions[3].after.value = q(16); }, v => { v.finalValue = q(14); },
            v => { v.finalValue = q(2, 4); }, v => { v.precedenceWitness = null; },
            v => { v.precedenceWitness.higherPriorityNodeId = 'missing'; }, v => { v.precedenceWitness.higherPriorityStep = -0; },
            v => { v.precedenceWitness.reason = 'power-before-product-or-sum'; }];
        for (const edit of edits) expect(valid(changed(original, edit))).toBe(false);
        expect(valid(changed(simple(), v => { v.precedenceWitness = original.precedenceWitness; }))).toBe(false);
        expect(valid(changed(original, v => { v.precedenceWitness = {higherPriorityNodeId: 'power', lowerPriorityNodeId: 'left',
            higherPriorityStep: 0, lowerPriorityStep: 2, reason: 'power-before-product-or-sum'}; }))).toBe(false);
        const independentProducts = make(binary('s', 'addition', binary('m1', 'multiplication', power('p', number('a', 2)), number('b', 2)),
            binary('m2', 'multiplication', number('c', 2), number('d', 3))));
        expect(valid(changed(independentProducts, v => { v.precedenceWitness = {higherPriorityNodeId: 'm1', lowerPriorityNodeId: 'm2',
            higherPriorityStep: 1, lowerPriorityStep: 2, reason: 'equal-priority-left-to-right'}; }))).toBe(false);
    });
});
