import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {partialQuotientDomain} from './domain.ts';
import {partialQuotientQuantities} from './domain.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {MultiDigitDivisionGenerator} from './generator.ts';
import {spec, MultiDigitDivisionGeneratorSchema as schema} from './spec.ts';

const legacyProfiles = [
    [Scope.SingleDigitDividend, 1],
    [Scope.TwoDigitDividend, 2],
    [Scope.ThreeDigitDividend, 3],
    [Scope.FourDigitDividend, 4]
] as const;
const twoDigitProfiles = legacyProfiles.slice(1);

describe('MultiDigitDivisionGenerator spec integration', () => {
    const generator = new MultiDigitDivisionGenerator();

    it('selects feasible width and zero providers before resolving partial range requests', () => {
        for (const labels of [[Scope.NumbersSmaller10], [Scope.NumbersSmaller1000, Scope.NumbersWithZero],
            [Scope.NumbersSmaller1000, Scope.NumbersWithoutZero], [Scope.NumbersSmaller1000, Scope.NumbersLarger5]]) {
            for (let seed = 0; seed < 32; seed++) {
                setSeed(seed);
                const resolved = extractConfig(schema, labels);
                const data = generator.generate(resolved.config)!.data;
                expect(hasCanonicalRangeWitness(partialQuotientQuantities(data), resolved.config.range!)).toBe(true);
                for (const label of labels) expect(resolved.resolvedLabels).toContain(label);
            }
        }
    });

    it('keeps every feasible width/zero/band cell equivalent in direct and planned resolution', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        let feasible = 0;
        for (const [width, digits] of legacyProfiles) for (const divisor of [1, 2]) for (const zero of [false, true]) {
            for (const labels of schema.range[2]) {
                const target = [width, divisor === 1 ? Scope.SingleDigitDivisor : Scope.TwoDigitDivisor,
                    zero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero, ...labels];
                const range = resolveCanonicalRangeFromLabels(labels)!;
                if (!partialQuotientDomain(digits, divisor, zero, range).count) {
                    expect(() => extractConfig(schema, target)).toThrow();
                    continue;
                }
                const direct = extractConfig(schema, target);
                const bindings = Object.fromEntries(normalizeSchemaChoices(schema, target, 'generator')
                    .map(field => [field.field, field.alternatives[0]!.labels]));
                // A range-aware resolver now rejects the contradictory extra absence
                // alternative rather than silently ignoring its conflict with presence.
                bindings.divisorDigits = divisor === 1
                    ? [Scope.SingleDigitDivisor, Area.ImperfectDivisibility, Scope.NumbersWithoutZero]
                    : [Scope.TwoDigitDivisor, ...(!zero ? [Scope.NumbersWithoutZero] : [])];
                bindings.range = labels;
                const planned = resolveSchemaChoices(schema, target, bindings);
                expect(planned.config).toEqual(direct.config);
                expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
                feasible++;
            }
        }
        expect(feasible).toBe(28);
    });

    it('declares only invariant procedure and number-domain capabilities', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Area.DivisionPartialQuotients,
            Area.Modulo,
            Area.Multiplication,
            Area.Subtraction,
            Scope.TwoOperands,
            Scope.IntegerNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ]));
        expect(spec.generalLabels).not.toContain(Area.ImperfectDivisibility);
        expect(spec.generalLabels).not.toContain(Scope.NumbersWithoutZero);
    });

    it.each(legacyProfiles)('resolves legacy %s exactly', (dividendLabel, dividendDigits) => {
        setSeed(dividendLabel);
        const stub = generateWithLabels(generator, [
            Area.DivisionPartialQuotients,
            Area.Modulo,
            Scope.TwoOperands,
            Scope.IntegerNumbers,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero,
            Scope.SingleDigitDivisor,
            dividendLabel,
            Ability.ProcedureExecution,
            Ability.ProcedureUnderstanding
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.dividendDigits).toBe(dividendDigits);
        expect(stub!.data.divisorDigits).toBe(1);
        expect(stub!.labels).toEqual(expect.arrayContaining([
            Scope.SingleDigitDivisor,
            Area.ImperfectDivisibility,
            Scope.NumbersWithoutZero,
            dividendLabel
        ]));
        expect(stub!.data.remainder).toBeGreaterThan(0);
    });

    it.each(twoDigitProfiles)('resolves two-digit divisor with %s', (dividendLabel, dividendDigits) => {
        setSeed(`two-digit-${dividendLabel}`);
        const stub = generateWithLabels(generator, [
            Area.DivisionPartialQuotients,
            Scope.TwoOperands,
            Scope.IntegerNumbers,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.TwoDigitDivisor,
            dividendLabel,
            Ability.ProcedureExecution,
            Ability.ProcedureUnderstanding
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.dividendDigits).toBe(dividendDigits);
        expect(stub!.data.divisorDigits).toBe(2);
        expect(stub!.labels).toEqual(expect.arrayContaining([
            Scope.TwoDigitDivisor,
            dividendLabel
        ]));
        expect(stub!.labels).not.toContain(Area.ImperfectDivisibility);
        expect(stub!.labels.filter(label => [Scope.NumbersWithZero, Scope.NumbersWithoutZero].includes(label as any)))
            .toHaveLength(1);
    });
});
