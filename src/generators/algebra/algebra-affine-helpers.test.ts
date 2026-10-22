import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AffineExpression, AffineNormalizationProof, AlgebraicScalar, ArithmeticOperation,
    CommonAffineDomain, ExactAffineNormalForm, ExactSymbolicExpressionNode as Node} from '../../types/problems.ts';
import {addAffineScalars, affineCoefficientArithmetic, affineScalar, compareAffineScalars, divideAffineScalars,
    equalAffineNormalForms, equalAffineScalars, isAffineExpression, isAffineNormalizationProof, isCommonAffineDomain,
    isExactAffineNormalForm, multiplyAffineScalars, negateAffineScalar, normalizeAffineExpression, subtractAffineScalars} from './algebra-affine-helpers.ts';

const q = (numerator: number, denominator = 1): AlgebraicScalar => affineScalar(BigInt(numerator), BigInt(denominator));
const declaration = (symbolId: string): CommonAffineDomain['symbols'][number] => ({symbolId, symbol: symbolId,
    domain: {kind: 'rational', lower: null, upper: null, excludedValues: []}});
const domain = (): CommonAffineDomain => ({domainId: 'all-Q', kind: 'independent-rational-variables', symbols: [declaration('x'), declaration('y'), declaration('z')]});
const n = (id: string, numerator: number, denominator = 1): Extract<Node, {kind: 'number'}> => ({id, kind: 'number', value: q(numerator, denominator),
    notation: {kind: 'fraction', numerator, denominator}});
const x = (id: string, symbolId = 'x'): Node => ({id, kind: 'variable', symbolId});
const b = (id: string, operation: ArithmeticOperation, left: Node, right: Node): Node => ({id, kind: 'binary', operation, left, right});
const g = (id: string, expression: Node): Node => ({id, kind: 'group', expression});
const neg = (id: string, operand: Node): Node => ({id, kind: 'negation', operand});
const expression = (root: Node): AffineExpression => ({expressionId: 'source', domainId: 'all-Q', root});
const normal = (constant: AlgebraicScalar, coefficients: [string, AlgebraicScalar][] = []): ExactAffineNormalForm => ({constant,
    coefficients: coefficients.map(([symbolId, coefficient]) => ({symbolId, coefficient}))});
const build = (root: Node) => normalizeAffineExpression(expression(root), domain());
const step = (proof: AffineNormalizationProof, nodeId: string) => proof.steps.find(row => row.nodeId === nodeId)!;

function changed(value: unknown, path: readonly (string | number)[], replacement: unknown): unknown {
    const clone = structuredClone(value) as Record<string | number, unknown>;
    let cursor = clone;
    for (const field of path.slice(0, -1)) cursor = cursor[field] as typeof clone;
    cursor[path.at(-1)!] = replacement;
    return clone;
}

// Independent unlimited rational arithmetic and direct syntax evaluation (no producer normalizer).
type Q = readonly [bigint, bigint];
function reduced(numerator: bigint, denominator: bigint): Q {
    if (denominator < 0n) { numerator = -numerator; denominator = -denominator; }
    let a = numerator < 0n ? -numerator : numerator, d = denominator;
    while (d) [a, d] = [d, a % d];
    return [numerator / a, denominator / a];
}
function operation(name: ArithmeticOperation, a: Q, c: Q): Q {
    if (name === 'addition') return reduced(a[0] * c[1] + c[0] * a[1], a[1] * c[1]);
    if (name === 'subtraction') return reduced(a[0] * c[1] - c[0] * a[1], a[1] * c[1]);
    if (name === 'multiplication') return reduced(a[0] * c[0], a[1] * c[1]);
    return reduced(a[0] * c[1], a[1] * c[0]);
}
const pair = (value: AlgebraicScalar): Q => [BigInt(value.numerator), BigInt(value.denominator)];
function evaluate(node: Node, bindings: Readonly<Record<string, Q>>): Q {
    if (node.kind === 'number') return pair(node.value);
    if (node.kind === 'variable') return bindings[node.symbolId]!;
    if (node.kind === 'group') return evaluate(node.expression, bindings);
    if (node.kind === 'negation') {const value = evaluate(node.operand, bindings); return [-value[0], value[1]];}
    if (node.kind !== 'binary') throw Error('Oracle uses affine grammar');
    return operation(node.operation, evaluate(node.left, bindings), evaluate(node.right, bindings));
}

describe('exact affine scalar arithmetic', () => {
    it('reduces BigInts before safe conversion and preserves canonical zero/signs', () => {
        const maximum = BigInt(Number.MAX_SAFE_INTEGER);
        expect(affineScalar(maximum * maximum, maximum)).toEqual(q(Number.MAX_SAFE_INTEGER));
        expect(affineScalar(-12n, -18n)).toEqual(q(2, 3));
        expect(affineScalar(0n, -98n)).toEqual(q(0));
        expect(negateAffineScalar(q(0))).toEqual(q(0));
        expect(Object.is(negateAffineScalar(q(0)).numerator, -0)).toBe(false);
        expect(negateAffineScalar(q(-2, 3))).toEqual(q(2, 3));
        expect(addAffineScalars(q(1, 6), q(1, 3))).toEqual(q(1, 2));
        expect(subtractAffineScalars(q(1, 6), q(1, 3))).toEqual(q(-1, 6));
        expect(multiplyAffineScalars(q(-3, 2), q(4, 9))).toEqual(q(-2, 3));
        expect(divideAffineScalars(q(2, 3), q(-4, 3))).toEqual(q(-1, 2));
        expect(equalAffineScalars(q(2, 3), q(4, 6))).toBe(true);
        expect(equalAffineScalars(q(2, 3), q(1, 3))).toBe(false);
        expect(compareAffineScalars(q(-1), q(0))).toBe(-1);
        expect(compareAffineScalars(q(3, 2), q(1))).toBe(1);
        expect(compareAffineScalars(q(3, 2), q(3, 2))).toBe(0);
        expect(compareAffineScalars(q(Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER), q(Number.MAX_SAFE_INTEGER - 2, Number.MAX_SAFE_INTEGER - 1))).toBe(1);
    });

    it('supplies each exact arithmetic witness and rejects invalid or unsafe results', () => {
        const expected = [q(5, 6), q(1, 6), q(1, 6), q(3, 2)];
        for (const [index, name] of ['addition', 'subtraction', 'multiplication', 'division'].entries()) {
            expect(affineCoefficientArithmetic(name as ArithmeticOperation, q(1, 2), q(1, 3)))
                .toEqual({kind: 'binary', operation: name, operands: [q(1, 2), q(1, 3)], result: expected[index]});
        }
        for (const action of [() => affineScalar(1n, 0n), () => affineScalar(1 as never, 1n),
            () => affineScalar(1n, (BigInt(Number.MAX_SAFE_INTEGER) + 1n)),
            () => affineScalar(BigInt(Number.MAX_SAFE_INTEGER) + 1n, 1n), () => affineScalar(-BigInt(Number.MAX_SAFE_INTEGER) - 1n, 1n),
            () => divideAffineScalars(q(1), q(0)), () => addAffineScalars(q(Number.MAX_SAFE_INTEGER), q(1)),
            () => multiplyAffineScalars(q(Number.MAX_SAFE_INTEGER), q(2)),
            () => addAffineScalars({numerator: 2, denominator: 4}, q(0)),
            () => equalAffineScalars({numerator: -0, denominator: 1}, q(0)),
            () => affineCoefficientArithmetic('power' as never, q(1), q(2))]) expect(action).toThrow(GeneratorValidationError);
    });
});

describe('universal affine coefficient induction', () => {
    it('retains every original occurrence, exact literal spelling and signed coefficient operations', () => {
        const literal = {...n('three', 6, 2), notation: {kind: 'decimal' as const, coefficient: 300, scale: 2, numeral: '3.00'}};
        const root = b('difference', 'subtraction', b('product', 'multiplication', literal,
            g('group', b('sum', 'addition', x('x'), n('two', 2)))), b('quotient', 'division', x('y', 'y'), n('half-divisor', 2)));
        const proof = build(root);
        expect(proof.rootNormalForm).toEqual(normal(q(6), [['x', q(3)], ['y', q(-1, 2)]]));
        expect(proof.steps.map(row => row.nodeId)).toEqual(['three', 'x', 'two', 'sum', 'group', 'product', 'y', 'half-divisor', 'quotient', 'difference']);
        expect(step(proof, 'x')).toEqual({nodeId: 'x', result: normal(q(0), [['x', q(1)]]), kind: 'variable', symbolId: 'x', unitCoefficient: q(1)});
        expect(step(proof, 'quotient')).toMatchObject({kind: 'divide', numeratorNodeId: 'y', constantDenominatorNodeId: 'half-divisor', nonzeroDenominator: q(2)});
        expect(step(proof, 'difference')).toMatchObject({kind: 'subtract', components: [
            {symbolId: null, arithmetic: {operation: 'subtraction', operands: [q(6), q(0)], result: q(6)}},
            {symbolId: 'x', arithmetic: {operation: 'subtraction', operands: [q(3), q(0)], result: q(3)}},
            {symbolId: 'y', arithmetic: {operation: 'subtraction', operands: [q(0), q(1, 2)], result: q(-1, 2)}}]});
        expect(((root as Extract<Node, {kind: 'binary'}>).left as Extract<Node, {kind: 'binary'}>).left).toBe(literal);
        expect(isAffineNormalizationProof(proof, expression(root), domain())).toBe(true);
    });

    it('preserves canceled original symbols as explicit zero arithmetic at every enclosing operation', () => {
        const canceled = b('cancel', 'subtraction', x('first'), x('second'));
        const root = neg('negative', g('group', b('sum', 'addition', canceled, n('one', 1))));
        const proof = build(root);
        expect(proof.rootNormalForm).toEqual(normal(q(-1)));
        expect(step(proof, 'cancel')).toMatchObject({components: [{symbolId: null}, {symbolId: 'x', arithmetic: {operands: [q(1), q(1)], result: q(0)}}]});
        expect(step(proof, 'sum')).toMatchObject({components: [{symbolId: null}, {symbolId: 'x', arithmetic: {operands: [q(0), q(0)], result: q(0)}}]});
        expect(step(proof, 'negative')).toMatchObject({kind: 'negation', components: [{symbolId: null}, {symbolId: 'x', arithmetic: {operation: 'multiplication', operands: [q(-1), q(0)], result: q(0)}}]});
        expect(isAffineNormalizationProof(proof, expression(root), domain())).toBe(true);
        expect(build(neg('outer', neg('inner', x('atom')))).rootNormalForm).toEqual(normal(q(0), [['x', q(1)]]));
    });

    it('proves constant children by complete maps, including cancellations, with deterministic multiplication roles', () => {
        const cancel = () => b('cancel', 'subtraction', x('first'), x('second'));
        const zeroProduct = build(b('product', 'multiplication', g('zero-group', cancel()), x('y', 'y')));
        expect(zeroProduct.rootNormalForm).toEqual(normal(q(0)));
        expect(step(zeroProduct, 'product')).toMatchObject({constantNodeId: 'zero-group', affineNodeId: 'y', constantFactor: q(0), components: [{symbolId: null}, {symbolId: 'x'}, {symbolId: 'y'}]});
        const rightConstant = build(b('product', 'multiplication', x('first'), n('three', 3)));
        expect(step(rightConstant, 'product')).toMatchObject({constantNodeId: 'three', affineNodeId: 'first'});
        const both = build(b('product', 'multiplication', n('left', 2), n('right', 3)));
        expect(step(both, 'product')).toMatchObject({constantNodeId: 'left', affineNodeId: 'right', constantFactor: q(2), result: normal(q(6))});
        const denominator = g('denominator', b('sum', 'addition', cancel(), n('one', 1)));
        expect(build(b('divide', 'division', x('y', 'y'), denominator)).rootNormalForm).toEqual(normal(q(0), [['y', q(1)]]));
        expect(isAffineExpression(expression(n('constant-only', 2)), domain())).toBe(true);
        expect(build(n('constant-only', 2)).steps).toHaveLength(1);
    });

    it('validates every subtree, never rescues nonlinear or undefined work by later cancellation or multiplication by zero', () => {
        const nonlinear = b('nonlinear', 'multiplication', x('x'), x('y', 'y'));
        for (const root of [nonlinear, b('outer', 'multiplication', n('zero', 0), g('group', nonlinear)),
            b('quotient', 'division', x('first'), x('second')), b('quotient', 'division', x('first'), n('zero', 0)),
            {id: 'power', kind: 'power', base: x('base'), exponent: 1} as Node]) {
            expect(isAffineExpression(expression(root), domain())).toBe(false);
            expect(() => build(root)).toThrow(GeneratorValidationError);
        }
        expect(() => build(b('too-large', 'multiplication', n('maximum', Number.MAX_SAFE_INTEGER), n('two', 2)))).toThrow(GeneratorValidationError);
    });

    it('uses independent BigInt syntax and coefficient evaluation over an exact varied corpus', () => {
        for (let first = -3; first <= 3; first++) for (let second = -3; second <= 3; second++) {
            const root = b('divide', 'division', g('numerator', b('sum', 'addition',
                b('left', 'multiplication', n('a', first, 2), g('inner', b('inside', 'subtraction', x('x'), x('y', 'y')))),
                b('right', 'multiplication', n('b', second, 3), x('z', 'z')))), n('denominator', 3, 2));
            const proof = build(root);
            expect(isAffineNormalizationProof(proof, expression(root), domain())).toBe(true);
            for (const bindings of [{x: [0n, 1n], y: [0n, 1n], z: [0n, 1n]},
                {x: [-7n, 3n], y: [5n, 2n], z: [-11n, 4n]}, {x: [13n, 2n], y: [-17n, 3n], z: [19n, 5n]}] as Readonly<Record<string, Q>>[]) {
                let value = pair(proof.rootNormalForm.constant);
                for (const row of proof.rootNormalForm.coefficients) value = operation('addition', value,
                    operation('multiplication', pair(row.coefficient), bindings[row.symbolId]!));
                expect(value).toEqual(evaluate(root, bindings));
            }
            const expectedX = reduced(BigInt(first), 3n), expectedZ = reduced(BigInt(second) * 2n, 9n);
            expect(proof.rootNormalForm.coefficients).toEqual([
                ...(first ? [{symbolId: 'x', coefficient: {numerator: Number(expectedX[0]), denominator: Number(expectedX[1])}},
                    {symbolId: 'y', coefficient: {numerator: -Number(expectedX[0]), denominator: Number(expectedX[1])}}] : []),
                ...(second ? [{symbolId: 'z', coefficient: {numerator: Number(expectedZ[0]), denominator: Number(expectedZ[1])}}] : [])]);
        }
    });
});

describe('affine domain, map and induction guards', () => {
    it('requires the explicit independent all-Q domain and coherent original syntax', () => {
        expect(isCommonAffineDomain(domain())).toBe(true);
        for (const value of [null, {}, {...domain(), domainId: ''}, {...domain(), kind: 'finite-test'}, {...domain(), symbols: []},
            changed(domain(), ['symbols', 0, 'domain', 'kind'], 'integer'), changed(domain(), ['symbols', 0, 'domain', 'lower'], {value: q(0), inclusive: true}),
            changed(domain(), ['symbols', 0, 'domain', 'upper'], {value: q(1), inclusive: true}),
            changed(domain(), ['symbols', 0, 'domain', 'excludedValues'], [q(0)]), changed(domain(), ['symbols', 0, 'symbol'], '1')]) {
            expect(isCommonAffineDomain(value)).toBe(false);
            expect(isAffineExpression(expression(x('x')), value as never)).toBe(false);
        }
        const roots: unknown[] = [b('sum', 'addition', x('same'), x('same')), x('unknown', 'undeclared'), {...x('x'), value: q(1)},
            {...n('bad', 1), notation: {kind: 'integer', numeral: '2'}}, b('ungrouped', 'multiplication', b('sum', 'addition', x('x'), n('one', 1)), n('two', 2))];
        const cycle: Record<string, unknown> = {id: 'cycle', kind: 'group'}; cycle.expression = cycle; roots.push(cycle);
        for (const root of roots) expect(isAffineExpression(expression(root as Node), domain())).toBe(false);
        for (const value of [null, {}, {...expression(x('x')), expressionId: ' '}, {...expression(x('x')), domainId: 'another-domain'}]) {
            expect(isAffineExpression(value, domain())).toBe(false);
            expect(() => normalizeAffineExpression(value as never, domain())).toThrow();
        }
        expect(isCommonAffineDomain({get domainId() {throw Error('accessor');}})).toBe(false);
    });

    it('requires complete sorted nonzero canonical maps without dropping declared canceled symbols from the domain', () => {
        const map = normal(q(1), [['x', q(2)], ['y', q(-3)]]);
        expect(isExactAffineNormalForm(map, domain())).toBe(true);
        expect(equalAffineNormalForms(map, structuredClone(map))).toBe(true);
        expect(equalAffineNormalForms(map, normal(q(0), [['x', q(2)], ['y', q(-3)]]))).toBe(false);
        expect(equalAffineNormalForms(map, normal(q(1), [['x', q(2)]]))).toBe(false);
        expect(equalAffineNormalForms(map, normal(q(1), [['x', q(2)], ['z', q(-3)]]))).toBe(false);
        expect(equalAffineNormalForms(map, normal(q(1), [['x', q(2)], ['y', q(3)]]))).toBe(false);
        for (const value of [null, {}, {...map, constant: {numerator: -0, denominator: 1}}, {...map, coefficients: new Array(1)},
            normal(q(0), [['y', q(1)], ['x', q(1)]]), normal(q(0), [['x', q(1)], ['x', q(2)]]),
            normal(q(0), [['unknown', q(1)]]), normal(q(0), [['x', q(0)]]), {...map, coefficients: [null]},
            {...map, coefficients: [{symbolId: 1, coefficient: q(1)}]}]) expect(isExactAffineNormalForm(value, domain())).toBe(false);
        expect(isExactAffineNormalForm(map, {} as never)).toBe(false);
        expect(isExactAffineNormalForm({get constant() {throw Error('accessor');}}, domain())).toBe(false);
    });

    it('accepts alternate valid topological/component orders, but rejects incomplete, duplicate or forged induction', () => {
        const root = b('sum', 'addition', b('left', 'multiplication', n('two', 2), x('x')), b('right', 'division', x('y', 'y'), n('three', 3)));
        const input = expression(root), proof = build(root);
        const reordered = {...proof, steps: [proof.steps[3]!, proof.steps[4]!, proof.steps[5]!, proof.steps[0]!, proof.steps[1]!, proof.steps[2]!,
            {...proof.steps[6]!, components: [...(proof.steps[6] as Extract<typeof proof.steps[number], {kind: 'add' | 'subtract'}>).components].reverse()}]};
        expect(isAffineNormalizationProof(reordered, input, domain())).toBe(true);
        const mutations: [readonly (string | number)[], unknown][] = [
            [['expressionId'], 'other'], [['steps'], []], [['steps'], new Array(0xffffffff)], [['rootNormalForm'], normal(q(1))],
            [['steps', 0], null], [['steps', 0, 'nodeId'], 1], [['steps', 0, 'nodeId'], 'unknown'], [['steps', 0, 'kind'], 'variable'],
            [['steps', 0, 'value'], q(3)], [['steps', 0, 'result'], normal(q(3))], [['steps', 1, 'symbolId'], 'y'],
            [['steps', 1, 'unitCoefficient'], q(0)], [['steps', 2, 'constantNodeId'], 'x'], [['steps', 2, 'affineNodeId'], 'two'],
            [['steps', 2, 'constantFactor'], q(3)], [['steps', 2, 'components'], []], [['steps', 2, 'components', 0], null],
            [['steps', 2, 'components', 0, 'symbolId'], 1], [['steps', 2, 'components', 0, 'symbolId'], 'unknown'],
            [['steps', 2, 'components', 0, 'arithmetic', 'kind'], 'literal'], [['steps', 2, 'components', 0, 'arithmetic', 'operation'], 'addition'],
            [['steps', 2, 'components', 0, 'arithmetic', 'operands', 0], q(3)], [['steps', 2, 'components', 0, 'arithmetic', 'operands', 1], q(1)],
            [['steps', 2, 'components', 0, 'arithmetic', 'result'], q(1)], [['steps', 5, 'numeratorNodeId'], 'three'],
            [['steps', 5, 'constantDenominatorNodeId'], 'y'], [['steps', 5, 'nonzeroDenominator'], q(2)],
            [['steps', 6, 'leftNodeId'], 'right'], [['steps', 6, 'rightNodeId'], 'left']];
        for (const [path, replacement] of mutations) expect(isAffineNormalizationProof(changed(proof, path, replacement), input, domain()), path.join('.')).toBe(false);
        expect(isAffineNormalizationProof({...proof, steps: [proof.steps[1], proof.steps[0], proof.steps[2], ...proof.steps.slice(3)]}, input, domain())).toBe(true);
        expect(isAffineNormalizationProof({...proof, steps: [proof.steps[2], proof.steps[0], proof.steps[1], ...proof.steps.slice(3)]}, input, domain())).toBe(false);
        expect(isAffineNormalizationProof({...proof, steps: [proof.steps[0], proof.steps[0], ...proof.steps.slice(2)]}, input, domain())).toBe(false);
        const duplicated = structuredClone(proof);
        const target = duplicated.steps[2] as Extract<typeof proof.steps[number], {kind: 'multiply'}>;
        expect(isAffineNormalizationProof(changed(duplicated, ['steps', 2, 'components'], [target.components[0], target.components[0]]), input, domain())).toBe(false);
        expect(isAffineNormalizationProof(changed(proof, ['steps', 2, 'components'], new Array(2)), input, domain())).toBe(false);
        expect(isAffineNormalizationProof(null, input, domain())).toBe(false);
        expect(isAffineNormalizationProof({get expressionId() {throw Error('accessor');}}, input, domain())).toBe(false);
        expect(isAffineNormalizationProof(proof, expression(n('constant', 1)), {} as never)).toBe(false);
    });

    it('checks group/unary/subtraction links, genuine zero witnesses and original variable unit coefficients', () => {
        const root = neg('negative', g('group', b('subtract', 'subtraction', x('first'), x('second'))));
        const proof = build(root), input = expression(root);
        const cases: [readonly (string | number)[], unknown][] = [[['steps', 3, 'innerNodeId'], 'first'], [['steps', 4, 'operandNodeId'], 'subtract'],
            [['steps', 2, 'leftNodeId'], 'second'], [['steps', 2, 'rightNodeId'], 'first'], [['steps', 0, 'unitCoefficient'], {numerator: -0, denominator: 1}],
            [['steps', 2, 'components'], [{symbolId: null, arithmetic: affineCoefficientArithmetic('subtraction', q(0), q(0))}]],
            [['steps', 4, 'components', 1, 'arithmetic', 'result'], q(1)]];
        for (const [path, replacement] of cases) expect(isAffineNormalizationProof(changed(proof, path, replacement), input, domain())).toBe(false);
    });
});
