import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {isNumericalPowerExpressionProblem} from '../../../generators/arithmetic/numerical-power-helpers.ts';
import type {ExactNumericalExpressionNode as Node, NumericalPowerExpressionProblem} from '../../../types/problems.ts';
import {ExactNumericExpression, PrescribedNumericCalculation} from './numerical-power-expression-format.tsx';
import {NumericalPowerEvaluationBody, NumericalPowerWritingBody} from './numerical-power-expression-view.tsx';
import {numericalPowerOracles, powerFractionOracle, powerGroupedOracle, powerNegatedOracle, powerOneDecimalOracle, powerProductFirstOracle, powerZeroOracle} from './numerical-power-expression-fixtures.ts';

const text = (markup: string) => markup.replace(/<sup[^>]*>(.*?)<\/sup>/g, '^$1').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const evaluation = (data: NumericalPowerExpressionProblem, solution: boolean) => renderToStaticMarkup(<NumericalPowerEvaluationBody data={data} isSolutionView={solution} />);
const writing = (data: NumericalPowerExpressionProblem, solution: boolean) => renderToStaticMarkup(<NumericalPowerWritingBody data={data} isSolutionView={solution} />);
const expression = (node: Node) => renderToStaticMarkup(<ExactNumericExpression node={node} />);
const number = (id: string, value: number): Node => ({id, kind: 'number', value: {numerator: value, denominator: 1}, notation: {kind: 'integer', numeral: String(value)}});

describe('exact numeric syntax and prescribed prose', () => {
    it('validates independent literal mathematical oracles with complete conventional work', () => {
        for (const data of numericalPowerOracles) expect(isNumericalPowerExpressionProblem(data)).toBe(true);
    });
    it('keeps negative and unreduced fractional power bases atomic without fake group identities', () => {
        expect(text(expression(powerZeroOracle.expression))).toBe('(-3) ^0');
        expect(text(expression(powerFractionOracle.expression))).toBe('(-2/4) ^3');
        for (const data of [powerZeroOracle, powerFractionOracle]) expect(expression(data.expression)).not.toContain('data-node-kind="group"');
        expect(expression(powerGroupedOracle.expression).match(/data-node-kind="group"/g)).toHaveLength(1);
    });
    it('distinguishes a negative literal base from negating an entire power', () => {
        const base = {id: 'p', kind: 'power', base: number('b', -3), exponent: 2} as const;
        expect(text(expression(base))).toBe('(-3) ^2');
        expect(text(expression(powerNegatedOracle.expression))).toBe('-( 3 ^2 )');
        expect(expression(powerNegatedOracle.expression)).not.toContain('data-node-kind="group"');
        expect(text(evaluation(powerNegatedOracle, true))).toContain('Value: -9');
    });
    it('preserves original decimal precision and valid alternative replacement spelling', () => {
        const markup = evaluation(powerOneDecimalOracle, true);
        expect(markup).toContain('data-literal-notation="0.500"');
        expect(markup).toContain('data-literal-notation="2/4"');
        expect(text(markup)).toContain('Value: 1/2');
    });
    it('prints nested unary negation with clarity parentheses and no fabricated group node', () => {
        const node: Node = {id: 'outer', kind: 'negation', operand: {id: 'inner', kind: 'negation', operand: number('base', 3)}};
        const markup = expression(node);
        expect(text(markup)).toBe('-( - 3 )');
        expect(markup).not.toContain('data-node-kind="group"');
    });
    it('preserves explicit right-hand subtraction and division grouping', () => {
        for (const operation of ['subtraction', 'division'] as const) {
            const node: Node = {id: 'root', kind: 'binary', operation, left: number('a', 8), right: {id: 'group', kind: 'group', expression: {id: 'right', kind: 'binary', operation, left: number('b', operation === 'subtraction' ? 3 : 4), right: number('c', operation === 'subtraction' ? 1 : 2)}}};
            const formatted = text(expression(node));
            expect(formatted).toBe(operation === 'subtraction' ? '8 - ( 3 - 1 )' : '8 ÷ ( 4 ÷ 2 )');
        }
    });
    it('makes subtraction/division roles and grouped quantities unambiguous in prose', () => {
        for (const operation of ['subtraction', 'division'] as const) {
            const node: Node = {id: 'root', kind: 'binary', operation, left: number('a', 8), right: {id: 'group', kind: 'group', expression: powerZeroOracle.expression}};
            const prose = text(renderToStaticMarkup(<PrescribedNumericCalculation node={node} />));
            expect(prose).toContain(operation === 'subtraction' ? 'Subtract the second quantity below from the first:' : 'Divide the first quantity below by the second:');
            expect(prose.indexOf('First quantity: the number 8')).toBeLessThan(prose.indexOf('Second quantity:'));
            expect(prose).toContain('Treat this whole calculation as one quantity:');
            expect(prose).toContain('power 0:');
            expect(prose).not.toMatch(/[×÷^]/);
        }
    });
});

describe('fixed evaluation and writing projections', () => {
    it('withholds every computed step/fact/result in evaluation Q with answer-independent response space', () => {
        const questions = [powerProductFirstOracle, powerZeroOracle].map(data => evaluation(data, false));
        for (const markup of questions) {
            expect(markup).toContain('data-role="power-given-expression"');
            expect(markup).not.toMatch(/power-reduction|power-fact|power-final-value|emerald/);
        }
        expect(text(questions[0]!)).not.toContain('15');
        expect(questions[0]!.match(/<div[^>]*data-role="power-response">.*?<\/div>/)![0]).toBe(questions[1]!.match(/<div[^>]*data-role="power-response">.*?<\/div>/)![0]);
    });
    it('projects product-first supplied snapshots in order, including the ready left addition later', () => {
        const markup = evaluation(powerProductFirstOracle, true);
        expect([...markup.matchAll(/data-reduction-node-id="([^"]+)"/g)].map(match => match[1])).toEqual(['power', 'product', 'left', 'root']);
        expect(text(markup)).toContain('1 + 2 + 3 × 4');
        expect(text(markup)).toContain('1 + 2 + 12');
        expect(text(markup)).toContain('3 + 12');
        expect(text(markup)).toContain('Value: 15');
        expect(markup).toContain('text-emerald-900');
    });
    it('shows genuine group completion as its supplied step, distinct from atomic parentheses', () => {
        const markup = evaluation(powerGroupedOracle, true);
        expect([...markup.matchAll(/data-reduction-node-id="([^"]+)"/g)].map(match => match[1])).toEqual(['sum', 'group', 'power']);
        expect(text(markup)).toContain('Replace the completed grouped quantity');
        expect(text(markup)).toContain('Value: 9');
        expect(evaluation(powerFractionOracle, true)).not.toContain('Replace the completed grouped quantity');
    });
    it('shows zero/one/multiple-factor facts with exactly the supplied cumulative products', () => {
        const zero = text(evaluation(powerZeroOracle, true)), one = text(evaluation(powerOneDecimalOracle, true)), fraction = text(evaluation(powerFractionOracle, true));
        expect(zero).toContain('The base is nonzero. A nonzero base raised to the power 0 equals 1.');
        expect(zero).not.toContain('factors equal');
        expect(one).toContain('1 factor equal to the base:');
        expect(one).toContain('no multiplication step is needed');
        expect(one).not.toContain('Successive multiplication results:');
        expect(fraction).toContain('(-1/2) × (-1/2) × (-1/2) = -1/8');
        expect(fraction).toContain('Successive multiplication results: 1/4, -1/8.');
    });
    it('uses necessary recursive prose in writing Q without symbolic answer, snapshots or results', () => {
        for (const data of numericalPowerOracles) {
            const markup = writing(data, false);
            expect(markup).toContain('data-role="power-prescribed-prose"');
            expect(markup).not.toMatch(/data-node-kind|power-written-answer|power-reduction|power-fact|power-final-value|<sup|emerald|[□→←×÷^]/);
        }
        expect(text(writing(powerProductFirstOracle, false))).not.toContain('15');
        expect(text(writing(powerFractionOracle, false))).toContain('numerator negative 2 and denominator 4');
        expect(text(writing(powerFractionOracle, false))).not.toContain('-1/8');
        expect(text(writing(powerZeroOracle, false))).toContain('power 0:');
    });
    it('writes the whole original symbolic expression in S without adding an evaluation task', () => {
        for (const data of numericalPowerOracles) {
            const markup = writing(data, true);
            expect(markup).toContain('data-role="power-written-answer"');
            expect(markup).toContain(expression(data.expression));
            expect(markup).not.toMatch(/power-reduction|power-fact|power-final-value/);
            expect(markup).toContain('text-emerald-900');
        }
    });
});

let cores: readonly ComponentType<{config: object; payload: unknown}>[];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [evaluate, write] = await Promise.all([import('./numerical-power-expression-evaluate/view.tsx'), import('./numerical-power-expression-write/view.tsx')]);
    cores = [evaluate.NumericalPowerExpressionEvaluateCore, write.NumericalPowerExpressionWriteCore] as unknown as typeof cores;
});
afterAll(() => vi.unstubAllGlobals());
const leaf = (index: number, data: unknown, solution: boolean) => renderToStaticMarkup(createElement(cores[index]!, {config: {}, payload: {problem: {type: 'arithmetic', data, labels: []}, targetLabels: [], seed: 13, isSolutionView: solution}}));

describe('both full-uniform numeric leaf boundaries', () => {
    it('accepts every independent uniform oracle in both modes, independent of production matching', () => {
        for (const data of numericalPowerOracles) for (const index of [0, 1]) for (const solution of [false, true]) expect(leaf(index, data, solution)).not.toMatch(/NaN|undefined|null/);
    });
    it('rejects malformed/sparse/forged traces and cyclic syntax with ViewValidationError', () => {
        const cyclic: Record<string, unknown> = {id: 'cycle', kind: 'group'}; cyclic.expression = cyclic;
        const bad = [undefined, {}, {...powerProductFirstOracle, reductions: [...powerProductFirstOracle.reductions].reverse()},
            {...powerZeroOracle, powerFacts: new Array(1)}, {...powerZeroOracle, precedenceWitness: undefined},
            {...powerZeroOracle, finalValue: {numerator: -0, denominator: 1}}, {...powerZeroOracle, expression: cyclic}];
        for (const data of bad) for (const index of [0, 1]) for (const solution of [false, true]) expect(() => leaf(index, data, solution)).toThrow('Validation Error');
    });
    it('keeps exact view-owned claims and excludes selected written-binding evidence on the writer', async () => {
        const [evaluate, write] = await Promise.all([import('./numerical-power-expression-evaluate/spec.ts'), import('./numerical-power-expression-write/spec.ts')]);
        expect(evaluate.NumericalPowerExpressionEvaluateViewSchema).toEqual({});
        expect(write.NumericalPowerExpressionWriteViewSchema).toEqual({});
        expect(evaluate.spec.generalLabels).toEqual([Scope.ArabicNumerals, Ability.ProcedureExecution]);
        expect(write.spec.generalLabels).toEqual([Scope.ArabicNumerals, Ability.Formalization, Ability.TextualReception]);
        const boundary = write.spec.compatibility!.find(rule => rule.id === 'numerical-power-writing-evidence')!;
        expect(boundary.dependencies).toEqual([{scope: 'generator', label: Area.OrderOfOperations}]);
        const query = (present: boolean) => ({has: (scope: string, label: string) => scope === 'generator' && label === Area.OrderOfOperations && present, exact: () => false});
        expect(boundary.predicate(query(false))).toBe(true);
        expect(boundary.predicate(query(true))).toBe(false);
    });
});
