import {renderToStaticMarkup} from 'react-dom/server';
import {Scope} from 'edugraph-ts';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {MeasurementDataGenerator} from '../../../generators/statistics/measurement-data/generator.ts';
import {MeasurementDataGeneratorSchema, spec as generatorSpec} from '../../../generators/statistics/measurement-data/spec.ts';
import {MeasurementExtremaGenerator} from '../../../generators/statistics/measurement-extrema/generator.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {MeasurementDataProblem} from '../../../types/problems.ts';
import {MeasurementLinePlotView} from './measurement-line-plot-view.tsx';
import {MeasurementDataTableViewSchema, spec as tableSpec} from './measurement-data-table/spec.ts';

let MeasurementDataTable: typeof import('./measurement-data-table/view.tsx')['MeasurementDataTable'];
let MeasurementDataTableCore: typeof import('./measurement-data-table/view.tsx')['MeasurementDataTableCore'];

beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({MeasurementDataTable, MeasurementDataTableCore} = await import('./measurement-data-table/view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

describe('measurement precision across views', () => {
    it.each(['cm', 'in'] as const)('shows an exact half-unit ruler and plot in %s', unit => {
        const objects = ['pencil', 'crayon', 'ribbon', 'key', 'brush', 'block'] as const;
        const lengths = [2, 2.5, 3.5, 3.5, 5, 8];
        const data: MeasurementDataProblem = {
            unit,
            subdivisions: 2,
            observations: objects.map((object, index) => ({object, value: lengths[index]!}))
        };
        const payload: ViewRenderPayload<'measurement-data-table'> = {
            problem: {type: 'statistics', data, labels: []},
            targetLabels: [], viewId: 'measurement-data-table', seed: 42, isSolutionView: false
        };
        const tableQuestion = renderToStaticMarkup(<MeasurementDataTableCore config={{}} payload={payload} />);
        const tableSolution = renderToStaticMarkup(<MeasurementDataTableCore config={{}} payload={{...payload, isSolutionView: true}} />);
        expect(tableQuestion).toContain(`nearest half ${unit === 'cm' ? 'centimeter' : 'inch'}`);
        expect(tableQuestion).toContain(`? ${unit}`);
        expect(tableSolution).toContain(`2½ ${unit}`);
        const plotQuestion = renderToStaticMarkup(<MeasurementLinePlotView mode="construction" payload={payload} viewId="fixture" />);
        const plotSolution = renderToStaticMarkup(<MeasurementLinePlotView mode="construction" payload={{...payload, isSolutionView: true}} viewId="fixture" />);
        expect(plotQuestion).toContain('Empty line plot with 13 ticks');
        expect(plotQuestion).toContain(`Each tick mark represents ½ ${unit === 'cm' ? 'centimeter' : 'inch'}.`);
        expect(plotQuestion).toContain('3½');
        expect(plotQuestion.match(/>×</g)).toBeNull();
        expect(plotSolution).toContain('Completed line plot with 13 ticks');
        expect(plotSolution.match(/>×</g)).toHaveLength(6);
    });

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
