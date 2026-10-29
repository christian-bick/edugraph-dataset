import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {FractionArithmeticGenerator, unlikeFractionMagnitudeRows} from './generator.ts';
import {FractionArithmeticGeneratorSchema, spec} from './spec.ts';

const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
const key = (pool: string, first: {numerator: number; denominator: number},
    second: {numerator: number; denominator: number}, common: number) =>
    JSON.stringify([pool, first.numerator, first.denominator, second.numerator, second.denominator, common]);

describe('evidenced fraction magnitude profiles', () => {
    it('keeps canonical fallback bundles valid and legacy broad defaults on the same task', () => {
        expect(findSchemaFallbackContractIssues(FractionArithmeticGeneratorSchema)).toEqual([]);
        expect(extractConfig(FractionArithmeticGeneratorSchema, [Scope.FractionNumbers, Scope.CommonDenominator, Area.Addition])
            .config.task).toBe('fraction-operation');
        expect(extractConfig(FractionArithmeticGeneratorSchema, [Scope.MixedNumbers, Scope.CommonDenominator, Area.Addition])
            .config.task).toBe('mixed-operation');
        expect(extractConfig(FractionArithmeticGeneratorSchema, [Scope.ProperFractions, Scope.CommonDenominator, Area.Addition])
            .config.task).toBe('decompose-proper');
    });

    it('keeps new magnitude completion from replacing fraction inputs with mixed original operands', () => {
        const labels = [Area.Addition, Scope.FractionNumbers, Scope.UnlikeDenominators];
        const planned = planCompatibility({identity: {targetId: 'fraction-form', generatorId: spec.generatorId, viewId: 'proof'},
            targetLabels: labels, generatorLabels: spec.generalLabels, viewLabels: [], generatorRules: spec.compatibility,
            fields: normalizeSchemaChoices(FractionArithmeticGeneratorSchema, labels, 'generator')});
        expect(planned.supported).toBe(true);
        if (!planned.supported) throw new Error(planned.reason);
        expect(planned.plan.domains.find(domain => domain.field === 'task')!.alternatives
            .every(choice => !choice.labels.includes(Scope.MixedNumbers))).toBe(true);
    });

    it.each(['addition', 'subtraction'] as const)('partitions all original unlike %s pool paths and preserves conditional weights', operation => {
        const original = new Map<string, boolean>();
        const counts = {proper: 0, improper: 0, nonleast: 0};
        for (const d1 of [2, 3, 4, 6, 8]) for (const d2 of [2, 3, 4, 6, 8]) {
            if (d1 === d2) continue;
            const least = d1 * d2 / gcd(d1, d2);
            for (const common of [least, 2 * least].filter(n => n <= 24)) {
                for (let a = 1; a < 2 * d1; a++) for (let b = 1; b < 2 * d2; b++) {
                    const sum = a * common / d1 + (operation === 'addition' ? 1 : -1) * b * common / d2;
                    if (sum <= 0 || sum > 3 * common) continue;
                    const first = {numerator: a, denominator: d1}, second = {numerator: b, denominator: d2};
                    const primaryProper = a < d1 || b < d2;
                    const pool = a < d1 && b < d2 ? 'proper' : 'improper';
                    original.set(key(pool, first, second, common), primaryProper); counts[pool]++;
                    if (common > least) { original.set(key('nonleast', first, second, common), primaryProper); counts.nonleast++; }
                }
            }
        }
        const current = new Set<string>();
        for (const magnitude of ['proper', 'improper'] as const) {
            const rows = unlikeFractionMagnitudeRows(operation, magnitude);
            const mass = rows.reduce((sum, row) => sum + row.weight, 0);
            const oldMass = [...original].filter(([, proper]) => proper === (magnitude === 'proper'))
                .reduce((sum, [k]) => sum + 1 / 3 / counts[JSON.parse(k)[0] as keyof typeof counts], 0);
            expect(mass / 3).toBeCloseTo(oldMass, 12);
            for (const row of rows) {
                expect(row.originalCount).toBe(counts[row.profile]);
                for (const candidate of row.retained) {
                    const k = key(row.profile, candidate.first, candidate.second, candidate.commonDenominator);
                    expect(original.get(k)).toBe(magnitude === 'proper');
                    expect(current.has(k)).toBe(false); current.add(k);
                    expect(row.weight / mass / row.retained.length)
                        .toBeCloseTo((1 / 3 / counts[row.profile]) / oldMass, 14);
                }
            }
        }
        expect(current).toEqual(new Set(original.keys()));
    });

    it.each([Area.Addition, Area.Subtraction])('generates an accessible input witness for %s magnitude choices', operation => {
        for (const magnitude of [Scope.ProperFractions, Scope.ImproperFractions]) for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(new FractionArithmeticGenerator(), [operation,
                Scope.FractionNumbers, Scope.UnlikeDenominators, magnitude])!;
            expect(stub.labels).toContain(magnitude);
            expect(stub.data.task).toBe('unlike-fraction-operation');
            if (stub.data.task !== 'unlike-fraction-operation') throw new Error('Wrong task');
            const inputs = [stub.data.first, stub.data.second];
            expect(inputs.some(value => value.numerator < value.denominator))
                .toBe(magnitude === Scope.ProperFractions);
        }
    });

    it('grounds proper aliases in the displayed input fractions rather than the result class', () => {
        const labels = [
            [Area.Addition, Scope.CommonDenominator, Scope.FractionNumbers],
            [Area.Subtraction, Scope.CommonDenominator, Scope.MixedNumbers],
            [Area.Addition, Area.Multiplication, Scope.CommonDenominator, Scope.TenthFractions],
            [Area.Addition, Scope.UnlikeDenominators, Scope.MixedNumbers]
        ];
        for (const request of labels) for (let seed = 0; seed < 32; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(new FractionArithmeticGenerator(), request)!;
            expect(stub.labels).toContain(Scope.ProperFractions);
            const data = stub.data;
            const input = data.task === 'tenths-hundredths-addition' ? data.firstTenths
                : data.task === 'fraction-operation' || data.task === 'mixed-operation'
                    || data.task === 'unlike-mixed-operation' ? data.first : null;
            expect(input).not.toBeNull();
            expect(input!.numerator).toBeLessThan(input!.denominator);
        }
    });
});
