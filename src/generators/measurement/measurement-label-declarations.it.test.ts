import {beforeAll, describe, expect, it} from 'vitest';
import {fileURLToPath} from 'node:url';
import {Area, Scope} from 'edugraph-ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';
import {matchTarget} from '../../lib/matching.ts';
import {computeSampleKey, computeSampleSeed} from '../../lib/generation.ts';
import {generatePlannedDraw} from '../../lib/planned-generation.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {assessLabelDependencyCoverage} from '../../lib/label-dependency-coverage.ts';
import type {MeasurementConversionStoryProblem, MeasurementNumberLineProblem} from '../../types/problems.ts';
import {spec as grade4Targets} from '../../spec/ccss/grade-04.ts';
import {spec as grade2Targets} from '../../spec/ccss/grade-02.ts';
import {spec as grade5Targets} from '../../spec/ccss/grade-05.ts';
import {spec as grade6Targets} from '../../spec/ccss/grade-06.ts';
import {MeasurementNumberLineGenerator} from './measurement-number-line/generator.ts';
import {MeasurementConversionProblemsGenerator} from './measurement-conversion-problems/generator.ts';
import {formatMeasurementNumberLineValue, isValidMeasurementNumberLineProblem} from '../../visuals/views/measurement/measurement-number-line/helpers.ts';
import {buildMeasurementConversionStoryPresentation, isValidMeasurementConversionStory} from '../../visuals/views/measurement/measure-conversion-problems/helpers.ts';

const lineTargets = grade4Targets.filter(target => target.id.startsWith('4.MD.A.2-measurement-number-lines~'));
const storyTargets = grade5Targets.filter(target => target.id.startsWith('5.MD.A.1-multistep-conversion-problems~'));
const rationalLineTargets = grade6Targets.filter(target => target.id.startsWith('6.NS.C.6c-rational-numberline-positioning~')
    && target.labels.includes(Scope.NumbersWithoutNegatives)
    && (target.labels.includes(Scope.FractionNumbers) || target.labels.includes(Scope.DecimalNumbers)));
const formats = [Scope.ArabicNumerals, Scope.Base10];
const sign = Scope.NumbersWithoutNegatives;
let generators: Awaited<ReturnType<typeof loadGeneratorModelCatalog>>;
let views: Awaited<ReturnType<typeof loadViewModelCatalog>>;

beforeAll(async () => {
    const generatorIds = ['measurement-number-line', 'measurement-conversion-problems'];
    const viewIds = ['measurement-number-line', 'measure-conversion-problems'];
    [generators, views] = await Promise.all([
        loadGeneratorModelCatalog(undefined, undefined, new Map(generatorIds.map(id =>
            [id, fileURLToPath(new URL(`./${id}/spec.ts`, import.meta.url))]))),
        loadViewModelCatalog(undefined, undefined, new Map(viewIds.map(id =>
            [id, fileURLToPath(new URL(`../../visuals/views/measurement/${id}/spec.ts`, import.meta.url))])))
    ]);
});

const families = [
    ['measurement-number-line', 'measurement-number-line', Scope.NumbersWithZero],
    ['measurement-conversion-problems', 'measure-conversion-problems', Scope.NumbersWithoutZero]
] as const;

describe('measurement label declarations on existing competency targets', () => {
    it('requires the conversion competency instead of admitting a generic Grade 2 addition story', () => {
        const generator = generators.find(entry => entry.generatorId === 'measurement-conversion-problems')!;
        const view = views.find(entry => entry.viewId === 'measure-conversion-problems')!;
        const target = grade2Targets.find(target => target.id.startsWith('2.OA.A.1-two-step-word-problems~')
            && target.labels.includes(Area.Addition) && !target.labels.includes(Area.Subtraction))!;
        const rules = (view.compatibility ?? view.spec.compatibility ?? []).filter(rule => rule.id !== 'conversion-story-request');
        const unrestricted = {...view, compatibility: rules, spec: {...view.spec, compatibility: rules}};
        expect(matchTarget(target, generator, unrestricted).matched).toBe(true);
        expect(matchTarget(target, generator, view)).toMatchObject({matched: false, reason: 'missing-required-label', label: Area.UnitConversion});
    });
    it('covers all five line units and seven conversion pairs in both configured number kinds', () => {
        expect(lineTargets).toHaveLength(10);
        expect(storyTargets).toHaveLength(14);
        expect(rationalLineTargets).toHaveLength(2);
    });

    it.each(families)('%s owns quantity claims while %s owns numeral notation', (generatorId, viewId, zero) => {
        const generator = generators.find(entry => entry.generatorId === generatorId)!;
        const view = views.find(entry => entry.viewId === viewId)!;
        expect(generator.generalLabels).toEqual(expect.arrayContaining([sign, zero]));
        expect(view.generalLabels).toEqual(expect.arrayContaining(formats));
        for (const label of formats) expect(generator.generalLabels).not.toContain(label);
        for (const label of [sign, Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            expect(view.generalLabels).not.toContain(label);
        }
        expect(Object.keys(generator.schema!).sort()).toEqual(
            generatorId === 'measurement-number-line' ? ['measurementKind', 'numberKind'] : ['numberKind', 'range', 'unitPair']
        );
        expect(view.schema).toEqual({});
    });

    const cases = [
        ...lineTargets.map(target => ({target, generatorId: families[0][0], viewId: families[0][1]})),
        ...rationalLineTargets.map(target => ({target, generatorId: families[0][0], viewId: families[0][1]})),
        ...storyTargets.map(target => ({target, generatorId: families[1][0], viewId: families[1][1]}))
    ];

    it.each(cases)('completes declared numeric groups for $target.id without changing its claims', ({target, generatorId, viewId}) => {
        const generator = generators.find(entry => entry.generatorId === generatorId)!;
        const view = views.find(entry => entry.viewId === viewId)!;
        const originalLabels = [...target.labels];
        for (const label of [...formats, Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            expect(target.labels).not.toContain(label);
        }
        const matched = matchTarget(target, generator, view);
        expect(matched.matched).toBe(true);
        if (!matched.matched) throw new Error(`Existing target stopped matching: ${target.id}: ${matched.reason}`);
        expect(matched.plan.targetLabels).toEqual([...originalLabels].sort());
        const selections = enumerateDependencyAuditSelections(matched.plan);
        expect(selections.status).toBe('complete');
        for (const selection of selections.selections) {
            expect(assessLabelDependencyCoverage({generatorId, viewId, labels: selection.labels}).failures).toEqual([]);
        }

        const producer = generatorId === 'measurement-number-line'
            ? new MeasurementNumberLineGenerator() : new MeasurementConversionProblemsGenerator();
        for (const mode of ['question', 'solution'] as const) for (let instanceIdx = 0; instanceIdx < 4; instanceIdx++) {
            const sampleKey = computeSampleKey({...matched.plan.identity, split: 'train', mode, instanceIdx});
            const draw = generatePlannedDraw({generator: producer, viewSchema: view.schema, plan: matched.plan,
                sampleKey, attempt: 1, seed: computeSampleSeed(sampleKey, 1)});
            expect(draw.stub).not.toBeNull();
            const selected = selections.selections.find(item => item.variantHash === draw.replay.selection.variantHash)!;
            expect(draw.labels).toEqual(selected.labels);
            expect(assessLabelDependencyCoverage({generatorId, viewId, labels: draw.labels}).failures).toEqual([]);
            if (generatorId === 'measurement-number-line') {
                const data = draw.stub!.data as unknown as MeasurementNumberLineProblem;
                expect(isValidMeasurementNumberLineProblem(data)).toBe(true);
                expect(data.tickValues[0].numerator).toBe(0);
                expect(data.tickValues.every(value => value.numerator >= 0 && value.denominator > 0)).toBe(true);
                expect(Number(formatMeasurementNumberLineValue(data.tickValues[0], data.numberKind))).toBe(0);
                expect(draw.labels).toContain(Scope.NumbersWithZero);
                expect(draw.labels).not.toContain(Scope.NumbersWithoutZero);
            } else {
                const data = draw.stub!.data as unknown as MeasurementConversionStoryProblem;
                expect(isValidMeasurementConversionStory(data)).toBe(true);
                expect([data.pair.factor, data.conversion.largerHundredths, data.conversion.smallerHundredths,
                    data.additionalTargetHundredths, data.totalTargetHundredths].every(value => value > 0)).toBe(true);
                const presentation = buildMeasurementConversionStoryPresentation(data);
                expect(presentation.story).toMatch(/[0-9]/);
                expect(presentation.factorEquation).toMatch(/[0-9]+ (?:×|÷) [0-9]+/);
                expect(draw.labels).toContain(Scope.NumbersWithoutZero);
                expect(draw.labels).not.toContain(Scope.NumbersWithZero);
            }
        }
        expect(target.labels).toEqual(originalLabels);
    });
});
