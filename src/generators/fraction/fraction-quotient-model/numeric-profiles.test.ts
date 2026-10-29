import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it, vi} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import * as randomModule from '../../../lib/random.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {FractionQuotientModelGenerator} from './generator.ts';
import {fractionNotationPairs, numericProfiles, resolveNumericProfile} from './numeric-profiles.ts';
import {FractionQuotientModelGeneratorSchema as schema, spec} from './spec.ts';

const unitDividend = [Scope.FractionDividend, Scope.IntegerDivisor, Scope.UnitFractions,
    Scope.NumbersWithoutNegatives];
const unitDivisor = [Scope.IntegerDividend, Scope.FractionDivisor, Scope.UnitFractions,
    Scope.NumbersWithoutNegatives];
const wholeSharing = [Area.Equation, Scope.IntegerDividend, Scope.IntegerDivisor,
    Scope.FractionQuotient, Scope.NumbersWithoutNegatives];
const requestCases = [
    [[Scope.FractionNumbers], 'fraction-as-quotient', ['proper', 'improper']],
    [[Scope.NumbersWithoutZero], 'fraction-as-quotient', ['proper', 'improper']],
    [[Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero], 'fraction-as-quotient', ['proper', 'improper']],
    [wholeSharing, 'whole-sharing-equation', ['zero', 'nonzero']],
    [unitDividend, 'unit-dividend-basic', ['nonzero']],
    [[Area.Multiplication, ...unitDividend], 'unit-dividend-inverse', ['nonzero']],
    [[Area.Equation, ...unitDividend], 'unit-dividend-equation', ['nonzero']],
    [unitDivisor, 'unit-divisor-basic', ['zero', 'nonzero']],
    [[Area.Multiplication, ...unitDivisor], 'unit-divisor-inverse', ['zero', 'nonzero']],
    [[Area.Equation, ...unitDivisor], 'unit-divisor-equation', ['zero', 'nonzero']]
] as const;

const planned = (request: readonly string[]) => {
    const result = planCompatibility({identity: {targetId: 'quotient-profile', generatorId: spec.generatorId, viewId: 'proof'},
        targetLabels: request, generatorLabels: spec.generalLabels, viewLabels: [], generatorRules: spec.compatibility,
        fields: normalizeSchemaChoices(schema, request, 'generator')});
    if (!result.supported) throw new Error(result.reason);
    const enumeration = enumerateDependencyAuditSelections(result.plan);
    expect(enumeration.status).toBe('complete');
    return enumeration.selections.map(selection => {
        const fields = Object.fromEntries(selection.choices.map(choice => [choice.field,
            result.plan.domains.find(domain => domain.owner === choice.owner && domain.field === choice.field)!
                .alternatives.find(alternative => alternative.id === choice.alternativeId)!.labels]));
        return resolveSchemaChoices(schema, request, fields);
    });
};

describe('fraction quotient finite numeric profiles', () => {
    it('declares valid standalone fallback bundles without reading a payload or consuming randomness', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        setSeed('pure-numeric-profile');
        const state = getRandomState();
        for (const [labels, value] of numericProfiles) expect(resolveNumericProfile([...labels])).toBe(value);
        expect(getRandomState()).toBe(state);
    });

    it.each(requestCases)('preserves the original %s route in direct and planned resolution', (request, relation, numeric) => {
        const resolved = planned(request);
        expect(new Set(resolved.map(item => item.config.relationProfile))).toEqual(new Set([relation]));
        expect(new Set(resolved.map(item => item.config.numericProfile))).toEqual(new Set(numeric));
        for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const direct = extractConfig(schema, [...request]);
            expect(direct.config.relationProfile).toBe(relation);
            expect(numeric).toContain(direct.config.numericProfile);
        }
    });

    it('admits thirteen compatible completions of the eight original unrequested relations', () => {
        const resolved = planned([]);
        expect(resolved).toHaveLength(13);
        expect(new Set(resolved.map(item => item.config.relationProfile)).size).toBe(8);
    });

    it('partitions every original notation pair exactly once with its original conditional probability', () => {
        const seen = new Set<string>();
        for (const profile of ['proper', 'improper'] as const) {
            const pairs = fractionNotationPairs(profile);
            expect(pairs).toHaveLength(15);
            for (const [numerator, denominator] of pairs) {
                expect(numerator >= 1 && numerator <= 6 && denominator >= 2 && denominator <= 6).toBe(true);
                expect(numerator < denominator).toBe(profile === 'proper');
                const key = `${numerator}/${denominator}`;
                expect(seen.has(key)).toBe(false); seen.add(key);
                expect(1 / pairs.length).toBeCloseTo((1 / 30) / (15 / 30), 14);
            }
        }
        expect(seen.size).toBe(30);
    });

    it('retains every original whole-sharing and unit-divisor draw path in exactly one zero profile', () => {
        const generator = new FractionQuotientModelGenerator();
        const draw = (config: Parameters<typeof generator.generate>[0], randomValues: number[]) => {
            const mock = vi.spyOn(randomModule, 'random').mockImplementation(() => {
                const value = randomValues.shift();
                if (value === undefined) throw new Error('Unexpected extra mathematical draw');
                return value;
            });
            try { return generator.generate(config).data; } finally { mock.mockRestore(); }
        };
        for (const relationProfile of ['whole-sharing-equation', 'unit-divisor-basic',
            'unit-divisor-inverse', 'unit-divisor-equation'] as const) {
            const sharing = relationProfile === 'whole-sharing-equation';
            const minSecond = sharing ? 1 : 2;
            for (let count = 0; count <= 6; count++) for (let second = minSecond; second <= 6; second++) {
                for (const materialDraw of [0.25, 0.75]) {
                    const secondDraw = (second - minSecond + 0.5) / (7 - minSecond);
                    const current = draw({relationProfile, numericProfile: count === 0 ? 'zero' : 'nonzero'}, [
                        count === 0 ? 0.5 : (count - 0.5) / 6, secondDraw, materialDraw]);
                    expect(current.dividend).toEqual({numerator: count, denominator: 1});
                    expect(current.divisor).toEqual(sharing
                        ? {numerator: second, denominator: 1} : {numerator: 1, denominator: second});
                    expect(current.quotient).toEqual(sharing
                        ? {numerator: count, denominator: second} : {numerator: count * second, denominator: 1});
                    expect(current.story.material).toBe(materialDraw < 0.5 ? 'ribbon' : 'rope');
                }
            }
        }
    });

    it('keeps every admitted profile claim true for the original operands, quotient and witnesses', () => {
        const generator = new FractionQuotientModelGenerator(), evaluator = createLabelDependencyEvaluator();
        for (const request of requestCases) for (const resolved of planned(request[0])) {
            const evaluation = evaluator.evaluate([Area.Division, ...resolved.resolvedLabels]);
            expect(evaluation.conflicts).toEqual([]);
            expect(evaluation.assessments.filter(item => ['numberKind', 'sign', 'zero', 'fractionMagnitude',
                'operandCount', 'operandDigits'].includes(item.facet)).every(item => item.status === 'satisfied')).toBe(true);
            for (let seed = 0; seed < 64; seed++) {
                setSeed(seed);
                const {data} = generator.generate(resolved.config);
                const numeric = resolved.config.numericProfile;
                const involved = [data.dividend, data.divisor, data.quotient,
                    ...Object.values(data.inverse), ...Object.values(data.equationWitness ?? {}),
                    ...Object.values(data.multiplicationWitness ?? {})];
                expect(involved.some(value => value.numerator === 0)).toBe(numeric === 'zero');
                expect(involved.every(value => value.numerator >= 0)).toBe(true);
                if (numeric === 'proper' || numeric === 'improper') {
                    expect(data.orientation).toBe('whole-by-whole');
                    expect(data.quotient.numerator < data.quotient.denominator).toBe(numeric === 'proper');
                }
            }
        }
    });

    it('rejects profile combinations that change original operand roles or make unsupported zero claims', () => {
        const generator = new FractionQuotientModelGenerator();
        expect(() => generator.generate({relationProfile: 'fraction-as-quotient', numericProfile: 'zero'})).toThrow(/incompatible/);
        expect(() => generator.generate({relationProfile: 'unit-dividend-basic', numericProfile: 'zero'})).toThrow(/incompatible/);
        expect(() => generator.generate({relationProfile: 'unit-divisor-basic', numericProfile: 'proper'})).toThrow(/incompatible/);
    });
});
