import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {DecimalMultiplicationProblem} from '../../../types/problems.ts';
import {assertDecimalMultiplication} from './decimal-multiplication-method-helpers.ts';

const small: DecimalMultiplicationProblem = {
    kind: 'decimal-multiplication-model', base: 10, operandScale: 100, productScale: 10000,
    first: {
        valueInHundredths: 12, canonicalNumeral: '0.12', alignedDigits: [0, 1, 2],
        partitions: [
            {place: 'tenths', digit: 1, valueInHundredths: 10, startInHundredths: 0},
            {place: 'hundredths', digit: 2, valueInHundredths: 2, startInHundredths: 10}
        ]
    },
    second: {
        valueInHundredths: 3, canonicalNumeral: '0.03', alignedDigits: [0, 0, 3],
        partitions: [{place: 'hundredths', digit: 3, valueInHundredths: 3, startInHundredths: 0}]
    },
    product: {valueInTenThousandths: 36, canonicalNumeral: '0.0036'},
    areaGrid: {
        widthInHundredths: 12, heightInHundredths: 3,
        cellAreaInTenThousandths: 1, cellCount: 36,
        regions: [
            {firstPartitionIndex: 0, secondPartitionIndex: 0, columnStart: 0, rowStart: 0, columns: 10, rows: 3, cellCount: 30, productInTenThousandths: 30},
            {firstPartitionIndex: 1, secondPartitionIndex: 0, columnStart: 10, rowStart: 0, columns: 2, rows: 3, cellCount: 6, productInTenThousandths: 6}
        ]
    }
};

const multiRegion: DecimalMultiplicationProblem = {
    kind: 'decimal-multiplication-model', base: 10, operandScale: 100, productScale: 10000,
    first: {
        valueInHundredths: 112, canonicalNumeral: '1.12', alignedDigits: [1, 1, 2],
        partitions: [
            {place: 'ones', digit: 1, valueInHundredths: 100, startInHundredths: 0},
            {place: 'tenths', digit: 1, valueInHundredths: 10, startInHundredths: 100},
            {place: 'hundredths', digit: 2, valueInHundredths: 2, startInHundredths: 110}
        ]
    },
    second: {
        valueInHundredths: 12, canonicalNumeral: '0.12', alignedDigits: [0, 1, 2],
        partitions: [
            {place: 'tenths', digit: 1, valueInHundredths: 10, startInHundredths: 0},
            {place: 'hundredths', digit: 2, valueInHundredths: 2, startInHundredths: 10}
        ]
    },
    product: {valueInTenThousandths: 1344, canonicalNumeral: '0.1344'},
    areaGrid: {
        widthInHundredths: 112, heightInHundredths: 12,
        cellAreaInTenThousandths: 1, cellCount: 1344,
        regions: [
            {firstPartitionIndex: 0, secondPartitionIndex: 0, columnStart: 0, rowStart: 0, columns: 100, rows: 10, cellCount: 1000, productInTenThousandths: 1000},
            {firstPartitionIndex: 0, secondPartitionIndex: 1, columnStart: 0, rowStart: 10, columns: 100, rows: 2, cellCount: 200, productInTenThousandths: 200},
            {firstPartitionIndex: 1, secondPartitionIndex: 0, columnStart: 100, rowStart: 0, columns: 10, rows: 10, cellCount: 100, productInTenThousandths: 100},
            {firstPartitionIndex: 1, secondPartitionIndex: 1, columnStart: 100, rowStart: 10, columns: 10, rows: 2, cellCount: 20, productInTenThousandths: 20},
            {firstPartitionIndex: 2, secondPartitionIndex: 0, columnStart: 110, rowStart: 0, columns: 2, rows: 10, cellCount: 20, productInTenThousandths: 20},
            {firstPartitionIndex: 2, secondPartitionIndex: 1, columnStart: 110, rowStart: 10, columns: 2, rows: 2, cellCount: 4, productInTenThousandths: 4}
        ]
    }
};

const maxGrid: DecimalMultiplicationProblem = {
    ...multiRegion,
    first: {
        valueInHundredths: 120, canonicalNumeral: '1.2', alignedDigits: [1, 2, 0],
        partitions: [
            {place: 'ones', digit: 1, valueInHundredths: 100, startInHundredths: 0},
            {place: 'tenths', digit: 2, valueInHundredths: 20, startInHundredths: 100}
        ]
    },
    product: {valueInTenThousandths: 1440, canonicalNumeral: '0.144'},
    areaGrid: {
        widthInHundredths: 120, heightInHundredths: 12,
        cellAreaInTenThousandths: 1, cellCount: 1440,
        regions: [
            {firstPartitionIndex: 0, secondPartitionIndex: 0, columnStart: 0, rowStart: 0, columns: 100, rows: 10, cellCount: 1000, productInTenThousandths: 1000},
            {firstPartitionIndex: 0, secondPartitionIndex: 1, columnStart: 0, rowStart: 10, columns: 100, rows: 2, cellCount: 200, productInTenThousandths: 200},
            {firstPartitionIndex: 1, secondPartitionIndex: 0, columnStart: 100, rowStart: 0, columns: 20, rows: 10, cellCount: 200, productInTenThousandths: 200},
            {firstPartitionIndex: 1, secondPartitionIndex: 1, columnStart: 100, rowStart: 10, columns: 20, rows: 2, cellCount: 40, productInTenThousandths: 40}
        ]
    }
};

let Core: typeof import('./operations-decimal-multiplication-method/view.tsx').OperationsDecimalMultiplicationMethodCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    Core = (await import('./operations-decimal-multiplication-method/view.tsx')).OperationsDecimalMultiplicationMethodCore;
});
afterAll(() => vi.unstubAllGlobals());

function render(data: DecimalMultiplicationProblem, isSolutionView: boolean): string {
    const payload: ViewRenderPayload<'operations-decimal-multiplication-method'> = {
        problem: {type: 'arithmetic', data, labels: []},
        viewId: 'operations-decimal-multiplication-method', targetLabels: [], isSolutionView, seed: 4
    };
    return renderToStaticMarkup(<Core payload={payload} />);
}

function visible(markup: string): string {
    return markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

describe('decimal multiplication method view', () => {
    it('renders a real 12-by-3 grid while withholding every numeric product in Question Mode', () => {
        expect(() => assertDecimalMultiplication('test', small)).not.toThrow();
        const question = render(small, false);
        const text = visible(question);
        expect(question).toContain('12 hundredth columns by 3 hundredth rows');
        expect(question).toContain('data-region="1"');
        expect(question).toContain('data-region="2"');
        expect(text).toContain('0.12 × 0.03');
        expect(text).not.toContain('0.0036');
        expect(text).not.toContain('30 cells');
        expect(text).not.toContain('1/10,000');
    });

    it('shows exact ten-thousandth partial products and their sum in Solution Mode', () => {
        const solution = visible(render(small, true));
        expect(solution).toContain('30 cells = 0.0030');
        expect(solution).toContain('6 cells = 0.0006');
        expect(solution).toContain('0.0030 + 0.0006 = 0.0036');
        expect(solution).toContain('one small cell represents 1/100 × 1/100 = 1/10,000');
    });

    it('renders six disjoint regions in the 112-by-12 grid', () => {
        expect(() => assertDecimalMultiplication('test', multiRegion)).not.toThrow();
        const solution = render(multiRegion, true);
        expect((solution.match(/data-region="/g) ?? []).length).toBe(6);
        expect(solution).toContain('width="728" height="138"');
        expect(visible(solution)).toContain('1.12 × 0.12');
        expect(visible(solution)).toContain('0.1344');
    });

    it('keeps the declared 120-by-12 grid inside the card and prompts row-by-column reasoning', () => {
        expect(() => assertDecimalMultiplication('test', maxGrid)).not.toThrow();
        const question = render(maxGrid, false);
        const svg = question.match(/<svg[^>]*width="(\d+)" height="(\d+)"/);
        expect(svg).not.toBeNull();
        expect(Number(svg![1])).toBe(776);
        expect(Number(svg![1])).toBeLessThan(848);
        expect(Number(svg![2])).toBe(138);
        expect((question.match(/data-region="/g) ?? []).length).toBe(4);
        expect(visible(question)).toContain('Use the rows and columns in each place-value region');
        expect(visible(question)).not.toContain('0.144');
    });

    it('rejects a region shifted outside its exact place partition', () => {
        expect(() => assertDecimalMultiplication('test', {
            ...small,
            areaGrid: {
                ...small.areaGrid,
                regions: [small.areaGrid.regions[0], {...small.areaGrid.regions[1], columnStart: 9}]
            }
        })).toThrow('without gaps or overlaps');
        expect(() => assertDecimalMultiplication('test', {
            ...maxGrid,
            first: {
                valueInHundredths: 121, canonicalNumeral: '1.21', alignedDigits: [1, 2, 1],
                partitions: [...maxGrid.first.partitions,
                    {place: 'hundredths', digit: 1, valueInHundredths: 1, startInHundredths: 120}]
            },
            product: {valueInTenThousandths: 1452, canonicalNumeral: '0.1452'},
            areaGrid: {
                ...maxGrid.areaGrid,
                widthInHundredths: 121, cellCount: 1452,
                regions: [...maxGrid.areaGrid.regions,
                    {firstPartitionIndex: 2, secondPartitionIndex: 0, columnStart: 120, rowStart: 0, columns: 1, rows: 10, cellCount: 10, productInTenThousandths: 10},
                    {firstPartitionIndex: 2, secondPartitionIndex: 1, columnStart: 120, rowStart: 10, columns: 1, rows: 2, cellCount: 2, productInTenThousandths: 2}]
            }
        })).toThrow('bounded hundredth-by-hundredth grid');
    });
});
