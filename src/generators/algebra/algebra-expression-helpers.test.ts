import {describe, expect, it} from 'vitest';
import type {AlgebraicExpressionProblem, AlgebraicStructuralRelation, AlgebraicSymbolDeclaration,
    ArithmeticOperation, ExactSymbolicExpressionNode as Node} from '../../types/problems.ts';
import {makeSignedRational} from '../number/signed-rational-helpers.ts';
import {buildAlgebraicExpressionProblem, isAlgebraicExpressionProblem, type AlgebraicExpressionInput} from './algebra-expression-helpers.ts';

const q = makeSignedRational;
const n = (id: string, numerator: number, denominator = 1): Extract<Node, {kind: 'number'}> => ({id, kind: 'number', value: q(numerator, denominator),
    notation: {kind: 'fraction', numerator, denominator}});
const x = (id: string, symbolId = 'x'): Node => ({id, kind: 'variable', symbolId});
const g = (id: string, expression: Node): Node => ({id, kind: 'group', expression});
const b = (id: string, operation: ArithmeticOperation, left: Node, right: Node): Node => ({id, kind: 'binary', operation, left, right});
const symbol = (id = 'x'): AlgebraicSymbolDeclaration => ({symbolId: id, symbol: id,
    domain: {kind: 'rational', lower: null, upper: null, excludedValues: []}});
const input = (expression: Node, relation: AlgebraicStructuralRelation['kind'] = 'sum'): AlgebraicExpressionInput => ({expression,
    symbols: [symbol()], bindings: [{symbolId: 'x', value: q(1, 2), notation: {kind: 'decimal', coefficient: 50, scale: 2, numeral: '0.50'}}],
    structuralKind: 'symbolic', relation, context: {kind: 'parameter-description', parameters: [{symbolId: 'x', meaning: 'number'}], resultMeaning: 'number'}});
const example = () => buildAlgebraicExpressionProblem(input(b('sum', 'addition', b('product', 'multiplication', n('three', 3),
    g('group', b('inner', 'addition', x('first'), n('two', 2)))), x('second'))));

function changed(problem: AlgebraicExpressionProblem, path: readonly string[], replacement: unknown): unknown {
    const value = structuredClone(problem) as unknown as Record<string, unknown>;
    let object = value;
    for (const field of path.slice(0, -1)) object = object[field] as Record<string, unknown>;
    object[path.at(-1)!] = replacement;
    return value;
}

describe('complete algebraic parameterization', () => {
    it('preserves literal syntax, every occurrence and exact numeric work independently of target tasks', () => {
        const data = example();
        expect(isAlgebraicExpressionProblem(data)).toBe(true);
        expect(data.substitution.finalValue).toEqual(q(8, 1));
        expect(data.substitution.bindings[0].occurrenceNodeIds).toEqual(['first', 'second']);
        expect(data.substitution.nodeValues.map(row => row.nodeId)).toEqual(['sum', 'product', 'three', 'group', 'inner', 'first', 'two', 'second']);
        expect(data.substitution.reductions.map(row => row.targetNodeId)).toEqual(['inner', 'group', 'product', 'sum']);
        expect(data.substitution.powerFacts).toEqual([]);
        expect(data.restrictions).toEqual([]);
        expect(data.groupedOperands).toEqual([{groupNodeId: 'group', innerNodeId: 'inner', parentNodeId: 'product', enclosingOperation: 'multiplication', position: 'right'}]);
        const numeric = data.substitution.substitutedExpression;
        if (numeric.kind !== 'binary' || numeric.right.kind !== 'number') throw Error('fixture');
        expect(numeric.right.notation).toEqual({kind: 'decimal', coefficient: 50, scale: 2, numeral: '0.50'});
        expect(data.expression).not.toBe(numeric);
    });

    it('retains operation order and denominator / zero-power domain restrictions', () => {
        const difference = buildAlgebraicExpressionProblem(input(b('minus', 'subtraction', n('five', 5), g('given', x('y'))), 'additive-components'));
        expect(difference.substitution.finalValue).toEqual(q(9, 2));
        const quotient = buildAlgebraicExpressionProblem(input(b('divide', 'division', n('five', 5), g('denominator', x('x'))), 'quotient'));
        expect(quotient.restrictions).toEqual([{kind: 'nonzero-expression', expressionNodeId: 'denominator', reason: 'division-denominator'}]);
        const power: Node = {id: 'power', kind: 'power', base: g('base', x('first')), exponent: 0};
        const data = buildAlgebraicExpressionProblem(input(b('sum', 'addition', power, x('second'))));
        expect(data.substitution.finalValue).toEqual(q(3, 2));
        expect(data.substitution.powerFacts[0]).toMatchObject({kind: 'zero-exponent', exponent: 0, nonzeroBase: true, result: q(1, 1)});
        expect(data.restrictions).toEqual([{kind: 'nonzero-expression', expressionNodeId: 'base', reason: 'zero-exponent-base'}]);
        expect(data.groupedOperands[0]).toMatchObject({enclosingOperation: 'power', position: 'base'});
        expect(isAlgebraicExpressionProblem(changed(data, ['restrictions'], []))).toBe(false);
        expect(isAlgebraicExpressionProblem(changed(quotient, ['restrictions', '0', 'reason'], 'zero-exponent-base'))).toBe(false);
        const zero = input(b('sum', 'addition', power, x('second')));
        expect(() => buildAlgebraicExpressionProblem({...zero, bindings: [{symbolId: 'x', value: q(0, 1), notation: {kind: 'integer', numeral: '0'}}]})).toThrow();
    });

    it('supports each structural proof on the actual numeric or symbolic frame', () => {
        const tree = b('sum', 'addition', b('product', 'multiplication', n('three', 3), g('group', x('first'))), n('two', 2));
        for (const structuralKind of ['symbolic', 'numeric'] as const) {
            for (const relation of ['sum', 'product', 'additive-components', 'multiplicative-components'] as const) {
                const data = buildAlgebraicExpressionProblem({...input(tree, relation), structuralKind});
                expect(data.structuralRelations[0].kind).toBe(relation);
                expect(data.structuralExpression.kind).toBe(structuralKind);
                expect(isAlgebraicExpressionProblem(data)).toBe(true);
            }
        }
        expect(() => buildAlgebraicExpressionProblem({...input(tree, 'coefficient'), structuralKind: 'numeric'})).toThrow();
        expect(() => buildAlgebraicExpressionProblem(input(tree, 'quotient'))).toThrow();
        expect(() => buildAlgebraicExpressionProblem({...input(tree), structuralKind: 'bad' as 'symbolic'})).toThrow();
    });

    it('handles a grouped unary input and numeric values beyond canonical sampler limits', () => {
        const negative: Node = {id: 'neg', kind: 'negation', operand: g('outer', b('sum', 'addition', x('input'), n('large', 1000)))};
        const data = buildAlgebraicExpressionProblem(input(negative, 'additive-components'));
        expect(data.substitution.finalValue).toEqual(q(-2001, 2));
        expect(data.groupedOperands[0]).toMatchObject({enclosingOperation: 'negation', position: 'operand'});
        expect(isAlgebraicExpressionProblem(data)).toBe(true);
        const nested = g('outer', g('inner', b('sum', 'addition', x('input'), n('large', 1000))));
        expect(() => buildAlgebraicExpressionProblem(input(nested))).toThrow(); // No group has an enclosing operation.
    });

    it('accepts reordered complete binding occurrences, work tables, restrictions and derived IDs', () => {
        const data = example();
        expect(isAlgebraicExpressionProblem(changed(data, ['substitution', 'bindings', '0', 'occurrenceNodeIds'], ['second', 'first']))).toBe(true);
        expect(isAlgebraicExpressionProblem(changed(data, ['substitution', 'nodeValues'], [...data.substitution.nodeValues].reverse()))).toBe(true);
        const signed = buildAlgebraicExpressionProblem(input(b('minus', 'subtraction', n('five', 5), g('given', x('y'))), 'additive-components'));
        const relation = signed.structuralRelations[0];
        if (relation.kind !== 'additive-components') throw Error('fixture');
        expect(isAlgebraicExpressionProblem(changed(signed, ['structuralRelations', '0', 'terms', '1', 'signedExpression', 'id'], 'another-fresh-id'))).toBe(true);
        expect(isAlgebraicExpressionProblem(changed(signed, ['structuralRelations', '0', 'terms', '1', 'signedExpression', 'id'], 'five'))).toBe(false);
        expect(relation.terms[1].polarity).toBe(-1);
    });
});

describe('signed terms and variable-independent coefficients', () => {
    it.each([-3, -1, 0, 1, 2, 5])('derives coefficient %i without assignment-based constant factors', coefficient => {
        const term: Node = coefficient === 1 ? x('term') : coefficient === -1 ? {id: 'neg', kind: 'negation', operand: x('term')}
            : b('term', 'multiplication', n('constant', coefficient), x('input'));
        const data = buildAlgebraicExpressionProblem(input(b('sum', 'addition', term, g('group', n('one', 1))), 'coefficient'));
        const fact = data.structuralRelations[0];
        if (fact.kind !== 'coefficient') throw Error('fixture');
        expect(fact.coefficient).toEqual(q(coefficient, 1));
        expect(fact.constantFactors).toEqual(Math.abs(coefficient) === 1 ? [] : [q(coefficient, 1)]);
        expect(fact.variablePart.kind).toBe('variable');
        expect(fact.variableSymbolIds).toEqual(['x']);
        expect(isAlgebraicExpressionProblem(data)).toBe(true);
    });

    it('retains grouping and all variable factors, evaluating only truly constant subexpressions', () => {
        const constant = g('constant-group', b('constant-sum', 'addition', n('two', 2), n('three', 3)));
        const variableGroup = g('variable-group', b('variable-sum', 'addition', x('first'), n('offset', 2)));
        const term = b('term', 'multiplication', b('constant-product', 'multiplication', constant, variableGroup), x('second'));
        const data = buildAlgebraicExpressionProblem(input(b('sum', 'addition', term, n('one', 1)), 'coefficient'));
        const fact = data.structuralRelations[0];
        if (fact.kind !== 'coefficient') throw Error('fixture');
        expect(fact.coefficient).toEqual(q(5, 1));
        expect(fact.constantFactors).toEqual([q(5, 1)]);
        expect(fact.variablePart).toMatchObject({kind: 'binary', operation: 'multiplication', left: variableGroup, right: x('second')});
        expect(isAlgebraicExpressionProblem(changed(data, ['structuralRelations', '0', 'variablePart', 'id'], 'fresh-product'))).toBe(true);
        expect(isAlgebraicExpressionProblem(changed(data, ['structuralRelations', '0', 'constantFactors'], [q(5, 1), q(1, 2)]))).toBe(false);
    });

    it('keeps every declared symbol variable when constructing a rational coefficient', () => {
        const tree = b('sum', 'addition', b('outer-product', 'multiplication', b('inner-product', 'multiplication', n('two', 2), x('first')), x('other', 'y')),
            g('group', n('three', 3)));
        const data = buildAlgebraicExpressionProblem({...input(tree, 'coefficient'), symbols: [symbol(), symbol('y')],
            bindings: [{symbolId: 'y', value: q(-1, 3), notation: {kind: 'fraction', numerator: -2, denominator: 6}},
                {symbolId: 'x', value: q(1, 2), notation: {kind: 'decimal', coefficient: 50, scale: 2, numeral: '0.50'}}],
            context: {kind: 'parameter-description', parameters: [{symbolId: 'y', meaning: 'number'}, {symbolId: 'x', meaning: 'number'}], resultMeaning: 'number'}});
        const fact = data.structuralRelations[0];
        if (fact.kind !== 'coefficient') throw Error('fixture');
        expect(fact.coefficient).toEqual(q(2, 1));
        expect(fact.constantFactors).toEqual([q(2, 1)]);
        expect(fact.variableSymbolIds).toEqual(['x', 'y']);
        expect(data.substitution.finalValue).toEqual(q(8, 3));
        expect(isAlgebraicExpressionProblem(changed(data, ['substitution', 'bindings'], [...data.substitution.bindings].reverse()))).toBe(true);
        expect(isAlgebraicExpressionProblem(changed(data, ['structuralRelations', '0', 'coefficient'], q(-2, 3)))).toBe(false);
    });

    it('keeps signed additive components at their grouping level and multiplies signs once', () => {
        const term = b('term', 'multiplication', n('negative', -3), x('first'));
        const data = buildAlgebraicExpressionProblem(input(b('minus', 'subtraction', g('constant-group', n('five', 5)), term), 'coefficient'));
        const fact = data.structuralRelations[0];
        if (fact.kind !== 'coefficient') throw Error('fixture');
        expect(fact.term.polarity).toBe(-1);
        expect(fact.constantFactors).toEqual([q(-3, 1)]);
        expect(fact.coefficient).toEqual(q(3, 1));
        expect(fact.term.signedExpression).toMatchObject({kind: 'negation', operand: {kind: 'group', expression: term}});
        const grouped = buildAlgebraicExpressionProblem(input(b('minus', 'subtraction', x('outer'),
            g('inner-group', b('inner', 'subtraction', x('inner-x'), n('two', 2)))), 'additive-components'));
        const components = grouped.structuralRelations[0];
        if (components.kind !== 'additive-components') throw Error('fixture');
        expect(components.terms.map(term => term.sourceNodeId)).toEqual(['outer', 'inner-group']);
        expect(components.terms.map(term => term.polarity)).toEqual([1, -1]);
        expect(isAlgebraicExpressionProblem(changed(grouped, ['structuralRelations', '0', 'terms', '1', 'signedExpression'], null))).toBe(false);
        expect(isAlgebraicExpressionProblem(changed(grouped, ['structuralRelations', '0', 'terms', '1', 'signedExpression'], n('different', 1)))).toBe(false);
    });

    it('uses fresh derived identifiers even when source IDs use the same spelling', () => {
        const term = b('term', 'multiplication', n('negative', -3), x('input'));
        const data = buildAlgebraicExpressionProblem(input(b('minus', 'subtraction', g('group', n('term:signed-group', 5)), term), 'additive-components'));
        const fact = data.structuralRelations[0];
        if (fact.kind !== 'additive-components' || fact.terms[1].signedExpression.kind !== 'negation') throw Error('fixture');
        expect(fact.terms[1].signedExpression.operand.id).toBe('term:signed-group_');
        const double: Node = {id: 'neg1', kind: 'negation', operand: {id: 'neg2', kind: 'negation', operand: x('input')}};
        const positive = buildAlgebraicExpressionProblem(input(b('sum', 'addition', double, g('group', n('one', 1))), 'coefficient'));
        expect(positive.structuralRelations[0]).toMatchObject({coefficient: q(1, 1), constantFactors: []});
    });

    it('does not reject a valid unrelated relation for an unrepresentable optional coefficient', () => {
        for (const factor of [n('first-constant', Number.MAX_SAFE_INTEGER), n('first-constant', 1, Number.MAX_SAFE_INTEGER)]) {
            const second = {...factor, id: 'second-constant'};
            const tree = b('sum', 'addition', b('outer-product', 'multiplication', b('inner-product', 'multiplication', factor, x('input')), second), g('group', n('zero', 0)));
            const options = {...input(tree), bindings: [{symbolId: 'x', value: q(0, 1), notation: {kind: 'integer' as const, numeral: '0'}}]};
            const data = buildAlgebraicExpressionProblem(options);
            expect(data.substitution.finalValue).toEqual(q(0, 1));
            expect(isAlgebraicExpressionProblem(data)).toBe(true);
        }
    });
});

describe('total malformed-payload rejection', () => {
    it('rejects missing or false mathematical links rather than trusting a successful binding', () => {
        const data = example();
        const mutations: readonly [readonly string[], unknown][] = [
            [['kind'], 'wrong'], [['symbols'], []], [['substitution'], null], [['substitution', 'bindings'], []], [['substitution', 'bindings'], null],
            [['substitution', 'bindings', '0', 'value'], q(1, 1)], [['substitution', 'bindings', '0', 'notation'], {kind: 'integer', numeral: '7'}],
            [['substitution', 'bindings', '0', 'symbolId'], 'y'], [['substitution', 'bindings', '0', 'occurrenceNodeIds'], ['first']],
            [['substitution', 'bindings', '0', 'occurrenceNodeIds'], ['first', 'first']], [['substitution', 'bindings', '0', 'occurrenceNodeIds'], ['first', 'missing']],
            [['substitution', 'bindings', '0', 'occurrenceNodeIds'], new Array(2)],
            [['substitution', 'substitutedExpression', 'id'], 'different'], [['substitution', 'finalValue'], q(7, 1)],
            [['substitution', 'finalNotation'], {kind: 'integer', numeral: '7'}], [['substitution', 'reductions'], []],
            [['restrictions'], [{kind: 'nonzero-expression', expressionNodeId: 'first', reason: 'division-denominator'}]],
            [['structuralExpression'], null], [['structuralExpression', 'kind'], 'wrong'], [['structuralExpression', 'expression', 'id'], 'changed'],
            [['groupedOperands'], []], [['groupedOperands', '0', 'position'], 'left'], [['structuralRelations'], []],
            [['structuralRelations', '0', 'operationNodeId'], 'group'], [['structuralRelations', '0', 'kind'], 'unknown'],
            [['context'], null], [['expression', 'id'], 'wrong']
        ];
        for (const [path, replacement] of mutations) expect(isAlgebraicExpressionProblem(changed(data, path, replacement)), path.join('.')).toBe(false);
        for (const value of [null, {}, new Array(1)]) expect(isAlgebraicExpressionProblem(value)).toBe(false);
    });

    it('rejects inadmissible/duplicate/unused bindings, missing groups, and all-variable complete models', () => {
        const base = input(b('sum', 'addition', n('one', 1), g('group', x('input'))));
        expect(() => buildAlgebraicExpressionProblem({...base, bindings: [base.bindings[0], base.bindings[0]]})).toThrow();
        expect(() => buildAlgebraicExpressionProblem({...base, bindings: [null] as unknown as AlgebraicExpressionInput['bindings']})).toThrow();
        expect(() => buildAlgebraicExpressionProblem({...base, bindings: new Array(1)})).toThrow();
        expect(() => buildAlgebraicExpressionProblem({...base, symbols: [symbol(), symbol('y')], bindings: [...base.bindings,
            {symbolId: 'y', value: q(1, 1), notation: {kind: 'integer', numeral: '1'}}]})).toThrow();
        expect(() => buildAlgebraicExpressionProblem({...base, symbols: [{...symbol(), domain: {...symbol().domain, excludedValues: [q(1, 2)]}}]})).toThrow();
        expect(() => buildAlgebraicExpressionProblem(input(b('sum', 'addition', n('one', 1), x('input'))))).toThrow();
        const allVariable = b('sum', 'addition', x('first'), g('group', x('second')));
        expect(() => buildAlgebraicExpressionProblem(input(allVariable))).toThrow();
    });
});
