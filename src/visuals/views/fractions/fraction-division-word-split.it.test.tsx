import {fileURLToPath} from 'node:url';
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
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {spec as grade5Targets} from '../../../spec/ccss/grade-05.ts';
import {spec as grade6Targets} from '../../../spec/ccss/grade-06.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {FractionDivisionRelationProblem, FractionQuotientProblem} from '../../../types/problems.ts';
import {FractionQuotientBody} from './fraction-quotient-view.tsx';

const generalId = 'fractions-general-division-word-problem';
const quotientId = 'fractions-division-word-problem';
let generalCore: typeof import('./fractions-general-division-word-problem/view.tsx').FractionsGeneralDivisionWordProblemCore;
let quotientCore: typeof import('./fractions-division-word-problem/view.tsx').FractionsDivisionWordProblemCore;
let generators: Awaited<ReturnType<typeof loadGeneratorModelCatalog>>;
let views: Awaited<ReturnType<typeof loadViewModelCatalog>>;

beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [general, quotient, generatorCatalog, viewCatalog] = await Promise.all([
        import('./fractions-general-division-word-problem/view.tsx'),
        import('./fractions-division-word-problem/view.tsx'),
        loadGeneratorModelCatalog(undefined, undefined, new Map(['fraction-division-relations', 'fraction-quotient-model'].map(id =>
            [id, fileURLToPath(new URL(`../../../generators/fraction/${id}/spec.ts`, import.meta.url))]))),
        loadViewModelCatalog(undefined, undefined, new Map([generalId, quotientId].map(id =>
            [id, fileURLToPath(new URL(`./${id}/spec.ts`, import.meta.url))])))
    ]);
    generalCore = general.FractionsGeneralDivisionWordProblemCore;
    quotientCore = quotient.FractionsDivisionWordProblemCore;
    generators = generatorCatalog;
    views = viewCatalog;
});
afterAll(() => vi.unstubAllGlobals());

const generalPayload = (data: FractionDivisionRelationProblem, isSolutionView: boolean): ViewRenderPayload<typeof generalId> =>
    ({viewId: generalId, problem: {type: 'fraction', data, labels: []}, targetLabels: [], isSolutionView, seed: 42});
const quotientPayload = (data: FractionQuotientProblem, isSolutionView: boolean): ViewRenderPayload<typeof quotientId> =>
    ({viewId: quotientId, problem: {type: 'fraction', data, labels: []}, targetLabels: [], isSolutionView, seed: 42});

describe('fraction division word-problem family separation', () => {
    it('preserves reading as necessary while requiring a common-part method without supplying the solved groups', () => {
        const generalView = views.find(view => view.viewId === generalId)!;
        expect(generalView.problemType).toBe('FractionDivisionRelationProblem');
        expect(generalView.generalLabels).toEqual([Ability.TextualReception, Ability.ProcedureExecution,
            Scope.ArabicNumerals, Scope.Base10, Scope.Numberline, Scope.BarModel]);
        expect(generalView.schema).toEqual({});
        expect(generalView.spec).not.toHaveProperty('inferredLabels');
        const contexts = new Set<string>();
        for (const operandProfile of ['fraction-by-fraction-proper', 'fraction-by-fraction-improper',
            'fraction-by-integer-proper', 'fraction-by-integer-improper',
            'integer-by-fraction-proper', 'integer-by-fraction-improper'] as const) {
            for (const groupCountProfile of operandProfile === 'fraction-by-integer-proper'
                ? ['zero'] as const : ['zero', 'positive'] as const)
            for (const withMultiplication of [false, true]) for (let seed = 0; seed < 12; seed++) {
                setSeed(`word-division-split-${operandProfile}-${withMultiplication}-${seed}`);
                const data = new FractionDivisionRelationsGenerator().generate({operandProfile, groupCountProfile,
                    withEquation: true, withMultiplication}).data;
                contexts.add(data.context.kind);
                const randomState = getRandomState();
                const question = renderToStaticMarkup(generalCore({payload: generalPayload(data, false)}));
                const solution = renderToStaticMarkup(generalCore({payload: generalPayload(data, true)}));
                expect(getRandomState()).toBe(randomState);
                expect(question).toContain('Use a common-part bar model on the number-line frame to solve the story.');
                expect(question).toContain('Blank numerical model frame');
                expect(question).toContain('Use the count of complete divisor-sized groups');
                expect(question).toContain('Equation: ____________________');
                expect(question).toContain('Answer with units: ____________________');
                expect(question).not.toContain('Dividend:');
                expect(question).not.toContain('Divisor-sized groups');
                expect(question).not.toContain('One divisor-sized group:');
                expect(question).not.toContain('height="29"');
                expect(question).not.toContain('data-evidence="product-relation"');
                expect(question.includes('Check by multiplication:')).toBe(withMultiplication);
                for (const markup of [question, solution]) {
                    expect(markup).toMatch(/<line x1="32" x2="732" y1="38" y2="38"/);
                    expect(/<text[^>]*x="32"[^>]*>0<\/text>/.test(markup)).toBe(groupCountProfile === 'zero');
                    expect(markup).toContain('All rows use the same numerical scale.');
                }
                expect(solution).toContain('Divisor-sized groups');
                expect(solution).toContain(`The numerical model has ${data.model.completeGroups} complete divisor-sized`);
                expect(solution.match(/ y="219" width="[^"]+" height="27"/g)).toHaveLength(data.model.divisorTicks);
            }
        }
        expect(contexts).toEqual(new Set(['sharing', 'measured-groups', 'rectangle']));
    });

    it('retains the three general targets with eleven exhaustive zero/positive complete-group bindings', () => {
        const generator = generators.find(candidate => candidate.generatorId === 'fraction-division-relations')!;
        const generalView = views.find(candidate => candidate.viewId === generalId)!;
        const quotientView = views.find(candidate => candidate.viewId === quotientId)!;
        const targets = grade6Targets.filter(target => target.id.startsWith('6.NS.A.1-fraction-division-word-problems~'));
        expect(targets).toHaveLength(3);
        let bindings = 0;
        for (const target of targets) {
            const result = matchTarget(target, generator, generalView);
            expect(result.matched).toBe(true);
            expect(matchTarget(target, generator, quotientView)).toEqual({matched: false, reason: 'incompatible-type'});
            if (!result.matched) throw new Error(result.reason);
            const selections = enumerateDependencyAuditSelections(result.plan);
            expect(selections.status).toBe('complete');
            expect(selections.selections).toHaveLength(target.labels.includes(Scope.IntegerDivisor) ? 3 : 4);
            for (const selection of selections.selections) {
                bindings++;
                const evaluation = createLabelDependencyEvaluator().evaluate(selection.labels);
                expect(evaluation.conflicts).toEqual([]);
                expect(evaluation.assessments.find(assessment => assessment.facet === 'zero')?.status).toBe('satisfied');
                const sampleKey = `${target.id}#fraction-division-relations#${generalId}#train#question#inst:0`;
                const replay = {version: 1 as const, sampleKey, seed: 17, attempt: 1,
                    selection: createGenerationSelectionReceipt(result.plan, selection.choices)};
                const input = {generator: new FractionDivisionRelationsGenerator(), viewSchema: generalView.schema,
                    plan: result.plan, sampleKey, seed: 17, attempt: 1, replay};
                const draw = generatePlannedDraw(input);
                expect(draw.stub?.data.kind).toBe('fraction-division-relation');
                expect(draw.labels).toEqual(expect.arrayContaining([Scope.Numberline, Scope.BarModel]));
                const zero = draw.stub!.data.model.completeGroups === 0;
                expect(draw.labels).toContain(zero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero);
                expect(draw.labels).not.toContain(zero ? Scope.NumbersWithoutZero : Scope.NumbersWithZero);
                expect(draw.replay).toEqual(replay);
                expect(generatePlannedDraw(input)).toEqual(draw);
                expect(() => generatePlannedDraw({...input,
                    sampleKey: sampleKey.replace(generalId, quotientId)})).toThrow(/does not belong/);
            }
        }
        expect(bindings).toBe(11);
    }, 30_000);

    it('retains all five legacy target routes and eight zero/nonzero bindings on the original ID', () => {
        const generator = generators.find(candidate => candidate.generatorId === 'fraction-quotient-model')!;
        const generalView = views.find(candidate => candidate.viewId === generalId)!;
        const quotientView = views.find(candidate => candidate.viewId === quotientId)!;
        expect(quotientView.problemType).toBe('FractionQuotientProblem');
        let tuples = 0, withZero = 0, withoutZero = 0;
        for (const target of [...grade5Targets, ...grade6Targets]) {
            const result = matchTarget(target, generator, quotientView);
            if (!result.matched) continue;
            tuples++;
            const selections = enumerateDependencyAuditSelections(result.plan);
            expect(selections.status).toBe('complete');
            for (const selection of selections.selections) {
                withZero += Number(selection.labels.includes(Scope.NumbersWithZero));
                withoutZero += Number(selection.labels.includes(Scope.NumbersWithoutZero));
            }
            expect(matchTarget(target, generator, generalView)).toEqual({matched: false, reason: 'incompatible-type'});
        }
        expect({tuples, withZero, withoutZero}).toEqual({tuples: 5, withZero: 3, withoutZero: 5});
        const data = new FractionQuotientModelGenerator().generate({relationProfile: 'unit-divisor-equation', numericProfile: 'zero'}).data;
        const generalData = new FractionDivisionRelationsGenerator().generate({operandProfile: 'fraction-by-fraction-proper',
            groupCountProfile: 'zero', withEquation: true, withMultiplication: false}).data;
        for (const isSolutionView of [false, true]) {
            expect(renderToStaticMarkup(quotientCore({payload: quotientPayload(data, isSolutionView)})))
                .toBe(renderToStaticMarkup(<FractionQuotientBody data={data} task="division-word-problem" isSolutionView={isSolutionView} />));
            // @ts-expect-error The legacy named payload is not accepted by the general-only leaf.
            expect(() => generalCore({payload: generalPayload(data, isSolutionView)})).toThrow(/Validation Error/);
            // @ts-expect-error The general named payload is not accepted by the quotient-only leaf.
            expect(() => quotientCore({payload: quotientPayload(generalData, isSolutionView)})).toThrow(/Validation Error/);
        }
    });
});
