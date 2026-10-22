import {describe, expect, it} from 'vitest';
import type {AlgebraicSymbolDeclaration, AlgebraicVariableDomain, ExactSymbolicExpressionNode as Node} from '../../types/problems.ts';
import {makeSignedRational} from '../number/signed-rational-helpers.ts';
import {algebraicChildren, inspectAlgebraicExpression, isAlgebraicDeclarations, isAlgebraicDomainMember,
    isAlgebraicExpressionSyntax, isAlgebraicVariableDomain, sameAlgebraicSyntax} from './algebra-syntax-helpers.ts';

const q = makeSignedRational;
const rational: AlgebraicVariableDomain = {kind: 'rational', lower: null, upper: null, excludedValues: []};
const declarations: readonly [AlgebraicSymbolDeclaration] = [{symbolId: 'x', symbol: 'x', domain: rational}];
const n = (id: string, numerator = 2, denominator = 1): Node => ({id, kind: 'number', value: q(numerator, denominator),
    notation: {kind: 'fraction', numerator, denominator}});
const x = (id = 'x1'): Node => ({id, kind: 'variable', symbolId: 'x'});
const bound = (numerator: number, denominator = 1, inclusive = true) => ({value: q(numerator, denominator), inclusive});

describe('algebraic domains', () => {
    it('uses exact open/closed rational bounds and exclusions', () => {
        const domain: AlgebraicVariableDomain = {kind: 'rational', lower: bound(-1, 2, false), upper: bound(3, 2), excludedValues: [q(0, 1)]};
        expect(isAlgebraicVariableDomain(domain)).toBe(true);
        expect([-1, 0, 1, 3, 4].map(value => isAlgebraicDomainMember(q(value, 2), domain))).toEqual([false, false, true, true, false]);
        expect(isAlgebraicDomainMember(q(2, 3), rational)).toBe(true);
        expect(isAlgebraicDomainMember(q(0, 1), {...rational, lower: bound(0), upper: bound(0)})).toBe(true);
        expect(isAlgebraicDomainMember({numerator: -0, denominator: 1}, rational)).toBe(false);
        expect(isAlgebraicDomainMember(q(0, 1), {} as AlgebraicVariableDomain)).toBe(false);
    });
    it('detects empty integer intervals and finite exclusions without enumerating large ranges', () => {
        const domain: AlgebraicVariableDomain = {kind: 'integer', lower: bound(-3, 2), upper: bound(3, 2), excludedValues: [q(-1, 1), q(0, 1)]};
        expect(isAlgebraicVariableDomain(domain)).toBe(true);
        expect(isAlgebraicDomainMember(q(1, 1), domain)).toBe(true);
        expect(isAlgebraicDomainMember(q(1, 2), domain)).toBe(false);
        expect(isAlgebraicVariableDomain({...domain, excludedValues: [q(-1, 1), q(0, 1), q(1, 1)]})).toBe(false);
        expect(isAlgebraicVariableDomain({...domain, lower: bound(0), upper: bound(1, 1, false), excludedValues: [q(0, 1)]})).toBe(false);
        expect(isAlgebraicVariableDomain({...domain, lower: bound(0, 1, false), upper: bound(1), excludedValues: []})).toBe(true);
        expect(isAlgebraicVariableDomain({...domain, lower: bound(1, 3), upper: bound(2, 3), excludedValues: []})).toBe(false);
        expect(isAlgebraicVariableDomain({...domain, lower: null, upper: bound(0)})).toBe(true);
        expect(isAlgebraicVariableDomain({...domain, lower: bound(Number.MAX_SAFE_INTEGER), upper: null})).toBe(true);
    });
    it('rejects malformed, empty and duplicate domains and declarations', () => {
        for (const value of [null, {}, {...rational, kind: 'real'}, {...rational, lower: undefined}, {...rational, upper: {value: q(1, 1), inclusive: 1}},
            {...rational, excludedValues: [q(1, 1), q(1, 1)]}, {...rational, excludedValues: [{numerator: 2, denominator: 2}]},
            {...rational, excludedValues: new Array(1)}, {...rational, excludedValues: null}, {...rational, lower: bound(2), upper: bound(1)},
            {...rational, lower: bound(1, 1, false), upper: bound(1)},
            {...rational, lower: bound(1), upper: bound(1), excludedValues: [q(1, 1)]}]) expect(isAlgebraicVariableDomain(value)).toBe(false);
        expect(isAlgebraicDeclarations(declarations)).toBe(true);
        expect(isAlgebraicDeclarations([{...declarations[0], symbol: 'α_2'}])).toBe(true);
        for (const value of [[], new Array(1), [null], [{...declarations[0], symbolId: ' '}], [{...declarations[0], symbol: ''}],
            [{...declarations[0], symbol: '5'}], [{...declarations[0], symbol: 'x+1'}], [{...declarations[0], symbol: 'x y'}],
            [...declarations, declarations[0]], [...declarations, {...declarations[0], symbolId: 'y'}]]) expect(isAlgebraicDeclarations(value)).toBe(false);
    });
    it('keeps public unknown-input guards total for throwing accessors', () => {
        const throwing = Object.defineProperty({}, 'kind', {get() { throw Error('malformed accessor'); }});
        expect(isAlgebraicVariableDomain(throwing)).toBe(false);
        expect(isAlgebraicDeclarations([Object.defineProperty({}, 'symbolId', {get() { throw Error('malformed accessor'); }})])).toBe(false);
        expect(isAlgebraicDomainMember(Object.defineProperty({}, 'numerator', {get() { throw Error('malformed accessor'); }}) as never, rational)).toBe(false);
    });
});

describe('unassigned exact algebraic syntax', () => {
    it('traverses broad literal, variable, group, unary, binary and power forms', () => {
        const tree: Node = {id: 'sum', kind: 'binary', operation: 'addition', left: {id: 'power', kind: 'power', exponent: 0,
            base: {id: 'group', kind: 'group', expression: {id: 'difference', kind: 'binary', operation: 'subtraction', left: x(), right: n('one', 1)}}},
        right: {id: 'negative', kind: 'negation', operand: {id: 'negative2', kind: 'negation', operand: n('number', -2, 4)}}};
        expect(isAlgebraicExpressionSyntax(tree, declarations)).toBe(true);
        expect(inspectAlgebraicExpression(tree, declarations).map(node => node.id)).toEqual(['sum', 'power', 'group', 'difference', 'x1', 'one', 'negative', 'negative2', 'number']);
        expect(isAlgebraicExpressionSyntax({id: 'p', kind: 'power', base: x(), exponent: 4}, declarations)).toBe(true);
        expect(isAlgebraicExpressionSyntax(x(), declarations)).toBe(true);
        expect(algebraicChildren(n('a'))).toEqual([]);
    });
    it('rejects invalid identity, assignment metadata and unsupported syntax', () => {
        const duplicate = {id: 'b', kind: 'binary', operation: 'addition', left: x(), right: x()};
        const cycle: Record<string, unknown> = {id: 'cycle', kind: 'group'}; cycle.expression = cycle;
        for (const value of [null, {}, {...x(), id: ''}, {...x(), id: ' x'}, {...x(), symbolId: 'missing'}, {...x(), value: q(2, 1)},
            {...n('a'), value: q(1, 1)}, {...n('a'), notation: {kind: 'integer', numeral: 'wrong'}}, {id: 'b', kind: 'unknown'},
            {id: 'b', kind: 'binary', operation: 'modulus', left: x(), right: n('n')},
            {id: 'p', kind: 'power', base: x(), exponent: -0}, {id: 'p', kind: 'power', base: x(), exponent: -1},
            {id: 'p', kind: 'power', base: x(), exponent: 1.5}, duplicate, cycle]) expect(isAlgebraicExpressionSyntax(value, declarations)).toBe(false);
        expect(() => inspectAlgebraicExpression(x(), [])).toThrow();
    });
    it('requires real groups for written binding and right association', () => {
        const sum: Node = {id: 'sum', kind: 'binary', operation: 'addition', left: x(), right: n('a')};
        const product: Node = {id: 'mul', kind: 'binary', operation: 'multiplication', left: x('x2'), right: n('b')};
        for (const value of [{id: 'neg', kind: 'negation', operand: sum}, {id: 'p', kind: 'power', base: sum, exponent: 2},
            {id: 'mul2', kind: 'binary', operation: 'multiplication', left: sum, right: n('c')},
            {id: 'mul2', kind: 'binary', operation: 'multiplication', left: n('c'), right: sum},
            {id: 'mul2', kind: 'binary', operation: 'multiplication', left: n('c'), right: product}]) expect(isAlgebraicExpressionSyntax(value, declarations)).toBe(false);
        expect(isAlgebraicExpressionSyntax({id: 'neg', kind: 'negation', operand: {id: 'g', kind: 'group', expression: sum}}, declarations)).toBe(true);
    });
    it('compares syntax independently of occurrence IDs, preserving literal forms and operations', () => {
        const original: Node = {id: 'b', kind: 'binary', operation: 'division', left: {id: 'g', kind: 'group', expression: x()}, right: n('a', 2, 4)};
        const copied = {...structuredClone(original), id: 'different'};
        expect(sameAlgebraicSyntax(original, copied)).toBe(true);
        expect(sameAlgebraicSyntax(original, x())).toBe(false);
        expect(sameAlgebraicSyntax(x(), {...x(), symbolId: 'y'} as Node)).toBe(false);
        expect(sameAlgebraicSyntax(original, {...original, operation: 'subtraction'})).toBe(false);
        expect(sameAlgebraicSyntax(original, {...original, right: n('other', 1, 2)})).toBe(false);
        expect(sameAlgebraicSyntax(n('a', 1), n('b', 2))).toBe(false);
        expect(sameAlgebraicSyntax({id: 'p', kind: 'power', base: x(), exponent: 1}, {id: 'p', kind: 'power', base: x(), exponent: 2})).toBe(false);
    });
});
