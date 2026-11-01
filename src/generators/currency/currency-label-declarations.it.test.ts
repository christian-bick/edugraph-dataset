import {fileURLToPath} from 'node:url';
import {Area, Scope} from 'edugraph-ts';
import {beforeAll, describe, expect, it} from 'vitest';
import {computeSampleKey, computeSampleSeed} from '../../lib/generation.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../lib/label-dependencies.ts';
import {matchTarget} from '../../lib/matching.ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../lib/planned-generation.ts';
import {getRandomState} from '../../lib/random.ts';
import {selectExactLabelSetMap} from '../../lib/resolvers.ts';
import {extractSchemaLabels} from '../../lib/utils.ts';
import {spec as grade2Targets} from '../../spec/ccss/grade-02.ts';
import type {GeneratorCompatibilityRule} from '../../types/compatibility.ts';
import type {CurrencyArithmeticProblem} from '../../types/problems.ts';
import {currencyStory, formatCurrency} from '../../visuals/views/currency/currency-word-problem/helpers.ts';
import {CurrencyArithmeticGenerator} from './currency-arithmetic/generator.ts';
import {coinDenominations} from './currency-arithmetic/spec.ts';

const generatorId = 'currency-arithmetic';
const viewId = 'currency-word-problem';
const targets = grade2Targets.filter(target => target.id.startsWith('2.MD.C.8-currency-word-problems~'));
const quantityLabels = [Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero];
const notationLabels = [Scope.ArabicNumerals, Scope.Base10, Scope.DecimalNumbers];
const integerLabels = [Scope.IntegerNumbers, Scope.SingleDigitLargestOperand,
    Scope.TwoDigitLargestOperand, Scope.TwoDigitSmallestOperand];
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
    it('covers all 18 targets and 22 selections while retaining eight source integer operand-digit obligations', () => {
        expect(targets).toHaveLength(18);
        const evaluator = createLabelDependencyEvaluator();
        let missing = 0;
        const digitTargets = new Set<string>();
        let digitSelections = 0;
        let selectionCount = 0;
        let rangeDeferrals = 0;
        for (const target of targets) {
            const originalLabels = [...target.labels];
            const matched = matchTarget(target, generator, view);
            if (!matched.matched) throw new Error(`Existing target stopped matching: ${target.id}: ${matched.reason}`);
            expect(target.labels).toEqual(originalLabels);
            const enumeration = enumerateDependencyAuditSelections(matched.plan);
            expect(enumeration.status).toBe('complete');
            const banknotes = target.labels.includes(Scope.Banknotes) && !target.labels.includes(Scope.Coins);
            const pennies = target.labels.includes(Scope.HundredthDenomination) && !target.labels.includes(Scope.Banknotes);
            const addition = target.labels.includes(Area.Addition);
            expect(enumeration.selections).toHaveLength(banknotes ? addition ? 2 : 1 : pennies ? addition ? 3 : 2 : 1);
            for (const {labels: selected} of enumeration.selections) {
                const integer = selected.includes(Scope.IntegerNumbers);
                expect(selected).toContain(Scope.DecimalNumbers);
                const evaluation = evaluator.evaluate(selected);
                expect(evaluation.context.status).toBe('eligible');
                expect(evaluation.errors).toEqual([]);
                expect(evaluation.conflicts).toEqual([]);
                const gaps = evaluation.assessments.filter(assessment => assessment.status === 'missing');
                expect(gaps.map(gap => gap.facet)).toEqual(banknotes || pennies ? [] : ['range']);
                rangeDeferrals += gaps.filter(gap => gap.facet === 'range').length;
                missing += gaps.filter(gap => gap.facet !== 'range').length;
                expect(evaluation.assessments.some(assessment => assessment.facet === 'operandDigits')).toBe(integer);
                if (integer) {
                    digitTargets.add(target.id);
                    digitSelections++;
                    const withoutWidth = evaluator.evaluate(selected.filter(label => label === Scope.IntegerNumbers
                        || !integerLabels.includes(label as Scope)));
                    expect(withoutWidth.assessments).toEqual(expect.arrayContaining([
                        expect.objectContaining({facet: 'operandDigits', status: 'missing'})
                    ]));
                }
                selectionCount++;
            }
        }
        expect(missing).toBe(0);
        expect(digitTargets.size).toBe(8);
        expect(digitSelections).toBe(12);
        expect(selectionCount).toBe(22);
        expect(rangeDeferrals).toBe(14);
    });

    it('keeps quantity and notation invariants separate from the conditional integer declarations', () => {
        for (const label of quantityLabels) {
            expect(generator.generalLabels).toContain(label);
            expect(view.generalLabels).not.toContain(label);
        }
        for (const label of notationLabels) {
            expect(view.generalLabels).toContain(label);
            expect(generator.generalLabels).not.toContain(label);
        }
        expect(generator.generalLabels).not.toContain(Scope.IntegerNumbers);
        expect(view.generalLabels).not.toContain(Scope.IntegerNumbers);
        expect(generator.labels).not.toContain(Scope.DecimalNumbers);
        expect(view.schema).toEqual({});
    });

    it.each(targets)('preserves configuration, mathematical draws and randomness for $id', target => {
        const precedingSchema = {...generator.schema!, coinDenomination: [coinDenominations,
            selectExactLabelSetMap([[[], 'none'],
                ...coinDenominations.map(denomination => [[denomination], denomination] as const)])] as const};
        // Remove only the additive integer claims; retain the current mathematical range contract.
        const retainedRules: readonly GeneratorCompatibilityRule[] = generator.spec.compatibility ?? generator.compatibility ?? [];
        const precedingRules = retainedRules.filter(rule => rule.id !== 'currency-integer-denominations');
        const preceding = {...generator,
            schema: precedingSchema,
            labels: [...generator.generalLabels, ...extractSchemaLabels(precedingSchema)],
            compatibility: precedingRules,
            spec: {...generator.spec, compatibility: precedingRules}
        };
        const precedingView = {...view,
            generalLabels: view.generalLabels.filter(label => label !== Scope.DecimalNumbers),
            supportedLabels: view.supportedLabels.filter(label => label !== Scope.DecimalNumbers),
            spec: {...view.spec, generalLabels: view.generalLabels.filter(label => label !== Scope.DecimalNumbers)}
        };
        const before = matchTarget(target, preceding, precedingView);
        const after = matchTarget(target, generator, view);
        if (!before.matched || !after.matched) throw new Error(`Currency target stopped matching: ${target.id}`);
        const producer = new CurrencyArithmeticGenerator();
        const precedingProducer = {type: producer.type, schema: precedingSchema, generate: producer.generate.bind(producer)};
        for (const mode of ['question', 'solution'] as const) for (let instanceIdx = 0; instanceIdx < 12; instanceIdx++) {
            const sampleKey = computeSampleKey({...after.plan.identity, split: 'train', mode, instanceIdx});
            const seed = computeSampleSeed(sampleKey, 1);
            const origin = {sampleKey, seed, attempt: 1, generatorSchema: generator.schema!, viewSchema: view.schema};
            const precedingConfig = resolvePlannedConfigurations({...origin, generatorSchema: precedingSchema, plan: before.plan});
            const currentConfig = resolvePlannedConfigurations({...origin, plan: after.plan});
            expect(currentConfig.generatorConfig).toEqual(precedingConfig.generatorConfig);
            expect(currentConfig.generatorRandomState).toBe(precedingConfig.generatorRandomState);
            expect(currentConfig.view.config).toEqual(precedingConfig.view.config);
            expect(currentConfig.view.randomState).toBe(precedingConfig.view.randomState);

            const precedingDraw = generatePlannedDraw({...origin, generator: precedingProducer, plan: before.plan});
            const precedingState = getRandomState();
            const currentDraw = generatePlannedDraw({...origin, generator: producer, plan: after.plan});
            expect(currentDraw.stub).not.toBeNull();
            expect(currentDraw.stub!.data).toEqual(precedingDraw.stub!.data);
            expect(getRandomState()).toBe(precedingState);
            expect(currentDraw.labels.filter(label => label !== Scope.DecimalNumbers && !integerLabels.includes(label as Scope)))
                .toEqual(precedingDraw.labels);
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
