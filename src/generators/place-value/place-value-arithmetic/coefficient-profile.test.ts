import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {resolveDependencyAuditAnnotation} from '../../../lib/label-dependency-annotation-resolution.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolvePlannedConfigurations, generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {hasStaticResolution} from '../../../lib/static-resolvers.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {spec as view} from '../../../visuals/views/place-value/place-value-arithmetic-model/spec.ts';
import {resolveCoefficientPresence, permitsCoefficientProfile} from './coefficient-profile.ts';
import {PlaceValueArithmeticGenerator} from './generator.ts';
import {PlaceValueArithmeticGeneratorSchema, spec} from './spec.ts';
import {hasCoefficientZero, primaryWidthRows, WidthDomain} from './width-domain.ts';

const examples = [
    {operation: 'addition', regrouping: false}, {operation: 'addition', regrouping: true},
    {operation: 'subtraction', regrouping: false}, {operation: 'subtraction', regrouping: true},
    {operation: 'subtraction', regrouping: false, zeroResult: true}
] as const;
const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
    schema: PlaceValueArithmeticGeneratorSchema, spec};
const consumer = {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view};

describe('complete place-value coefficient presence profiles', () => {
    it.each(examples)('partitions all old $operation pairs with regrouping=$regrouping', example => {
        for (const maximum of [19, 99, 999]) for (const width of ['legacy', 'single', 'multiple'] as const) {
            const domain: WidthDomain = {...example, minimum: 1, maximum};
            const original = primaryWidthRows(domain, width);
            const oldRows = new Map(original.map(row => [row.first, row]));
            const children = [false, true].map(coefficientZero => primaryWidthRows({...domain, coefficientZero}, width));
            const size = (rows: typeof original) => rows.reduce((sum, row) => sum + row.seconds.length, 0);
            const mass = (rows: typeof original) => rows.reduce((sum, row) => sum + row.weight, 0);
            expect(size(children[0]!) + size(children[1]!)).toBe(size(original));
            expect(mass(children[0]!) + mass(children[1]!)).toBeCloseTo(mass(original), 12);
            for (const [index, rows] of children.entries()) for (const row of rows) {
                const old = oldRows.get(row.first)!;
                const oldSeconds = new Set(old.seconds);
                expect(row.weight / row.seconds.length).toBeCloseTo(old.weight / old.seconds.length, 14);
                expect(row.seconds.every(second => oldSeconds.has(second)
                    && hasCoefficientZero(row.first, second, domain.operation) === Boolean(index))).toBe(true);
                // No-higher-borrow guard makes adjusted-tens zero already
                // evidenced by the subtrahend's visible zero tens coefficient.
                if (domain.operation === 'subtraction' && domain.regrouping
                    && Math.floor(row.first % 100 / 10) === 1) {
                    expect(row.seconds.every(second => Math.floor(second % 100 / 10) === 0)).toBe(true);
                }
            }
        }
    });

    it('trusts only the reviewed deterministic identity and checks all complete context branches', () => {
        expect(hasStaticResolution(resolveCoefficientPresence)).toBe(true);
        expect(hasStaticResolution(Object.assign((labels: string[]) => resolveCoefficientPresence(labels),
            resolveCoefficientPresence))).toBe(false);
        const flags = [Area.IntegerRegrouping, Scope.SingleDigitSmallestOperand,
            Scope.TwoDigitLargestOperand, Scope.MultiplesOf10];
        for (const operation of [Area.Addition, Area.AdditionPlaceValuePartitioning,
            Area.Subtraction, Area.SubtractionPlaceValuePartitioning]) for (let bits = 0; bits < 16; bits++) {
            for (const width of [[], [Scope.SingleDigitLargestOperand], [Scope.MultipleDigitLargestOperand]]) {
                for (const bound of [Scope.NumbersSmaller10, Scope.NumbersSmaller100, Scope.NumbersSmaller1000]) {
                    for (const zero of [[], [Scope.NumbersWithZero], [Scope.NumbersWithoutZero],
                        [Scope.NumbersWithZero, Scope.NumbersWithoutZero]]) {
                        const labels = [operation, bound, ...width, ...zero, ...flags.filter((_, bit) => bits & 1 << bit)];
                        const state = getRandomState(), resolved = resolveCoefficientPresence(labels);
                        expect(resolveCoefficientPresence(labels)).toBe(resolved);
                        expect(getRandomState()).toBe(state);
                        if (zero.length === 2) expect(resolved).toBeUndefined();
                    }
                }
            }
        }
    });

    it('keeps broad subtraction positive in direct and planned paths while preserving explicit equality', () => {
        for (const operation of [Area.Addition, Area.Subtraction]) for (const regrouping of [false, true]) {
            for (const explicit of [false, true]) {
                const labels = [operation, Scope.NumbersSmaller1000, ...view.generalLabels,
                    ...(regrouping ? [Area.IntegerRegrouping] : []), ...(explicit ? [Scope.NumbersWithZero] : [])];
                const match = planModelCompatibility({id: 'coefficient', labels}, model, consumer);
                expect(match.supported).toBe(true);
                if (!match.supported) throw new Error(match.reason);
                const selections = enumerateDependencyAuditSelections(match.plan);
                expect(selections.status).toBe('complete');
                for (const selection of selections.selections) {
                    const resolved = resolveDependencyAuditAnnotation({id: 'coefficient', plan: match.plan,
                        selection, generator: model, view: consumer});
                    expect(resolved.annotationResolution.status).toBe('not_required');
                    expect(resolved.labels.includes(Scope.NumbersWithZero))
                        .not.toBe(resolved.labels.includes(Scope.NumbersWithoutZero));
                    const sampleKey = `coefficient#${spec.generatorId}#${view.viewId}#train#question#inst:0`;
                    const input = {generator: new PlaceValueArithmeticGenerator(), generatorSchema: PlaceValueArithmeticGeneratorSchema,
                        viewSchema: {}, generatorSpec: spec, viewSpec: view, plan: match.plan, sampleKey, seed: 17, attempt: 1,
                        replay: {version: 1 as const, sampleKey, seed: 17, attempt: 1,
                            selection: createGenerationSelectionReceipt(match.plan, selection.choices)}};
                    const configured = resolvePlannedConfigurations(input);
                    const equality = explicit && operation === Area.Subtraction && !regrouping;
                    expect(configured.generatorConfig.requireZero).toBe(equality);
                    const draw = generatePlannedDraw(input);
                    expect(draw.stub).not.toBeNull();
                    expect(draw.stub!.data.answer === 0).toBe(equality);
                    expect(hasCoefficientZero(draw.stub!.data.num1, draw.stub!.data.num2, draw.stub!.data.operation))
                        .toBe(configured.generatorConfig.coefficientPresence);
                    expect(generatePlannedDraw(input)).toEqual(draw);
                }
                for (let seed = 0; seed < 24; seed++) {
                    setSeed(seed);
                    const config = extractConfig(PlaceValueArithmeticGeneratorSchema, labels).config;
                    expect(config.requireZero).toBe(explicit && operation === Area.Subtraction && !regrouping);
                    const generated = new PlaceValueArithmeticGenerator().generate(config)!;
                    expect(generated).not.toBeNull();
                    expect(hasCoefficientZero(generated.data.num1, generated.data.num2, generated.data.operation))
                        .toBe(config.coefficientPresence);
                }
            }
        }
    });

    it('makes truthful absence matchable, rejecting one-digit absence and contradictory claims', () => {
        const labels = [Area.Subtraction, Scope.NumbersSmaller1000, ...view.generalLabels];
        for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            const stub = generateWithLabels(new PlaceValueArithmeticGenerator(), [...labels, zero])!;
            expect(stub.labels).toContain(zero);
            expect(stub.labels).not.toContain(zero === Scope.NumbersWithZero ? Scope.NumbersWithoutZero : Scope.NumbersWithZero);
        }
        expect(planModelCompatibility({id: 'single-absence', labels: [...labels,
            Scope.SingleDigitLargestOperand, Scope.NumbersWithoutZero]}, model, consumer).supported).toBe(false);
        expect(planModelCompatibility({id: 'conflict', labels: [...labels,
            Scope.NumbersWithZero, Scope.NumbersWithoutZero]}, model, consumer).supported).toBe(false);
        expect(permitsCoefficientProfile(label => [Area.Subtraction, Scope.NumbersWithZero,
            Scope.NumbersWithoutZero].includes(label as never), false)).toBe(false);
    });
});
