import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {VolumeRectangularPrismGenerator} from '../../../generators/measurement/volume-rectangular-prism/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {RectangularPrismVolumeProblem} from '../../../types/problems.ts';

type Profile = 'packing-equivalence' | 'triple-product' | 'associative-triple-product'
    | 'edge-formula' | 'base-area-formula';
const profiles: readonly Profile[] = [
    'packing-equivalence', 'triple-product', 'associative-triple-product',
    'edge-formula', 'base-area-formula'
];

let PackingCore: typeof import('./volume-packing-product-explanation/view.tsx').VolumePackingProductExplanationCore;
let ModelCore: typeof import('./volume-product-model/view.tsx').VolumeProductModelCore;
let ExecutionCore: typeof import('./volume-formula-execution/view.tsx').VolumeFormulaExecutionCore;
let StoryCore: typeof import('./volume-formula-story/view.tsx').VolumeFormulaStoryCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    PackingCore = (await import('./volume-packing-product-explanation/view.tsx')).VolumePackingProductExplanationCore;
    ModelCore = (await import('./volume-product-model/view.tsx')).VolumeProductModelCore;
    ExecutionCore = (await import('./volume-formula-execution/view.tsx')).VolumeFormulaExecutionCore;
    StoryCore = (await import('./volume-formula-story/view.tsx')).VolumeFormulaStoryCore;
});
afterAll(() => vi.unstubAllGlobals());

const fixture = (relationProfile: Profile, seed = 27): RectangularPrismVolumeProblem => {
    setSeed(`${relationProfile}-${seed}`);
    return new VolumeRectangularPrismGenerator().generate({relationProfile}).data;
};
const visible = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

const packing = (data: RectangularPrismVolumeProblem, isSolutionView: boolean): string => {
    const payload: ViewRenderPayload<'volume-packing-product-explanation'> = {
        problem: {type: 'measurement', data, labels: []}, viewId: 'volume-packing-product-explanation',
        targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<PackingCore config={{}} payload={payload} />);
};
const model = (data: RectangularPrismVolumeProblem, isSolutionView: boolean): string => {
    const payload: ViewRenderPayload<'volume-product-model'> = {
        problem: {type: 'measurement', data, labels: []}, viewId: 'volume-product-model',
        targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<ModelCore config={{}} payload={payload} />);
};
const execution = (data: RectangularPrismVolumeProblem, isSolutionView: boolean): string => {
    const payload: ViewRenderPayload<'volume-formula-execution'> = {
        problem: {type: 'measurement', data, labels: []}, viewId: 'volume-formula-execution',
        targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<ExecutionCore config={{}} payload={payload} />);
};
const story = (data: RectangularPrismVolumeProblem, isSolutionView: boolean): string => {
    const payload: ViewRenderPayload<'volume-formula-story'> = {
        problem: {type: 'measurement', data, labels: []}, viewId: 'volume-formula-story',
        targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<StoryCore config={{}} payload={payload} />);
};

describe('rectangular-prism task projections', () => {
    it('explains counted layers and both volume products while Q leaves equations blank', () => {
        const data = fixture('packing-equivalence');
        const q = visible(packing(data, false));
        const s = visible(packing(data, true));
        const {length, width, height} = data.dimensions;
        expect(packing(data, false).match(/data-prism-cell=/g)).toHaveLength(data.cubeCount);
        expect(q).toContain('Write both equations.');
        expect(q).not.toContain(`V = (${length} × ${width}) × ${height}`);
        expect(s).toContain('without gaps or overlaps');
        expect(s).toContain(`V = (${length} × ${width}) × ${height}`);
        expect(s).toContain(`${data.baseAreaSquareUnits} × ${height} = ${data.cubeCount} u³`);
        expect(s).toContain(`${data.cubeCount} cubes × 1 u³ per cube`);
    });

    it.each(['triple-product', 'associative-triple-product'] as const)(
        'constructs a %s model in S from empty Q cube slots', relationProfile => {
            const data = fixture(relationProfile);
            const multiplier = data.associativeRegrouping ? 2 : 1;
            const q = model(data, false);
            const s = model(data, true);
            expect(q.match(/data-empty-slot=/g)).toHaveLength(data.cubeCount * multiplier);
            expect(q).not.toContain('data-prism-cell=');
            expect(s.match(/data-prism-cell=/g)).toHaveLength(data.cubeCount * multiplier);
            expect(visible(q)).not.toContain(`= ${data.volumeCubicUnits}`);
            expect(visible(s)).toContain(`= ${data.volumeCubicUnits}`);
            if (data.associativeRegrouping) {
                const {length, width, height} = data.dimensions;
                expect(visible(s)).toContain(`${length} × (${width} × ${height})`);
                expect(s).toContain('Column slices');
            }
        }
    );

    it.each(['edge-formula', 'base-area-formula'] as const)(
        'executes the %s volume formula with exact units', relationProfile => {
            const data = fixture(relationProfile);
            const q = visible(execution(data, false));
            const s = visible(execution(data, true));
            expect(q).not.toContain('V =');
            expect(s).toContain(data.measuredInput.kind === 'three-edges'
                ? 'V = length × width × height' : 'V = base area × height');
            expect(s).toContain(`V = ${data.volumeCubicUnits} u³`);
        }
    );

    it.each(['edge-formula', 'base-area-formula'] as const)(
        'requires story reading for %s without a labeled diagram in Q', relationProfile => {
            const data = fixture(relationProfile);
            const q = story(data, false);
            const s = visible(story(data, true));
            expect(visible(q)).toContain('storage crate');
            expect(visible(q)).toContain('How many cubic units');
            expect(q).toContain('Empty rectangular prism outline');
            expect(q).not.toContain('Base area ');
            expect(visible(q)).not.toContain('V =');
            expect(s).toContain(`The crate holds ${data.volumeCubicUnits} u³`);
        }
    );

    it('accepts every producer profile in all four leaf views and both modes', () => {
        for (const relationProfile of profiles) {
            for (let seed = 0; seed < 8; seed++) {
                const data = fixture(relationProfile, seed);
                for (const render of [packing, model, execution, story]) {
                    expect(() => render(data, false)).not.toThrow();
                    expect(() => render(data, true)).not.toThrow();
                }
            }
        }
    });

    it('rejects invalid canonical data before rendering any view', () => {
        const data = fixture('associative-triple-product');
        const bad = {...data, heightLayers: data.heightLayers.slice(1)};
        for (const render of [packing, model, execution, story]) {
            expect(() => render(bad, false)).toThrow('Expected exact prism dimensions');
        }
    });
});
