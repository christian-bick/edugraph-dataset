import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {VolumeCompositePrismsGenerator} from '../../../generators/measurement/volume-composite-prisms/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {CompositePrismVolumeProblem} from '../../../types/problems.ts';

let AdditivityCore: typeof import('./volume-additivity-explanation/view.tsx').VolumeAdditivityExplanationCore;
let ExecutionCore: typeof import('./volume-composite-execution/view.tsx').VolumeCompositeExecutionCore;
let StoryCore: typeof import('./volume-composite-story/view.tsx').VolumeCompositeStoryCore;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    AdditivityCore = (await import('./volume-additivity-explanation/view.tsx')).VolumeAdditivityExplanationCore;
    ExecutionCore = (await import('./volume-composite-execution/view.tsx')).VolumeCompositeExecutionCore;
    StoryCore = (await import('./volume-composite-story/view.tsx')).VolumeCompositeStoryCore;
});
afterAll(() => vi.unstubAllGlobals());

const fixture = (
    calculationModel: 'partition-additivity' | 'component-products-plus-sum', seed = 27
): CompositePrismVolumeProblem => {
    setSeed(`${calculationModel}-${seed}`);
    return new VolumeCompositePrismsGenerator().generate({calculationModel}).data;
};
const visible = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

const additivity = (data: CompositePrismVolumeProblem, isSolutionView: boolean): string => {
    const payload: ViewRenderPayload<'volume-additivity-explanation'> = {
        problem: {type: 'measurement', data, labels: []}, viewId: 'volume-additivity-explanation',
        targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<AdditivityCore config={{}} payload={payload} />);
};
const execution = (data: CompositePrismVolumeProblem, isSolutionView: boolean): string => {
    const payload: ViewRenderPayload<'volume-composite-execution'> = {
        problem: {type: 'measurement', data, labels: []}, viewId: 'volume-composite-execution',
        targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<ExecutionCore config={{}} payload={payload} />);
};
const story = (data: CompositePrismVolumeProblem, isSolutionView: boolean): string => {
    const payload: ViewRenderPayload<'volume-composite-story'> = {
        problem: {type: 'measurement', data, labels: []}, viewId: 'volume-composite-story',
        targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<StoryCore config={{}} payload={payload} />);
};

describe('two-part composite prism views', () => {
    it('asks for the causal volume-addition explanation, then shows the zero-volume shared face', () => {
        const data = fixture('partition-additivity');
        const q = additivity(data, false);
        const s = visible(additivity(data, true));
        expect(q).toContain('data-shared-seam="true"');
        expect(visible(q)).toContain('Explain why adding their volumes');
        expect(visible(q)).not.toContain('interiors do not overlap');
        expect(visible(q)).not.toContain(`${data.volumeSum.totalCubicUnits} u³`);
        expect(s).toContain('interiors do not overlap');
        expect(s).toContain('shared face has area');
        expect(s).toContain('zero volume');
        expect(s).toContain(`${data.volumeSum.totalCubicUnits} u³`);
    });

    it('shows each part product before adding in execution S, but not Q', () => {
        const data = fixture('component-products-plus-sum');
        const q = visible(execution(data, false));
        const s = visible(execution(data, true));
        const [left, right] = data.parts;
        expect(q).toContain(`${left.dimensions.length} u long`);
        expect(q).toContain(`${right.dimensions.length} u long`);
        expect(q).not.toContain(`= ${data.volumeSum.totalCubicUnits} u³`);
        const a = `${left.dimensions.length} × ${left.dimensions.depth} × ${left.dimensions.height} = ${left.volumeCubicUnits} u³`;
        const b = `${right.dimensions.length} × ${right.dimensions.depth} × ${right.dimensions.height} = ${right.volumeCubicUnits} u³`;
        expect(s).toContain(a);
        expect(s).toContain(b);
        expect(s.indexOf(a)).toBeLessThan(s.indexOf(b));
        expect(s).toContain(`${left.volumeCubicUnits} + ${right.volumeCubicUnits} = ${data.volumeSum.totalCubicUnits} u³`);
    });

    it('keeps story measurements in prose and the diagram unlabeled', () => {
        const data = fixture('component-products-plus-sum');
        const q = story(data, false);
        const [left, right] = data.parts;
        expect(visible(q)).toContain(`The blue left part A is ${left.dimensions.length} u long`);
        expect(visible(q)).toContain(`The gold right part B is ${right.dimensions.length} u long`);
        expect(q).not.toContain('Part A</div>');
        expect(q).toContain('data-shared-seam="true"');
        const svg = q.match(/<svg[\s\S]*?<\/svg>/)?.[0];
        expect(svg).toBeDefined();
        expect(svg).not.toMatch(/<text[^>]*>\d/);
        expect(visible(q)).not.toContain('V whole');
        expect(visible(story(data, true))).toContain(`${data.volumeSum.totalCubicUnits} u³`);
    });

    it('accepts both producer profiles in all three views and modes', () => {
        for (const calculationModel of ['partition-additivity', 'component-products-plus-sum'] as const) {
            for (let seed = 0; seed < 15; seed++) {
                const data = fixture(calculationModel, seed);
                for (const render of [additivity, execution, story]) {
                    expect(() => render(data, false)).not.toThrow();
                    expect(() => render(data, true)).not.toThrow();
                }
            }
        }
    });

    it('rejects a false total before any view renders', () => {
        const data = fixture('component-products-plus-sum');
        const bad = {...data, volumeSum: {...data.volumeSum, totalCubicUnits: -1}};
        for (const render of [additivity, execution, story]) {
            expect(() => render(bad, false)).toThrow('Expected two exact joined prisms');
        }
    });
});
