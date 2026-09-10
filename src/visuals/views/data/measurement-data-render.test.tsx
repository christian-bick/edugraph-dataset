import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {MeasurementDataGenerator} from '../../../generators/statistics/measurement-data/generator.ts';
import {MeasurementExtremaGenerator} from '../../../generators/statistics/measurement-extrema/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementLinePlotView} from './measurement-line-plot-view.tsx';

let MeasurementDataTable: typeof import('./measurement-data-table/view.tsx')['MeasurementDataTable'];

beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({MeasurementDataTable} = await import('./measurement-data-table/view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

describe('measurement precision across views', () => {
    it.each([
        ['integer', false, 'cm', 'centimeter'],
        ['integer', false, 'in', 'inch'],
        ['fraction', false, 'cm', 'quarter centimeter'],
        ['fraction', false, 'in', 'quarter inch'],
        ['fraction', true, 'cm', 'eighth centimeter'],
        ['fraction', true, 'in', 'eighth inch']
    ] as const)('renders %s / single frame %s / %s coherently', (numberKind, useSingleFrame, unitScale, precision) => {
        setSeed('precision');
        const {data} = new MeasurementDataGenerator().generate({numberKind, useSingleFrame, unitScale});
        for (const isSolutionView of [false, true]) {
            const payload = {
                problem: {type: 'statistics' as const, data, labels: []},
                targetLabels: [], viewId: 'measurement-data-table' as const, seed: 42, isSolutionView
            };
            const table = renderToStaticMarkup(<MeasurementDataTable payload={payload} />);
            expect(table).toContain(isSolutionView ? 'Recorded measurements' : `nearest ${precision}.`);
            const plot = renderToStaticMarkup(<MeasurementLinePlotView
                mode="construction" payload={payload} viewId="fixture"
            />);
            expect(plot).toContain(isSolutionView ? 'Completed line plot' : 'Plot each recorded measurement');
        }
    });

    it('renders both extrema operations without requiring duplicate operand aliases', () => {
        for (const operation of ['addition', 'subtraction'] as const) {
            for (const unitScale of ['cm', 'in'] as const) {
                setSeed('extrema');
                const {data} = new MeasurementExtremaGenerator().generate({operation, unitScale});
                for (const isSolutionView of [false, true]) {
                    const payload = {
                        problem: {type: 'statistics' as const, data, labels: []},
                        targetLabels: [], viewId: 'measurement-line-plot-arithmetic', seed: 42, isSolutionView
                    };
                    const markup = renderToStaticMarkup(<MeasurementLinePlotView
                        mode="arithmetic" payload={payload} viewId="fixture"
                    />);
                    expect(markup).toContain(isSolutionView
                        ? operation === 'addition' ? 'Add them' : 'Subtract to get'
                        : operation === 'addition' ? 'shortest + longest = ?' : 'longest − shortest = ?');
                }
            }
        }
    });
});
