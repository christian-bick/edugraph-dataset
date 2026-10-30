import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Scope} from 'edugraph-ts';
import {FractionDivisionRelationsGenerator} from '../../../../generators/fraction/fraction-division-relations/generator.ts';
import {FractionQuotientModelGenerator} from '../../../../generators/fraction/fraction-quotient-model/generator.ts';
import {createGenerationSelectionReceipt} from '../../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../../../lib/label-dependencies.ts';
import {matchTarget} from '../../../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../../../lib/model-catalog.ts';
import {generatePlannedDraw} from '../../../../lib/planned-generation.ts';
import {setSeed} from '../../../../lib/random.ts';
import {spec as grade5Targets} from '../../../../spec/ccss/grade-05.ts';
import {spec as grade6Targets} from '../../../../spec/ccss/grade-06.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {FractionDivisionRelationProblem, FractionQuotientProblem} from '../../../../types/problems.ts';
import {GeneralFractionDivisionBody} from '../fraction-division-view.tsx';
import {FractionsGeneralDivisionExecutionViewSchema, spec} from './spec.ts';

const oldIds = ['fractions-division-execution', 'fractions-division-interpretation',
    'fractions-division-inverse-explanation', 'fractions-division-story-creation'] as const;
const profiles = ['fraction-by-fraction-proper', 'fraction-by-fraction-improper', 'fraction-by-integer-proper',
    'fraction-by-integer-improper', 'integer-by-fraction-proper', 'integer-by-fraction-improper'] as const;
let GeneralCore: typeof import('./view.tsx')['FractionsGeneralDivisionExecutionCore'];
let QuotientCore: typeof import('../fractions-division-execution/view.tsx')['FractionsDivisionExecutionCore'];
let generators: Awaited<ReturnType<typeof loadGeneratorModelCatalog>>;
let views: Awaited<ReturnType<typeof loadViewModelCatalog>>;

beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [general, quotient, generatorCatalog, viewCatalog] = await Promise.all([
        import('./view.tsx'), import('../fractions-division-execution/view.tsx'),
        loadGeneratorModelCatalog(undefined, undefined, new Map(['fraction-division-relations', 'fraction-quotient-model'].map(id =>
            [id, fileURLToPath(new URL(`../../../../generators/fraction/${id}/spec.ts`, import.meta.url))]))),
        loadViewModelCatalog(undefined, undefined, new Map([...oldIds, spec.viewId].map(id =>
            [id, fileURLToPath(new URL(`../${id}/spec.ts`, import.meta.url))])))
    ]);
    GeneralCore = general.FractionsGeneralDivisionExecutionCore;
    QuotientCore = quotient.FractionsDivisionExecutionCore;
    generators = generatorCatalog;
    views = viewCatalog;
});
afterAll(() => vi.unstubAllGlobals());

const generalPayload = (data: FractionDivisionRelationProblem, isSolutionView: boolean):
    ViewRenderPayload<'fractions-general-division-execution'> => ({viewId: 'fractions-general-division-execution',
    problem: {type: 'fraction', data, labels: []}, targetLabels: [], isSolutionView, seed: 42});
const quotientPayload = (data: FractionQuotientProblem, isSolutionView: boolean):
    ViewRenderPayload<'fractions-division-execution'> => ({viewId: 'fractions-division-execution',
    problem: {type: 'fraction', data, labels: []}, targetLabels: [], isSolutionView, seed: 42});
const render = (data: FractionDivisionRelationProblem, solution: boolean) =>
    renderToStaticMarkup(createElement(GeneralCore, {payload: generalPayload(data, solution)}));

describe('general division execution split', () => {
    it('declares one general-model task with an invariant numerical origin and proportional bars', () => {
        expect(FractionsGeneralDivisionExecutionViewSchema).toEqual({});
        expect(spec.generalLabels).toEqual([Ability.ProcedureExecution, Scope.ArabicNumerals, Scope.Base10,
            Scope.Numberline, Scope.BarModel, Scope.NumbersWithZero]);
        expect(spec).not.toHaveProperty('inferredLabels');
        expect(spec.compatibility).toBeUndefined();
    });

    it('preserves the exact general rendering and numerical-zero/bar evidence in both modes for all six profiles', () => {
        const generator = new FractionDivisionRelationsGenerator();
        const contexts = new Set<string>();
        const dividends = new Set<string>();
        for (const operandProfile of profiles) for (const withEquation of [false, true]) {
            for (const withMultiplication of [false, true]) for (let seed = 0; seed < 8; seed++) {
                setSeed(`general-execution-split-${operandProfile}-${withEquation}-${withMultiplication}-${seed}`);
                const {data} = generator.generate({operandProfile, withEquation, withMultiplication});
                contexts.add(data.context.kind);
                dividends.add(data.dividend.numerator === 0 ? 'zero' : 'positive');
                for (const solution of [false, true]) {
                    const markup = render(data, solution);
                    expect(markup).toBe(renderToStaticMarkup(createElement(GeneralFractionDivisionBody,
                        {data, isSolutionView: solution, task: 'division-execution'})));
                    expect(markup).toMatch(/<line x1="32" x2="732" y1="38" y2="38"/);
                    expect(markup).toMatch(/<text[^>]*x="32"[^>]*>0<\/text>/);
                    expect(markup).toMatch(/<text[^>]*>1<\/text>/);
                    const parts = [...markup.matchAll(/<rect[^>]* y="83" width="([^"]+)" height="29" fill="([^"]+)"/g)];
                    expect(parts).toHaveLength(data.model.coverageTicks);
                    expect(parts.filter(part => part[2] === '#a5b4fc')).toHaveLength(data.model.dividendTicks);
                    for (const part of parts) expect(Number(part[1])).toBeCloseTo(700 / data.model.coverageTicks, 12);
                    expect(markup.match(/ y="219" width="[^"]+" height="27"/g)).toHaveLength(data.model.divisorTicks);
                    expect(markup.includes('The exact quotient is')).toBe(solution);
                    expect(markup.includes('data-response="answer-blank"')).toBe(!solution);
                }
            }
        }
        expect(contexts).toEqual(new Set(['sharing', 'measured-groups', 'rectangle']));
        expect(dividends).toEqual(new Set(['zero', 'positive']));
    });

    it('rejects the other valid payload family statically and at runtime in both directions', () => {
        const general = new FractionDivisionRelationsGenerator().generate({operandProfile: 'fraction-by-fraction-proper',
            withEquation: false, withMultiplication: false}).data;
        const quotient = new FractionQuotientModelGenerator().generate({relationProfile: 'unit-divisor-basic', numericProfile: 'zero'}).data;
        for (const solution of [false, true]) {
            // @ts-expect-error The new leaf accepts the named general relation, never a legacy quotient problem.
            const wrongGeneral = generalPayload(quotient, solution);
            // @ts-expect-error The retained leaf accepts the named quotient problem, never a general relation.
            const wrongQuotient = quotientPayload(general, solution);
            expect(() => renderToStaticMarkup(createElement(GeneralCore, {payload: wrongGeneral}))).toThrow(/Validation Error/);
            expect(() => renderToStaticMarkup(createElement(QuotientCore, {payload: wrongQuotient}))).toThrow(/Validation Error/);
        }
    });

    it('preserves the three real execution targets as six complete general selections, with replay owned by the new ID', () => {
        const generatorInfo = generators.find(entry => entry.generatorId === 'fraction-division-relations')!;
        const generalView = views.find(entry => entry.viewId === spec.viewId)!;
        const quotientView = views.find(entry => entry.viewId === oldIds[0])!;
        expect(generalView.problemType).toBe('FractionDivisionRelationProblem');
        expect(quotientView.problemType).toBe('FractionQuotientProblem');
        const targets = grade6Targets.filter(target => target.id.startsWith('6.NS.A.1-fraction-division-execution~'));
        expect(targets).toHaveLength(3);
        let checked = 0;
        for (const target of targets) {
            const result = matchTarget(target, generatorInfo, generalView);
            expect(result.matched).toBe(true);
            expect(matchTarget(target, generatorInfo, quotientView)).toEqual({matched: false, reason: 'incompatible-type'});
            if (!result.matched) throw new Error(result.reason);
            const selections = enumerateDependencyAuditSelections(result.plan);
            expect(selections.status).toBe('complete');
            expect(selections.selections).toHaveLength(2);
            for (const selection of selections.selections) {
                checked++;
                const evaluated = createLabelDependencyEvaluator().evaluate(selection.labels);
                expect(evaluated.conflicts).toEqual([]);
                expect(evaluated.assessments.find(assessment => assessment.facet === 'zero')?.status).toBe('satisfied');
                for (const mode of ['question', 'solution']) {
                    const sampleKey = `${target.id}#fraction-division-relations#${spec.viewId}#train#${mode}#inst:0`;
                    const replay = {version: 1 as const, sampleKey, seed: 17, attempt: 1,
                        selection: createGenerationSelectionReceipt(result.plan, selection.choices)};
                    const input = {generator: new FractionDivisionRelationsGenerator(), viewSchema: FractionsGeneralDivisionExecutionViewSchema,
                        plan: result.plan, sampleKey, seed: 17, attempt: 1, replay};
                    const draw = generatePlannedDraw(input);
                    expect(draw.stub).not.toBeNull();
                    expect(draw.stub!.data.kind).toBe('fraction-division-relation');
                    expect(draw.labels).toEqual(expect.arrayContaining([Scope.Numberline, Scope.BarModel, Scope.NumbersWithZero]));
                    expect(draw.replay).toEqual(replay);
                    expect(generatePlannedDraw(input)).toEqual(draw);
                    expect(() => generatePlannedDraw({...input,
                        sampleKey: sampleKey.replace(spec.viewId, oldIds[0])})).toThrow(/does not belong/);
                }
            }
        }
        expect(checked).toBe(6);
    });

    it('retains all 42 legacy selections across the four old IDs, including 14 zero and 28 nonzero choices', () => {
        const quotientInfo = generators.find(entry => entry.generatorId === 'fraction-quotient-model')!;
        const generalView = views.find(entry => entry.viewId === spec.viewId)!;
        let withZero = 0, withoutZero = 0;
        for (const id of oldIds) {
            const view = views.find(entry => entry.viewId === id)!;
            for (const target of [...grade5Targets, ...grade6Targets]) {
                const result = matchTarget(target, quotientInfo, view);
                if (!result.matched) continue;
                const selections = enumerateDependencyAuditSelections(result.plan);
                expect(selections.status).toBe('complete');
                for (const selection of selections.selections) {
                    withZero += Number(selection.labels.includes(Scope.NumbersWithZero));
                    withoutZero += Number(selection.labels.includes(Scope.NumbersWithoutZero));
                }
                expect(matchTarget(target, quotientInfo, generalView)).toEqual({matched: false, reason: 'incompatible-type'});
            }
        }
        expect({withZero, withoutZero}).toEqual({withZero: 14, withoutZero: 28});
    });
});
