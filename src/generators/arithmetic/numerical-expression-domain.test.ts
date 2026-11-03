import {describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import type {NumericalExpressionNode, NumericalExpressionStructureNode} from '../../types/problems.ts';
import {numericalExpressionCalculationProblem, numericalExpressionProfiles, numericalExpressionQuantities,
    numericalExpressionRows, numericalExpressionStructureProblem, sampleNumericalExpressionFrame,
    type NumericalExpressionFrame, type NumericalExpressionProjection} from './numerical-expression-domain.ts';

// Generation's mathematical domain must remain independent of schema label resolution.
vi.mock('./arithmetic-numerical-expressions/spec.ts', () => {
    throw new Error('Mathematical source domains must not load schema label mappings.');
});
vi.mock('./arithmetic-numerical-expression-calculations/spec.ts', () => {
    throw new Error('Mathematical source domains must not load schema label mappings.');
});

const thresholds = [5, 10, 20, 100, 120, 1000];
const key = (row: NumericalExpressionFrame) => `${row.structure}:${row.factor}:${row.first}:${row.second}:${row.operation}`;

/** Independent transcription of the former nested draw law, including its conditional b pool. */
function oldSource(): NumericalExpressionFrame[] {
    const rows: NumericalExpressionFrame[] = [];
    for (let factor = 2; factor <= 5; factor++) for (let first = 16; first <= 70; first++) {
        const choices = Math.min(30, first - 2) - 1;
        for (let offset = 0; offset < choices; offset++) for (const operation of ['addition', 'subtraction'] as const) {
            rows.push({structure: 'grouped', factor, first, second: offset + 2, operation, weight: 2329089562800 / choices});
        }
    }
    for (let a = 2; a <= 10; a++) for (let b = 2; b <= 10; b++) for (let c = 2; c <= 10; c++)
        rows.push({structure: 'ungrouped', factor: a, first: b, second: c, operation: 'multiplication', weight: 1});
    return rows;
}

function oracleValues(row: NumericalExpressionFrame, projection: NumericalExpressionProjection): number[] {
    const result = [row.factor, row.first, row.second];
    if (projection === 'calculation') {
        const inner = row.structure === 'ungrouped' ? row.first * row.second
            : row.operation === 'addition' ? row.first + row.second : row.first - row.second;
        result.push(inner, row.factor * inner);
    }
    return result;
}

function oracleCell(values: readonly number[]): string | undefined {
    const min = Math.min(...values), max = Math.max(...values);
    if (min === max && thresholds.includes(max)) return undefined;
    return `${thresholds.filter(value => value <= min).at(-1) ?? 0}/${thresholds.find(value => value >= max)}`;
}

function syntaxValues(node: NumericalExpressionStructureNode): number[] {
    if (node.kind === 'number') return [node.value];
    expect(Object.hasOwn(node, 'value')).toBe(false);
    return node.kind === 'group' ? syntaxValues(node.expression) : [...syntaxValues(node.left), ...syntaxValues(node.right)];
}

function calculatedValues(node: NumericalExpressionNode): number[] {
    if (node.kind === 'number') return [node.value];
    if (node.kind === 'group') {
        expect(node.value).toBe(node.expression.value);
        return calculatedValues(node.expression);
    }
    const left = calculatedValues(node.left), right = calculatedValues(node.right);
    const expected = node.operation === 'addition' ? node.left.value + node.right.value
        : node.operation === 'subtraction' ? node.left.value - node.right.value : node.left.value * node.right.value;
    expect(node.value).toBe(expected);
    return [...left, ...right, node.value];
}

describe('numerical expression source domains', () => {
    it.each(['structure', 'calculation'] as const)('partitions all original %s paths exactly once with their original conditional weights', projection => {
        const profiles = numericalExpressionProfiles(projection);
        expect(profiles).toHaveLength(projection === 'structure' ? 7 : 14);
        const actual = new Map<string, {row: NumericalExpressionFrame; cell: string}>();
        for (const {profile} of profiles) for (const row of numericalExpressionRows(projection, profile)) {
            expect(actual.has(key(row))).toBe(false);
            actual.set(key(row), {row, cell: `${profile.range.min}/${profile.range.max}`});
        }
        const expected = oldSource().filter(row => oracleCell(oracleValues(row, projection)) !== undefined);
        expect(new Set(profiles.map(({profile}) => `${profile.structure}:${profile.range.min}/${profile.range.max}`)))
            .toEqual(new Set(expected.map(row => `${row.structure}:${oracleCell(oracleValues(row, projection))}`)));
        expect(expected).toHaveLength(projection === 'structure' ? 12399 : 12401);
        expect(actual.size).toBe(expected.length);
        for (const row of expected) {
            const found = actual.get(key(row));
            expect(found).toEqual({row, cell: oracleCell(oracleValues(row, projection))});
            expect(Number.isSafeInteger(row.weight)).toBe(true);
            expect(numericalExpressionQuantities(row, projection)).toEqual(oracleValues(row, projection));
        }
        const grouped = [...actual.values()].filter(({row}) => row.structure === 'grouped');
        expect(grouped.reduce((sum, {row}) => sum + row.weight, 0)).toBe(1024799407632000);
        const retired = oldSource().filter(row => !actual.has(key(row)));
        expect(retired.map(row => [row.factor, row.first, row.second]))
            .toEqual(projection === 'structure' ? [[5, 5, 5], [10, 10, 10]] : []);
    });

    it.each(['structure', 'calculation'] as const)('makes every %s conditional ticket reachable with exact safe integer mass', projection => {
        for (const {profile} of numericalExpressionProfiles(projection)) {
            const rows = numericalExpressionRows(projection, profile);
            const total = rows.reduce((sum, row) => sum + row.weight, 0);
            expect(Number.isSafeInteger(total)).toBe(true);
            let previous = 0;
            for (const row of rows) {
                const middle = (previous + row.weight / 2) / total;
                expect(sampleNumericalExpressionFrame(rows, () => middle)).toBe(row);
                previous += row.weight;
            }
            expect(sampleNumericalExpressionFrame(rows, () => 0)).toBe(rows[0]);
            expect(sampleNumericalExpressionFrame(rows, () => 1 - Number.EPSILON)).toBe(rows.at(-1));
        }
    });

    it('places a cumulative boundary in the following interval and rejects invalid random tickets', () => {
        const rows = oldSource().slice(0, 2);
        expect(sampleNumericalExpressionFrame(rows, () => 0.5)).toBe(rows[1]);
        expect(sampleNumericalExpressionFrame([], () => {throw new Error('Empty pools must not draw.');})).toBeUndefined();
        for (const draw of [-1, 1, NaN, Infinity]) expect(() => sampleNumericalExpressionFrame(rows, () => draw)).toThrow();
    });

    it('rejects malformed profiles and inconsistent witnesses without silently replacing them', () => {
        for (const profile of [undefined, {}, {structure: 'other', range: createCanonicalNumericRange(20)},
            {structure: 'grouped', range: {min: 30, max: 100}},
            {structure: 'grouped', range: {...createCanonicalNumericRange(20), minimumBelow: 10}}]) {
            expect(() => numericalExpressionRows('structure', profile as never)).toThrow();
        }
        expect(() => numericalExpressionRows('other' as never, {structure: 'grouped', range: createCanonicalNumericRange(20)})).toThrow();
        expect(numericalExpressionRows('structure', {structure: 'grouped', range: createCanonicalNumericRange(5)})).toEqual([]);
    });

    it.each([2, 3, 4, 5, 6, 7, 8, 9, 10])('builds every original factor %i frame as syntax or independently correct calculated evidence', factor => {
        for (const row of oldSource().filter(row => row.factor === factor)) {
            const syntax = numericalExpressionStructureProblem(row);
            const calculation = numericalExpressionCalculationProblem(row);
            expect(syntaxValues(syntax.expression)).toEqual([row.factor, row.first, row.second]);
            expect(calculatedValues(calculation.expression)).toEqual(oracleValues(row, 'calculation'));
            expect(syntax.multiplicativeComparison?.factor).toBe(row.factor);
            expect(calculation.multiplicativeComparison?.reference.value)
                .toBe(oracleValues(row, 'calculation')[3]);
            expect(syntax.expression.kind).toBe('operation');
            if (syntax.expression.kind !== 'operation') throw new Error('Expected a product.');
            expect(syntax.expression.right.kind === 'group').toBe(row.structure === 'grouped');
            if (row.structure === 'grouped') {
                const withoutGrouping = row.operation === 'addition' ? row.factor * row.first + row.second
                    : row.factor * row.first - row.second;
                expect(calculation.expression.value).not.toBe(withoutGrouping);
            }
        }
    });
});
