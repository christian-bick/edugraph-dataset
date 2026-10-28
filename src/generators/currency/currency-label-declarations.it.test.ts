import {fileURLToPath} from 'node:url';
import {Scope} from 'edugraph-ts';
import {beforeAll, describe, expect, it} from 'vitest';
import {computeSampleKey, computeSampleSeed} from '../../lib/generation.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../lib/label-dependencies.ts';
import {matchTarget} from '../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../lib/planned-generation.ts';
import {getRandomState} from '../../lib/random.ts';
import {spec as grade2Targets} from '../../spec/ccss/grade-02.ts';
import type {CurrencyArithmeticProblem} from '../../types/problems.ts';
import {currencyStory, formatCurrency} from '../../visuals/views/currency/currency-word-problem/helpers.ts';
import {CurrencyArithmeticGenerator} from './currency-arithmetic/generator.ts';

const generatorId = 'currency-arithmetic';
const viewId = 'currency-word-problem';
const targets = grade2Targets.filter(target => target.id.startsWith('2.MD.C.8-currency-word-problems~'));
const quantityLabels = [Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero];
const notationLabels = [Scope.ArabicNumerals, Scope.Base10];
let generator: Awaited<ReturnType<typeof loadGeneratorModelCatalog>>[number];
let view: Awaited<ReturnType<typeof loadViewModelCatalog>>[number];

beforeAll(async () => {
    const [generators, views] = await Promise.all([
        loadGeneratorModelCatalog(undefined, undefined, new Map([
            [generatorId, fileURLToPath(new URL('./currency-arithmetic/spec.ts', import.meta.url))]
        ])),
        loadViewModelCatalog(undefined, undefined, new Map([
            [viewId, fileURLToPath(new URL('../../visuals/views/currency/currency-word-problem/spec.ts', import.meta.url))]
        ]))
    ]);
    generator = generators.find(entry => entry.generatorId === generatorId)!;
    view = views.find(entry => entry.viewId === viewId)!;
});

describe('currency declarations on existing Grade 2 word-problem targets', () => {
    it('keeps the 18 admitted selections and reports only their unresolved number-kind facet', () => {
        expect(targets).toHaveLength(18);
        const evaluator = createLabelDependencyEvaluator();
        let missing = 0;
        for (const target of targets) {
            const originalLabels = [...target.labels];
            const matched = matchTarget(target, generator, view);
            if (!matched.matched) throw new Error(`Existing target stopped matching: ${target.id}: ${matched.reason}`);
            expect(target.labels).toEqual(originalLabels);
            const enumeration = enumerateDependencyAuditSelections(matched.plan);
            expect(enumeration.status).toBe('complete');
            expect(enumeration.selections).toHaveLength(1);
            const evaluation = evaluator.evaluate(enumeration.selections[0].labels);
            expect(evaluation.context.status).toBe('eligible');
            expect(evaluation.errors).toEqual([]);
            expect(evaluation.conflicts).toEqual([]);
            const gaps = evaluation.assessments.filter(assessment => assessment.status === 'missing' && assessment.facet !== 'range');
            expect(gaps.map(assessment => assessment.facet)).toEqual(['numberKind']);
            expect(evaluation.assessments.some(assessment => assessment.facet === 'operandDigits')).toBe(false);
            missing += gaps.length;
        }
        expect(missing).toBe(18);
    });

    it('owns positive quantity invariants in the generator without choosing a number kind', () => {
        for (const label of quantityLabels) {
            expect(generator.generalLabels).toContain(label);
            expect(view.generalLabels).not.toContain(label);
        }
        for (const label of notationLabels) {
            expect(view.generalLabels).toContain(label);
            expect(generator.generalLabels).not.toContain(label);
        }
        for (const label of [Scope.IntegerNumbers, Scope.DecimalNumbers]) {
            expect(generator.generalLabels).not.toContain(label);
            expect(view.generalLabels).not.toContain(label);
        }
    });

    it.each(targets)('preserves configuration, mathematical draws and randomness for $id', target => {
        const preceding = {...generator,
            generalLabels: generator.generalLabels.filter(label => !quantityLabels.includes(label as Scope)),
            labels: generator.labels.filter(label => !quantityLabels.includes(label as Scope)),
            spec: {...generator.spec, generalLabels: generator.generalLabels.filter(label => !quantityLabels.includes(label as Scope))}
        };
        const precedingView = {...view,
            generalLabels: view.generalLabels.filter(label => !notationLabels.includes(label as Scope)),
            supportedLabels: view.supportedLabels.filter(label => !notationLabels.includes(label as Scope)),
            spec: {...view.spec, generalLabels: view.generalLabels.filter(label => !notationLabels.includes(label as Scope))}
        };
        const before = matchTarget(target, preceding, precedingView);
        const after = matchTarget(target, generator, view);
        if (!before.matched || !after.matched) throw new Error(`Currency target stopped matching: ${target.id}`);
        const producer = new CurrencyArithmeticGenerator();
        for (const mode of ['question', 'solution'] as const) for (let instanceIdx = 0; instanceIdx < 12; instanceIdx++) {
            const sampleKey = computeSampleKey({...after.plan.identity, split: 'train', mode, instanceIdx});
            const seed = computeSampleSeed(sampleKey, 1);
            const origin = {sampleKey, seed, attempt: 1, generatorSchema: generator.schema!, viewSchema: view.schema};
            const precedingConfig = resolvePlannedConfigurations({...origin, plan: before.plan});
            const currentConfig = resolvePlannedConfigurations({...origin, plan: after.plan});
            expect(currentConfig.generatorConfig).toEqual(precedingConfig.generatorConfig);
            expect(currentConfig.generatorRandomState).toBe(precedingConfig.generatorRandomState);
            expect(currentConfig.view.config).toEqual(precedingConfig.view.config);
            expect(currentConfig.view.randomState).toBe(precedingConfig.view.randomState);

            const precedingDraw = generatePlannedDraw({...origin, generator: producer, plan: before.plan});
            const precedingState = getRandomState();
            const currentDraw = generatePlannedDraw({...origin, generator: producer, plan: after.plan});
            expect(currentDraw.stub).not.toBeNull();
            expect(currentDraw.stub!.data).toEqual(precedingDraw.stub!.data);
            expect(getRandomState()).toBe(precedingState);
            expect(currentDraw.labels).toEqual([...precedingDraw.labels, ...quantityLabels, ...notationLabels].sort());
            const data = currentDraw.stub!.data as CurrencyArithmeticProblem;
            expect(data.answerCents).toBeGreaterThan(0);
            const forceDollars = data.amounts.some(amount => amount.items.some(item => item.kind === 'banknote'));
            const displayValues = [...data.amounts.map(amount => amount.totalCents),
                ...(mode === 'solution' ? [data.answerCents] : [])];
            for (const cents of displayValues) {
                const display = formatCurrency(cents, forceDollars);
                expect(display).toMatch(/^(?:\d+¢|\$\d+(?:\.\d{2})?)$/);
                const displayedCents = display.endsWith('¢')
                    ? Number(display.slice(0, -1)) : Math.round(Number(display.slice(1)) * 100);
                expect(displayedCents).toBe(cents);
                expect(displayedCents).toBeGreaterThan(0);
            }
            for (const amount of data.amounts) {
                expect(currencyStory(data)).toContain(formatCurrency(amount.totalCents, forceDollars));
            }
            for (const amount of data.amounts) {
                expect(amount.totalCents).toBeGreaterThan(0);
                for (const item of amount.items) {
                    expect(item.count).toBeGreaterThan(0);
                    expect(item.denominationCents).toBeGreaterThan(0);
                }
            }
        }
    });
});
