import {Ability, Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as random from '../../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import type {DecimalWritingProblem} from '../../../types/problems.ts';
import {DecimalWritingGenerator} from './generator.ts';
import {DecimalWritingGeneratorSchema, spec} from './spec.ts';
import {decimalWritingHasZero, resolveDecimalNotation, resolveDecimalZeroProfile} from './zero-profile.ts';
import {spec as readingSpec} from '../../../visuals/views/numbers/numbers-decimal-numeral-reading/spec.ts';
import {decimalReadingChoices} from '../../../visuals/views/numbers/decimal-writing-helpers.ts';

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

describe('decimal number-name source coefficient profiles', () => {
    it('excludes unused padding and keeps both kinds of active zero', () => {
        expect(decimalWritingHasZero(decimal(1, [2, 0, 0], 1))).toBe(false);
        expect(decimalWritingHasZero(decimal(1, [2, 3, 0], 2))).toBe(false);
        expect(decimalWritingHasZero(decimal(0, [2, 3, 4], 3))).toBe(true);
        expect(decimalWritingHasZero(decimal(1, [0, 3, 4], 3))).toBe(true);
        expect(decimalWritingHasZero(decimal(1, [2, 0, 4], 3))).toBe(true);
        expect(decimalWritingHasZero(decimal(1, [2, 3, 4], 3))).toBe(false);
    });

    it('qualifies the existing notation family in direct and planned choices', () => {
        expect(findSchemaFallbackContractIssues(generator.schema)).toEqual([]);
        expect(resolveDecimalNotation([])).toBeUndefined();
        expect(resolveDecimalNotation([Area.DecimalNotation])).toBe(Area.DecimalNotation);
        expect(resolveDecimalNotation([Scope.NumbersWithZero])).toBe(Area.NumberNameNotation);
        expect(resolveDecimalNotation([Area.DecimalNotation, Scope.NumbersWithZero])).toBeUndefined();
        expect(resolveDecimalNotation([Area.DecimalNotation, Area.NumberNameNotation])).toBeUndefined();
        expect(resolveDecimalNotation([Scope.NumbersWithZero, Scope.NumbersWithoutZero])).toBeUndefined();
        expect(resolveDecimalZeroProfile([])).toBe('legacy');
        expect(resolveDecimalZeroProfile([Area.NumberNameNotation])).toBeUndefined();
        expect(resolveDecimalZeroProfile([Area.DecimalNotation])).toBe('legacy');
        expect(resolveDecimalZeroProfile([Area.DecimalNotation, Scope.NumbersWithoutZero])).toBeUndefined();
        expect(resolveDecimalZeroProfile([Area.DecimalNotation, Area.NumberNameNotation])).toBeUndefined();
        expect(resolveDecimalZeroProfile([Scope.NumbersWithZero, Scope.NumbersWithoutZero])).toBeUndefined();
        for (const label of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) {
            expect(plan([label]).supported).toBe(true);
            expect(plan([Area.DecimalNotation, label]).supported).toBe(false);
            const result = plan([Area.NumberNameNotation, label]);
            expect(result.supported).toBe(true);
            if (!result.supported) continue;
            for (let seed = 0; seed < 64; seed++) {
                random.setSeed(seed);
                const direct = extractConfig(DecimalWritingGeneratorSchema, [label]);
                expect(direct.config.notationFamily).toBe(Area.NumberNameNotation);
                expect(direct.resolvedLabels).toContain(label);
                const data = generator.generate(direct.config)!.data;
                expect(decimalWritingHasZero(data)).toBe(label === Scope.NumbersWithZero);
                const planned = resolvePlannedConfigurations({generatorSchema: generator.schema, viewSchema: {},
                    plan: result.plan, sampleKey: 'decimal-zero#decimal-writing#decimal-zero-test#train#question#inst:0', seed, attempt: 1});
                expect(decimalWritingHasZero(generator.generate(planned.generatorConfig)!.data))
                    .toBe(label === Scope.NumbersWithZero);
            }
        }
        const legacy = plan([Area.DecimalNotation]);
        expect(legacy.supported).toBe(true);
        if (legacy.supported) expect(legacy.plan.domains.find(domain => domain.field === 'zeroProfile')!
            .alternatives.map(choice => choice.labels)).toEqual([[]]);
        expect(plan([Area.NumberNameNotation, Scope.NumbersWithZero, Scope.NumbersWithoutZero]).supported).toBe(false);
        expect(() => extractConfig(generator.schema, [Area.DecimalNotation, Scope.NumbersWithZero])).toThrow();
    });

    it('retains every old raw precision/pattern path and its duplicate probability mass', () => {
        let queue: number[] = [];
        vi.spyOn(random, 'random').mockImplementation(() => {
            const next = queue.shift();
            if (next === undefined) throw new Error('Unexpected random draw or rejection');
            return next;
        });
        const masses = new Map<string, number>();
        let paths = 0, zeroMass = 0, nonzeroMass = 0;
        const check = (data: DecimalWritingProblem, draws: number[], mass: number) => {
            queue = draws;
            const zero = decimalWritingHasZero(data);
            const generated = generator.generate({notationFamily: Area.NumberNameNotation,
                zeroProfile: zero ? 'with-zero' : 'without-zero'});
            expect(generated?.data).toEqual(data);
            expect(queue).toEqual([]);
            masses.set(data.canonicalNumeral, (masses.get(data.canonicalNumeral) ?? 0) + mass);
            if (zero) zeroMass += mass; else nonzeroMass += mass;
            paths++;
        };
        for (let whole = 0; whole <= 9; whole++) {
            const wholeDraw = (whole + 0.5) / 10;
            for (let digit = 1; digit <= 9; digit++) check(decimal(whole, [digit, 0, 0], 1),
                [wholeDraw, 0.06, (digit - 0.5) / 9], 0.1 * 0.12 / 9);
            for (let hundredth = 1; hundredth <= 9; hundredth++) {
                check(decimal(whole, [0, hundredth, 0], 2),
                    [wholeDraw, 0.18, 0.25, (hundredth - 0.5) / 9], 0.1 * 0.12 * 0.5 / 9);
                for (let tenth = 0; tenth <= 9; tenth++) check(decimal(whole, [tenth, hundredth, 0], 2),
                    [wholeDraw, 0.18, 0.75, (tenth + 0.5) / 10, (hundredth - 0.5) / 9], 0.1 * 0.12 * 0.5 / 10 / 9);
            }
            for (let pattern = 0; pattern <= 3; pattern++) {
                const tenths = pattern === 0 || pattern === 2 ? [0] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
                const hundredths = pattern === 0 || pattern === 1 ? [0] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
                for (const tenth of tenths) for (const hundredth of hundredths) for (let thousandth = 1; thousandth <= 9; thousandth++) {
                    const draws = [wholeDraw, 0.62, (pattern + 0.5) / 4];
                    if (tenth) draws.push((tenth - 0.5) / 9);
                    if (hundredth) draws.push((hundredth - 0.5) / 9);
                    draws.push((thousandth - 0.5) / 9);
                    check(decimal(whole, [tenth, hundredth, thousandth], 3), draws,
                        0.1 * 0.76 / 4 / tenths.length / hundredths.length / 9);
                }
            }
        }
        expect(paths).toBe(10080);
        expect(masses.size).toBe(9990);
        expect(zeroMass).toBeCloseTo(0.6724, 12);
        expect(nonzeroMass).toBeCloseTo(0.3276, 12);
        expect([...masses.values()].reduce((sum, mass) => sum + mass, 0)).toBeCloseTo(1, 12);
    });

    it('requires the scoped profile and terminates a hostile incompatible source', () => {
        expect(() => generator.generate({notationFamily: Area.DecimalNotation})).toThrow('zeroProfile');
        expect(() => generator.generate({notationFamily: Area.NumberNameNotation, zeroProfile: 'legacy'})).toThrow('declared zero');
        expect(() => generator.generate({notationFamily: Area.DecimalNotation, zeroProfile: 'with-zero'})).toThrow('legacy');
        const draw = vi.spyOn(random, 'random').mockReturnValue(0);
        expect(generator.generate({notationFamily: Area.NumberNameNotation, zeroProfile: 'without-zero'})).toBeNull();
        expect(draw).toHaveBeenCalledTimes(256 * 3);
    });

    it('keeps reading distractors outside the name-source zero guarantee for broad requests too', () => {
        const source = decimal(5, [1, 9, 9], 3);
        expect(decimalWritingHasZero(source)).toBe(false);
        // The same source needs no zero in name writing, but reading adds5.209.
        expect(decimalReadingChoices(source, 0).some(choice => choice.valueInThousandths === 5209)).toBe(true);
        const readingPlan = (labels: string[]) => planModelCompatibility({id: 'reading-zero', labels},
            {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: generator.schema, spec},
            {viewId: readingSpec.viewId, generalLabels: readingSpec.generalLabels, schema: {}, spec: readingSpec});
        expect(readingPlan([Scope.NumbersWithoutZero, Ability.TextualReception]).supported).toBe(false);
        expect(readingPlan([Area.NumberNameNotation, Ability.TextualReception]).supported).toBe(false);
        expect(readingPlan([Area.DecimalNotation, Ability.TextualReception]).supported).toBe(true);
        expect(readingPlan([Ability.TextualReception]).supported).toBe(true);
    });
});
