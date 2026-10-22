import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AlgebraicScalar, AlgebraicUnit, ElementaryEquationContext, ElementaryEquationForm, ExactAlgebraicStatement,
    ExactEquation, ExactSymbolicExpressionNode as Node, StatementAmbientDomain, StatementBinding} from '../../types/problems.ts';
import {makeSignedRational} from '../number/signed-rational-helpers.ts';
import {buildStatementAssignmentCheck as build, isElementaryEquationContext as contextGuard,
    isStatementAmbientDomain as domainGuard, isStatementAssignmentCheck as guard,
    isStatementDomainMember as member, isStrictThresholdContext as thresholdGuard, statementDomainCardinality as cardinality} from './algebra-statement-core-helpers.ts';

const q = (n: number, d = 1): AlgebraicScalar => makeSignedRational(n, d);
const n = (id: string, numerator: number, denominator = 1): Extract<Node, {kind: 'number'}> => ({id, kind: 'number', value: q(numerator, denominator),
    notation: denominator === 1 ? {kind: 'integer', numeral: String(numerator)} : {kind: 'fraction', numerator, denominator}});
const v = (id = 'x'): Extract<Node, {kind: 'variable'}> => ({id, kind: 'variable', symbolId: 'x'});
const binary = (id: string, operation: 'addition' | 'subtraction' | 'multiplication' | 'division', left: Node, right: Node): Node => ({id, kind: 'binary', operation, left, right});
const group = (expression: Node): Node => ({id: `${expression.id}-group`, kind: 'group', expression});
const variable = {symbolId: 'x', symbol: 'x'};
const all: StatementAmbientDomain = {kind: 'numeric', values: {kind: 'rational', lower: null, upper: null, excludedValues: []}};
const interval = (lower: number | null, upper: number | null, lowerClosed = true, upperClosed = true, excluded: number[] = []): StatementAmbientDomain => ({kind: 'numeric',
    values: {kind: 'rational', lower: lower === null ? null : {value: q(lower), inclusive: lowerClosed}, upper: upper === null ? null : {value: q(upper), inclusive: upperClosed}, excludedValues: excluded.map(value => q(value))}});
const finite = (...values: number[]): StatementAmbientDomain => ({kind: 'finite', values: values.map(value => q(value)) as [AlgebraicScalar, ...AlgebraicScalar[]]});
const binding = (numerator: number, denominator = 1): StatementBinding => ({symbolId: 'x', value: q(numerator, denominator), notation: n('bound', numerator, denominator).notation});
const equation = (operation: 'addition' | 'multiplication' = 'addition', coefficient = n('c', 3, 4), total = n('q', 2)): ExactEquation => ({operator: 'equal',
    left: binary('left', operation, operation === 'addition' ? v() : coefficient, operation === 'addition' ? coefficient : v()), right: total});
const form = (statement: ExactEquation): ElementaryEquationForm => {
    if (statement.left.kind !== 'binary' || statement.right.kind !== 'number') throw Error('Fixture grammar');
    const additive = statement.left.operation === 'addition', literal = additive ? statement.left.right : statement.left.left;
    if (literal.kind !== 'number') throw Error('Fixture literal');
    return additive ? {kind: 'additive', variableNodeId: 'x', addend: literal.value, total: statement.right.value}
        : {kind: 'multiplicative', variableNodeId: 'x', coefficient: literal.value, total: statement.right.value};
};
const changed = <T>(source: T, edit: (value: any) => void): T => {const value = structuredClone(source); edit(value); return value;};
const units = (subject: AlgebraicUnit['subject'], name: string, currency = 0, time = 0, count = 0, length = 0): AlgebraicUnit => ({subject, name, dimensions: {currency, time, count, length}});
const numbers = units('number', 'number'), dollars = units('money', 'dollars', 1), hours = units('time', 'hours', 0, 1);
const amount = (quantityId: string, meaning: string, unit = dollars) => ({quantityId, meaning, unit});
const fixed = (quantityId: string, meaning: string, literal: Extract<Node, {kind: 'number'}>, unit = dollars) => ({...amount(quantityId, meaning, unit), value: literal.value, notation: literal.notation});
function abstract(statement = equation()): ElementaryEquationContext {
    const additive = statement.left.kind === 'binary' && statement.left.operation === 'addition';
    const literal = (additive ? (statement.left as Extract<Node, {kind: 'binary'}>).right : (statement.left as Extract<Node, {kind: 'binary'}>).left) as Extract<Node, {kind: 'number'}>;
    return {kind: 'number-relation', relationship: additive ? 'sum' : 'scaled-value', variableQuantity: amount('input', 'input-number', numbers),
        constantQuantity: fixed('constant', additive ? 'added-number' : 'scale-factor', literal, numbers), resultQuantity: fixed('total', 'resulting-number', statement.right as Extract<Node, {kind: 'number'}>, numbers)} as ElementaryEquationContext;
}
function physical(kind: 'combined-amounts' | 'equal-groups', statement: ExactEquation, role = 'amount-per-group'): ElementaryEquationContext {
    const literal = (statement.left as Extract<Node, {kind: 'binary'}>)[kind === 'combined-amounts' ? 'right' : 'left'] as Extract<Node, {kind: 'number'}>;
    return kind === 'combined-amounts' ? {kind, variableQuantity: amount('input', 'initial-amount'), addedQuantity: fixed('added', 'added-amount', literal),
        totalQuantity: fixed('total', 'total-amount', statement.right as Extract<Node, {kind: 'number'}>)} as ElementaryEquationContext
        : {kind, variableQuantity: amount('input', role, role === 'duration' ? hours : role === 'group-count' ? numbers : dollars),
            multiplierQuantity: fixed('coefficient', role === 'duration' ? 'rate' : role === 'group-count' ? 'amount-per-group' : 'group-count', literal,
                role === 'duration' ? units('money', 'dollars per hour', 1, -1) : role === 'group-count' ? dollars : numbers),
            totalQuantity: fixed('total', 'total-amount', statement.right as Extract<Node, {kind: 'number'}>)} as ElementaryEquationContext;
}

describe('statement rational domains', () => {
    it('agrees with independent cross-product membership over intervals, holes and finite sets', () => {
        const domains = [all, interval(0, null), interval(-2, 3, false, true, [0, 2]), interval(1, 1), finite(-2, 0, 3)];
        for (const domain of domains) {
            expect(domainGuard(domain)).toBe(true);
            for (let numerator = -16; numerator <= 16; numerator++) for (let denominator = 1; denominator <= 6; denominator++) {
                const value = q(numerator, denominator);
                const less = (a: AlgebraicScalar, b: AlgebraicScalar) => BigInt(a.numerator) * BigInt(b.denominator) < BigInt(b.numerator) * BigInt(a.denominator);
                const same = (a: AlgebraicScalar, b: AlgebraicScalar) => a.numerator === b.numerator && a.denominator === b.denominator;
                const expected = domain.kind === 'finite' ? domain.values.some(item => same(item, value))
                    : (!domain.values.lower || less(domain.values.lower.value, value) || domain.values.lower.inclusive && same(value, domain.values.lower.value))
                    && (!domain.values.upper || less(value, domain.values.upper.value) || domain.values.upper.inclusive && same(value, domain.values.upper.value))
                    && !domain.values.excludedValues.some(item => same(item, value));
                expect(member(value, domain)).toBe(expected);
            }
        }
        expect(cardinality(finite(-2, 0, 3))).toEqual({kind: 'finite', count: 3});
        expect(cardinality(interval(1, 1))).toEqual({kind: 'finite', count: 1});
        for (const domain of [all, interval(0, null), interval(0, 2, false, false, [1])]) expect(cardinality(domain)).toEqual({kind: 'infinite'});
    });

    it('rejects empty, noncanonical, sparse and nonrational domains with total guards', () => {
        const bad = [null, {}, {kind: 'finite', values: []}, {kind: 'finite', values: [q(1), q(1)]}, {kind: 'finite', values: new Array(2 ** 32 - 1)},
            {kind: 'finite', values: [{numerator: -0, denominator: 1}]}, {kind: 'finite', values: [q(1), {numerator: 2, denominator: 2}]},
            interval(2, 1), interval(1, 1, false), interval(1, 1, true, true, [1]), {kind: 'numeric', values: {...(all as Extract<StatementAmbientDomain, {kind: 'numeric'}>).values, kind: 'integer'}}];
        for (const domain of bad) {expect(domainGuard(domain)).toBe(false); expect(member(q(0), domain as never)).toBe(false); expect(() => cardinality(domain as never)).toThrow(GeneratorValidationError);}
        expect(member({numerator: 2, denominator: 2}, all)).toBe(false);
        expect(domainGuard(Object.defineProperty({}, 'kind', {get() {throw Error('Accessor');}}))).toBe(false);
        expect(member(q(1), Object.defineProperty({}, 'kind', {get() {throw Error('Accessor');}}) as never)).toBe(false);
    });
});

describe('exact one-assignment evidence', () => {
    it('retains unreduced binding spelling and literal-only sides without fake work', () => {
        const statement = equation(), row = build(statement, variable, all, binding(10, 8));
        expect(row.comparison).toEqual({operator: 'equal', leftValue: q(2), rightValue: q(2), truth: true});
        expect(row.left.replacements[0]).toEqual({occurrenceNodeId: 'x', symbolId: 'x', value: q(5, 4), notation: {kind: 'fraction', numerator: 10, denominator: 8}});
        expect(row.right.replacements).toEqual([]); expect(row.right.calculation.reductions).toEqual([]);
        expect(guard(row, statement, variable, all)).toBe(true);
        expect(build(statement, variable, all, binding(0)).comparison.truth).toBe(false);
        // Core has no candidate-list constraint: arbitrary ambient members remain legal.
        expect(guard(build(statement, variable, finite(0, 2), binding(2)), statement, variable, finite(0, 2))).toBe(true);
    });

    it('handles repeated occurrences, groups, unary signs, all operators and both strict directions exactly', () => {
        const left = {id: 'negated', kind: 'negation' as const, operand: group(binary('sum', 'addition', v('first'), v('second')))};
        const statement: ExactAlgebraicStatement = {operator: 'equal', left, right: n('right', -1)};
        const row = build(statement, variable, all, binding(1, 2));
        expect(row.comparison.truth).toBe(true); expect(row.left.replacements).toHaveLength(2);
        expect(guard(changed(row, value => {value.left.replacements.reverse(); value.left.calculation.nodeValues.reverse();}), statement, variable, all)).toBe(true);
        for (const operation of ['addition', 'subtraction', 'multiplication', 'division'] as const) for (const operator of ['equal', 'less', 'greater'] as const) {
            const source = {operator, left: binary('op', operation, v(), n('constant', 3)), right: n('q', 2)};
            const evidence = build(source, variable, all, binding(3, 2));
            const expected = operation === 'addition' ? q(9, 2) : operation === 'subtraction' ? q(-3, 2) : operation === 'multiplication' ? q(9, 2) : q(1, 2);
            const comparison = BigInt(expected.numerator) - 2n * BigInt(expected.denominator);
            expect(evidence.comparison.leftValue).toEqual(expected);
            expect(evidence.comparison.truth).toBe(operator === 'equal' ? comparison === 0n : operator === 'less' ? comparison < 0n : comparison > 0n);
            expect(guard(evidence, source, variable, all)).toBe(true);
        }
        const maximum = Number.MAX_SAFE_INTEGER;
        const safe = {operator: 'equal' as const, left: binary('ratio', 'division', v(), n('m', maximum)), right: n('one', 1)};
        expect(build(safe, variable, all, binding(maximum)).comparison.truth).toBe(true);
    });

    it('accepts equivalent supplied reduction notation without changing original spelling', () => {
        const statement = equation('addition', n('zero', 0), n('right', 1));
        const row = changed(build(statement, variable, all, binding(2, 4)), value => {
            value.left.calculation.reductions[0].after.notation = {kind: 'decimal', coefficient: 50, scale: 2, numeral: '0.50'};
        });
        expect(guard(row, statement, variable, all)).toBe(true);
        expect(guard(changed(row, value => {value.left.calculation.expression.left.notation = {kind: 'decimal', coefficient: 5, scale: 1, numeral: '0.5'};}), statement, variable, all)).toBe(false);
    });

    it('rejects malformed bindings, syntax, forged rows/calculations/comparisons and arithmetic errors', () => {
        const statement = equation(), row = build(statement, variable, all, binding(1));
        const mutations: ((value: any) => void)[] = [value => {value.binding.symbolId = 'y';}, value => {value.binding.value = q(2);},
            value => {value.left.replacements = [];}, value => {value.left.replacements = new Array(1);}, value => {value.left.replacements.push(value.left.replacements[0]);},
            value => {value.left.replacements[0].occurrenceNodeId = 'unknown';}, value => {value.left.replacements[0].symbolId = 'y';},
            value => {value.left.replacements[0].value = q(2);}, value => {value.left.replacements[0].notation.numeral = '2';},
            value => {value.left.calculation.expression.id = 'changed';}, value => {value.left.calculation.finalValue = q(9);},
            value => {value.comparison.operator = 'less';}, value => {value.comparison.leftValue = q(0);}, value => {value.comparison.rightValue = q(0);},
            value => {value.comparison.truth = !value.comparison.truth;}, value => {value.right.calculation = {};}, value => {value.left = null;}];
        for (const mutation of mutations) expect(guard(changed(row, mutation), statement, variable, all)).toBe(false);
        const duplicate = build({operator: 'equal', left: binary('sum', 'addition', v('a'), v('b')), right: n('one', 1)}, variable, all, binding(1, 2));
        expect(guard(changed(duplicate, value => {value.left.replacements[1] = value.left.replacements[0];}), {operator: 'equal', left: binary('sum', 'addition', v('a'), v('b')), right: n('one', 1)}, variable, all)).toBe(false);
        for (const bad of [null, {}, {...binding(1), symbolId: 'y'}, {...binding(1), notation: {kind: 'integer', numeral: '2'}}, binding(-1)]) {
            expect(() => build(statement, variable, interval(0, null), bad as never)).toThrow(GeneratorValidationError);
        }
        expect(() => build(statement, {symbolId: 'x', symbol: '2x'}, all, binding(1))).toThrow(GeneratorValidationError);
        expect(() => build({...statement, left: {id: 'power', kind: 'power', base: v(), exponent: 1}}, variable, all, binding(1))).toThrow(GeneratorValidationError);
        expect(() => build({operator: 'equal', left: binary('divide', 'division', v(), n('zero', 0)), right: n('right', 0)}, variable, all, binding(1))).toThrow(GeneratorValidationError);
        const cycle = group(v()) as any; cycle.expression = cycle;
        expect(guard(row, {...statement, left: cycle}, variable, all)).toBe(false);
        expect(guard(Object.defineProperty({}, 'binding', {get() {throw Error('Accessor');}}), statement, variable, all)).toBe(false);
        expect(guard(row, {...statement, operator: 'invalid'} as never, variable, all)).toBe(false);
    });
});

describe('elementary quantity and strict-threshold semantics', () => {
    it('admits signed abstract relations and validates exact role/constants/notation/form links', () => {
        for (const operation of ['addition', 'multiplication'] as const) {
            const statement = equation(operation, n('c', -3, 2), n('q', -5));
            const context = abstract(statement);
            expect(contextGuard(context, statement, form(statement), all)).toBe(true);
            for (const edit of [(value: any) => {value.variableQuantity.meaning = 'initial-amount';}, (value: any) => {value.constantQuantity.value = q(4);},
                (value: any) => {value.resultQuantity.notation.numeral = '5';}, (value: any) => {value.constantQuantity.meaning = 'fixed-charge';},
                (value: any) => {value.relationship = 'other';}, (value: any) => {value.variableQuantity.quantityId = 'total';},
                (value: any) => {value.variableQuantity.unit = dollars;}]) expect(contextGuard(changed(context, edit), statement, form(statement), all)).toBe(false);
            expect(contextGuard(context, statement, {...form(statement), total: q(0)}, all)).toBe(false);
        }
    });

    it('proves nonnegative whole-domain amounts and continuous/count equal groups with genuine unit roles', () => {
        const add = equation('addition', n('c', 2), n('q', 5)), product = equation('multiplication', n('c', 2), n('q', 6));
        const context = physical('combined-amounts', add);
        expect(contextGuard(context, add, form(add), interval(0, null))).toBe(true);
        expect(contextGuard(context, add, form(add), finite(0, 1, 2))).toBe(true);
        expect(contextGuard(context, add, form(add), all)).toBe(false);
        expect(contextGuard(context, add, form(add), finite(-1, 2))).toBe(false);
        const negative = equation('addition', n('c', -1), n('q', 2));
        expect(contextGuard(physical('combined-amounts', negative), negative, form(negative), interval(0, null))).toBe(false);
        for (const role of ['amount-per-group', 'duration', 'group-count']) {
            const data = physical('equal-groups', product, role), domain = role === 'group-count' ? finite(0, 2, 3) : interval(0, null);
            expect(contextGuard(data, product, form(product), domain)).toBe(true);
            if (role === 'group-count') {
                expect(contextGuard(data, product, form(product), interval(0, null))).toBe(false);
                expect(contextGuard(data, product, form(product), interval(2, 2))).toBe(true);
            }
        }
        const zero = equation('multiplication', n('c', 0), n('q', 0));
        expect(contextGuard(physical('equal-groups', zero), zero, form(zero), interval(0, null))).toBe(true);
        const ticketUnit = units('item', 'tickets', 0, 0, 1);
        const tickets = changed(context, value => {for (const quantity of [value.variableQuantity, value.addedQuantity, value.totalQuantity]) quantity.unit = ticketUnit;});
        expect(contextGuard(tickets, add, form(add), finite(0, 1, 2))).toBe(true);
        expect(contextGuard(tickets, add, form(add), interval(0, null))).toBe(false);
        expect(contextGuard(tickets, add, form(add), finite(0, 1))).toBe(true);
        const duration = physical('equal-groups', product, 'duration');
        for (const edit of [(value: any) => {value.variableQuantity.unit = dollars; value.multiplierQuantity.unit = numbers;},
            (value: any) => {value.variableQuantity.unit.name = 'minutes';}, (value: any) => {value.multiplierQuantity.meaning = 'group-count';},
            (value: any) => {value.totalQuantity.unit.name = 'euros';}]) expect(contextGuard(changed(duration, edit), product, form(product), interval(0, null))).toBe(false);
    });

    it('rejects malformed elementary syntax/role families and cannot silently infer physical count claims', () => {
        const statement = equation(), context = abstract(statement);
        for (const bad of [null, {}, {kind: 'other'}, {...context, variableQuantity: null}]) expect(contextGuard(bad, statement, form(statement), all)).toBe(false);
        expect(contextGuard(context, {...statement, operator: 'less'} as never, form(statement), all)).toBe(false);
        expect(contextGuard(context, {...statement, left: n('no', 1)}, form(statement), all)).toBe(false);
        expect(contextGuard(context, statement, {...form(statement), variableNodeId: 'wrong'}, all)).toBe(false);
        expect(contextGuard(context, statement, {kind: 'other'} as never, all)).toBe(false);
        expect(contextGuard(context, {...statement, right: v('right')}, form(statement), all)).toBe(false);
        const product = equation('multiplication', n('c', 3, 2), n('q', 3));
        expect(contextGuard(physical('equal-groups', product), product, form(product), interval(0, null))).toBe(false); // fractional group count
        const count = equation('addition', n('c', 1, 2), n('q', 3));
        const tickets = changed(physical('combined-amounts', count), value => {for (const quantity of [value.variableQuantity, value.addedQuantity, value.totalQuantity]) quantity.unit = units('item', 'tickets', 0, 0, 1);});
        expect(contextGuard(tickets, count, form(count), finite(0, 1))).toBe(false);
        expect(contextGuard(Object.defineProperty({}, 'kind', {get() {throw Error('Accessor');}}), statement, form(statement), all)).toBe(false);
    });

    it('preserves all three signed references, strict direction and exact threshold spelling across domains', () => {
        const metadata = [{kind: 'temperature', reference: 'celsius-zero', unit: 'degrees-celsius'}, {kind: 'elevation', reference: 'sea-level', unit: 'meters'}, {kind: 'balance', reference: 'settled-balance', unit: 'dollars'}];
        for (const context of metadata) for (const direction of ['less', 'greater'] as const) {
            const bound = {variableNodeId: 'x', value: q(3, 2), notation: n('c', 6, 4).notation, direction};
            const data = {kind: 'strict-threshold', context, quantityId: 'observed', threshold: {quantityId: 'limit', value: bound.value, notation: bound.notation},
                relationship: direction === 'less' ? 'strictly-below-threshold' : 'strictly-above-threshold'};
            for (const domain of [all, interval(0, null), interval(0, 3), finite(-2, 0, 2)]) expect(thresholdGuard(data, bound, domain)).toBe(true);
            for (const edit of [(value: any) => {value.context.kind = 'charge';}, (value: any) => {value.context.reference = 'other';},
                (value: any) => {value.context.unit = 'euros';}, (value: any) => {value.threshold.quantityId = 'observed';},
                (value: any) => {value.threshold.value = q(2);}, (value: any) => {value.relationship = 'not-strict';},
                (value: any) => {value.threshold.notation = {kind: 'fraction', numerator: 3, denominator: 2};}]) expect(thresholdGuard(changed(data, edit), bound, all)).toBe(false);
            expect(thresholdGuard(data, {...bound, direction: 'bad'} as never, all)).toBe(false);
            expect(thresholdGuard(data, {...bound, notation: {kind: 'integer', numeral: '2'}}, all)).toBe(false);
        }
        expect(thresholdGuard(null, {} as never, all)).toBe(false);
        expect(thresholdGuard(Object.defineProperty({}, 'kind', {get() {throw Error('Accessor');}}), {} as never, all)).toBe(false);
    });
});
