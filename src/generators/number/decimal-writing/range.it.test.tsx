import {Area, Scope} from 'edugraph-ts';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {resolveDependencyAuditAnnotation} from '../../../lib/label-dependency-annotation-resolution.ts';
import {matchTarget} from '../../../lib/matching.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {getRandomState} from '../../../lib/random.ts';
import {extractSchemaLabels} from '../../../lib/utils.ts';
import type {PreparedViewConfiguration} from '../../../types/generation-plan.ts';
import type {DecimalReadingRelationProblem, DecimalWritingProblem} from '../../../types/problems.ts';
import {spec as gradeTwo} from '../../../spec/ccss/grade-02.ts';
import {spec as gradeFive} from '../../../spec/ccss/grade-05.ts';
import {spec as nameSpec} from '../../../visuals/views/numbers/numbers-decimal-name-writing/spec.ts';
import {spec as numeralSpec} from '../../../visuals/views/numbers/numbers-decimal-numeral-writing/spec.ts';
import {spec as readingSpec} from '../../../visuals/views/numbers/numbers-decimal-numeral-reading/spec.ts';
import {DecimalReadingRelationsGenerator, buildDecimalReadingRelation} from '../decimal-reading-relations/generator.ts';
import {DecimalReadingRelationsGeneratorSchema as readingSchema, spec as readingGeneratorSpec} from '../decimal-reading-relations/spec.ts';
import {decimalSource} from '../decimal-writing.test-fixtures.ts';
import {DecimalWritingGenerator} from './generator.ts';
import {DecimalWritingGeneratorSchema as writingSchema, spec as writingSpec, type DecimalWritingGeneratorConfig} from './spec.ts';

type DecimalViewId = 'numbers-decimal-name-writing' | 'numbers-decimal-numeral-writing' | 'numbers-decimal-numeral-reading';
type DecimalData = DecimalWritingProblem | DecimalReadingRelationProblem;
const viewSpecs = {'numbers-decimal-name-writing': nameSpec, 'numbers-decimal-numeral-writing': numeralSpec,
    'numbers-decimal-numeral-reading': readingSpec};
const models = {
    writing: {generatorId: writingSpec.generatorId, generalLabels: writingSpec.generalLabels, schema: writingSchema, spec: writingSpec,
        labels: [...writingSpec.generalLabels, ...extractSchemaLabels(writingSchema)], problemType: 'DecimalWritingProblem'},
    reading: {generatorId: readingGeneratorSpec.generatorId, generalLabels: readingGeneratorSpec.generalLabels, schema: readingSchema,
        spec: readingGeneratorSpec, labels: [...readingGeneratorSpec.generalLabels, ...extractSchemaLabels(readingSchema)],
        problemType: 'DecimalReadingRelationProblem'}
};
const viewModel = (viewId: DecimalViewId) => ({viewId, generalLabels: viewSpecs[viewId].generalLabels,
    supportedLabels: [...viewSpecs[viewId].generalLabels], schema: {}, spec: viewSpecs[viewId],
    problemType: viewId === 'numbers-decimal-numeral-reading' ? 'DecimalReadingRelationProblem' : 'DecimalWritingProblem'});
const sourceTargets = [...gradeTwo, ...gradeFive];
const routes = [
    {targetId: '2.NBT.A.3-number-names~64737390', producer: 'writing', viewId: 'numbers-decimal-name-writing', uppers: [5]},
    {targetId: '2.NBT.A.3-number-names~fe3a0c16', producer: 'writing', viewId: 'numbers-decimal-name-writing', uppers: [10]},
    {targetId: '5.NBT.A.3a-write-decimal-number-names~dda779d5', producer: 'writing', viewId: 'numbers-decimal-name-writing', uppers: [5, 10]},
    {targetId: '5.NBT.A.3a-write-decimal-numerals~8cee5f30', producer: 'writing', viewId: 'numbers-decimal-numeral-writing', uppers: [5, 10]},
    {targetId: '5.NBT.A.3a-read-decimal-numerals~d058a881', producer: 'reading', viewId: 'numbers-decimal-numeral-reading', uppers: [5, 10]}
] as const;

let NameView: typeof import('../../../visuals/views/numbers/numbers-decimal-name-writing/view.tsx')['NumbersDecimalNameWriting'];
let NumeralView: typeof import('../../../visuals/views/numbers/numbers-decimal-numeral-writing/view.tsx')['NumbersDecimalNumeralWriting'];
let ReadingView: typeof import('../../../visuals/views/numbers/numbers-decimal-numeral-reading/view.tsx')['NumbersDecimalNumeralReading'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const [name, numeral, reading] = await Promise.all([
        import('../../../visuals/views/numbers/numbers-decimal-name-writing/view.tsx'),
        import('../../../visuals/views/numbers/numbers-decimal-numeral-writing/view.tsx'),
        import('../../../visuals/views/numbers/numbers-decimal-numeral-reading/view.tsx')
    ]);
    NameView = name.NumbersDecimalNameWriting;
    NumeralView = numeral.NumbersDecimalNumeralWriting;
    ReadingView = reading.NumbersDecimalNumeralReading;
});
afterAll(() => vi.unstubAllGlobals());

function render(viewId: DecimalViewId, data: DecimalData, labels: string[], isSolutionView: boolean,
    preparedView: PreparedViewConfiguration = {version: 1, viewId, planHash: 'decimal-fixture', variantHash: 'empty',
        config: {}, labels: [], randomState: 1}): string {
    const common = {targetLabels: labels, seed: 17, isSolutionView, preparedView};
    if (viewId === 'numbers-decimal-numeral-reading' && data.kind === 'decimal-reading-relation')
        return renderToStaticMarkup(createElement(ReadingView, {payload: {...common, viewId,
            problem: {type: 'writing', data, labels}}}));
    if (viewId === 'numbers-decimal-name-writing' && data.kind === 'decimal-writing')
        return renderToStaticMarkup(createElement(NameView, {payload: {...common, viewId,
            problem: {type: 'writing', data, labels}}}));
    if (viewId === 'numbers-decimal-numeral-writing' && data.kind === 'decimal-writing')
        return renderToStaticMarkup(createElement(NumeralView, {payload: {...common, viewId,
            problem: {type: 'writing', data, labels}}}));
    throw Error('A decimal producer/view family was mismatched');
}

function quantitiesOf(data: DecimalData): number[] {
    return data.kind === 'decimal-writing' ? [data.valueInThousandths / 1000]
        : [data.source.valueInThousandths, ...data.comparisonValues].map(value => value / 1000);
}

describe('decimal scalar-range consumer and source contracts', () => {
    it('retains the five source lineages with eight complete preselected bindings', () => {
        expect(routes).toHaveLength(5);
        expect(routes.reduce((count, route) => count + route.uppers.length, 0)).toBe(8);
        expect(sourceTargets.filter(target => routes.some(route => route.targetId === target.id))).toHaveLength(5);
    });

    it.each(routes)('preserves all selected ranges and Q/S receipt replay for $targetId', route => {
        const target = sourceTargets.find(item => item.id === route.targetId)!;
        const model = models[route.producer], consumer = viewModel(route.viewId);
        const matched = matchTarget(target, model, consumer);
        expect(matched.matched).toBe(true);
        if (!matched.matched) throw Error('A reviewed decimal source lineage lost coverage');
        const selections = enumerateDependencyAuditSelections(matched.plan);
        expect(selections.status).toBe('complete');
        expect(selections.selections).toHaveLength(route.uppers.length);
        const upperBands = new Set<number>();
        const generator = route.producer === 'writing' ? new DecimalWritingGenerator() : new DecimalReadingRelationsGenerator();
        for (const selection of selections.selections) {
            expect(resolveDependencyAuditAnnotation({id: selection.variantHash, plan: matched.plan, selection,
                generator: {schema: model.schema, spec: model.spec}, view: {schema: {}, spec: consumer.spec}})
                .annotationResolution.status).toBe('not_required');
            const receipt = createGenerationSelectionReceipt(matched.plan, selection.choices);
            for (const mode of ['question', 'solution']) for (let seed = 0; seed < 8; seed++) {
                const sampleKey = [target.id, model.generatorId, route.viewId, 'train', mode, 'inst:0'].join('#');
                const input = {generator, generatorSchema: model.schema, generatorSpec: model.spec, viewSchema: {}, viewSpec: consumer.spec,
                    plan: matched.plan, sampleKey, seed, attempt: 1,
                    replay: {version: 1 as const, sampleKey, seed, attempt: 1, selection: receipt}};
                const resolved = resolvePlannedConfigurations(input);
                const config: Pick<DecimalWritingGeneratorConfig, 'range'> = resolved.generatorConfig;
                if (!config.range) throw Error('A decimal source plan must supply its canonical value range.');
                const range = config.range;
                upperBands.add(range.max);
                expect(range.min).toBe(range.max === 5 ? 0 : 5);
                const first = generatePlannedDraw(input), continuation = getRandomState();
                expect(first.stub).not.toBeNull();
                expect(first.labels).toContain(Scope.NumbersWithoutZero);
                expect(first.labels).not.toContain(Scope.NumbersWithZero);
                expect(first.labels.includes(Scope.NumbersLarger5)).toBe(range.max === 10);
                expect(first.replay.selection).toEqual(receipt);
                expect(generatePlannedDraw(input)).toEqual(first);
                expect(getRandomState()).toBe(continuation);
                const data = first.stub!.data as DecimalData, quantities = quantitiesOf(data);
                expect(quantities.every(value => value > 0 && value >= range.min && value <= range.max)).toBe(true);
                expect(Math.max(...quantities)).toBeGreaterThan(range.max === 5 ? -1 : 5);
                expect(Math.min(...quantities)).toBeLessThan(range.max === 5 ? 5 : 10);
                const html = render(route.viewId, data, first.labels, mode === 'solution', first.view);
                expect(html).not.toMatch(/Rendering Error|NaN|undefined/);
                expect(html).toContain('decimal');
                if (route.viewId === 'numbers-decimal-numeral-reading') expect(html.includes('✓')).toBe(mode === 'solution');
            }
        }
        expect([...upperBands].sort((a, b) => a - b)).toEqual([...route.uppers]);
    });

    it.each(['numbers-decimal-name-writing', 'numbers-decimal-numeral-writing', 'numbers-decimal-numeral-reading'] as const)(
        'retains every legitimate notation/range and rejects opposite payload families for%s', viewId => {
            const consumer = viewModel(viewId), reading = viewId === 'numbers-decimal-numeral-reading';
            const model = reading ? models.reading : models.writing;
            for (const notation of reading ? [Area.DecimalNotation] : [Area.DecimalNotation, Area.NumberNameNotation]) {
                for (const range of [[Scope.NumbersSmaller5], [Scope.NumbersLarger5, Scope.NumbersSmaller10]]) {
                    const labels = [notation, ...range, ...consumer.generalLabels, Scope.NumbersWithoutZero];
                    expect(matchTarget({id: 'future-decimal', labels}, model, consumer).matched).toBe(true);
                    expect(matchTarget({id: 'future-decimal-zero', labels: [...labels, Scope.NumbersWithZero]}, model, consumer))
                        .toMatchObject({matched: false, reason: 'unsupported-label', label: Scope.NumbersWithZero});
                }
            }
            expect(matchTarget({id: 'wrong-decimal-family', labels: [Area.DecimalNotation, Scope.NumbersSmaller5, ...consumer.generalLabels]},
                reading ? models.writing : models.reading, consumer)).toMatchObject({matched: false, reason: 'incompatible-type'});
        }
    );

    it.each(['numbers-decimal-name-writing', 'numbers-decimal-numeral-writing', 'numbers-decimal-numeral-reading'] as const)(
        'preserves zero placeholders and the unknown answer in both modes for%s', viewId => {
            for (const whole of [0, 5]) {
                const source = decimalSource(whole, [0, 0, 5], 3);
                const data = viewId === 'numbers-decimal-numeral-reading' ? buildDecimalReadingRelation(source) : source;
                const labels = [Scope.NumbersWithoutZero, ...viewSpecs[viewId].generalLabels,
                    ...(whole === 0 ? [Scope.NumbersSmaller5] : [Scope.NumbersLarger5, Scope.NumbersSmaller10])];
                expect(quantitiesOf(data).every(value => value > 0)).toBe(true);
                for (const solution of [false, true]) {
                    const html = render(viewId, data, labels, solution);
                    expect(html).not.toMatch(/Rendering Error|NaN|undefined/);
                    if (viewId === 'numbers-decimal-numeral-reading') {
                        expect(html).toContain(source.canonicalNumeral);
                        expect(html.includes('✓')).toBe(solution);
                    } else if (viewId === 'numbers-decimal-name-writing') {
                        expect(html).toContain(source.canonicalNumeral);
                        expect(html.includes((whole === 0 ? 'zero' : 'five') + ' and five thousandths')).toBe(solution);
                    } else {
                        expect(html).toContain((whole === 0 ? 'zero' : 'five') + ' and five thousandths');
                        expect(html.includes(source.canonicalNumeral)).toBe(solution);
                        expect(html.includes('border-dashed')).toBe(!solution);
                    }
                }
            }
        }
    );
});
