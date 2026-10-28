import {beforeAll, describe, expect, it, vi} from 'vitest';
import {fileURLToPath} from 'node:url';
import {Ability, Area, Scope} from 'edugraph-ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';
import {matchTarget} from '../../lib/matching.ts';
import {computeSampleKey, computeSampleSeed} from '../../lib/generation.ts';
import {bindingsForSelection, generatePlannedDraw} from '../../lib/planned-generation.ts';
import {createGenerationSelectionReceipt} from '../../lib/compatibility.ts';
import {resolveSchemaChoices} from '../../lib/schema-choices.ts';
import {extractSchemaLabels} from '../../lib/utils.ts';
import {arithmeticOperations, resolveDeclaredOperation} from '../arithmetic/helpers.ts';
import {enumerateDependencyAuditSelections} from '../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../lib/label-dependencies.ts';
import {assessLabelDependencyCoverage} from '../../lib/label-dependency-coverage.ts';
import * as randomSource from '../../lib/random.ts';
import type {MeasurementWordProblemGrade4, MeasurementWordProblemValue} from '../../types/problems.ts';
import {spec as grade4Targets} from '../../spec/ccss/grade-04.ts';
import {MeasurementWordProblemsGenerator} from './measurement-word-problems/generator.ts';
import {buildMeasurementWordProblemPresentation, isValidMeasurementWordProblemGrade4} from '../../visuals/views/measurement/measurement-word-problem-grade4/helpers.ts';

const generatorId = 'measurement-word-problems';
const viewId = 'measurement-word-problem-grade4';
const targets = grade4Targets.filter(target => target.id.startsWith('4.MD.A.2-measurement-word-problems~'));
const quantityLabels = [Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero];
const notationLabels = [Scope.ArabicNumerals, Scope.Base10];
let generator: Awaited<ReturnType<typeof loadGeneratorModelCatalog>>[number];
let view: Awaited<ReturnType<typeof loadViewModelCatalog>>[number];

beforeAll(async () => {
    const [generators, views] = await Promise.all([
        loadGeneratorModelCatalog(undefined, undefined, new Map([
            [generatorId, fileURLToPath(new URL('./measurement-word-problems/spec.ts', import.meta.url))]
        ])),
        loadViewModelCatalog(undefined, undefined, new Map([
            [viewId, fileURLToPath(new URL('../../visuals/views/measurement/measurement-word-problem-grade4/spec.ts', import.meta.url))]
        ]))
    ]);
    generator = generators.find(entry => entry.generatorId === generatorId)!;
    view = views.find(entry => entry.viewId === viewId)!;
});

const exactDisplay = (text: string): MeasurementWordProblemValue => {
    const token = text.match(/\d+(?:[./]\d+)?/)?.[0];
    expect(token).toBeDefined();
    if (token!.includes('/')) {
        const [numerator, denominator] = token!.split('/').map(Number);
        return {numerator, denominator};
    }
    const places = token!.split('.')[1]?.length ?? 0;
    return {numerator: Number(token!.replace('.', '')), denominator: 10 ** places};
};

const expectSameQuantity = (actual: MeasurementWordProblemValue, expected: MeasurementWordProblemValue) => {
    expect(BigInt(actual.numerator) * BigInt(expected.denominator))
        .toBe(BigInt(expected.numerator) * BigInt(actual.denominator));
};

const expectPositiveQuantityPresentation = (data: MeasurementWordProblemGrade4, mode: 'question' | 'solution') => {
    expect(isValidMeasurementWordProblemGrade4(data)).toBe(true);
    const quantities = data.operands.map(operand => operand.role === 'measured'
        ? operand.value : {numerator: operand.count, denominator: 1});
    for (const value of [...quantities, data.answer]) {
        expect(Number.isSafeInteger(value.numerator)).toBe(true);
        expect(Number.isSafeInteger(value.denominator)).toBe(true);
        expect(value.numerator).toBeGreaterThan(0);
        expect(value.denominator).toBeGreaterThan(0);
    }
    if (data.numberKind === 'fraction') {
        const measuredValues = data.operands.flatMap(operand => operand.role === 'measured' ? [operand.value] : []);
        for (const value of [...measuredValues, data.answer]) {
            expect(value.numerator).toBeLessThan(value.denominator);
        }
        for (const operand of data.operands) {
            if (operand.role === 'group-count') expect(operand.count).toBeGreaterThan(1);
        }
    }
    if (data.operation === 'division') {
        expect(data.operands[1].role).toBe('group-count');
        const divisor = quantities[1];
        expect(divisor.denominator).toBe(1);
        expect(divisor.numerator).toBeGreaterThan(1);
        expect(divisor.numerator).toBeLessThan(10);
    }
    if (data.operation === 'multiplication') {
        expect(data.operands[0].role).toBe('group-count');
        if (data.numberKind === 'integer') {
            expect(Math.min(...quantities.map(value => value.numerator))).toBeLessThan(10);
        } else {
            const [groups, measured] = quantities;
            expect(groups.denominator).toBe(1);
            expect(groups.numerator).toBeLessThan(10);
            expect(groups.numerator * measured.denominator).toBeGreaterThan(measured.numerator);
        }
    }
    const [left, right] = quantities;
    const answer = data.operation === 'addition' || data.operation === 'subtraction'
        ? {numerator: left.numerator * right.denominator
            + (data.operation === 'addition' ? 1 : -1) * right.numerator * left.denominator,
        denominator: left.denominator * right.denominator}
        : data.operation === 'multiplication'
            ? {numerator: left.numerator * right.numerator, denominator: left.denominator * right.denominator}
            : {numerator: left.numerator * right.denominator, denominator: left.denominator * right.numerator};
    expectSameQuantity(data.answer, answer);

    const presentation = buildMeasurementWordProblemPresentation(data);
    expect(presentation).not.toBeNull();
    expect(presentation!.story).toMatch(/[0-9]/);
    for (let index = 0; index < quantities.length; index++) {
        expectSameQuantity(exactDisplay(presentation!.operands[index].text), quantities[index]);
    }
    expectSameQuantity(exactDisplay(presentation!.answer.display), data.answer);
    expect(presentation!.answer.display).toMatch(data.numberKind === 'fraction'
        ? /^\d+\/\d+$/ : data.numberKind === 'decimal' ? /^\d+\.\d+$/ : /^\d+$/);
    if (mode === 'question') {
        expect(presentation!.questionEquation).toContain('?');
    } else {
        expect(presentation!.solutionEquation).not.toContain('?');
        expect(presentation!.solutionEquation).toContain(presentation!.answer.equationTerm);
    }
};

const partialTarget = (labels: readonly string[]) => ({
    ...targets[0],
    id: 'measurement-word-declaration-probe',
    labels: [Scope.MeterScale, Scope.SingleStep, Scope.TwoOperands, Ability.TextualReception, ...labels]
});

const admittedConfigurations = (labels: readonly string[], producer = generator) => {
    const target = partialTarget(labels);
    const matched = matchTarget(target, producer, view);
    expect(matched.matched).toBe(true);
    if (!matched.matched) throw new Error(`Partial target stopped matching: ${matched.reason}`);
    const selections = enumerateDependencyAuditSelections(matched.plan);
    expect(selections.status).toBe('complete');
    const configurations = selections.selections.map(selection => {
        const receipt = createGenerationSelectionReceipt(matched.plan, selection.choices);
        const bindings = bindingsForSelection(matched.plan, receipt);
        const resolved = resolveSchemaChoices(producer.schema!, target.labels, bindings.generator);
        return {selection, receipt, config: resolved.config};
    });
    return {target, plan: matched.plan, configurations};
};

const operationValue = (config: Record<string, unknown>) => {
    const profile = config.operandDigits as {role: string; digits: number} | false | undefined;
    return {operation: config.operation,
        largestOperandDigits: profile && profile.role === 'largest' ? profile.digits : undefined};
};

const expectOperationRoles = (labels: readonly string[], config: Record<string, unknown>) => {
    const {operation, largestOperandDigits} = operationValue(config);
    expect(labels.includes(Scope.SingleDigitDivisor)).toBe(operation === Area.Division);
    expect(labels.includes(Scope.SingleDigitSmallestOperand))
        .toBe(operation === Area.Multiplication && config.numberKind === 'integer');
    expect(labels.includes(Scope.SingleDigitLargestOperand))
        .toBe(operation === Area.Multiplication && config.numberKind !== 'integer' || largestOperandDigits === 1);
    expect(labels.includes(Scope.TwoDigitLargestOperand)).toBe(largestOperandDigits === 2);
};

const expectIntegerAdditiveWidth = (labels: readonly string[], data: MeasurementWordProblemGrade4) => {
    if (data.numberKind !== 'integer' || (data.operation !== 'addition' && data.operation !== 'subtraction')) return;
    const largest = Math.max(...data.operands.map(operand => operand.value.numerator));
    expect(labels.includes(Scope.SingleDigitLargestOperand)).toBe(largest < 10);
    expect(labels.includes(Scope.TwoDigitLargestOperand)).toBe(largest >= 10);
};

describe('measurement word-problem declarations on existing Grade 4 targets', () => {
    it('assigns positive quantities to the generator and decimal digit notation to the view', () => {
        expect(targets).toHaveLength(60);
        expect(generator.generalLabels).toEqual(expect.arrayContaining(quantityLabels));
        expect(view.generalLabels).toEqual(expect.arrayContaining(notationLabels));
        for (const label of notationLabels) expect(generator.generalLabels).not.toContain(label);
        for (const label of quantityLabels) expect(view.generalLabels).not.toContain(label);
        expect(Object.keys(generator.schema!).sort()).toEqual(['measurementKind', 'numberKind', 'operandDigits', 'operation']);
        expect(view.schema).toEqual({});
    });

    it('checks 70 source selections without unresolved non-range dependency assessments', () => {
        const evaluator = createLabelDependencyEvaluator();
        const missingCounts = new Map<string, number>();
        let selectionCount = 0;
        for (const target of targets) {
            const matched = matchTarget(target, generator, view);
            if (!matched.matched) throw new Error(`Existing target stopped matching: ${target.id}: ${matched.reason}`);
            const selections = enumerateDependencyAuditSelections(matched.plan);
            expect(selections.status).toBe('complete');
            expect(selections.selections).toHaveLength((target.labels.includes(Area.Addition) || target.labels.includes(Area.Subtraction))
                && target.labels.includes(Scope.IntegerNumbers) ? 2 : 1);
            selectionCount += selections.selections.length;
            for (const selection of selections.selections) {
                const evaluation = evaluator.evaluate(selection.labels);
                expect(evaluation.context.status).toBe('eligible');
                expect(evaluation.errors).toEqual([]);
                expect(evaluation.conflicts).toEqual([]);
                const missing = evaluation.assessments.filter(item => item.status === 'missing' && item.facet !== 'range');
                expect(missing).toEqual([]);
                for (const assessment of missing) {
                    missingCounts.set(assessment.facet, (missingCounts.get(assessment.facet) ?? 0) + 1);
                }
            }
        }
        expect(selectionCount).toBe(70);
        expect(Object.fromEntries(missingCounts)).toEqual({});
    });

    it.each([
        {name: 'number kind and operation omitted', labels: [], count: 14},
        {name: 'multiplication with number kind omitted', labels: [Area.Multiplication], count: 3},
        {name: 'integer kind with operation omitted', labels: [Scope.IntegerNumbers], count: 6},
        {name: 'fraction kind with operation omitted', labels: [Scope.FractionNumbers], count: 4},
        {name: 'decimal kind with operation omitted', labels: [Scope.DecimalNumbers], count: 4}
    ])('preserves the complete semantic configuration set for $name', ({labels, count}) => {
        const precedingSchema = {measurementKind: generator.schema!.measurementKind,
            numberKind: generator.schema!.numberKind, operation: [arithmeticOperations, resolveDeclaredOperation] as const};
        const precedingGenerator = {...generator, schema: precedingSchema,
            labels: [...generator.generalLabels, ...extractSchemaLabels(precedingSchema)], compatibility: [],
            spec: {...generator.spec, compatibility: []}};
        const preceding = admittedConfigurations(labels, precedingGenerator);
        const current = admittedConfigurations(labels);
        const keys = (entries: typeof current.configurations) => [...new Set(entries.map(entry =>
            JSON.stringify({measurementKind: entry.config.measurementKind, numberKind: entry.config.numberKind,
                operation: entry.config.operation})))].sort();
        expect(current.configurations).toHaveLength(count);
        expect(new Set(current.configurations.map(entry => JSON.stringify(entry.config))).size).toBe(count);
        expect(keys(current.configurations)).toEqual(keys(preceding.configurations));
        expect(current.target.labels).toEqual(partialTarget(labels).labels);

        for (const [instanceIdx, entry] of current.configurations.entries()) {
            expectOperationRoles(entry.selection.labels, entry.config);
            for (const mode of ['question', 'solution'] as const) {
                const sampleKey = computeSampleKey({...current.plan.identity, split: 'train', mode, instanceIdx});
                const seed = computeSampleSeed(sampleKey, 1);
                const draw = generatePlannedDraw({generator: new MeasurementWordProblemsGenerator(), viewSchema: view.schema,
                    plan: current.plan, sampleKey, attempt: 1, seed,
                    replay: {version: 1, sampleKey, attempt: 1, seed, selection: entry.receipt}});
                expect(draw.stub).not.toBeNull();
                expect(draw.labels).toEqual(entry.selection.labels);
                const data = draw.stub!.data as unknown as MeasurementWordProblemGrade4;
                expect(data.numberKind).toBe(entry.config.numberKind);
                expectIntegerAdditiveWidth(draw.labels, data);
                expectPositiveQuantityPresentation(data, mode);
            }
        }
    });

    it.each([
        {name: 'integer multiplication', labels: [Area.Multiplication, Scope.IntegerNumbers, Scope.SingleDigitSmallestOperand], kinds: ['integer']},
        {name: 'fraction multiplication', labels: [Area.Multiplication, Scope.FractionNumbers, Scope.SingleDigitLargestOperand], kinds: ['fraction']},
        {name: 'decimal multiplication', labels: [Area.Multiplication, Scope.DecimalNumbers, Scope.SingleDigitLargestOperand], kinds: ['decimal']},
        {name: 'smallest width with omitted kind', labels: [Area.Multiplication, Scope.SingleDigitSmallestOperand], kinds: ['integer']},
        {name: 'largest width with omitted kind', labels: [Area.Multiplication, Scope.SingleDigitLargestOperand], kinds: ['decimal', 'fraction']},
        {name: 'smallest width with omitted kind and operation', labels: [Scope.SingleDigitSmallestOperand], kinds: ['integer']}
    ])('admits the supported explicit role for $name', ({labels, kinds}) => {
        const current = admittedConfigurations(labels);
        expect(current.configurations.map(entry => entry.config.numberKind).sort()).toEqual(kinds);
        for (const entry of current.configurations) {
            expect(entry.config.operation).toBe(Area.Multiplication);
            expect(entry.selection.labels).toEqual(expect.arrayContaining(labels));
            expectOperationRoles(entry.selection.labels, entry.config);
        }
    });

    it.each([
        {name: 'integer addition', labels: [Area.Addition, Scope.IntegerNumbers], operations: [Area.Addition], widths: [1, 2]},
        {name: 'explicit one-digit addition', labels: [Area.Addition, Scope.SingleDigitLargestOperand], operations: [Area.Addition], widths: [1]},
        {name: 'explicit two-digit addition', labels: [Area.Addition, Scope.TwoDigitLargestOperand], operations: [Area.Addition], widths: [2]},
        {name: 'integer subtraction', labels: [Area.Subtraction, Scope.IntegerNumbers], operations: [Area.Subtraction], widths: [1, 2]},
        {name: 'explicit one-digit subtraction', labels: [Area.Subtraction, Scope.SingleDigitLargestOperand], operations: [Area.Subtraction], widths: [1]},
        {name: 'explicit two-digit subtraction', labels: [Area.Subtraction, Scope.TwoDigitLargestOperand], operations: [Area.Subtraction], widths: [2]},
        {name: 'integer one-digit width with operation omitted', labels: [Scope.IntegerNumbers, Scope.SingleDigitLargestOperand], operations: [Area.Addition, Area.Subtraction], widths: [1, 1]},
        {name: 'two-digit width with kind and operation omitted', labels: [Scope.TwoDigitLargestOperand], operations: [Area.Addition, Area.Subtraction], widths: [2, 2]}
    ])('admits exactly the supported integer additive profiles for $name', ({labels, operations, widths}) => {
        const current = admittedConfigurations(labels);
        expect(current.configurations.map(entry => operationValue(entry.config).largestOperandDigits).sort()).toEqual(widths);
        expect([...new Set(current.configurations.map(entry => entry.config.operation))].sort()).toEqual(operations);
        for (const entry of current.configurations) {
            expect(entry.config.numberKind).toBe('integer');
            expect(entry.selection.labels).toEqual(expect.arrayContaining(labels));
            expectOperationRoles(entry.selection.labels, entry.config);
        }
    });

    it('allows a partial largest-width request to select only integer addition/subtraction or noninteger multiplication', () => {
        const current = admittedConfigurations([Scope.SingleDigitLargestOperand]);
        expect(current.configurations.map(entry => [operationValue(entry.config).operation, entry.config.numberKind]).sort())
            .toEqual([[Area.Addition, 'integer'], [Area.Subtraction, 'integer'],
                [Area.Multiplication, 'decimal'], [Area.Multiplication, 'fraction']].sort());
        for (const entry of current.configurations) expectOperationRoles(entry.selection.labels, entry.config);
    });

    it.each([
        {name: 'integer multiplication with largest width', labels: [Area.Multiplication, Scope.IntegerNumbers, Scope.SingleDigitLargestOperand]},
        {name: 'fraction multiplication with smallest width', labels: [Area.Multiplication, Scope.FractionNumbers, Scope.SingleDigitSmallestOperand]},
        {name: 'decimal multiplication with smallest width', labels: [Area.Multiplication, Scope.DecimalNumbers, Scope.SingleDigitSmallestOperand]},
        {name: 'both multiplication bundles', labels: [Area.Multiplication, Scope.SingleDigitSmallestOperand, Scope.SingleDigitLargestOperand]},
        {name: 'addition with multiplication width', labels: [Area.Addition, Scope.SingleDigitSmallestOperand]},
        {name: 'division with multiplication width', labels: [Area.Division, Scope.SingleDigitLargestOperand]},
        {name: 'addition with divisor width', labels: [Area.Addition, Scope.SingleDigitDivisor]},
        {name: 'subtraction with divisor width', labels: [Area.Subtraction, Scope.SingleDigitDivisor]},
        {name: 'multiplication with divisor width', labels: [Area.Multiplication, Scope.SingleDigitDivisor]},
        {name: 'fraction addition with one-digit width', labels: [Area.Addition, Scope.FractionNumbers, Scope.SingleDigitLargestOperand]},
        {name: 'decimal addition with two-digit width', labels: [Area.Addition, Scope.DecimalNumbers, Scope.TwoDigitLargestOperand]},
        {name: 'addition with competing widths', labels: [Area.Addition, Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand]},
        {name: 'fraction subtraction with one-digit width', labels: [Area.Subtraction, Scope.FractionNumbers, Scope.SingleDigitLargestOperand]},
        {name: 'decimal subtraction with two-digit width', labels: [Area.Subtraction, Scope.DecimalNumbers, Scope.TwoDigitLargestOperand]},
        {name: 'subtraction with competing widths', labels: [Area.Subtraction, Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand]},
        {name: 'subtraction with multiplication width', labels: [Area.Subtraction, Scope.SingleDigitSmallestOperand]}
    ])('rejects unsupported explicit claims for $name without rewriting the target', ({labels}) => {
        const target = partialTarget(labels);
        const originalLabels = [...target.labels];
        expect(matchTarget(target, generator, view).matched).toBe(false);
        expect(target.labels).toEqual(originalLabels);
    });

    it.each(targets)('emits truthful declarations for $id without changing its claims', target => {
        const originalLabels = [...target.labels];
        const matched = matchTarget(target, generator, view);
        expect(matched.matched).toBe(true);
        if (!matched.matched) throw new Error(`Existing target stopped matching: ${target.id}: ${matched.reason}`);
        expect(matched.plan.targetLabels).toEqual([...originalLabels].sort());
        const selections = enumerateDependencyAuditSelections(matched.plan);
        expect(selections.status).toBe('complete');
        expect(selections.selections).toHaveLength((target.labels.includes(Area.Addition) || target.labels.includes(Area.Subtraction))
            && target.labels.includes(Scope.IntegerNumbers) ? 2 : 1);
        const producer = new MeasurementWordProblemsGenerator();
        for (const selection of selections.selections) {
            const receipt = createGenerationSelectionReceipt(matched.plan, selection.choices);
            const config = resolveSchemaChoices(generator.schema!, target.labels,
                bindingsForSelection(matched.plan, receipt).generator).config;
            const checkDraw = (mode: 'question' | 'solution', instanceIdx: number) => {
                const sampleKey = computeSampleKey({...matched.plan.identity, split: 'train', mode, instanceIdx});
                const seed = computeSampleSeed(sampleKey, 1);
                const draw = generatePlannedDraw({generator: producer, viewSchema: view.schema, plan: matched.plan,
                    sampleKey, attempt: 1, seed,
                    replay: {version: 1, sampleKey, attempt: 1, seed, selection: receipt}});
                expect(draw.stub).not.toBeNull();
                expect(draw.labels).toEqual(selection.labels);
                expect(draw.labels).toEqual(expect.arrayContaining([...quantityLabels, ...notationLabels]));
                expect(draw.labels).not.toContain(Scope.NumbersWithZero);
                expect(draw.labels.includes(Scope.ProperFractions)).toBe(target.labels.includes(Scope.FractionNumbers));
                expectOperationRoles(draw.labels, config);
                const coverage = assessLabelDependencyCoverage({generatorId, viewId, kind: 'sample', labels: draw.labels});
                expect(coverage.status).toBe('checked');
                expect(coverage.failures).toEqual([]);
                const data = draw.stub!.data as unknown as MeasurementWordProblemGrade4;
                expectIntegerAdditiveWidth(draw.labels, data);
                expectPositiveQuantityPresentation(data, mode);
            };
            for (const mode of ['question', 'solution'] as const) {
                for (let instanceIdx = 0; instanceIdx < 4; instanceIdx++) checkDraw(mode, instanceIdx);
                // Exercise the first and last supported sampler choices, including positive subtraction/division minima.
                for (const boundary of [0, 1 - Number.EPSILON]) {
                    const random = vi.spyOn(randomSource, 'random').mockReturnValue(boundary);
                    try {
                        checkDraw(mode, 4);
                    } finally {
                        random.mockRestore();
                    }
                }
            }
        }
        expect(target.labels).toEqual(originalLabels);
    });
});
