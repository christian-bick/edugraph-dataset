import {describe, expect, it} from 'vitest';
import type {AffineExpression, AlgebraExpressionEquivalenceProblem, ArithmeticOperation, CommonAffineDomain, ExactNumericalExpressionNode,
    ExactSymbolicExpressionNode as Node} from '../../types/problems.ts';
import {buildExactNumericCalculation} from '../arithmetic/exact-numeric-calculation-helpers.ts';
import {makeSignedRational} from '../number/signed-rational-helpers.ts';
import {buildAlgebraExpressionEquivalenceProblem as build, isAlgebraExpressionEquivalenceProblem as valid,
    type AffineRewriteDescriptor, type AlgebraEquivalenceBuildInput} from './algebra-equivalence-helpers.ts';

const q = makeSignedRational;
const n = (id: string, numerator: number, denominator = 1): Extract<Node, {kind: 'number'}> => ({id, kind: 'number', value: q(numerator, denominator), notation: {kind: 'fraction', numerator, denominator}});
const v = (id: string, symbolId = 'x'): Node => ({id, kind: 'variable', symbolId});
const b = (id: string, operation: ArithmeticOperation, left: Node, right: Node): Node => ({id, kind: 'binary', operation, left, right});
const g = (id: string, expression: Node): Node => ({id, kind: 'group', expression});
const domain: CommonAffineDomain = {domainId: 'all-Q', kind: 'independent-rational-variables', symbols: ['x', 'y'].map(symbolId => ({symbolId, symbol: symbolId,
    domain: {kind: 'rational' as const, lower: null, upper: null, excludedValues: []}})) as unknown as CommonAffineDomain['symbols']};
const expression = (expressionId: string, root: Node): AffineExpression => ({expressionId, domainId: domain.domainId, root});
function inputs(source: Node, result: Node, kind: AffineRewriteDescriptor['kind'], candidate: Node | null = null,
    direction?: 'factored-to-expanded' | 'expanded-to-factored' | 'left-to-right' | 'right-to-left'): AlgebraEquivalenceBuildInput {
    const descriptor = {kind, beforeExpressionId: 'source', afterExpressionId: 'result', beforeSubtreeId: source.id, afterSubtreeId: result.id,
        ...(direction ? {direction} : {})} as AffineRewriteDescriptor;
    return {domain, expressions: candidate ? [expression('source', source), expression('result', result), expression('candidate', candidate)]
        : [expression('source', source), expression('result', result)], sourceExpressionId: 'source', equivalentExpressionId: 'result',
    rewriteSteps: [descriptor], candidateExpressionId: candidate ? 'candidate' : 'result'};
}
function distribution(reverse = false, falseCandidate = false): AlgebraEquivalenceBuildInput {
    const x = v('x'), source = b('factored', 'multiplication', n('scalar', 3), g('sum-group', b('inner-sum', 'addition', n('two', 2), x)));
    const result = b('expanded', 'addition', n('six', 6), b('expanded-product', 'multiplication', n('three', 3), x));
    return inputs(reverse ? result : source, reverse ? source : result, 'distribution', falseCandidate ? b('false', 'addition', result, n('one', 1)) : null,
        reverse ? 'expanded-to-factored' : 'factored-to-expanded');
}
function collection(coefficients: readonly number[] = [1, 1, 1]): AlgebraEquivalenceBuildInput {
    const terms = coefficients.map((coefficient, index) => coefficient === 1 ? v(`x${index}`) : coefficient === -1
        ? {id: `negative${index}`, kind: 'negation' as const, operand: v(`x${index}`)}
        : b(`term${index}`, 'multiplication', n(`coefficient${index}`, coefficient), v(`x${index}`)));
    const source = terms.slice(1).reduce((root, term, index) => b(`sum${index}`, 'addition', root, term), terms[0]!);
    const total = coefficients.reduce((a, c) => a + c, 0);
    const variable = v('x0'), result = total === 0 ? n('zero-result', 0) : b('collected', 'multiplication', n('new-coefficient', total), variable);
    return inputs(source, result, 'collection');
}
function association(operation: 'addition' | 'multiplication' = 'addition', reverse = false): AlgebraEquivalenceBuildInput {
    const a = operation === 'addition' ? v('x') : n('two', 2), c = v('y', 'y'), d = n('three', 3);
    const source = b('before', operation, g('old-group', b('old-inner', operation, a, d)), c);
    const result = b('after', operation, a, g('new-group', b('new-inner', operation, d, c)));
    return inputs(reverse ? result : source, reverse ? source : result, 'association', null, reverse ? 'right-to-left' : 'left-to-right');
}
function commutation(operation: 'addition' | 'multiplication' = 'addition'): AlgebraEquivalenceBuildInput {
    const x = v('x'), two = n('two', 2);
    return inputs(b('before', operation, x, two), b('after', operation, two, x), 'commutation');
}
function changed(problem: AlgebraExpressionEquivalenceProblem, path: readonly string[], replacement: unknown): unknown {
    const value = structuredClone(problem) as unknown as Record<string, unknown>;
    let object = value; for (const key of path.slice(0, -1)) object = object[key] as Record<string, unknown>;
    object[path.at(-1)!] = replacement;
    return value;
}

describe('real local affine rewrites', () => {
    it.each([false, true])('derives distribution/extraction with actual constant products, reverse=%s', reverse => {
        const data = build(distribution(reverse));
        expect(valid(data)).toBe(true);
        expect(data.comparison.kind).toBe('equivalent');
        const step = data.validIdentity.steps[0];
        expect(step.kind).toBe('distribution');
        if (step.kind !== 'distribution') throw Error('fixture');
        expect(step.scalar).toEqual(q(3, 1));
        expect(step.coefficientProducts.map(row => row.operands)).toEqual([[q(3, 1), q(2, 1)], [q(3, 1), q(1, 1)]]);
        expect(step.coefficientProducts.map(row => row.result)).toEqual([q(6, 1), q(3, 1)]);
        expect(step.addendNodeIds).toEqual(['two', 'x']);
        expect(step.productNodeIds).toEqual(['six', 'expanded-product']);
    });
    it('verifies signed scalar products and preserves exact variable parts', () => {
        const x = v('x'), y = v('y', 'y');
        const source = b('before', 'multiplication', n('scalar', -2), g('group', b('difference', 'subtraction',
            b('first-product', 'multiplication', n('three', 3), x), b('second-product', 'multiplication', n('half', 1, 2), y))));
        const result = b('after', 'addition', b('negative-product', 'multiplication', n('negative-six', -6), x), y);
        const data = build(inputs(source, result, 'distribution', null, 'factored-to-expanded'));
        expect(valid(data)).toBe(true);
        expect(data.validIdentity.steps[0]).toMatchObject({scalar: q(-2, 1), coefficientProducts: [{result: q(-6, 1)}, {result: q(1, 1)}]});
    });
    it('infers either constant scalar orientation from the actual expansion, inside unchanged context', () => {
        for (const twoSums of [false, true]) for (const reverse of [false, true]) {
            const sum = g('first-group', b('first-sum', 'addition', n('two', 2), n('three', 3)));
            const multiplier = twoSums ? g('second-group', b('second-sum', 'addition', n('four', 4), n('five', 5))) : n('four', 4);
            const factored = b('factored', 'multiplication', sum, multiplier);
            const expanded = b('expanded', 'addition', n('first-result', twoSums ? 18 : 8), n('second-result', twoSums ? 27 : 12));
            const x = v('context-x'), wrap = (node: Node) => b('outer', 'addition', x, g('context-group', node));
            const options = inputs(wrap(reverse ? expanded : factored), wrap(reverse ? factored : expanded), 'distribution', null,
                reverse ? 'expanded-to-factored' : 'factored-to-expanded');
            const descriptor = {...options.rewriteSteps[0], beforeSubtreeId: reverse ? 'expanded' : 'factored', afterSubtreeId: reverse ? 'factored' : 'expanded'};
            const data = build({...options, rewriteSteps: [descriptor]});
            expect(valid(data)).toBe(true);
            expect(data.validIdentity.steps[0]).toMatchObject({kind: 'distribution', scalar: q(twoSums ? 9 : 4, 1), addendNodeIds: ['two', 'three']});
        }
    });
    it.each([[1, 1, 1], [3, -5], [3, -3], [0, 1], [-1, 1]])('collects exact signed and implicit coefficients %j', (...coefficients) => {
        const data = build(collection(coefficients));
        expect(valid(data)).toBe(true);
        const step = data.validIdentity.steps[0];
        if (step.kind !== 'collection') throw Error('fixture');
        expect(step.terms.map(term => term.signedCoefficient.numerator)).toEqual(coefficients);
        expect(step.coefficientSums).toHaveLength(coefficients.length - 1);
        expect(step.collectedCoefficient).toEqual(q(coefficients.reduce((sum, value) => sum + value, 0), 1));
    });
    it('infers the actual collected symbol instead of the first repeated symbol', () => {
        const x1 = v('x1'), x2 = v('x2'), y1 = v('y1', 'y'), y2 = v('y2', 'y');
        const intact = b('intact-x-sum', 'addition', x1, x2);
        const source = b('before', 'addition', b('before-left', 'addition', intact, y1), y2);
        const result = b('after', 'addition', intact, b('collected-y', 'multiplication', n('two', 2), y1));
        const data = build(inputs(source, result, 'collection'));
        expect(valid(data)).toBe(true);
        expect(data.validIdentity.steps[0]).toMatchObject({kind: 'collection', symbolId: 'y', collectedCoefficient: q(2, 1)});
        const both = b('changed-both', 'addition', b('collected-x', 'multiplication', n('two-x', 2), x1), b('collected-y', 'multiplication', n('two-y', 2), y1));
        expect(() => build(inputs(source, both, 'collection'))).toThrow();
    });
    it('collects constant-denominator terms through signs and groups without losing the original variable occurrences', () => {
        for (const variant of ['halves', 'negative-denominator', 'signed-numerator', 'scaled-numerator'] as const) {
            const x1 = v('x1'), x2 = v('x2');
            const numerator = variant === 'signed-numerator' ? {id: 'negative-x', kind: 'negation' as const, operand: x1}
                : variant === 'scaled-numerator' ? b('scaled-x', 'multiplication', n('three', 3), x1) : x1;
            const first = b('first-quotient', 'division', numerator, g('first-denominator', n('first-two',
                variant === 'negative-denominator' || variant === 'signed-numerator' ? -2 : 2)));
            const second = b('second-quotient', 'division', x2, n('second-two', variant === 'scaled-numerator' ? -2 : 2));
            const source = b('before', variant === 'negative-denominator' ? 'subtraction' : 'addition', g('first-group', first), g('second-group', second));
            const result = variant === 'negative-denominator' ? {id: 'result', kind: 'negation' as const, operand: x1} : x1;
            const data = build(inputs(source, result, 'collection'));
            expect(valid(data)).toBe(true);
            expect(data.validIdentity.steps[0]).toMatchObject({kind: 'collection', symbolId: 'x',
                terms: [{variableOccurrenceId: 'x1', signedCoefficient: q(variant === 'negative-denominator' ? -1 : variant === 'scaled-numerator' ? 3 : 1, 2)},
                    {variableOccurrenceId: 'x2', signedCoefficient: q(variant === 'negative-denominator' || variant === 'scaled-numerator' ? -1 : 1, 2)}],
                collectedCoefficient: q(variant === 'negative-denominator' ? -1 : 1, 1)});
        }
        const x1 = v('x1'), x2 = v('x2'), first = g('nonmonomial', b('same-symbol-sum', 'addition', x1, x2));
        const source = b('before', 'addition', b('quotient', 'division', first, n('two', 2)), v('x3'));
        const result = b('result', 'multiplication', n('new-two', 2), x1);
        expect(() => build(inputs(source, result, 'collection'))).toThrow('complete same-symbol group');
    });
    it.each(['addition', 'multiplication'] as const)('preserves ordered operands through both %s associations and commutation', operation => {
        for (const reverse of [false, true]) {
            const data = build(association(operation, reverse)); expect(valid(data)).toBe(true);
            expect(data.validIdentity.steps[0]).toMatchObject({kind: 'association', operation,
                beforeGrouping: reverse ? 'right' : 'left', afterGrouping: reverse ? 'left' : 'right'});
        }
        const data = build(commutation(operation)); expect(valid(data)).toBe(true);
        expect(data.validIdentity.steps[0]).toMatchObject({kind: 'commutation', operation, operandNodeIds: ['x', 'two']});
    });
    it('computes constant arithmetic only at the specified subtree and preserves its surrounding IDs', () => {
        const x = v('x'), before = b('calculation', 'addition', n('two', 2), n('three', 3)), after = n('five', 5);
        const source = b('outer', 'addition', x, g('context-group', before)), result = b('outer', 'addition', x, g('context-group', after));
        const descriptor = {...inputs(source, result, 'constant-arithmetic').rewriteSteps[0], beforeSubtreeId: 'calculation', afterSubtreeId: 'five'};
        const data = build({...inputs(source, result, 'constant-arithmetic'), rewriteSteps: [descriptor]});
        expect(valid(data)).toBe(true);
        expect(data.validIdentity.steps[0]).toMatchObject({kind: 'constant-arithmetic', arithmetic: {operands: [q(2, 1), q(3, 1)], result: q(5, 1)}});
        const alteredContext = b('outer', 'addition', v('different-x'), g('context-group', after));
        expect(() => build({...inputs(source, alteredContext, 'constant-arithmetic'), rewriteSteps: [descriptor]})).toThrow();
    });
    it('allows exact generic normalization with retained original domains after cancellation', () => {
        const source = b('before', 'subtraction', v('first'), v('second'));
        const data = build(inputs(source, n('zero', 0), 'coefficient-normalization', n('one', 1)));
        expect(valid(data)).toBe(true);
        expect(data.domain.symbols).toHaveLength(2);
        expect(data.validIdentity.universalProof.commonNormalForm).toEqual({constant: q(0, 1), coefficients: []});
        expect(data.comparison.kind).toBe('not-equivalent');
        if (data.comparison.kind !== 'not-equivalent') throw Error('fixture');
        expect(data.comparison.counterexample.right.replacements).toEqual([]);
        expect(data.comparison.counterexample.right.calculation.reductions).toEqual([]);
    });
});

describe('universal comparison versus a genuine counterexample', () => {
    it('uses all zero for a constant difference and keeps the independent valid identity intact', () => {
        const data = build(distribution(false, true));
        expect(valid(data)).toBe(true);
        if (data.comparison.kind !== 'not-equivalent') throw Error('fixture');
        const witness = data.comparison.counterexample;
        expect(witness.bindings.map(binding => binding.value)).toEqual([q(0, 1), q(0, 1)]);
        expect(witness.unequalValues).toEqual({left: q(6, 1), right: q(7, 1)});
        expect(data.validIdentity.universalProof.commonNormalForm.constant).toEqual(q(6, 1));
    });
    it('uses a differing coefficient basis and does not mistake agreement at zero for identity', () => {
        const options = commutation(), result = options.expressions[1].root;
        const candidate = b('false', 'addition', result, v('extra-x'));
        const data = build({...options, expressions: [...options.expressions, expression('candidate', candidate)], candidateExpressionId: 'candidate'});
        expect(valid(data)).toBe(true);
        if (data.comparison.kind !== 'not-equivalent') throw Error('fixture');
        expect(data.comparison.differingComponent).toEqual({symbolId: 'x', sourceCoefficient: q(1, 1), candidateCoefficient: q(2, 1)});
        expect(data.comparison.counterexample.bindings.map(binding => binding.value)).toEqual([q(1, 1), q(0, 1)]);
        expect(data.comparison.counterexample.unequalValues).toEqual({left: q(3, 1), right: q(4, 1)});
    });
    it('uses basis-1 only when preferred basis+1 has unsafe exact numeric work', () => {
        const maximum = Number.MAX_SAFE_INTEGER, x = v('x'), term = b('term', 'multiplication', n('factor', maximum), x), constant = n('constant', maximum);
        const source = b('before', 'addition', term, constant), result = b('after', 'addition', constant, term);
        const candidate = b('candidate-root', 'addition', b('candidate-product', 'multiplication', n('smaller-factor', maximum - 1), v('candidate-x')), constant);
        const data = build(inputs(source, result, 'commutation', candidate));
        expect(valid(data)).toBe(true);
        if (data.comparison.kind !== 'not-equivalent') throw Error('fixture');
        expect(data.comparison.counterexample.bindings[0].value).toEqual(q(-1, 1));
        expect(data.comparison.counterexample.unequalValues).toEqual({left: q(0, 1), right: q(1, 1)});
    });
    it('fails clearly when neither supported nonzero basis has representable numeric intermediates', () => {
        const maximum = Number.MAX_SAFE_INTEGER;
        const positive = g('positive-group', b('positive', 'addition', b('positive-product', 'multiplication', n('m1', maximum), v('x1')), n('m2', maximum)));
        const negative = g('negative-group', b('negative', 'subtraction', b('negative-product', 'multiplication', n('m3', maximum), v('x2')), n('m4', maximum)));
        const first = b('first', 'multiplication', n('half1', 1, 2), positive), second = b('second', 'multiplication', n('half2', 1, 2), negative);
        const source = b('before', 'addition', first, second), result = b('after', 'addition', second, first);
        const candidate = b('candidate-root', 'multiplication', n('smaller-factor', maximum - 1), v('candidate-x'));
        expect(() => build(inputs(source, result, 'commutation', candidate))).toThrow('safely representable numeric work');
    });
    it('accepts reordered complete normalizations and replacement rows without altering mathematical evidence', () => {
        const data = build(distribution(false, true));
        const proof = data.validIdentity.universalProof.leftNormalization;
        const steps = [...proof.steps];
        // Literal scalar and the inner constant are independent leaves.
        const scalar = steps.findIndex(step => step.nodeId === 'scalar'), constant = steps.findIndex(step => step.nodeId === 'two');
        [steps[scalar], steps[constant]] = [steps[constant]!, steps[scalar]!];
        expect(valid(changed(data, ['validIdentity', 'universalProof', 'leftNormalization', 'steps'], steps))).toBe(true);
        if (data.comparison.kind !== 'not-equivalent') throw Error('fixture');
        expect(valid(changed(data, ['comparison', 'counterexample', 'bindings'], [...data.comparison.counterexample.bindings].reverse()))).toBe(true);
    });
    it('accepts a coherent noncanonical counterexample assignment and its exact original-occurrence work', () => {
        const data = build(distribution(false, true));
        if (data.comparison.kind !== 'not-equivalent') throw Error('fixture');
        const binding = {symbolId: 'x', value: q(2, 1), notation: {kind: 'fraction' as const, numerator: 4, denominator: 2}};
        function replace(node: Node): ExactNumericalExpressionNode {
            if (node.kind === 'variable') return {id: node.id, kind: 'number', value: binding.value, notation: binding.notation};
            if (node.kind === 'binary') return {...node, left: replace(node.left), right: replace(node.right)};
            if (node.kind === 'group') return {...node, expression: replace(node.expression)};
            if (node.kind !== 'number') throw Error('fixture');
            return node;
        }
        const policy = {domain: 'rational' as const, maximumAbsoluteValue: q(100, 1), maximumNodes: 30, maximumDepth: 10, maximumExponent: 0};
        const leftExpression = data.expressions[0], rightExpression = data.expressions[2]!;
        const left = {sourceExpressionId: 'source', replacements: [{occurrenceNodeId: 'x', symbolId: 'x', value: binding.value, notation: binding.notation}],
            calculation: buildExactNumericCalculation(replace(leftExpression.root), policy)};
        const right = {sourceExpressionId: 'candidate', replacements: left.replacements,
            calculation: buildExactNumericCalculation(replace(rightExpression.root), policy)};
        const witness = {...data.comparison.counterexample, bindings: [binding, data.comparison.counterexample.bindings[1]], left, right,
            unequalValues: {left: q(12, 1), right: q(13, 1)}};
        expect(valid(changed(data, ['comparison', 'counterexample'], witness))).toBe(true);
    });
});

describe('reject forged laws, references and numeric witnesses', () => {
    it('rejects equivalent maps mislabeled as a different property or with changed surviving occurrences', () => {
        const options = distribution();
        expect(() => build({...options, rewriteSteps: [{...options.rewriteSteps[0], kind: 'commutation'}]})).toThrow();
        expect(() => build({...commutation(), rewriteSteps: [{...commutation().rewriteSteps[0], kind: 'association', direction: 'left-to-right'}]})).toThrow();
        const wrongIds = structuredClone(options);
        const after = wrongIds.expressions[1].root;
        if (after.kind !== 'binary' || after.right.kind !== 'binary') throw Error('fixture');
        const right = after.right;
        expect(() => build({...options, expressions: [options.expressions[0], expression('result', {...after, right: {...right, right: v('scalar')}})]})).toThrow();
        const x = v('x'); expect(() => build(inputs(b('a', 'addition', x, v('other')), b('b', 'addition', v('other'), x), 'commutation'))).toThrow();
        expect(() => build(inputs(b('a', 'subtraction', x, n('zero', 0)), b('b', 'subtraction', n('zero', 0), x), 'commutation'))).toThrow();
    });
    it('rejects incomplete registries/chains, variable-free sources and invalid domain restrictions', () => {
        const options = distribution();
        for (const bad of [null, {...options, expressions: []}, {...options, expressions: new Array(2)}, {...options, rewriteSteps: []},
            {...options, expressions: [options.expressions[0], options.expressions[0]]}, {...options, sourceExpressionId: 'missing'},
            {...options, equivalentExpressionId: 'source'}, {...options, candidateExpressionId: 'missing'},
            {...options, rewriteSteps: [{...options.rewriteSteps[0], beforeSubtreeId: 'missing'}]},
            {...options, rewriteSteps: [{...options.rewriteSteps[0], kind: 'unknown'}]},
            {...options, domain: {...domain, symbols: [{...domain.symbols[0], domain: {kind: 'rational', lower: null, upper: null, excludedValues: [q(0, 1)]}}]}}]) {
            expect(() => build(bad as AlgebraEquivalenceBuildInput)).toThrow();
        }
        expect(() => build(inputs(b('before', 'addition', n('a', 2), n('b', 3)), n('after', 5), 'constant-arithmetic'))).toThrow();
    });
    it('makes total guard reject false verdicts, missing structured proofs, bad references and numeric forgeries', () => {
        const data = build(distribution(false, true));
        const mutations: readonly [readonly string[], unknown][] = [
            [['kind'], 'other'], [['domain'], null], [['validIdentity'], null], [['comparison'], null],
            [['validIdentity', 'sourceExpressionId'], 'missing'], [['validIdentity', 'steps'], []], [['validIdentity', 'steps'], [null]],
            [['validIdentity', 'steps', '0', 'beforeExpressionId'], 'result'], [['validIdentity', 'steps', '0', 'scalar'], q(4, 1)],
            [['validIdentity', 'steps', '0', 'afterSubtreeId'], 'missing'], [['validIdentity', 'universalProof', 'commonNormalForm', 'constant'], q(99, 1)],
            [['comparison', 'sourceExpressionId'], 'result'], [['comparison', 'candidateExpressionId'], 'missing'], [['comparison', 'kind'], 'equivalent'],
            [['comparison', 'kind'], 'unknown'], [['comparison', 'sourceNormalization'], null], [['comparison', 'differingComponent'], null],
            [['comparison', 'differingComponent', 'symbolId'], 'undeclared'], [['comparison', 'differingComponent', 'candidateCoefficient'], q(6, 1)],
            [['comparison', 'counterexample'], null], [['comparison', 'counterexample', 'bindings'], []],
            [['comparison', 'counterexample', 'bindings', '0', 'symbolId'], 'missing'],
            [['comparison', 'counterexample', 'bindings', '0', 'value'], {numerator: -0, denominator: 1}],
            [['comparison', 'counterexample', 'left', 'sourceExpressionId'], 'result'],
            [['comparison', 'counterexample', 'left', 'replacements'], []],
            [['comparison', 'counterexample', 'left', 'calculation', 'finalValue'], q(99, 1)],
            [['comparison', 'counterexample', 'unequalValues', 'left'], q(99, 1)]
        ];
        for (const [path, replacement] of mutations) expect(valid(changed(data, path, replacement)), path.join('.')).toBe(false);
        for (const value of [null, {}, Object.defineProperty({}, 'kind', {get() { throw Error('bad getter'); }})]) expect(valid(value)).toBe(false);
    });
});
