import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Scope} from 'edugraph-ts';
import type {RationalNumberlineValuesProblem} from '../../../types/problems.ts';
import {makeCoordinateAxis} from '../../../generators/coordinate/coordinate-helpers.ts';
import {buildRationalNumberlineValuesProblem} from '../../../generators/number/rational-numberline-values/generator.ts';
import {formatCoordinateNotation} from '../coordinate/rational-coordinate-helpers.ts';
import {isRationalNumberlineValues} from './rational-numberline-helpers.ts';
import {decimalLineOracle, fractionLineOracle, integerLineOracle, threeTickLineOracle} from './rational-numberline-fixtures.ts';
import {RationalLinePositioningBody, RationalLineReadingBody} from './rational-numberline-view.tsx';
import {spec as positioningSpec, NumbersRationalLinePositioningViewSchema} from './numbers-rational-line-positioning/spec.ts';
import {spec as readingSpec, NumbersRationalLineReadingViewSchema} from './numbers-rational-line-reading/spec.ts';

const plain = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const position = (data: RationalNumberlineValuesProblem, solution: boolean, seed: number) => renderToStaticMarkup(<RationalLinePositioningBody data={data} isSolutionView={solution} seed={seed} />);
const read = (data: RationalNumberlineValuesProblem, solution: boolean, seed: number) => renderToStaticMarkup(<RationalLineReadingBody data={data} isSolutionView={solution} seed={seed} />);
const labels = (markup: string) => [...markup.matchAll(/data-role="numberline-tick-label" data-tick-index="(\d+)">([^<]+)<\/text>/g)];
const atTick = (data: RationalNumberlineValuesProblem, tickIndex: number): RationalNumberlineValuesProblem => {
    const value = data.axis.ticks[tickIndex]!;
    return {...data, point: {value, magnitude: {numerator: Math.abs(value.numerator), denominator: value.denominator}, sign: Math.sign(value.numerator) as -1 | 0 | 1, tickIndex, notation: data.axis.tickNotations[tickIndex]!}};
};

describe('rational number-line learner tasks', () => {
    it('gives the exact original value while leaving positioning Questions entirely unmarked', () => {
        for (const [data, expected] of [[fractionLineOracle, '-6/8'], [decimalLineOracle, '-0.750']] as const) for (const seed of [18, 19]) {
            const question = position(data, false, seed);
            expect(plain(question)).toContain(`Place P at ${expected}.`);
            expect(question).not.toContain('data-role="numberline-marker"');
            expect(question).not.toContain('data-role="numberline-answer"');
            expect(labels(question)).toHaveLength(data.axis.ticks.length);
            const solution = position(data, true, seed);
            expect(solution).toContain('data-role="numberline-marker"');
            expect(plain(solution)).toContain(`P = ${expected}`);
            expect(solution).toContain('#047857');
        }
    });
    it('hides the marked numeric tick and every completed reading response while retaining the exact scale', () => {
        for (const data of [integerLineOracle, fractionLineOracle, decimalLineOracle]) for (const seed of [18, 19]) {
            const question = read(data, false, seed);
            expect(question).toContain('data-role="numberline-marker" aria-label="Point P"');
            expect(question).toContain('data-role="blank-numberline-answer"');
            expect(question).not.toContain('data-role="numberline-answer"');
            expect(question).not.toContain('data-role="given-numberline-value"');
            expect(question).not.toContain('<title');
            const visible = labels(question);
            expect(visible).toHaveLength(data.axis.ticks.length - 1);
            expect(visible.some(label => Number(label[1]) === data.point.tickIndex)).toBe(false);
            expect(plain(question)).not.toContain(formatCoordinateNotation(data.point.notation));
            expect(plain(question)).toContain(`Step: ${formatCoordinateNotation(data.axis.stepNotation)}`);
            for (const label of visible) expect(label[2]).toBe(formatCoordinateNotation(data.axis.tickNotations[Number(label[1])]!));
        }
    });
    it('withholds zero, middle and endpoint answers on minimal three-tick mixed-form lines with two remaining anchors', () => {
        for (const tickIndex of [0, 1, 2]) for (const seed of [18, 19]) {
            const data = atTick(threeTickLineOracle, tickIndex);
            const question = read(data, false, seed);
            expect(labels(question).map(label => Number(label[1]))).toEqual([0, 1, 2].filter(index => index !== tickIndex));
            expect(question).not.toMatch(/origin|minimum|maximum|<title/);
            expect(plain(question)).toContain('P = __________');
            const solution = read(data, true, seed);
            expect(labels(solution)).toHaveLength(3);
            expect(plain(solution)).toContain(`P = ${formatCoordinateNotation(data.point.notation)}`);
        }
    });
    it('uses ascending rightward/upward coordinates with exact literal marker positions', () => {
        const horizontal = read(integerLineOracle, false, 18), vertical = read(integerLineOracle, false, 19);
        expect(horizontal).toContain('data-orientation="horizontal"');
        expect(horizontal).toContain('<circle cx="215" cy="92"');
        expect(vertical).toContain('data-orientation="vertical"');
        expect(vertical).toContain('<circle cx="370" cy="427.5"');
        const minimum = read(atTick(integerLineOracle, 0), false, 19), maximum = read(atTick(integerLineOracle, 4), false, 19);
        expect(minimum).toContain('<circle cx="370" cy="550"');
        expect(maximum).toContain('<circle cx="370" cy="60"');
        expect(read(integerLineOracle, false, 18)).toBe(horizontal);
    });
    it('preserves unreduced fraction and trailing-zero decimal answer notation in green Solutions', () => {
        expect(plain(read(fractionLineOracle, true, 18))).toContain('P = -6/8');
        expect(plain(read(decimalLineOracle, true, 19))).toContain('P = -0.750');
        expect(plain(position(threeTickLineOracle, true, 18))).toContain('P = 0/7');
        for (const data of [integerLineOracle, fractionLineOracle, decimalLineOracle, threeTickLineOracle]) for (const render of [position, read]) {
            expect(render(data, false, 18)).not.toMatch(/emerald|#047857|[□→←]/);
            expect(render(data, true, 19)).toContain('text-emerald-800');
        }
    });
    it('accepts broad coherent producer models independently of canonical sampling limits', () => {
        for (const kind of ['integer', 'fraction', 'decimal'] as const) for (const start of [-4, 0]) {
            const axis = makeCoordinateAxis({numerator: 1, denominator: kind === 'integer' ? 1 : 4}, start, 4, kind, 3);
            for (const tickIndex of [0, axis.zeroIndex, axis.ticks.length - 1]) {
                const data = buildRationalNumberlineValuesProblem(axis, tickIndex);
                expect(isRationalNumberlineValues(data)).toBe(true);
                for (const seed of [18, 19]) for (const solution of [false, true]) for (const render of [position, read]) expect(render(data, solution, seed)).not.toMatch(/NaN|undefined|null/);
            }
        }
        const longAxis = {
            ...integerLineOracle.axis, minimum: {numerator: -8, denominator: 1}, maximum: {numerator: 4, denominator: 1}, zeroIndex: 8,
            ticks: [-8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4].map(numerator => ({numerator, denominator: 1})),
            tickNotations: ['-8', '-7', '-6', '-5', '-4', '-3', '-2', '-1', '0', '1', '2', '3', '4'].map(numeral => ({kind: 'integer' as const, numeral}))
        };
        const longData = buildRationalNumberlineValuesProblem(longAxis, 12);
        expect(isRationalNumberlineValues(longData)).toBe(true);
        for (const seed of [18, 19]) {
            expect(labels(read(longData, false, seed))).toHaveLength(12);
            expect(labels(position(longData, false, seed))).toHaveLength(13);
        }
        const nonpositive = makeCoordinateAxis({numerator: 1, denominator: 2}, -2, 0, 'fraction');
        const data = buildRationalNumberlineValuesProblem(nonpositive, 2, {kind: 'decimal', coefficient: 0, scale: 3, numeral: '0.000'});
        expect(isRationalNumberlineValues(data)).toBe(true);
        expect(labels(read(data, false, 18))).toHaveLength(2);
    });
    it('retains fixed empty schemas and sole ownership of the number-line presentation and learner action', () => {
        expect(NumbersRationalLinePositioningViewSchema).toEqual({});
        expect(NumbersRationalLineReadingViewSchema).toEqual({});
        expect(positioningSpec.generalLabels).toEqual([Scope.Numberline, Ability.VisualArticulation]);
        expect(readingSpec.generalLabels).toEqual([Scope.Numberline, Ability.VisualReception]);
    });
});

let cores: readonly ComponentType<{payload: unknown; config: object}>[];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const modules = await Promise.all([import('./numbers-rational-line-positioning/view.tsx'), import('./numbers-rational-line-reading/view.tsx')]);
    cores = [modules[0].NumbersRationalLinePositioningCore, modules[1].NumbersRationalLineReadingCore] as unknown as typeof cores;
});
afterAll(() => vi.unstubAllGlobals());

describe('rational number-line leaf validation boundaries', () => {
    const leaf = (index: number, data: unknown, solution: boolean) => renderToStaticMarkup(createElement(cores[index]!, {config: {}, payload: {
        problem: {type: 'arithmetic', data, labels: []}, targetLabels: [], isSolutionView: solution, seed: 19
    }}));
    it('renders all literal form/domain members through both leaf cores in both modes', () => {
        for (const index of [0, 1]) for (const data of [integerLineOracle, fractionLineOracle, decimalLineOracle, threeTickLineOracle]) for (const solution of [false, true]) expect(leaf(index, data, solution)).not.toMatch(/NaN|undefined|null/);
    });
    it('rejects missing and malformed witness data through ViewValidationError in both modes', () => {
        const sparse = [...integerLineOracle.axis.ticks];
        delete sparse[1];
        for (const index of [0, 1]) for (const solution of [false, true]) for (const data of [undefined, {...integerLineOracle, point: {...integerLineOracle.point, sign: 1}},
            {...integerLineOracle, axis: {...integerLineOracle.axis, ticks: sparse}}, {...threeTickLineOracle, point: {...threeTickLineOracle.point, sign: -0}}]) {
            expect(() => leaf(index, data, solution)).toThrow('Validation Error');
        }
    });
});
