import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Scope} from 'edugraph-ts';
import {FractionDivisionRelationsGenerator} from '../../../generators/fraction/fraction-division-relations/generator.ts';
import {FractionQuotientModelGenerator} from '../../../generators/fraction/fraction-quotient-model/generator.ts';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {matchTarget} from '../../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../../lib/model-catalog.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {spec as grade5Targets} from '../../../spec/ccss/grade-05.ts';
import {spec as grade6Targets} from '../../../spec/ccss/grade-06.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {FractionDivisionRelationProblem, FractionQuotientProblem, ViewTypeMap} from '../../../types/problems.ts';
import {GeneralFractionDivisionBody} from './fraction-division-view.tsx';

const cases = [
    {oldId: 'fractions-division-execution', newId: 'fractions-general-division-execution',
        task: 'division-execution', ability: Ability.ProcedureExecution, targetPrefix: '6.NS.A.1-fraction-division-execution~'},
    {oldId: 'fractions-division-interpretation', newId: 'fractions-general-division-interpretation',
        task: 'division-interpretation', ability: Ability.Interpretation, targetPrefix: '6.NS.A.1-fraction-division-interpretation~'},
    {oldId: 'fractions-division-inverse-explanation', newId: 'fractions-general-division-inverse-explanation',
        task: 'division-inverse-explanation', ability: Ability.ProcedureUnderstanding, targetPrefix: '6.NS.A.1-fraction-division-inverse-explanation~'},
    {oldId: 'fractions-division-story-creation', newId: 'fractions-general-division-story-creation',
        task: 'division-story-creation', ability: Ability.TextualArticulation, targetPrefix: '6.NS.A.1-fraction-division-story-creation~'}
] as const;
type GeneralId = typeof cases[number]['newId'];
type QuotientId = typeof cases[number]['oldId'];
type Renderer<T> = (data: T, solution: boolean) => string;
type Renderers = {general: Renderer<FractionDivisionRelationProblem>; quotient: Renderer<FractionQuotientProblem>};
let renderers: Record<GeneralId, Renderers>;
let generators: Awaited<ReturnType<typeof loadGeneratorModelCatalog>>;
let views: Awaited<ReturnType<typeof loadViewModelCatalog>>;

const payload = <T extends GeneralId | QuotientId>(viewId: T, data: ViewTypeMap[T], isSolutionView: boolean):
    ViewRenderPayload<T> => ({viewId, problem: {type: 'fraction', data, labels: []},
    targetLabels: [], isSolutionView, seed: 42});

beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [execution, interpretation, inverse, story, oldExecution, oldInterpretation, oldInverse, oldStory,
        generatorCatalog, viewCatalog] = await Promise.all([
        import('./fractions-general-division-execution/view.tsx'), import('./fractions-general-division-interpretation/view.tsx'),
        import('./fractions-general-division-inverse-explanation/view.tsx'), import('./fractions-general-division-story-creation/view.tsx'),
        import('./fractions-division-execution/view.tsx'), import('./fractions-division-interpretation/view.tsx'),
        import('./fractions-division-inverse-explanation/view.tsx'), import('./fractions-division-story-creation/view.tsx'),
        loadGeneratorModelCatalog(undefined, undefined, new Map(['fraction-division-relations', 'fraction-quotient-model'].map(id =>
            [id, fileURLToPath(new URL(`../../../generators/fraction/${id}/spec.ts`, import.meta.url))]))),
        loadViewModelCatalog(undefined, undefined, new Map(cases.flatMap(entry => [entry.oldId, entry.newId]).map(id =>
            [id, fileURLToPath(new URL(`./${id}/spec.ts`, import.meta.url))])))
    ]);
    // Each adapter constructs its exact named payload. The test matrix never widens
    // a production Core to an unknown-payload component or a valid-family union.
    renderers = {
        'fractions-general-division-execution': {
            general: (data, solution) => renderToStaticMarkup(createElement(execution.FractionsGeneralDivisionExecutionCore,
                {payload: payload('fractions-general-division-execution', data, solution)})),
            quotient: (data, solution) => renderToStaticMarkup(createElement(oldExecution.FractionsDivisionExecutionCore,
                {payload: payload('fractions-division-execution', data, solution)}))
        },
        'fractions-general-division-interpretation': {
            general: (data, solution) => renderToStaticMarkup(createElement(interpretation.FractionsGeneralDivisionInterpretationCore,
                {payload: payload('fractions-general-division-interpretation', data, solution)})),
            quotient: (data, solution) => renderToStaticMarkup(createElement(oldInterpretation.FractionsDivisionInterpretationCore,
                {payload: payload('fractions-division-interpretation', data, solution)}))
        },
        'fractions-general-division-inverse-explanation': {
            general: (data, solution) => renderToStaticMarkup(createElement(inverse.FractionsGeneralDivisionInverseExplanationCore,
                {payload: payload('fractions-general-division-inverse-explanation', data, solution)})),
            quotient: (data, solution) => renderToStaticMarkup(createElement(oldInverse.FractionsDivisionInverseExplanationCore,
                {payload: payload('fractions-division-inverse-explanation', data, solution)}))
        },
        'fractions-general-division-story-creation': {
            general: (data, solution) => renderToStaticMarkup(createElement(story.FractionsGeneralDivisionStoryCreationCore,
                {payload: payload('fractions-general-division-story-creation', data, solution)})),
            quotient: (data, solution) => renderToStaticMarkup(createElement(oldStory.FractionsDivisionStoryCreationCore,
                {payload: payload('fractions-division-story-creation', data, solution)}))
        }
    };
    generators = generatorCatalog;
    views = viewCatalog;
});
afterAll(() => vi.unstubAllGlobals());

describe('supplied general division model migrations', () => {
    it.each(cases)('$newId preserves its complete model and both-mode projection across all six profiles', entry => {
        const view = views.find(candidate => candidate.viewId === entry.newId)!;
        expect(view.problemType).toBe('FractionDivisionRelationProblem');
        expect(view.schema).toEqual({});
        expect(view.generalLabels).toEqual([entry.ability, Scope.ArabicNumerals, Scope.Base10,
            Scope.Numberline, Scope.BarModel, Scope.NumbersWithZero]);
        expect(view.spec).not.toHaveProperty('inferredLabels');
        const profiles = ['fraction-by-fraction-proper', 'fraction-by-fraction-improper',
            'fraction-by-integer-proper', 'fraction-by-integer-improper',
            'integer-by-fraction-proper', 'integer-by-fraction-improper'] as const;
        const contexts = new Set<string>();
        const dividends = new Set<string>();
        for (const operandProfile of profiles) for (const withEquation of [false, true]) {
            for (const withMultiplication of [false, true]) for (let seed = 0; seed < 4; seed++) {
                setSeed(`division-model-split-${operandProfile}-${withEquation}-${withMultiplication}-${seed}`);
                const {data} = new FractionDivisionRelationsGenerator().generate({operandProfile, withEquation, withMultiplication});
                contexts.add(data.context.kind);
                dividends.add(data.dividend.numerator === 0 ? 'zero' : 'positive');
                for (const solution of [false, true]) {
                    const markup = renderers[entry.newId].general(data, solution);
                    expect(markup).toBe(renderToStaticMarkup(createElement(GeneralFractionDivisionBody,
                        {data, isSolutionView: solution, task: entry.task})));
                    expect(markup).toMatch(/<line x1="32" x2="732" y1="38" y2="38"/);
                    expect(markup).toMatch(/<text[^>]*x="32"[^>]*>0<\/text>/);
                    expect(markup).toMatch(/<text[^>]*>1<\/text>/);
                    const parts = [...markup.matchAll(/<rect[^>]* y="83" width="([^"]+)" height="29" fill="([^"]+)"/g)];
                    expect(parts).toHaveLength(data.model.coverageTicks);
                    expect(parts.filter(part => part[2] === '#a5b4fc')).toHaveLength(data.model.dividendTicks);
                    for (const part of parts) expect(Number(part[1])).toBeCloseTo(700 / data.model.coverageTicks, 12);
                    expect(markup.match(/ y="219" width="[^"]+" height="27"/g)).toHaveLength(data.model.divisorTicks);
                }
            }
        }
        expect(contexts).toEqual(new Set(['sharing', 'measured-groups', 'rectangle']));
        expect(dividends).toEqual(new Set(['zero', 'positive']));
    });

    it.each(cases)('$newId and $oldId reject the other valid named payload family in both modes', entry => {
        const general = new FractionDivisionRelationsGenerator().generate({operandProfile: 'fraction-by-fraction-proper',
            withEquation: false, withMultiplication: false}).data;
        const quotient = new FractionQuotientModelGenerator().generate({relationProfile: 'unit-divisor-basic', numericProfile: 'zero'}).data;
        for (const solution of [false, true]) {
            // @ts-expect-error An adversarial legacy fixture violates the general-only adapter contract.
            expect(() => renderers[entry.newId].general(quotient, solution)).toThrow(/Validation Error/);
            // @ts-expect-error An adversarial general fixture violates the quotient-only adapter contract.
            expect(() => renderers[entry.newId].quotient(general, solution)).toThrow(/Validation Error/);
        }
    });

    it.each(cases)('$newId retains three real targets, six complete selections and replay ownership', entry => {
        const generator = generators.find(candidate => candidate.generatorId === 'fraction-division-relations')!;
        const generalView = views.find(candidate => candidate.viewId === entry.newId)!;
        const quotientView = views.find(candidate => candidate.viewId === entry.oldId)!;
        expect(quotientView.problemType).toBe('FractionQuotientProblem');
        const targets = grade6Targets.filter(target => target.id.startsWith(entry.targetPrefix));
        expect(targets).toHaveLength(3);
        let checked = 0;
        for (const target of targets) {
            const result = matchTarget(target, generator, generalView);
            expect(result.matched).toBe(true);
            expect(matchTarget(target, generator, quotientView)).toEqual({matched: false, reason: 'incompatible-type'});
            if (!result.matched) throw new Error(result.reason);
            const selections = enumerateDependencyAuditSelections(result.plan);
            expect(selections.status).toBe('complete');
            expect(selections.selections).toHaveLength(2);
            for (const selection of selections.selections) {
                checked++;
                const evaluation = createLabelDependencyEvaluator().evaluate(selection.labels);
                expect(evaluation.conflicts).toEqual([]);
                expect(evaluation.assessments.find(assessment => assessment.facet === 'zero')?.status).toBe('satisfied');
                for (const mode of ['question', 'solution']) {
                    const sampleKey = `${target.id}#fraction-division-relations#${entry.newId}#train#${mode}#inst:0`;
                    const replay = {version: 1 as const, sampleKey, seed: 17, attempt: 1,
                        selection: createGenerationSelectionReceipt(result.plan, selection.choices)};
                    const input = {generator: new FractionDivisionRelationsGenerator(), viewSchema: generalView.schema,
                        plan: result.plan, sampleKey, seed: 17, attempt: 1, replay};
                    const draw = generatePlannedDraw(input);
                    expect(draw.stub).not.toBeNull();
                    expect(draw.stub!.data.kind).toBe('fraction-division-relation');
                    expect(draw.labels).toEqual(expect.arrayContaining([Scope.Numberline, Scope.BarModel, Scope.NumbersWithZero]));
                    expect(draw.replay).toEqual(replay);
                    expect(generatePlannedDraw(input)).toEqual(draw);
                    expect(() => generatePlannedDraw({...input,
                        sampleKey: sampleKey.replace(entry.newId, entry.oldId)})).toThrow(/does not belong/);
                }
            }
        }
        expect(checked).toBe(6);
    });

    it('retains 42 legacy selections on the four original IDs, including 14 zero and 28 nonzero choices', () => {
        const generator = generators.find(entry => entry.generatorId === 'fraction-quotient-model')!;
        let withZero = 0, withoutZero = 0, tuples = 0;
        for (const entry of cases) {
            const view = views.find(candidate => candidate.viewId === entry.oldId)!;
            const wrongView = views.find(candidate => candidate.viewId === entry.newId)!;
            for (const target of [...grade5Targets, ...grade6Targets]) {
                const result = matchTarget(target, generator, view);
                if (!result.matched) continue;
                tuples++;
                const selections = enumerateDependencyAuditSelections(result.plan);
                expect(selections.status).toBe('complete');
                for (const selection of selections.selections) {
                    withZero += Number(selection.labels.includes(Scope.NumbersWithZero));
                    withoutZero += Number(selection.labels.includes(Scope.NumbersWithoutZero));
                }
                expect(matchTarget(target, generator, wrongView)).toEqual({matched: false, reason: 'incompatible-type'});
            }
        }
        expect({tuples, withZero, withoutZero}).toEqual({tuples: 16, withZero: 14, withoutZero: 28});
    });
});
