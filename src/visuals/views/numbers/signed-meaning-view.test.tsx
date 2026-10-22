import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {buildSignedRationalContextProblem} from '../../../generators/number/signed-rational-contexts/generator.ts';
import {balanceOracle, chargeOracle, oppositeOracle, positiveOppositeOracle, seaLevelOracle, zeroOppositeOracle} from './signed-meaning-fixtures.ts';
import {SignedContextBody, type SignedContextTask} from './signed-context-view.tsx';
import {RationalOppositeBody, type RationalOppositeTask} from './rational-opposite-view.tsx';

const text = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const context = (task: SignedContextTask, solution = false, data = balanceOracle) => renderToStaticMarkup(<SignedContextBody data={data} task={task} isSolutionView={solution} />);
const opposite = (task: RationalOppositeTask, solution = false, data = oppositeOracle, seed = 0) => renderToStaticMarkup(<RationalOppositeBody data={data} task={task} isSolutionView={solution} seed={seed} />);

describe('signed context task projections', () => {
    it('makes contextual prose necessary for formalization without revealing signed numeric responses', () => {
        const question = context('signed-context-formalization');
        expect(text(question)).toContain('3/2 dollars are owed.');
        expect(text(question)).toContain('5/4 dollars of net funds are available.');
        expect(question).not.toContain('-3/2');
        expect(question).not.toContain('+5/4');
        expect(question).not.toContain('emerald');
        const solution = context('signed-context-formalization', true);
        expect(text(solution)).toContain('A: -3/2 dollars');
        expect(text(solution)).toContain('B: +5/4 dollars');
        expect(solution).toContain('emerald');
    });
    it('gives signed readings for interpretation but withholds their contextual meaning in Question', () => {
        const question = context('signed-context-interpretation');
        expect(text(question)).toContain('-3/2 dollars');
        expect(text(question)).toContain('+5/4 dollars');
        expect(question).not.toContain('3/2 dollars are owed.');
        expect(text(context('signed-context-interpretation', true))).toContain('3/2 dollars are owed.');
    });
    it('withholds zero meaning while retaining its reference framework, then explains every typed context accurately', () => {
        const question = context('contextual-zero', false, seaLevelOracle);
        expect(text(question)).toContain('relative to sea level');
        expect(text(question)).toContain('0 m');
        expect(question).not.toContain('Zero meters means');
        for (const [kind, answer] of [['temperature', 'reference temperature'], ['elevation', 'at sea level'], ['balance', 'balance is settled'], ['charge', 'net electric charge is neutral']] as const) {
            const data = buildSignedRationalContextProblem(kind, [{numerator: 0, denominator: 1}]);
            expect(text(context('contextual-zero', true, data))).toContain(answer);
        }
    });
    it('renders all coherent array members and zero descriptions in every context task', () => {
        for (const task of ['contextual-zero', 'signed-context-interpretation', 'signed-context-formalization'] as const) {
            for (const solution of [false, true]) expect(text(context(task, solution, chargeOracle))).toContain('C:');
        }
        expect(text(context('signed-context-formalization', false, seaLevelOracle))).toContain('Zero meters means the elevation is at sea level.');
    });
});

describe('opposite relation task projections', () => {
    it('shows two literal opposite steps for both signs without a misleading nested minus', () => {
        const question = text(opposite('double-opposite'));
        expect(question).toContain('First opposite: -(-3/2) = +3/2');
        expect(question).toContain('Second opposite: -(+3/2) = -3/2');
        expect(question).toContain('Reference value: 0');
        expect(question).not.toContain('returns to the starting value');
        expect(text(opposite('double-opposite', true, positiveOppositeOracle))).toContain('returns to the starting value, +3/2');
        expect(opposite('double-opposite')).not.toContain('<svg');
    });
    it('preserves invariant negative and zero context for a zero original without adding a number-line task', () => {
        const question = opposite('double-opposite', false, zeroOppositeOracle);
        expect(text(question)).toContain('First opposite: -(0) = 0');
        expect(text(question)).toMatch(/Reference values: -3\/2; 0\s*; \+3\/2/);
        expect(question).not.toContain('<svg');
        expect(text(opposite('double-opposite', true, zeroOppositeOracle))).toContain('Both opposite steps leave zero unchanged.');
    });
    it('places true and unequal signed pairs at supplied ticks in both deterministic orientations', () => {
        for (const seed of [0, 1]) {
            const question = opposite('opposite-locations', false, oppositeOracle, seed);
            expect(question.match(/data-role="number-line"/g)).toHaveLength(2);
            expect(question).toContain('data-point="A" data-tick-index="1"');
            expect(question).toContain('data-point="A" data-tick-index="3"');
            expect(question).toContain(`data-orientation="${seed === 0 ? 'horizontal' : 'vertical'}"`);
            expect(question).not.toContain('Pair 1 is an opposite pair');
            const solution = text(opposite('opposite-locations', true, oppositeOracle, seed));
            expect(solution).toContain('both distances from zero are 3/2');
            expect(solution).toContain('Pair 2 has distances 1/2 and 3/2. They are unequal');
            expect(solution).toContain(seed === 0 ? 'left of zero' : 'below zero');
            expect(opposite('opposite-locations', false, oppositeOracle, seed)).toBe(question);
        }
    });
    it('uses one coincident zero marker and withholds the requested fixed-point explanation', () => {
        const question = opposite('zero-opposite');
        expect(question.match(/<circle/g)).toHaveLength(1);
        expect(question).toContain('data-point="Z" data-tick-index="4"');
        expect(text(question)).toContain('Z marks zero and its opposite.');
        expect(text(question)).toContain('-(0) = 0');
        expect(question).not.toContain('leaves this point unchanged');
        expect(text(opposite('zero-opposite', true))).toContain('leaves this point unchanged, so -0 = 0');
    });
    it('keeps all Question projections neutral and all completed explanations green without fallback placeholders', () => {
        for (const task of ['double-opposite', 'opposite-locations', 'zero-opposite'] as const) {
            const question = opposite(task);
            expect(question).not.toContain('emerald');
            expect(question).not.toContain('□');
            expect(question).toContain('data-role="blank-response"');
            expect(opposite(task, true)).toContain('emerald');
        }
    });
});

let cores: readonly ComponentType<{payload: unknown; config: object}>[];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const modules = await Promise.all([import('./numbers-contextual-zero/view.tsx'), import('./numbers-signed-context-interpretation/view.tsx'),
        import('./numbers-signed-context-formalization/view.tsx'), import('./numbers-double-opposite/view.tsx'), import('./numbers-opposite-locations/view.tsx'), import('./numbers-zero-opposite/view.tsx')]);
    cores = [modules[0].NumbersContextualZeroCore, modules[1].NumbersSignedContextInterpretationCore, modules[2].NumbersSignedContextFormalizationCore,
        modules[3].NumbersDoubleOppositeCore, modules[4].NumbersOppositeLocationsCore, modules[5].NumbersZeroOppositeCore] as unknown as typeof cores;
});
afterAll(() => vi.unstubAllGlobals());
describe('six leaf uniform payload boundaries', () => {
    const leaf = (index: number, data: unknown, solution: boolean) => renderToStaticMarkup(createElement(cores[index]!, {config: {}, payload: {
        problem: {type: 'arithmetic', data, labels: []}, targetLabels: [], isSolutionView: solution, seed: 19
    }}));
    it('accepts every coherent context array and each primary-sign opposite member in all consuming leaves', () => {
        for (let index = 0; index < 6; index++) for (const data of index < 3 ? [balanceOracle, seaLevelOracle, chargeOracle] : [oppositeOracle, positiveOppositeOracle, zeroOppositeOracle]) {
            for (const solution of [false, true]) expect(leaf(index, data, solution)).not.toMatch(/NaN|undefined|null/);
        }
    });
    it('rejects missing data, wrong metadata and corrupted exact witnesses before either mode renders', () => {
        for (let index = 0; index < 6; index++) for (const solution of [false, true]) {
            expect(() => leaf(index, undefined, solution)).toThrow('Validation Error');
            expect(() => leaf(index, index < 3 ? {...balanceOracle, observations: [{...balanceOracle.observations[0], sign: 0}]} :
                {...oppositeOracle, zeroFixedPoint: {...oppositeOracle.zeroFixedPoint, tickIndex: 0}}, solution)).toThrow('Validation Error');
        }
    });
    it('converts sparse arrays and inherited context keys into the ordinary view validation error', () => {
        const ticks = [...oppositeOracle.axis.ticks];
        delete ticks[3];
        for (let index = 0; index < 6; index++) for (const solution of [false, true]) {
            const invalid = index < 3 ? [{...balanceOracle, context: {kind: 'toString'}}, {...balanceOracle, observations: new Array(1)}] :
                [{...oppositeOracle, axis: {...oppositeOracle.axis, ticks}}];
            invalid.forEach(data => expect(() => leaf(index, data, solution)).toThrow('Validation Error'));
        }
    });
});
