import {renderToStaticMarkup} from 'react-dom/server';
import {Scope} from 'edugraph-ts';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {MeasurementDataGenerator} from '../../../generators/statistics/measurement-data/generator.ts';
import {MeasurementDataGeneratorSchema, spec as generatorSpec} from '../../../generators/statistics/measurement-data/spec.ts';
import {MeasurementExtremaGenerator} from '../../../generators/statistics/measurement-extrema/generator.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementLinePlotView} from './measurement-line-plot-view.tsx';
import {MeasurementDataTableViewSchema, spec as tableSpec} from './measurement-data-table/spec.ts';

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
        const target = {id: 'measurement-precision-fixture', labels: [
            numberKind === 'integer' ? Scope.IntegerNumbers : Scope.FractionNumbers,
            unitScale === 'cm' ? Scope.CentimeterScale : Scope.InchScale,
            ...(useSingleFrame ? [Scope.SingleFrameOfReference] : [])
        ]};
        const planned = planModelCompatibility(target,
            {...generatorSpec, schema: MeasurementDataGeneratorSchema, spec: generatorSpec},
            {...tableSpec, schema: MeasurementDataTableViewSchema, spec: tableSpec});
        if (!planned.supported) throw new Error(`Measurement fixture is unsupported: ${planned.reason}`);
        const prepared = resolvePlannedConfigurations({
            generatorSchema: MeasurementDataGeneratorSchema, viewSchema: MeasurementDataTableViewSchema,
            plan: planned.plan, sampleKey: `${target.id}#measurement-data#measurement-data-table#train#question#inst:0`,
            attempt: 1, seed: 42
        });
        expect(prepared.generatorConfig).toEqual({numberKind, useSingleFrame, unitScale});
        setSeed('precision');
        const {data} = new MeasurementDataGenerator().generate({numberKind, useSingleFrame, unitScale});
        for (const isSolutionView of [false, true]) {
            const payload = {
                problem: {type: 'statistics' as const, data, labels: prepared.generatorLabels},
                targetLabels: target.labels, viewId: 'measurement-data-table' as const, seed: 42, isSolutionView,
                preparedView: prepared.view
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
