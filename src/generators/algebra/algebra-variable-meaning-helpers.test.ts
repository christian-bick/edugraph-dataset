import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AlgebraicScalar, AlgebraVariableMeaningProblem, ArithmeticOperation, ExactSymbolicExpressionNode as Node,
    VariableMeaningDomain, VariableMeaningQuantity} from '../../types/problems.ts';
import {makeSignedRational} from '../number/signed-rational-helpers.ts';
import {buildStatementAssignmentCheck} from './algebra-statement-core-helpers.ts';
import {buildAlgebraVariableMeaningProblem as build, isAlgebraVariableMeaningProblem as guard,
    type VariableMeaningBuildInput} from './algebra-variable-meaning-helpers.ts';

const q = (numerator: number, denominator = 1): AlgebraicScalar => makeSignedRational(numerator, denominator);
const number = (id: string, numerator: number, denominator = 1): Extract<Node, {kind: 'number'}> => ({id, kind: 'number', value: q(numerator, denominator),
    notation: denominator === 1 ? {kind: 'integer', numeral: String(numerator)} : {kind: 'fraction', numerator, denominator}});
const variable = (id = 'x'): Extract<Node, {kind: 'variable'}> => ({id, kind: 'variable', symbolId: 'x'});
const binary = (id: string, operation: ArithmeticOperation, left: Node, right: Node): Node => ({id, kind: 'binary', operation, left, right});
const group = (id: string, expression: Node): Node => ({id, kind: 'group', expression});
const domain = (name: VariableMeaningDomain['name'] = 'rational-numbers'): VariableMeaningDomain => ({domainId: `named-${name}`, name,
    set: {kind: name === 'integers' || name === 'nonnegative-integers' ? 'integer' : 'rational',
        lower: name.startsWith('nonnegative') ? {value: q(0), inclusive: true} : null, upper: null, excludedValues: []}});
const quantities = {
    number: {kind: 'number', referent: 'mathematical-number', unit: 'none'},
    count: {kind: 'count', referent: 'tokens-in-a-bag', unit: 'tokens'},
    length: {kind: 'length', referent: 'segment-length', unit: 'meters'}
} as const satisfies Record<string, VariableMeaningQuantity>;
const input = (left: Node = variable(), right: Node = number('seven', 7), role: VariableMeaningBuildInput['role'] = 'particular-unknown',
    set = domain(), quantity: VariableMeaningQuantity = quantities.number): VariableMeaningBuildInput => ({domain: set, symbol: {symbolId: 'x', symbol: 'x'}, quantity,
    expressions: [{expressionId: 'left', root: left}, {expressionId: 'right', root: right}], role});
const changed = <T>(source: T, edit: (value: any) => void): T => {const value = structuredClone(source); edit(value); return value;};
const particular = (data: AlgebraVariableMeaningProblem) => {
    if (data.role.kind !== 'particular-unknown') throw Error('Particular fixture');
    return data.role.uniqueValueWitness;
};
const universal = (data: AlgebraVariableMeaningProblem) => {
    if (data.role.kind !== 'arbitrary-generalized-number') throw Error('Universal fixture');
    return data.role.universalProof;
};

/** Complete literal proofs written independently of the builder and normalizer. */
function literalOracle(generalized = false): AlgebraVariableMeaningProblem {
    const symbol = {symbolId: 'x', symbol: 'x'}, proofDomain = {domainId: 'proof', kind: 'independent-rational-variables' as const,
        symbols: [{...symbol, domain: {kind: 'rational' as const, lower: null, upper: null, excludedValues: []}}] as const};
    const left = {expressionId: 'left', domainId: 'proof', root: variable('original-variable')};
    const right = {expressionId: 'right', domainId: 'proof', root: generalized ? variable('second-variable') : number('original-seven', 7)};
    const linear = {constant: q(0), coefficients: [{symbolId: 'x', coefficient: q(1)}]}, constant = {constant: q(7), coefficients: []};
    const leftNormalization = {expressionId: 'left', steps: [{nodeId: 'original-variable', kind: 'variable' as const, symbolId: 'x',
        unitCoefficient: {numerator: 1 as const, denominator: 1 as const}, result: linear}] as const, rootNormalForm: linear};
    const core = {kind: 'algebra-variable-models' as const, domain: domain(), symbol, quantity: quantities.number, proofDomain,
        expressions: [left, right] as const, relation: {leftExpressionId: 'left', rightExpressionId: 'right'}};
    if (generalized) {
        const rightNormalization = {...leftNormalization, expressionId: 'right', steps: [{...leftNormalization.steps[0], nodeId: 'second-variable'}] as const};
        return {...core, role: {kind: 'arbitrary-generalized-number', quantifier: 'for-every-domain-member', domainInclusion: 'named-domain-subset-of-rationals',
            universalProof: {domainId: 'proof', leftExpressionId: 'left', rightExpressionId: 'right', leftNormalization, rightNormalization, commonNormalForm: linear}}};
    }
    const rightNormalization = {expressionId: 'right', steps: [{nodeId: 'original-seven', kind: 'literal' as const, value: q(7), result: constant}] as const, rootNormalForm: constant};
    const calculation = (id: string) => ({expression: number(id, 7), nodeValues: [{nodeId: id, value: q(7)}] as const,
        powerFacts: [], reductions: [], finalValue: q(7), precedenceWitness: null});
    return {...core, role: {kind: 'particular-unknown', situation: 'one-fixed-situation', uniqueValueWitness: {leftNormalization, rightNormalization,
        coefficientDifference: {kind: 'binary', operation: 'subtraction', operands: [q(1), q(0)], result: q(1)},
        constantDifference: {kind: 'binary', operation: 'subtraction', operands: [q(0), q(7)], result: q(-7)},
        inverseArithmetic: {kind: 'binary', operation: 'division', operands: [q(7), q(1)], result: q(7)}, uniqueValue: q(7),
        verification: {binding: {symbolId: 'x', value: q(7), notation: {kind: 'integer', numeral: '7'}},
            left: {replacements: [{occurrenceNodeId: 'original-variable', symbolId: 'x', value: q(7), notation: {kind: 'integer', numeral: '7'}}], calculation: calculation('original-variable')},
            right: {replacements: [], calculation: calculation('original-seven')}, comparison: {operator: 'equal', leftValue: q(7), rightValue: q(7), truth: true}}}}};
}

describe('variable meaning from exact quantified relations', () => {
    it('accepts independent complete particular and universal proof oracles', () => {
        expect(guard(literalOracle())).toBe(true);
        expect(guard(literalOracle(true))).toBe(true);
    });

    it('distinguishes one particular zero, count and measure from universal named-domain membership', () => {
        const plus = (value: number) => binary('sum', 'addition', variable(), number('added', value));
        for (const [total, expected] of [[10, 7], [3, 0]] as const) {
            const data = build(input(plus(3), number('total', total), 'particular-unknown', domain('nonnegative-integers'), quantities.count));
            expect(particular(data).uniqueValue).toEqual(q(expected));
            expect(particular(data).verification.comparison.leftValue).toEqual(q(total));
            expect(guard(data)).toBe(true);
            expect(Object.is(particular(data).inverseArithmetic.operands[0].numerator, -0)).toBe(false);
        }
        const length = build(input(binary('sum', 'addition', variable(), number('added', 3, 4)), number('total', 17, 4),
            'particular-unknown', domain('nonnegative-rational-numbers'), quantities.length));
        expect(particular(length).uniqueValue).toEqual(q(7, 2)); expect(guard(length)).toBe(true);
        for (const name of ['rational-numbers', 'integers', 'nonnegative-rational-numbers', 'nonnegative-integers'] as const) {
            const data = build(input(variable(), variable('other'), 'arbitrary-generalized-number', domain(name)));
            expect(guard(data)).toBe(true);
            expect(data.proofDomain.symbols[0].domain).toEqual({kind: 'rational', lower: null, upper: null, excludedValues: []});
        }
    });

    it('proves exact repeated-variable roots with an independent rational grid oracle', () => {
        const affine = (id: string, a: number, b: number): Node => binary(`${id}-sum`, 'addition',
            binary(`${id}-product`, 'multiplication', number(`${id}-a`, a), variable(`${id}-x`)), number(`${id}-b`, b));
        for (let a = -2; a <= 2; a++) for (let c = -2; c <= 2; c++) if (a !== c) {
            for (let b = -1; b <= 1; b++) for (let d = -1; d <= 1; d++) {
                const data = build(input(affine('L', a, b), affine('R', c, d))), witness = particular(data), root = witness.uniqueValue;
                expect(BigInt(root.numerator) * BigInt(a - c)).toBe(BigInt(d - b) * BigInt(root.denominator));
                expect(witness.coefficientDifference.result).toEqual(q(a - c));
                expect(witness.constantDifference.result).toEqual(q(b - d));
                expect(guard(data)).toBe(true);
            }
        }
        const reversed = build(input(number('seven', -7), variable()));
        expect(particular(reversed).uniqueValue).toEqual(q(-7)); expect(guard(reversed)).toBe(true);
    });

    it('proves nontrivial universal identities, exact original spellings and canceled symbols', () => {
        const fixtures: readonly [Node, Node, VariableMeaningDomain, VariableMeaningQuantity][] = [
            [binary('sum', 'addition', variable('a'), variable('b')), binary('double', 'multiplication', number('two', 2), variable('c')), domain('nonnegative-integers'), quantities.count],
            [binary('sum', 'addition', variable('a'), number('half', 1, 2)), binary('reverse', 'addition', number('other-half', 1, 2), variable('b')), domain(), quantities.number],
            [binary('sum', 'addition', variable('a'), group('inner-group', binary('inner', 'addition', variable('b'), number('one', 1)))),
                binary('outer', 'addition', binary('product', 'multiplication', number('two', 2), variable('c')), number('other-one', 1)), domain('integers'), quantities.number],
            [binary('cancel', 'subtraction', variable('a'), variable('b')), number('zero', 0), domain(), quantities.number],
            [binary('sum', 'addition', binary('coefficient', 'multiplication', number('unreduced', 2, 4), variable()),
                {...number('decimal', 1, 2), notation: {kind: 'decimal', coefficient: 500, scale: 3, numeral: '0.500'}}),
                binary('other-sum', 'addition', binary('other-coefficient', 'multiplication', number('half', 1, 2), variable('other')), number('other-half', 1, 2)), domain(), quantities.number]
        ];
        for (const [left, right, named, quantity] of fixtures) {
            const data = build(input(left, right, 'arbitrary-generalized-number', named, quantity));
            expect(guard(data)).toBe(true); expect(data.expressions[0].root).toEqual(left);
            expect(universal(data).leftNormalization.rootNormalForm).toEqual(universal(data).rightNormalization.rootNormalForm);
            expect(data.proofDomain.symbols).toHaveLength(1);
        }
    });

    it('accepts alternate topological/component orders and equivalent coherent binding notation', () => {
        const data = build(input(binary('sum', 'addition', variable(), number('quarter', 1, 4)), number('total', 3, 4)));
        const witness = particular(data), steps = [...witness.leftNormalization.steps];
        [steps[0], steps[1]] = [steps[1]!, steps[0]!];
        const reordered = changed(data, value => {
            value.role.uniqueValueWitness.leftNormalization.steps = steps;
            value.role.uniqueValueWitness.leftNormalization.steps.at(-1).components.reverse();
        });
        const alternate = buildStatementAssignmentCheck({operator: 'equal', left: data.expressions[0].root, right: data.expressions[1].root}, data.symbol,
            {kind: 'numeric', values: {kind: 'rational', lower: null, upper: null, excludedValues: []}},
            {symbolId: 'x', value: q(1, 2), notation: {kind: 'fraction', numerator: 2, denominator: 4}});
        const alternative = changed(reordered, value => {value.role.uniqueValueWitness.verification = alternate;
            value.role.uniqueValueWitness.verification.left.calculation.nodeValues.reverse();});
        expect(guard(alternative)).toBe(true);
        const general = build(input(binary('sum', 'addition', variable(), number('one', 1)), binary('other', 'addition', number('second-one', 1), variable('second')), 'arbitrary-generalized-number'));
        expect(guard(changed(general, value => {
            const steps = value.role.universalProof.rightNormalization.steps;
            [steps[0], steps[1]] = [steps[1], steps[0]];
            steps.at(-1).components.reverse();
        }))).toBe(true);
    });

    it('rejects zero-coefficient, false-universal and inadmissible particular claims', () => {
        const cancel = () => binary('cancel', 'subtraction', variable('a'), variable('b'));
        const bad = [input(cancel(), number('zero', 0)), input(cancel(), number('one', 1)),
            input(variable(), number('minus', -1), 'particular-unknown', domain('nonnegative-integers'), quantities.count),
            input(variable(), number('minus', -1), 'particular-unknown', domain('nonnegative-rational-numbers'), quantities.length),
            input(binary('twice', 'multiplication', number('two', 2), variable()), number('one', 1), 'particular-unknown', domain('integers')),
            input(binary('sum', 'addition', variable(), number('two', 2)), binary('double', 'multiplication', number('other-two', 2), variable('other')), 'arbitrary-generalized-number')];
        for (const source of bad) expect(() => build(source)).toThrow(GeneratorValidationError);
        expect(() => build({...input(), role: 'task' as never})).toThrow(GeneratorValidationError);
    });

    it('accepts safe boundary values and rejects genuinely unsafe reduced roots', () => {
        const maximum = Number.MAX_SAFE_INTEGER, valid = build(input(variable(), number('maximum', maximum)));
        expect(particular(valid).uniqueValue).toEqual(q(maximum)); expect(guard(valid)).toBe(true);
        expect(() => build(input(binary('half', 'multiplication', number('factor', 1, 2), variable()), number('maximum', maximum)))).toThrow(GeneratorValidationError);
        const denominator = group('denominator-group', binary('constant-one', 'addition', binary('cancel', 'subtraction', variable('a'), variable('b')), number('one', 1)));
        const constantDenominator = build(input(binary('quotient', 'division', variable('c'), denominator), variable('d'), 'arbitrary-generalized-number'));
        expect(guard(constantDenominator)).toBe(true);
        expect(() => build(input(binary('bad-quotient', 'division', variable('a'), variable('b')), number('one', 1)))).toThrow(GeneratorValidationError);
    });

    it('strictly validates named domains, quantity meanings, original declarations and refs', () => {
        const source = literalOracle();
        const mutations: ((value: any) => void)[] = [
            value => {value.kind = 'other';}, value => {value.domain.domainId = '';}, value => {value.domain.name = 'naturals';},
            value => {value.domain.set.kind = 'integer';}, value => {value.domain.set.upper = {value: q(10), inclusive: true};},
            value => {value.domain.set.excludedValues = [q(1)];}, value => {value.domain.set.lower = {value: q(0), inclusive: true};},
            value => {value.symbol.symbolId = 'y';}, value => {value.symbol.symbol = '2x';},
            value => {value.proofDomain.symbols.push({...value.proofDomain.symbols[0], symbolId: 'y', symbol: 'y'});},
            value => {value.proofDomain.symbols[0].symbol = 'y';}, value => {value.proofDomain.symbols[0].domain.kind = 'integer';},
            value => {value.quantity.kind = 'volume';}, value => {value.quantity.unit = 'meters';},
            value => {value.expressions[1].expressionId = 'left';}, value => {value.expressions[0].domainId = 'wrong';},
            value => {value.relation.leftExpressionId = 'right';}, value => {value.relation.rightExpressionId = 'left';},
            value => {value.expressions = [value.expressions[0]];},
            value => {value.expressions[0].root = number('seven', 7);}
        ];
        for (const edit of mutations) expect(guard(changed(source, edit))).toBe(false);
        for (const kind of ['count', 'length'] as const) expect(guard(changed(source, value => {value.quantity = quantities[kind];}))).toBe(false);
        for (const role of ['particular-unknown', 'arbitrary-generalized-number'] as const) {
            const source = build(input(variable(), role === 'particular-unknown' ? number('seven', 7) : variable('other'), role, domain('integers')));
            expect(guard(changed(source, value => {
                value.proofDomain.domainId = value.domain.domainId;
                value.expressions.forEach((expression: any) => {expression.domainId = value.domain.domainId;});
                if (value.role.kind === 'arbitrary-generalized-number') value.role.universalProof.domainId = value.domain.domainId;
            }))).toBe(false);
        }
        for (const name of ['nonnegative-rational-numbers', 'nonnegative-integers'] as const) {
            const source = build(input(variable(), number('seven', 7), 'particular-unknown', domain(name)));
            for (const lower of [null, {value: q(1), inclusive: true}, {value: q(0), inclusive: false}]) expect(guard(changed(source, value => {value.domain.set.lower = lower;}))).toBe(false);
        }
        expect(guard(changed(build(input(variable(), number('seven', 7), 'particular-unknown', domain('nonnegative-integers'), quantities.count)), value => {value.quantity.referent = 'segment-length';}))).toBe(false);
        expect(guard(changed(build(input(variable(), number('seven', 7), 'particular-unknown', domain('nonnegative-rational-numbers'), quantities.length)), value => {value.quantity.unit = 'feet';}))).toBe(false);
    });

    it('rejects forged particular induction/arithmetic/root/verification and role evidence', () => {
        const source = literalOracle();
        const mutations: ((value: any) => void)[] = [value => {value.role = {};}, value => {value.role.situation = 'any-situation';},
            value => {value.role.uniqueValueWitness = null;}, value => {value.role.uniqueValueWitness.leftNormalization.expressionId = 'wrong';},
            value => {value.role.uniqueValueWitness.rightNormalization.steps[0].value = q(8);},
            value => {value.role.uniqueValueWitness.coefficientDifference.operation = 'addition';},
            value => {value.role.uniqueValueWitness.coefficientDifference.kind = 'negation';},
            value => {value.role.uniqueValueWitness.coefficientDifference.operands = [q(1)];},
            value => {value.role.uniqueValueWitness.coefficientDifference.operands[0] = q(2);},
            value => {value.role.uniqueValueWitness.constantDifference.operands[1] = q(6);},
            value => {value.role.uniqueValueWitness.inverseArithmetic.result = q(8);},
            value => {value.role.uniqueValueWitness.uniqueValue = q(8);}, value => {value.role.uniqueValueWitness.uniqueValue = {numerator: -0, denominator: 1};},
            value => {value.role.uniqueValueWitness.verification.comparison.truth = false;},
            value => {value.role.uniqueValueWitness.verification.left.replacements = [];},
            value => {value.role.uniqueValueWitness.verification.binding.symbolId = 'y';},
            value => {value.role.uniqueValueWitness.verification.left.calculation.expression.id = 'other';}];
        for (const edit of mutations) expect(guard(changed(source, edit))).toBe(false);
        const altered = changed(source, value => {
            value.role.uniqueValueWitness.verification = buildStatementAssignmentCheck({operator: 'equal', left: source.expressions[0].root, right: source.expressions[1].root}, source.symbol,
                {kind: 'numeric', values: {kind: 'rational', lower: null, upper: null, excludedValues: []}}, {symbolId: 'x', value: q(6), notation: {kind: 'integer', numeral: '6'}});
        });
        expect(guard(altered)).toBe(false);
    });

    it('rejects forged universal maps, proof sources, quantification and subset evidence', () => {
        const source = literalOracle(true);
        const mutations: ((value: any) => void)[] = [value => {value.role.kind = 'function-input';}, value => {value.role.quantifier = 'one-member';},
            value => {value.role.domainInclusion = 'tested-examples';}, value => {value.role.universalProof = {};},
            value => {value.role.universalProof.domainId = 'wrong';}, value => {value.role.universalProof.leftExpressionId = 'wrong';},
            value => {value.role.universalProof.rightExpressionId = 'wrong';},
            value => {value.role.universalProof.leftNormalization.steps[0].unitCoefficient = q(2);},
            value => {value.role.universalProof.rightNormalization.steps[0].nodeId = 'wrong';},
            value => {value.role.universalProof.commonNormalForm = {constant: q(0), coefficients: []};},
            value => {value.role.universalProof.commonNormalForm.coefficients[0].coefficient = q(2);},
            value => {value.role.universalProof.commonNormalForm.coefficients.push({symbolId: 'y', coefficient: q(1)});},
            value => {value.expressions[1].root = number('seven', 7);}
        ];
        for (const edit of mutations) expect(guard(changed(source, edit))).toBe(false);
    });

    it('is total for absent, sparse, cyclic and throwing input, without arbitrary allocation', () => {
        const source = literalOracle();
        const cycle: any = {id: 'cycle', kind: 'group'}; cycle.expression = cycle;
        const values = [undefined, null, {}, [], {get domain() {throw Error('accessor');}},
            changed(source, value => {value.expressions = new Array(2 ** 32 - 1);}),
            changed(source, value => {value.expressions[0].root = cycle;}),
            changed(source, value => {value.role.uniqueValueWitness.leftNormalization.steps = new Array(2 ** 32 - 1);}),
            changed(source, value => {value.role.uniqueValueWitness.coefficientDifference.operands = new Array(2);}),
            changed(source, value => {Object.defineProperty(value.role, 'situation', {get() {throw Error('accessor');}});})];
        for (const value of values) expect(guard(value)).toBe(false);
        for (const value of [null, {}, {...input(), expressions: new Array(2)}]) expect(() => build(value as never)).toThrow(GeneratorValidationError);
    });
});
