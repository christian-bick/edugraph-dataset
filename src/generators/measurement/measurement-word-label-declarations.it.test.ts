import {beforeAll, describe, expect, it, vi} from 'vitest';
import {fileURLToPath} from 'node:url';
import {Scope} from 'edugraph-ts';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from '../../lib/model-catalog.ts';
import {matchTarget} from '../../lib/matching.ts';
import {computeSampleKey, computeSampleSeed} from '../../lib/generation.ts';
import {generatePlannedDraw} from '../../lib/planned-generation.ts';
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

const expectedMissingFacets = (labels: readonly string[]) => labels.includes(Scope.FractionNumbers)
    ? ['fractionMagnitude', 'operandDigits'] : ['operandDigits'];

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

describe('measurement word-problem declarations on existing Grade 4 targets', () => {
    it('assigns positive quantities to the generator and decimal digit notation to the view', () => {
        expect(targets).toHaveLength(60);
        expect(generator.generalLabels).toEqual(expect.arrayContaining(quantityLabels));
        expect(view.generalLabels).toEqual(expect.arrayContaining(notationLabels));
        for (const label of notationLabels) expect(generator.generalLabels).not.toContain(label);
        for (const label of quantityLabels) expect(view.generalLabels).not.toContain(label);
        expect(Object.keys(generator.schema!).sort()).toEqual(['measurementKind', 'numberKind', 'operation']);
        expect(view.schema).toEqual({});
    });

    it('leaves the 60 operand-digit and 20 fraction-magnitude source assessments unresolved', () => {
        const evaluator = createLabelDependencyEvaluator();
        const missingCounts = new Map<string, number>();
        for (const target of targets) {
            const matched = matchTarget(target, generator, view);
            if (!matched.matched) throw new Error(`Existing target stopped matching: ${target.id}: ${matched.reason}`);
            const selections = enumerateDependencyAuditSelections(matched.plan);
            expect(selections.status).toBe('complete');
            expect(selections.selections).toHaveLength(1);
            for (const selection of selections.selections) {
                const evaluation = evaluator.evaluate(selection.labels);
                expect(evaluation.context.status).toBe('eligible');
                expect(evaluation.errors).toEqual([]);
                expect(evaluation.conflicts).toEqual([]);
                const missing = evaluation.assessments.filter(item => item.status === 'missing' && item.facet !== 'range');
                expect(missing.map(item => item.facet).sort()).toEqual(expectedMissingFacets(target.labels));
                for (const assessment of missing) {
                    missingCounts.set(assessment.facet, (missingCounts.get(assessment.facet) ?? 0) + 1);
                }
            }
        }
        expect(Object.fromEntries(missingCounts)).toEqual({operandDigits: 60, fractionMagnitude: 20});
    });

    it.each(targets)('emits truthful declarations for $id without changing its claims', target => {
        const originalLabels = [...target.labels];
        const matched = matchTarget(target, generator, view);
        expect(matched.matched).toBe(true);
        if (!matched.matched) throw new Error(`Existing target stopped matching: ${target.id}: ${matched.reason}`);
        expect(matched.plan.targetLabels).toEqual([...originalLabels].sort());
        const selections = enumerateDependencyAuditSelections(matched.plan);
        expect(selections.status).toBe('complete');
        expect(selections.selections).toHaveLength(1);
        const producer = new MeasurementWordProblemsGenerator();
        const checkDraw = (mode: 'question' | 'solution', instanceIdx: number) => {
            const sampleKey = computeSampleKey({...matched.plan.identity, split: 'train', mode, instanceIdx});
            const draw = generatePlannedDraw({generator: producer, viewSchema: view.schema, plan: matched.plan,
                sampleKey, attempt: 1, seed: computeSampleSeed(sampleKey, 1)});
            expect(draw.stub).not.toBeNull();
            expect(draw.labels).toEqual(selections.selections[0].labels);
            expect(draw.labels).toEqual(expect.arrayContaining([...quantityLabels, ...notationLabels]));
            expect(draw.labels).not.toContain(Scope.NumbersWithZero);
            expect(draw.labels).not.toContain(Scope.ProperFractions);
            const coverage = assessLabelDependencyCoverage({generatorId, viewId, kind: 'sample', labels: draw.labels});
            expect(coverage.status).toBe('checked');
            expect(coverage.failures.every(failure => failure.code === 'missing')).toBe(true);
            expect(coverage.failures.map(failure => failure.facet).sort()).toEqual(expectedMissingFacets(target.labels));
            expectPositiveQuantityPresentation(draw.stub!.data as unknown as MeasurementWordProblemGrade4, mode);
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
        expect(target.labels).toEqual(originalLabels);
    });
});
