import {Ability, Area, Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {MeasurementMassEstimationGenerator} from '../../../../generators/measurement/measurement-mass-estimation/generator.ts';
import {MeasurementMassEstimationGeneratorSchema, spec as generatorSpec} from '../../../../generators/measurement/measurement-mass-estimation/spec.ts';
import {planModelCompatibility} from '../../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../../lib/planned-generation.ts';
import type {MassEstimateProblem} from '../../../../types/problems.ts';
import {referenceGroups} from './illustrations.tsx';
import {MeasureMassEstimateViewSchema, spec as viewSpec} from './spec.ts';

let MeasureMassEstimate: typeof import('./view.tsx')['MeasureMassEstimate'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({MeasureMassEstimate} = await import('./view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

const profiles = [
    {object: 'crayon', name: 'Crayon', unit: 'g', count: 10, groups: Array(10).fill(1)},
    {object: 'apple', name: 'Apple', unit: 'g', count: 200, groups: [100, 100]},
    {object: 'book', name: 'Book', unit: 'g', count: 500, groups: [100, 100, 100, 100, 100]},
    {object: 'backpack', name: 'Backpack', unit: 'kg', count: 3, groups: [1, 1, 1]},
    {object: 'chair', name: 'Chair', unit: 'kg', count: 5, groups: [1, 1, 1, 1, 1]},
    {object: 'bicycle', name: 'Bicycle', unit: 'kg', count: 12, groups: Array(12).fill(1)}
] as const;

function prepare(unit: MassEstimateProblem['unit'], seed = 0) {
    const target = {id: 'mass-estimation-fixture', labels: [
        Area.Estimation, Area.MeasuringWeight, Ability.ProcedureExecution,
        unit === 'g' ? Scope.GramScale : Scope.KilogramScale
    ]};
    const planned = planModelCompatibility(target,
        {...generatorSpec, spec: generatorSpec, schema: MeasurementMassEstimationGeneratorSchema},
        {...viewSpec, spec: viewSpec, schema: MeasureMassEstimateViewSchema});
    if (!planned.supported) throw new Error(`Fixture was rejected: ${planned.reason}`);
    const draw = generatePlannedDraw({
        generator: new MeasurementMassEstimationGenerator(), viewSchema: MeasureMassEstimateViewSchema,
        plan: planned.plan, sampleKey: `${target.id}#${generatorSpec.generatorId}#${viewSpec.viewId}#train#question#inst:0`,
        attempt: 1, seed
    });
    if (!draw.stub) throw new Error('Fixture did not generate.');
    return {
        problem: {type: 'measurement' as const, data: draw.stub.data as MassEstimateProblem, labels: draw.stub.labels},
        targetLabels: target.labels, viewId: viewSpec.viewId, seed, isSolutionView: false,
        preparedView: draw.view
    };
}

describe('mass estimation evidence', () => {
    it.each(profiles)('depicts $object and the exact reference collection without printing the question answer', profile => {
        const payload = prepare(profile.unit);
        payload.problem.data = {
            measurementKind: 'mass', object: profile.object, unit: profile.unit,
            estimate: profile.count, referenceCount: profile.count, referenceValue: 1,
            referenceObject: profile.unit === 'g' ? 'paperclip' : 'one-kilogram-bag'
        };
        const question = renderToStaticMarkup(<MeasureMassEstimate payload={payload} />);
        const solution = renderToStaticMarkup(<MeasureMassEstimate payload={{...payload, isSolutionView: true}} />);
        const targetGraphic = question.match(new RegExp(`<svg[^>]*aria-label="${profile.name}"[^>]*>(.*?)</svg>`))?.[1];
        expect(targetGraphic).toMatch(/<(path|rect|circle)\b/);
        expect(question).toContain('About the same mass');
        expect(question).toContain('aria-label="approximately equal mass"');
        expect(question).toContain(profile.unit === 'g' ? 'Each paperclip: 1 g' : 'Each bag: 1 kg');

        const picturedGroups = [...question.matchAll(/data-reference-count="(\d+)"/g)].map(match => Number(match[1]));
        expect(picturedGroups).toEqual(profile.groups);
        expect(picturedGroups.reduce((total, count) => total + count, 0)).toBe(payload.problem.data.referenceCount);
        expect(referenceGroups(profile.count, profile.unit)).toEqual(picturedGroups);
        if (profile.unit === 'g' && profile.count >= 100) {
            expect(question.match(/>100 paperclips<\/text>/g)).toHaveLength(profile.count / 100);
        } else if (profile.unit === 'kg') {
            expect(question.match(/>1 kg<\/text>/g)).toHaveLength(profile.count);
        }

        expect(question).toContain(`A good estimate is ____ ${profile.unit}.`);
        expect(question).not.toContain(`A good estimate is ${profile.count} ${profile.unit}.`);
        expect(question).not.toContain(`about ${profile.count}`);
        expect(question).not.toContain(`1 ${profile.unit} × ${profile.count}`);
        expect(solution).toContain(`about ${profile.count}`);
        expect(solution).toContain(`1 ${profile.unit} × ${profile.count} ≈ ${profile.count} ${profile.unit}`);
        expect(solution).toContain(`A good estimate is ${profile.count} ${profile.unit}.`);
        expect(renderToStaticMarkup(<MeasureMassEstimate payload={payload} />)).toBe(question);
    });

    it('repairs the failed backpack draw with a target picture and three kilogram references', () => {
        const payload = prepare('kg', 1854837199);
        expect(payload.problem.data).toMatchObject({object: 'backpack', referenceCount: 3, estimate: 3, unit: 'kg'});
        const markup = renderToStaticMarkup(<MeasureMassEstimate payload={payload} />);
        expect(markup).toContain('role="img" aria-label="Backpack"');
        expect(markup.match(/data-reference-count="1"/g)).toHaveLength(3);
        expect(markup).toContain('About how many kg is the backpack?');
        expect(markup).not.toContain('A good estimate is 3 kg.');
    });

    it.each([
        {referenceCount: 4},
        {estimate: 4},
        {referenceValue: 2},
        {referenceObject: 'paperclip'},
        {unit: 'g'},
        {object: 'unknown'}
    ])('rejects inconsistent canonical comparison data %j', overrides => {
        const payload = prepare('kg', 1854837199);
        payload.problem.data = {...payload.problem.data, ...overrides} as MassEstimateProblem;
        expect(() => renderToStaticMarkup(<MeasureMassEstimate payload={payload} />)).toThrow('Unsupported mass estimate');
    });
});
