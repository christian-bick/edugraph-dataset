import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as random from '../../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import type {DecimalWritingProblem} from '../../../types/problems.ts';
import {DecimalWritingGenerator} from './generator.ts';
import {DecimalWritingGeneratorSchema, spec} from './spec.ts';
import {decimalWritingHasZero, resolveDecimalNotation, resolveDecimalZeroProfile} from './zero-profile.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {decimalReadingChoices} from '../../../visuals/views/numbers/decimal-writing-helpers.ts';
import {buildDecimalReadingRelation, DecimalReadingRelationsGenerator} from '../decimal-reading-relations/generator.ts';

afterEach(() => vi.restoreAllMocks());
const generator = new DecimalWritingGenerator();
const plan = (labels: string[]) => planModelCompatibility({id: 'decimal-zero', labels},
    {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: generator.schema, spec},
    {viewId: 'decimal-zero-test', generalLabels: [], schema: {}, spec: {viewId: 'decimal-zero-test', generalLabels: []}});
const decimal = (wholePart: number, digits: [number, number, number], scale: 1 | 2 | 3): DecimalWritingProblem => ({
    kind: 'decimal-writing', base: 10, wholePart,
    canonicalNumeral: `${wholePart}.${digits.slice(0, scale).join('')}`,
    valueInThousandths: wholePart * 1000 + digits[0] * 100 + digits[1] * 10 + digits[2],
    fractionalPart: {precision: scale === 1 ? 'tenths' : scale === 2 ? 'hundredths' : 'thousandths',
        digits, numerator: Number(digits.slice(0, scale).join('')), denominator: 10 ** scale as 10 | 100 | 1000} as DecimalWritingProblem['fractionalPart']
});

describe('decimal number-name whole-quantity zero profiles', () => {
    it('requires zero wholes and never uses a fractional zero digit as its criterion', () => {
        expect(decimalWritingHasZero(decimal(1, [2, 0, 0], 1))).toBe(false);
        expect(decimalWritingHasZero(decimal(1, [2, 3, 0], 2))).toBe(false);
        expect(decimalWritingHasZero(decimal(0, [2, 3, 4], 3))).toBe(true);
        expect(decimalWritingHasZero(decimal(1, [0, 3, 4], 3))).toBe(false);
        expect(decimalWritingHasZero(decimal(1, [2, 0, 4], 3))).toBe(false);
        expect(decimalWritingHasZero(decimal(2, [0, 5, 0], 2))).toBe(false);
        expect(decimalWritingHasZero(decimal(0, [2, 0, 5], 3))).toBe(true);
        expect(decimalWritingHasZero(decimal(1, [2, 3, 4], 3))).toBe(false);
    });

    it('qualifies the existing notation family in direct and planned choices', () => {
        expect(findSchemaFallbackContractIssues(generator.schema)).toEqual([]);
        expect(resolveDecimalNotation([])).toBeUndefined();
        expect(resolveDecimalNotation([Area.DecimalNotation])).toBe(Area.DecimalNotation);
        expect(resolveDecimalNotation([Scope.NumbersWithZero])).toBe(Area.NumberNameNotation);
        expect(resolveDecimalNotation([Area.DecimalNotation, Scope.NumbersWithZero])).toBe(Area.DecimalNotation);
        expect(resolveDecimalNotation([Area.DecimalNotation, Area.NumberNameNotation])).toBeUndefined();
        expect(resolveDecimalNotation([Scope.NumbersWithZero, Scope.NumbersWithoutZero])).toBeUndefined();
        expect(resolveDecimalZeroProfile([])).toBeUndefined();
        expect(resolveDecimalZeroProfile([Area.NumberNameNotation])).toBeUndefined();
        expect(resolveDecimalZeroProfile([Area.DecimalNotation])).toBeUndefined();
        expect(resolveDecimalZeroProfile([Area.DecimalNotation, Scope.NumbersWithoutZero])).toBe('without-zero');
        expect(resolveDecimalZeroProfile([Area.DecimalNotation, Area.NumberNameNotation])).toBeUndefined();
        expect(resolveDecimalZeroProfile([Scope.NumbersWithZero, Scope.NumbersWithoutZero])).toBeUndefined();
        for (const label of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            expect(plan([label]).supported).toBe(true);
            expect(extractConfig(DecimalWritingGeneratorSchema, [label]).config.notationFamily).toBe(Area.NumberNameNotation);
            for (const notationFamily of [Area.DecimalNotation, Area.NumberNameNotation] as const) {
                const result = plan([notationFamily, label]);
                expect(result.supported).toBe(true);
                if (!result.supported) throw new Error('Expected both zero profiles for each notation family.');
                for (let seed = 0; seed < 64; seed++) {
                    random.setSeed(seed);
                    const direct = extractConfig(DecimalWritingGeneratorSchema, [notationFamily, label]);
                    expect(direct.config.notationFamily).toBe(notationFamily);
                    expect(direct.resolvedLabels).toContain(label);
                    const data = generator.generate(direct.config)!.data;
                    expect(decimalWritingHasZero(data)).toBe(label === Scope.NumbersWithZero);
                    const planned = resolvePlannedConfigurations({generatorSchema: generator.schema, viewSchema: {},
                        plan: result.plan, sampleKey: 'decimal-zero#decimal-writing#decimal-zero-test#train#question#inst:0', seed, attempt: 1});
                    expect(decimalWritingHasZero(generator.generate(planned.generatorConfig)!.data))
                        .toBe(label === Scope.NumbersWithZero);
                }
            }
        }
        const numeral = plan([Area.DecimalNotation]);
        expect(numeral.supported).toBe(true);
        if (numeral.supported) expect(numeral.plan.domains.find(domain => domain.field === 'zeroProfile')!
            .alternatives.map(choice => choice.labels)).toEqual([[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]);
        expect(plan([Area.NumberNameNotation, Scope.NumbersWithZero, Scope.NumbersWithoutZero]).supported).toBe(false);
        expect(extractConfig(generator.schema, [Area.DecimalNotation, Scope.NumbersWithZero]).config)
            .toEqual({notationFamily: Area.DecimalNotation, zeroProfile: 'with-zero', range: createCanonicalNumericRange(5)});
    });

    it('retains every old fractional precision/pattern path and all 9,990 source values across canonical profiles', () => {
        let queue: number[] = [];
        vi.spyOn(random, 'random').mockImplementation(() => {
            const next = queue.shift();
            if (next === undefined) throw new Error('Unexpected random draw or rejection');
            return next;
        });
        const values = new Set<string>();
        const reader = new DecimalReadingRelationsGenerator();
        let paths = 0;
        const check = (data: DecimalWritingProblem, draws: number[]) => {
            const zero = decimalWritingHasZero(data);
            const zeroProfile = zero ? 'with-zero' : 'without-zero';
            const range = createCanonicalNumericRange(data.wholePart < 5 ? 5 : 10);
            const wholeDraw = zero ? 0.5 : data.wholePart < 5 ? (data.wholePart - 0.5) / 4 : (data.wholePart - 4.5) / 5;
            const conditionedDraws = [wholeDraw, ...draws.slice(1)];
            for (const notationFamily of [Area.DecimalNotation, Area.NumberNameNotation] as const) {
                queue = [...conditionedDraws];
                expect(generator.generate({notationFamily, zeroProfile, range})?.data).toEqual(data);
                expect(queue).toEqual([]);
            }
            queue = [...conditionedDraws];
            const relation = reader.generate({zeroProfile, range})!.data;
            expect(relation).toEqual(buildDecimalReadingRelation(data));
            expect(relation.comparisonValues.every(value => Math.floor(value / 1000) === data.wholePart)).toBe(true);
            expect(queue).toEqual([]);
            expect(hasCanonicalRangeWitness([data.wholePart, data.fractionalPart.numerator / data.fractionalPart.denominator,
                data.valueInThousandths / 1000, ...relation.comparisonValues.map(value => value / 1000)], range)).toBe(true);
            values.add(data.canonicalNumeral);
            paths++;
        };
        for (let whole = 0; whole <= 9; whole++) {
            const wholeDraw = (whole + 0.5) / 10;
            for (let digit = 1; digit <= 9; digit++) check(decimal(whole, [digit, 0, 0], 1),
                [wholeDraw, 0.06, (digit - 0.5) / 9]);
            for (let hundredth = 1; hundredth <= 9; hundredth++) {
                check(decimal(whole, [0, hundredth, 0], 2),
                    [wholeDraw, 0.18, 0.25, (hundredth - 0.5) / 9]);
                for (let tenth = 0; tenth <= 9; tenth++) check(decimal(whole, [tenth, hundredth, 0], 2),
                    [wholeDraw, 0.18, 0.75, (tenth + 0.5) / 10, (hundredth - 0.5) / 9]);
            }
            for (let pattern = 0; pattern <= 3; pattern++) {
                const tenths = pattern === 0 || pattern === 2 ? [0] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
                const hundredths = pattern === 0 || pattern === 1 ? [0] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
                for (const tenth of tenths) for (const hundredth of hundredths) for (let thousandth = 1; thousandth <= 9; thousandth++) {
                    const draws = [wholeDraw, 0.62, (pattern + 0.5) / 4];
                    if (tenth) draws.push((tenth - 0.5) / 9);
                    if (hundredth) draws.push((hundredth - 0.5) / 9);
                    draws.push((thousandth - 0.5) / 9);
                    check(decimal(whole, [tenth, hundredth, thousandth], 3), draws);
                }
            }
        }
        expect(paths).toBe(10080);
        expect(values.size).toBe(9990);
    });

    it('requires the scoped profile and constructs nonzero whole quantities without rejection', () => {
        expect(() => generator.generate({notationFamily: Area.DecimalNotation})).toThrow('zeroProfile');
        for (const notationFamily of [Area.NumberNameNotation, Area.DecimalNotation]) {
            expect(() => generator.generate({notationFamily, zeroProfile: 'legacy', range: createCanonicalNumericRange(5)} as never)).toThrow('declared zero');
        }
        const draw = vi.spyOn(random, 'random').mockReturnValue(0);
        expect(generator.generate({notationFamily: Area.NumberNameNotation, zeroProfile: 'without-zero', range: createCanonicalNumericRange(5)})!.data.wholePart).toBe(1);
        expect(draw).toHaveBeenCalledTimes(3);
    });

    it('keeps all reading quantities in the same numerical zero-whole context', () => {
        const source = decimal(5, [1, 9, 9], 3);
        expect(decimalWritingHasZero(source)).toBe(false);
        // Both values have positive wholes; a zero digit in an alternative
        // does not change the name-source numerical-zero classification.
        expect(decimalReadingChoices(buildDecimalReadingRelation(source), 0).some(choice => choice.valueInThousandths === 5209)).toBe(true);
        expect(decimalReadingChoices(buildDecimalReadingRelation(source), 0)
            .every(choice => choice.name.startsWith('five and '))).toBe(true);
        const zeroWholes = decimal(0, [2, 0, 5], 3);
        expect(decimalReadingChoices(buildDecimalReadingRelation(zeroWholes), 0)
            .every(choice => choice.name.startsWith('zero and '))).toBe(true);
    });
});
