import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {hasStaticResolution} from '../../../lib/static-resolvers.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {resolveDependencyAuditAnnotation} from '../../../lib/label-dependency-annotation-resolution.ts';
import {spec as gradeTwo} from '../../../spec/ccss/grade-02.ts';
import {PlaceValueArithmeticGenerator} from './generator.ts';
import {PlaceValueArithmeticGeneratorSchema, spec} from './spec.ts';
import {primaryWidthRows, samplePrimaryWidth, WidthDomain} from './width-domain.ts';
import {primaryWidthContext, resolvePrimaryWidth} from './width-profile.ts';
import {spec as explanation} from '../../../visuals/views/place-value/place-value-arithmetic-explanation/spec.ts';
import {spec as concrete} from '../../../visuals/views/place-value/place-value-arithmetic-model/spec.ts';
import {spec as written} from '../../../visuals/views/place-value/place-value-arithmetic-written-method/spec.ts';

afterEach(() => vi.restoreAllMocks());
const cases = [
    {operation: 'addition', regrouping: false}, {operation: 'addition', regrouping: true},
    {operation: 'subtraction', regrouping: false}, {operation: 'subtraction', regrouping: true},
    {operation: 'subtraction', regrouping: false, zeroResult: true}
] as const;

describe('place-value primary width finite support', () => {
    it.each(cases)('partitions all original $operation pairs for regrouping=$regrouping', example => {
        for (const maximum of [19, 99, 999]) {
            const domain = {...example, minimum: 1, maximum} as WidthDomain;
            const original = primaryWidthRows(domain, 'legacy');
            const children = [primaryWidthRows(domain, 'single'), primaryWidthRows(domain, 'multiple')];
            const expected = [{count: 0, mass: 0}, {count: 0, mass: 0}];
            for (let left = 1; left <= maximum; left++) for (let right = 1; right <= maximum; right++) {
                let probability: number;
                if (domain.operation === 'addition') {
                    if (left + right > maximum || Math.floor((left % 10 + right % 10) / 10) !== Number(domain.regrouping)) continue;
                    probability = 1 / (maximum - 1) / (maximum - left);
                } else if (domain.zeroResult) {
                    if (left !== right || domain.regrouping) continue;
                    probability = 1 / maximum;
                } else {
                    if (left <= right || (left % 10 < right % 10) !== domain.regrouping) continue;
                    if (Math.floor(left % 100 / 10) < Math.floor(right % 100 / 10) + Number(domain.regrouping)
                        || Math.floor(left / 100) < Math.floor(right / 100)) continue;
                    probability = 1 / (maximum - 1) / (left - 1);
                }
                const item = expected[Math.max(left, right) <= 9 ? 0 : 1]!;
                item.count++; item.mass += probability;
            }
            const count = (rows: typeof original) => rows.reduce((sum, row) => sum + row.seconds.length, 0);
            expect(count(children[0]!) + count(children[1]!)).toBe(count(original));
            const mass = (rows: typeof original) => rows.reduce((sum, row) => sum + row.weight, 0);
            expect(mass(children[0]!) + mass(children[1]!)).toBeCloseTo(mass(original), 12);
            const random = vi.spyOn(rng, 'random');
            for (const [index, rows] of children.entries()) {
                expect(count(rows)).toBe(expected[index]!.count);
                expect(mass(rows)).toBeCloseTo(expected[index]!.mass, 10);
                const width = index === 0 ? 'single' : 'multiple';
                let before = 0;
                for (const row of rows) {
                    const originalRow = original.find(candidate => candidate.first === row.first)!;
                    expect(row.seconds.every(value => originalRow.seconds.includes(value))).toBe(true);
                    expect(row.weight / row.seconds.length)
                        .toBeCloseTo(originalRow.weight / originalRow.seconds.length, 14);
                    for (const secondDraw of [0, 1 - Number.EPSILON]) {
                        random.mockReturnValueOnce((before + row.weight / 2) / mass(rows)).mockReturnValueOnce(secondDraw);
                        const pair = samplePrimaryWidth(domain, width)!;
                        expect((Math.max(...pair) <= 9) === (width === 'single')).toBe(true);
                        expect(pair).toEqual([row.first, secondDraw === 0 ? row.seconds[0] : row.seconds.at(-1)]);
                    }
                    before += row.weight;
                }
                if (!rows.length) expect(samplePrimaryWidth(domain, width)).toBeNull();
            }
            random.mockRestore();
        }
    });
});

describe('reviewed owner-specific resolver contract', () => {
    it('trusts only the reviewed function identity, never copied metadata', () => {
        expect(hasStaticResolution(resolvePrimaryWidth)).toBe(true);
        expect(hasStaticResolution(Object.assign((labels: string[]) => resolvePrimaryWidth(labels),
            resolvePrimaryWidth))).toBe(false);
        expect(findSchemaFallbackContractIssues(PlaceValueArithmeticGeneratorSchema)).toEqual([]);
    });

    it('resolves complete flag/range/width bindings deterministically without entropy', () => {
        const operations = [Area.Addition, Area.AdditionPlaceValuePartitioning,
            Area.Subtraction, Area.SubtractionPlaceValuePartitioning];
        const flags = [Area.IntegerRegrouping, Scope.SingleDigitSmallestOperand,
            Scope.TwoDigitLargestOperand, Scope.MultiplesOf10, Scope.NumbersWithZero];
        for (const operation of operations) for (let bits = 0; bits < 32; bits++) {
            for (const bound of [Scope.NumbersSmaller5, Scope.NumbersSmaller10,
                Scope.NumbersSmaller100, Scope.NumbersSmaller1000]) {
                const context = [operation, bound, ...flags.filter((_, bit) => bits & 1 << bit)];
                for (const width of [[], [Scope.SingleDigitLargestOperand], [Scope.MultipleDigitLargestOperand],
                    [Scope.SingleDigitLargestOperand, Scope.MultipleDigitLargestOperand]]) {
                    const labels = [...context, ...width];
                    const before = rng.getRandomState();
                    const first = resolvePrimaryWidth(labels);
                    expect(resolvePrimaryWidth(labels)).toBe(first);
                    expect(rng.getRandomState()).toBe(before);
                }
            }
        }
        expect(resolvePrimaryWidth([])).toBe('legacy');
        expect(resolvePrimaryWidth([Scope.SingleDigitLargestOperand])).toBe('single');
        expect(resolvePrimaryWidth([Scope.MultipleDigitLargestOperand])).toBe('multiple');
        expect(primaryWidthContext).toContain(Scope.NumbersWithZero);
    });

    it.each([
        ['2.NBT.B.9-explain-strategies~4203a811', explanation],
        ['2.NBT.B.9-explain-strategies~dbec91bb', explanation],
        ['2.NBT.B.7-concrete-regrouping~f5125172', concrete],
        ['2.NBT.B.7-model-to-written-method~3cfc3d3f', written]
    ] as const)('closes the real planned width omission without pending inference: %s', (id, view) => {
        const target = gradeTwo.find(candidate => candidate.id === id)!;
        expect(target).toBeDefined();
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
            schema: PlaceValueArithmeticGeneratorSchema, spec};
        const consumer = {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view};
        const match = planModelCompatibility(target, model, consumer);
        expect(match.supported).toBe(true);
        if (!match.supported) throw new Error(match.reason);
        const selections = enumerateDependencyAuditSelections(match.plan);
        expect(selections.status).toBe('complete');
        expect(selections.selections).toHaveLength(3);
        for (const selection of selections.selections) {
            const resolved = resolveDependencyAuditAnnotation({id: 'test-width', plan: match.plan,
                selection, generator: model, view: consumer});
            expect(resolved.annotationResolution.status).toBe('exhaustive');
            expect(resolved.labels.some(label => new Set<string>([Scope.SingleDigitLargestOperand,
                Scope.MultipleDigitLargestOperand]).has(label))).toBe(true);
        }
    });

    it('supports both direct explicit widths and preserves unrelated legacy profiles', () => {
        for (const operation of [Area.Addition, Area.Subtraction]) {
            for (const width of [Scope.SingleDigitLargestOperand, Scope.MultipleDigitLargestOperand]) {
                for (let seed = 0; seed < 20; seed++) {
                    rng.setSeed(seed);
                    const stub = generateWithLabels(new PlaceValueArithmeticGenerator(),
                        [operation, Scope.NumbersSmaller1000, width])!;
                    expect(stub.labels).toContain(width);
                    expect(Math.max(stub.data.num1, stub.data.num2) <= 9)
                        .toBe(width === Scope.SingleDigitLargestOperand);
                }
            }
        }
        const labels = [Area.Addition, Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand,
            Scope.NumbersSmaller100];
        expect(extractConfig(PlaceValueArithmeticGeneratorSchema, labels).config.largestOperandProfile).toBe('legacy');
    });

    it('requires an explicit profile and defends against invalid manual combinations', () => {
        const base = {operation: Area.Addition, requireRegrouping: false, requireSingleDigitSmallest: false,
            requireTwoDigitLargest: false, requireMultipleOf10: false, requireZero: false,
            range: {min: 0, max: 1000}} as const;
        const generator = new PlaceValueArithmeticGenerator();
        expect(() => generator.generate(base)).toThrow(/largestOperandProfile/);
        expect(() => generator.generate({...base, coefficientPresence: true,
            largestOperandProfile: 'unsupported'} as never)).toThrow(/width profile/);
        expect(generator.generate({...base, requireTwoDigitLargest: true, requireSingleDigitSmallest: true,
            coefficientPresence: true, largestOperandProfile: 'single'})).toBeNull();
        expect(generator.generate({...base, operation: Area.Subtraction, requireRegrouping: true,
            coefficientPresence: true, largestOperandProfile: 'single'})).toBeNull();
        for (const width of ['single', 'multiple'] as const) {
            const result = generator.generate({...base, operation: Area.Subtraction, requireZero: true,
                coefficientPresence: true, largestOperandProfile: width})!;
            expect(result.data.answer).toBe(0);
            expect(result.data.num1).toBe(result.data.num2);
            expect(result.data.num1 <= 9).toBe(width === 'single');
        }
    });
});
