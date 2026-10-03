import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {VolumeUnitCubesGenerator} from '../../../generators/measurement/volume-unit-cubes/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {UnitCubeVolumeProblem} from '../../../types/problems.ts';

let SpecificationCore: typeof import('./volume-unit-cube-specification/view.tsx').VolumeUnitCubeSpecificationCore;
let InterpretationCore: typeof import('./volume-packing-interpretation/view.tsx').VolumePackingInterpretationCore;
let CountCore: typeof import('./volume-unit-cube-count/view.tsx').VolumeUnitCubeCountCore;

beforeAll(async () => {
    vi.stubGlobal('window', {});
    SpecificationCore = (await import('./volume-unit-cube-specification/view.tsx')).VolumeUnitCubeSpecificationCore;
    InterpretationCore = (await import('./volume-packing-interpretation/view.tsx')).VolumePackingInterpretationCore;
    CountCore = (await import('./volume-unit-cube-count/view.tsx')).VolumeUnitCubeCountCore;
});
afterAll(() => vi.unstubAllGlobals());

const fixture = (
    unitId: UnitCubeVolumeProblem['unitId'], seed = 27,
    countingModel: 'unindexed' | 'enumerated' = 'unindexed'
): UnitCubeVolumeProblem => {
    setSeed(seed);
    return new VolumeUnitCubesGenerator().generate({unitId, countingModel}).data;
};
const traced = (data: UnitCubeVolumeProblem): UnitCubeVolumeProblem => ({
    ...data,
    countingTrace: data.occupiedCells.map((cell, index) => ({cell, ordinal: index + 1}))
});
const withBounds = (
    data: UnitCubeVolumeProblem, bounds: UnitCubeVolumeProblem['bounds']
): UnitCubeVolumeProblem => {
    const cubeCount = bounds.columns * bounds.rows * bounds.layers;
    return {
        ...data, bounds, cubeCount, countingTrace: undefined,
        occupiedCells: Array.from({length: cubeCount}, (_, index) => ({
            column: index % bounds.columns,
            row: Math.floor(index / bounds.columns) % bounds.rows,
            layer: Math.floor(index / (bounds.columns * bounds.rows))
        }))
    };
};

const specification = (data: UnitCubeVolumeProblem, isSolutionView: boolean) => {
    const payload: ViewRenderPayload<'volume-unit-cube-specification'> = {
        problem: {type: 'measurement', data, labels: []},
        viewId: 'volume-unit-cube-specification', targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<SpecificationCore config={{}} payload={payload} />);
};
const interpretation = (data: UnitCubeVolumeProblem, isSolutionView: boolean) => {
    const payload: ViewRenderPayload<'volume-packing-interpretation'> = {
        problem: {type: 'measurement', data, labels: []},
        viewId: 'volume-packing-interpretation', targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<InterpretationCore config={{}} payload={payload} />);
};
const count = (data: UnitCubeVolumeProblem, isSolutionView: boolean) => {
    const payload: ViewRenderPayload<'volume-unit-cube-count'> = {
        problem: {type: 'measurement', data, labels: []},
        viewId: 'volume-unit-cube-count', targetLabels: [], isSolutionView, seed: 1
    };
    return renderToStaticMarkup(<CountCore config={{}} payload={payload} />);
};
const visible = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('unit cube specification and packing views', () => {
    it('specifies a genuine 3D unit cube while keeping the volume unknown in Q', () => {
        const data = fixture('generic');
        expect(data.countingTrace).toBeUndefined();
        const question = visible(specification(data, false));
        const solution = visible(specification(data, true));
        expect(question).toContain('All the edges of this cube measure 1 u');
        expect(question).toContain('One square face: 1 u²');
        expect(question).not.toContain('1 u³');
        expect(solution).toContain('unit cube');
        expect(solution).toContain('1 u³');
        expect(specification(data, false)).toContain('viewBox="0 0 330 225"');
    });

    it('shows a bound-specific larger solid in both specification modes without exposing its volume', () => {
        const data = fixture('generic');
        const small = withBounds(data, {columns: 2, rows: 2, layers: 1});
        const large = withBounds(data, {columns: 4, rows: 3, layers: 2});
        for (const isSolutionView of [false, true]) {
            const smallMarkup = specification(small, isSolutionView);
            const largeMarkup = specification(large, isSolutionView);
            expect(smallMarkup).toContain('This larger solid is built from copies of the cube shown above.');
            expect(smallMarkup).toContain('h-[142px]');
            expect(smallMarkup.match(/<polygon/g)).toHaveLength(11);
            expect(largeMarkup.match(/<polygon/g)).toHaveLength(29);
            expect(smallMarkup).not.toBe(largeMarkup);
            expect(visible(smallMarkup)).not.toContain(`${small.cubeCount} u³`);
            expect(visible(largeMarkup)).not.toContain(`${large.cubeCount} u³`);
        }
    });

    it('explains the complete packing without revealing the explanation in Q', () => {
        const data = fixture('generic');
        const question = visible(interpretation(data, false));
        const solution = visible(interpretation(data, true));
        expect(question).toContain('Why does counting them give its volume?');
        expect(question).not.toContain(`${data.cubeCount} cubes ×`);
        expect(solution).toContain('without gaps or overlaps');
        expect(solution).toContain(`${data.cubeCount} cubes × 1 u³ per cube`);
        expect(solution).toContain(`${data.cubeCount} u³`);
        expect(interpretation(data, false).match(/data-unit-cell=/g)).toHaveLength(data.cubeCount);
    });

    it.each(['generic', 'cm', 'in', 'ft'] as const)('counts all visible cubes in %s, with Q total hidden', unitId => {
        const data = fixture(unitId, 27, 'enumerated');
        expect(data.countingTrace).toHaveLength(data.cubeCount);
        const unit = unitId === 'generic' ? 'u³' : `${unitId}³`;
        const questionMarkup = count(data, false);
        const solutionMarkup = count(data, true);
        const question = visible(questionMarkup);
        const solution = visible(solutionMarkup);
        expect(questionMarkup.match(/data-unit-cell=/g)).toHaveLength(data.cubeCount);
        expect(solutionMarkup.match(/data-unit-cell=/g)).toHaveLength(data.cubeCount);
        expect(questionMarkup).not.toContain('data-cube-ordinal=');
        expect(solutionMarkup.match(/data-cube-ordinal=/g)).toHaveLength(data.cubeCount);
        expect(question).toContain(`Volume in ${unit}:`);
        expect(question).not.toContain(`${data.cubeCount} ${unit}`);
        expect(solution).toContain(`${data.cubeCount} ${unit}`);
        for (let layer = 0; layer < data.bounds.layers; layer++) {
            expect(question).toContain(`Layer ${layer + 1}`);
            expect(question).not.toContain(`${data.bounds.columns * data.bounds.rows} cubes`);
            expect(solution).toContain(`${data.bounds.columns * data.bounds.rows} cubes`);
        }
    });

    it('accepts seeded producer data in every task and unit profile', () => {
        for (const unitId of ['generic', 'cm', 'in', 'ft'] as const) {
            for (let seed = 0; seed < 15; seed++) {
                const data = fixture(unitId, seed);
                for (const render of [specification, interpretation]) {
                    expect(() => render(data, false)).not.toThrow();
                    expect(() => render(data, true)).not.toThrow();
                }
                const enumerated = fixture(unitId, seed, 'enumerated');
                expect(() => count(enumerated, false)).not.toThrow();
                expect(() => count(enumerated, true)).not.toThrow();
                expect(() => count(data, false)).not.toThrow();
                expect(() => count(data, true)).not.toThrow();
            }
        }
    });

    it('rejects malformed occupancy before all three views render', () => {
        const data = fixture('cm');
        const invalid = {...data, occupiedCells: data.occupiedCells.slice(1)};
        for (const render of [specification, interpretation]) {
            expect(() => render(invalid, false)).toThrow('complete, ordered packing');
        }
        expect(() => count(traced(invalid), false)).toThrow('complete ordered packing');
        expect(() => count(data, false)).not.toThrow();
    });

    it('rejects an incorrect count ordinal before rendering', () => {
        const data = fixture('in', 27, 'enumerated');
        const countingTrace = data.countingTrace!;
        const invalid = {...data, countingTrace: [
            {...countingTrace[0]!, ordinal: 2}, ...countingTrace.slice(1)
        ]};
        expect(() => count(invalid, true)).toThrow('counting trace to be exact');
    });

    it('counts an unindexed packing without inventing ordinal badges', () => {
        const data = fixture('ft', 27, 'unindexed');
        const question = count(data, false);
        const solution = count(data, true);
        expect(question).not.toContain('data-cube-ordinal=');
        expect(solution).not.toContain('data-cube-ordinal=');
        expect(visible(solution)).toContain(`${data.cubeCount} ft³`);
    });
});
