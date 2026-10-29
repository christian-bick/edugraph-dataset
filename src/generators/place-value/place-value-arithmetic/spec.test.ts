import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolveInferredLabels} from '../../../lib/inferred-labels.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {spec as modelView} from '../../../visuals/views/place-value/place-value-arithmetic-model/spec.ts';
import {spec as writtenView} from '../../../visuals/views/place-value/place-value-arithmetic-written-method/spec.ts';
import {spec as explanationView} from '../../../visuals/views/place-value/place-value-arithmetic-explanation/spec.ts';
import {PlaceValueArithmeticGenerator} from './generator.ts';
import {PlaceValueArithmeticGeneratorSchema, spec} from './spec.ts';

const invariantLabels = [
    Scope.TwoOperands,
    Scope.IntegerNumbers,
    Scope.Base10,
    Scope.NumbersWithoutNegatives
];

const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
    schema: PlaceValueArithmeticGeneratorSchema, spec};
const views = [modelView, writtenView, explanationView];

const generate = (labels: string[]) => generateWithLabels(
    new PlaceValueArithmeticGenerator(),
    [...labels, Scope.TwoOperands, Scope.NumbersSmaller100, Ability.ProcedureUnderstanding]
);

describe('PlaceValueArithmeticGenerator spec integration', () => {
    it('annotates zero absence only for positive whole-tens subtraction', () => {
        const generator = new PlaceValueArithmeticGenerator();
        const labels = [Area.Subtraction, Scope.MultiplesOf10, Scope.NumbersSmaller100];
        for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, labels)!;
            expect(stub.labels).toContain(Scope.NumbersWithoutZero);
            expect(stub.labels).not.toContain(Scope.NumbersWithZero);
            for (const value of [stub.data.num1, stub.data.num2, stub.data.answer]) {
                expect(value).toBeGreaterThan(0);
                expect(value % 10).toBe(0);
            }
            setSeed(seed);
            const withZero = generateWithLabels(generator, [...labels, Scope.NumbersWithZero])!;
            expect(withZero.data.answer).toBe(0);
            expect(withZero.labels).toContain(Scope.NumbersWithZero);
            expect(withZero.labels).not.toContain(Scope.NumbersWithoutZero);
        }
    });

    it.each([
        [Area.AdditionPlaceValuePartitioning, Scope.MultiplesOf10, Scope.TwoDigitLargestOperand],
        [Area.Addition], [Area.Addition, Area.IntegerRegrouping],
        [Area.Subtraction], [Area.Subtraction, Area.IntegerRegrouping]
    ].map(labels => ({labels})))('does not generalize whole-tens zero absence to $labels', ({labels}) => {
        setSeed(12);
        const stub = generateWithLabels(new PlaceValueArithmeticGenerator(), [...labels, Scope.NumbersSmaller1000]);
        expect(stub).not.toBeNull();
        expect(stub!.labels).not.toContain(Scope.NumbersWithoutZero);
    });

    it.each([Area.Subtraction, Area.SubtractionPlaceValuePartitioning])(
        'annotates the guaranteed multi-digit largest operand for %s with borrowing', operation => {
            const widths = new Set<number>();
            for (let seed = 0; seed < 32; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(new PlaceValueArithmeticGenerator(), [operation,
                    Area.IntegerRegrouping, Scope.NumbersSmaller1000]);
                expect(stub).not.toBeNull();
                expect(stub!.labels).toContain(Scope.MultipleDigitLargestOperand);
                expect(stub!.labels).not.toContain(Scope.TwoDigitLargestOperand);
                expect(stub!.data.num1).toBeGreaterThan(stub!.data.num2);
                expect(stub!.data.num1 % 10).toBeLessThan(stub!.data.num2 % 10);
                expect(stub!.data.num1).toBeGreaterThanOrEqual(10);
                widths.add(String(stub!.data.num1).length);
            }
            expect(widths).toEqual(new Set([2, 3]));
        }
    );

    it.each([
        [Area.Addition], [Area.Addition, Area.IntegerRegrouping],
        [Area.AdditionPlaceValuePartitioning, Area.IntegerRegrouping],
        [Area.Subtraction], [Area.SubtractionPlaceValuePartitioning]
    ].map(labels => ({labels})))('uses the selected general width instead of assuming borrowing: $labels', ({labels}) => {
        setSeed(9);
        const stub = generateWithLabels(new PlaceValueArithmeticGenerator(), [...labels, Scope.NumbersSmaller1000]);
        expect(stub).not.toBeNull();
        const width = Math.max(stub!.data.num1, stub!.data.num2) <= 9
            ? Scope.SingleDigitLargestOperand : Scope.MultipleDigitLargestOperand;
        expect(stub!.labels).toContain(width);
    });

    it('makes a truthful borrowed width matching-capable and rejects single-digit borrowing', () => {
        const labels = [Area.SubtractionPlaceValuePartitioning, Area.IntegerRegrouping,
            Scope.NumbersSmaller1000, ...modelView.generalLabels];
        const consumer = {viewId: modelView.viewId, generalLabels: modelView.generalLabels, schema: {}, spec: modelView};
        expect(planModelCompatibility({id: 'borrow', labels}, model, consumer).supported).toBe(true);
        expect(planModelCompatibility({id: 'borrow-with-width',
            labels: [...labels, Scope.MultipleDigitLargestOperand]}, model, consumer).supported).toBe(true);
        expect(planModelCompatibility({id: 'borrow-with-width',
            labels: [...labels, Scope.SingleDigitLargestOperand]}, model, consumer).supported).toBe(false);
    });

    it.each([modelView, writtenView])('resolves and replays the additional annotation for $viewId', view => {
        const target = {id: 'borrow', labels: [Area.SubtractionPlaceValuePartitioning, Area.IntegerRegrouping,
            Scope.NumbersSmaller1000, ...view.generalLabels]};
        const result = planModelCompatibility(target, model,
            {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view});
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error('Expected borrowing to remain admitted.');
        const input = {generator: new PlaceValueArithmeticGenerator(), viewSchema: {}, generatorSpec: spec,
            viewSpec: view, plan: result.plan, sampleKey: `borrow#place-value-arithmetic#${view.viewId}#train#question#inst:0`,
            attempt: 1, seed: 42};
        const draw = generatePlannedDraw(input);
        const state = getRandomState();
        expect(draw.stub).not.toBeNull();
        expect(draw.labels).toContain(Scope.MultipleDigitLargestOperand);
        expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
        expect(getRandomState()).toBe(state);
    });

    it('preserves direct configuration, payload and entropy with unspecified operations as well', () => {
        const generator = new PlaceValueArithmeticGenerator();
        const withoutInference = {...spec, inferredLabels: undefined};
        for (const operation of [[], [Area.Addition], [Area.Subtraction],
            [Area.AdditionPlaceValuePartitioning], [Area.SubtractionPlaceValuePartitioning]]) {
            for (const regrouping of [[], [Area.IntegerRegrouping]]) {
                const labels = [...operation, ...regrouping, Scope.NumbersSmaller1000];
                for (const seed of [0, 1, 17, 2026]) {
                    const draws = [withoutInference, spec].map(owner => {
                        setSeed(seed);
                        const resolved = extractConfig(generator.schema, labels, {spec: owner, owner: 'generator'});
                        const configurationState = getRandomState();
                        const stub = generator.generate(resolved.config);
                        return {config: resolved.config, labels: resolved.resolvedLabels, configurationState,
                            stub, state: getRandomState()};
                    });
                    const expected = draws[0];
                    const width = expected.config.operation === Area.Subtraction && expected.config.requireRegrouping
                        ? [Scope.MultipleDigitLargestOperand] : [];
                    expect(draws[1]).toEqual({...expected, labels: [...new Set([...expected.labels, ...width])]});
                }
            }
        }
        const {config} = extractConfig(generator.schema, [Area.Subtraction, Area.IntegerRegrouping,
            Scope.NumbersSmaller1000]);
        expect(resolveInferredLabels({spec, schema: generator.schema, config,
            labels: [Scope.MultipleDigitLargestOperand], owner: 'generator'})).toEqual([Scope.MultipleDigitLargestOperand]);
    });

    it('declares invariant math while parameterizing regrouping and operand constraints', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining(invariantLabels));
        expect(spec.generalLabels).not.toContain(Area.IntegerRegrouping);
        expect(spec.generalLabels).not.toContain(Scope.MultiplesOf10);
        expect(spec.generalLabels).not.toContain(Scope.SingleDigitSmallestOperand);
        expect(spec.generalLabels).not.toContain(Scope.NumbersWithZero);
    });

    it.each([
        ['without regrouping', [], 'none'],
        ['with regrouping', [Area.IntegerRegrouping], 'compose-ten']
    ] as const)('resolves two-digit plus single-digit %s', (_name, extraLabels, regroupingKind) => {
        setSeed(regroupingKind);
        const stub = generate([
            Area.AdditionPlaceValuePartitioning,
            Scope.SingleDigitSmallestOperand,
            Scope.TwoDigitLargestOperand,
            ...extraLabels
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operandProfile).toBe('two-digit-single-digit');
        expect(stub!.data.regrouping.kind).toBe(regroupingKind);
        expect(stub!.labels).toEqual(expect.arrayContaining([
            Area.AdditionPlaceValuePartitioning,
            Scope.SingleDigitSmallestOperand,
            Scope.TwoDigitLargestOperand
        ]));
        expect(stub!.labels).not.toContain(Area.Addition);
    });

    it('resolves two-digit plus a multiple of 10', () => {
        const stub = generate([
            Area.AdditionPlaceValuePartitioning,
            Scope.MultiplesOf10,
            Scope.TwoDigitLargestOperand
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operandProfile).toBe('two-digit-multiple-of-ten');
        expect(stub!.data.num2 % 10).toBe(0);
        expect(stub!.data.regrouping.kind).toBe('none');
    });

    it.each([
        [Scope.NumbersWithoutZero, false],
        [Scope.NumbersWithZero, true]
    ] as const)('resolves multiples-of-10 subtraction for %s', (zeroLabel, requireZero) => {
        setSeed(zeroLabel);
        const stub = generate([
            Area.Subtraction,
            Area.PlaceValue,
            Scope.MultiplesOf10,
            Scope.NumbersWithoutNegatives,
            zeroLabel
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operandProfile).toBe('multiples-of-ten');
        expect(stub!.data.answer === 0).toBe(requireZero);
        expect(stub!.labels).toEqual(expect.arrayContaining([
            Area.Subtraction,
            Scope.MultiplesOf10,
            zeroLabel
        ]));
        expect(spec.generalLabels).toContain(Area.PlaceValue);
        expect(stub!.labels).not.toContain(Area.SubtractionPlaceValuePartitioning);
    });

    it.each(views.flatMap(view => [Scope.NumbersWithoutZero, Scope.NumbersWithZero]
        .map(zeroLabel => ({view, zeroLabel}))))(
        'admits whole-tens subtraction without partitioning in $view.viewId / $zeroLabel',
        ({view, zeroLabel}) => {
            const labels = [Area.PlaceValue, Scope.MultiplesOf10, Scope.TwoOperands,
                Scope.NumbersSmaller100, Scope.NumbersWithoutNegatives, zeroLabel, ...view.generalLabels];
            const consumer = {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view};
            const accepted = planModelCompatibility({id: 'whole-tens', labels: [...labels, Area.Subtraction]},
                model, consumer);
            expect(accepted.supported).toBe(true);

            const rejected = planModelCompatibility({id: 'unsupported-partitioning',
                labels: [...labels, Area.SubtractionPlaceValuePartitioning]}, model, consumer);
            expect(rejected).toMatchObject({supported: false, reason: 'incompatible-rules'});
        }
    );

    it.each(views)('preserves the partitioning route for $viewId when regrouping supplies its evidence', view => {
        const labels = [Area.SubtractionPlaceValuePartitioning, Area.IntegerRegrouping,
            Scope.TwoOperands, Scope.NumbersSmaller1000, ...view.generalLabels];
        expect(planModelCompatibility({id: 'partitioned-subtraction', labels}, model,
            {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view}).supported).toBe(true);
    });

    it.each([
        [Area.AdditionPlaceValuePartitioning, 'addition', 'compose-ten'],
        [Area.SubtractionPlaceValuePartitioning, 'subtraction', 'decompose-ten']
    ] as const)('preserves upper-grade %s regrouping resolution', (strategy, operation, kind) => {
        const stub = generateWithLabels(new PlaceValueArithmeticGenerator(), [
            strategy,
            Area.IntegerRegrouping,
            Scope.PhysicalNumbers,
            Scope.TwoOperands,
            Scope.NumbersSmaller1000,
            Ability.ProcedureUnderstanding
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation);
        expect(stub!.data.operandProfile).toBe('general');
        expect(stub!.data.regrouping.kind).toBe(kind);
        expect(stub!.labels).toEqual(expect.arrayContaining([strategy, Area.IntegerRegrouping]));
    });

    it('does not attach a whole-tens width to general addition', () => {
        const labels = [Area.Addition, Scope.TwoDigitSmallestOperand, Scope.NumbersSmaller1000];
        const result = planModelCompatibility({id: 'general-addition-width', labels}, model,
            {viewId: 'neutral', generalLabels: [], schema: {}, spec: {viewId: 'neutral', generalLabels: []}});
        expect(result).toMatchObject({supported: false, reason: 'incompatible-rules'});
        setSeed(0);
        expect(generateWithLabels(new PlaceValueArithmeticGenerator(), labels)).toBeNull();
    });

    it.each([
        [Area.Addition], [Area.Addition, Area.IntegerRegrouping],
        [Area.Subtraction], [Area.Subtraction, Area.IntegerRegrouping],
        [Area.AdditionPlaceValuePartitioning, Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand],
        [Area.AdditionPlaceValuePartitioning, Scope.MultiplesOf10, Scope.TwoDigitLargestOperand],
        [Area.Subtraction, Scope.MultiplesOf10, Scope.NumbersWithoutZero],
        [Area.Subtraction, Scope.MultiplesOf10, Scope.NumbersWithZero]
    ].map(profileLabels => ({profileLabels})))('preserves the old configuration, entropy and choice counts for $profileLabels', ({profileLabels}) => {
        const labels = [...profileLabels, Scope.NumbersSmaller100];
        const generator = new PlaceValueArithmeticGenerator();
        const legacySchema = {...PlaceValueArithmeticGeneratorSchema,
            requireMultipleOf10: [[Scope.MultiplesOf10], hasLabel(Scope.MultiplesOf10)]} as const;
        const domains = [legacySchema, generator.schema].map(schema => {
            setSeed(71);
            const choices = normalizeSchemaChoices(schema, labels, 'generator');
            const result = planModelCompatibility({id: 'legacy-place-value', labels}, {...model, schema},
                {viewId: 'neutral', generalLabels: [], schema: {}, spec: {viewId: 'neutral', generalLabels: []}});
            expect(getRandomState()).toBe(71);
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error('Expected the original place-value profile to remain admitted.');
            return {
                choices: choices.map(domain => [domain.field, domain.alternatives.length]),
                admitted: result.plan.domains.map(domain => [domain.field, domain.alternatives.length]),
                groups: result.plan.groups.map(group => ({fields: group.fields, count: group.assignments.length}))
            };
        });
        expect(domains[1]).toEqual(domains[0]);
        for (const seed of [0, 2, 42]) {
            const draws = [legacySchema, generator.schema].map(schema => {
                setSeed(seed);
                const {config} = extractConfig(schema, labels);
                const configurationState = getRandomState();
                const stub = generator.generate(config);
                return {config, configurationState, stub, state: getRandomState()};
            });
            expect(draws[1]).toEqual(draws[0]);
        }
    });
});
