import {Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import * as random from '../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../lib/utils.ts';
import {resolveSchemaChoices} from '../../lib/schema-choices.ts';
import {planModelCompatibility} from '../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../lib/planned-generation.ts';
import {decimalMultiplicationRangePools, DecimalMultiplicationModelGenerator} from './decimal-multiplication-model/generator.ts';
import {DecimalMultiplicationModelGeneratorSchema, spec as multiplication} from './decimal-multiplication-model/spec.ts';
import {decimalDivisionRangeCandidates, DecimalDivisionModelGenerator} from './decimal-division-model/generator.ts';
import {DecimalDivisionModelGeneratorSchema, spec as division} from './decimal-division-model/spec.ts';
import {spec as multiplicationView} from '../../visuals/views/operations/operations-decimal-multiplication-method/spec.ts';
import {spec as divisionView} from '../../visuals/views/operations/operations-decimal-division-method/spec.ts';

afterEach(() => vi.restoreAllMocks());
const bands = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20],
    [Scope.NumbersSmaller100, 100], [Scope.NumbersSmaller120, 120], [Scope.NumbersSmaller1000, 1000], [Scope.NumbersSmaller10000, 10000]] as const;

describe('canonical decimal area/count domains', () => {
    it('retains every original multiplication pair/scenario and its conditional probability', () => {
        const expected = new Map<string, string>();
        for (let first = 1; first <= 120; first++) for (let second = 1; second <= 12; second++) {
            if (first % 10 === 0 || second % 10 === 0 || first * second % 10 === 0) continue;
            const profile = first < 10 && second < 10 ? 'hundredths-by-hundredths'
                : first >= 11 && first < 100 && second < 10 ? 'tenths-by-hundredths'
                    : first >= 11 && first < 100 && second >= 11 ? 'two-part-axes'
                        : first >= 101 && first <= 109 && second < 10 ? 'zero-placeholder'
                            : first >= 111 && first <= 119 && second >= 11 ? 'three-part-axis' : null;
            if (profile) expected.set(`${first}:${second}`, profile);
        }
        const generator = new DecimalMultiplicationModelGenerator();
        const draw = vi.spyOn(random, 'random');
        const seen = new Set<string>();
        const counts: number[] = [];
        let totalMass = 0;
        for (const [, upper] of bands) {
            const range = createCanonicalNumericRange(upper);
            const pools = decimalMultiplicationRangePools(range);
            const total = pools.reduce((sum, pool) => sum + pool.weight, 0);
            let preceding = 0, count = 0;
            for (const pool of pools) {
                expect(pool.weight / pool.pairs.length).toBeCloseTo(1 / 5 / pool.originalCount, 15);
                totalMass += pool.weight;
                for (const [index, [first, second]] of pool.pairs.entries()) {
                    const key = `${first}:${second}`;
                    expect(seen.has(key)).toBe(false);
                    expect(expected.get(key)).toBe(pool.profile);
                    seen.add(key);
                    const draws = [(preceding + pool.weight / 2) / total, (index + 0.5) / pool.pairs.length];
                    draw.mockImplementation(() => {
                        const next = draws.shift();
                        if (next === undefined) throw new Error('Unexpected area-model draw');
                        return next;
                    });
                    const data = generator.generate({range})!.data;
                    expect(draws).toEqual([]);
                    expect([data.first.valueInHundredths, data.second.valueInHundredths]).toEqual([first, second]);
                    expect(hasCanonicalRangeWitness([first / 100, second / 100, first * second / 10000, .0001,
                        first, second, first * second, ...data.areaGrid.regions.map(region => region.cellCount)], range)).toBe(true);
                    count++;
                }
                preceding += pool.weight;
            }
            counts.push(count);
        }
        expect(counts).toEqual([10, 13, 24, 189, 39, 659, 39]);
        expect(seen.size).toBe(expected.size);
        expect(seen.size).toBe(973);
        expect(totalMass).toBeCloseTo(1, 14);
    });

    it('retains all 48 division inputs and their original unequal divisor probabilities', () => {
        const expected = new Set<string>();
        for (const divisor of [8, 16]) for (let full = 1; full <= 4; full++)
            for (let remainder = 1; remainder < divisor; remainder += 2) expected.add(`${full * divisor + remainder}:${divisor}`);
        const seen = new Set<string>();
        const generator = new DecimalDivisionModelGenerator();
        const draw = vi.spyOn(random, 'random');
        const counts: number[] = [];
        let totalMass = 0;
        for (const upper of [100, 120, 1000]) {
            const range = createCanonicalNumericRange(upper);
            const candidates = decimalDivisionRangeCandidates(range);
            const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
            let preceding = 0;
            for (const candidate of candidates) {
                const key = `${candidate.dividend}:${candidate.divisor}`;
                expect(expected.has(key)).toBe(true);
                expect(seen.has(key)).toBe(false);
                seen.add(key);
                expect(candidate.weight).toBe(0.5 / 4 / (candidate.divisor / 2));
                totalMass += candidate.weight;
                draw.mockReset().mockReturnValueOnce((preceding + candidate.weight / 2) / total);
                const data = generator.generate({range}).data;
                expect(draw).toHaveBeenCalledTimes(1);
                expect([data.dividend.valueInHundredths, data.divisor.valueInHundredths]).toEqual([candidate.dividend, candidate.divisor]);
                const quantities = [candidate.dividend / 100, candidate.divisor / 100, data.quotient.valueInTenThousandths / 10000,
                    .01, 1, 10, candidate.dividend, candidate.divisor, data.grouping.fullGroupCount, data.grouping.remainderCells];
                let partial = candidate.dividend;
                for (const step of data.divisionTrace.steps) {
                    const digit = Math.floor(partial / candidate.divisor), product = candidate.divisor * digit, remainder = partial - product;
                    expect(step).toMatchObject({partialDividend: partial, quotientDigit: digit, subtrahend: product, remainder});
                    quantities.push(partial, digit, product, remainder);
                    partial = remainder * 10;
                }
                expect(partial).toBe(0);
                expect(hasCanonicalRangeWitness(quantities, range)).toBe(true);
                preceding += candidate.weight;
            }
            counts.push(candidates.length);
        }
        expect(counts).toEqual([28, 4, 16]);
        expect(seen).toEqual(expected);
        expect(totalMass).toBeCloseTo(1, 14);
    });

    it('resolves and replays every band through the production compatibility paths', () => {
        for (const [instance, schema, spec, view, choices] of [
            [new DecimalMultiplicationModelGenerator(), DecimalMultiplicationModelGeneratorSchema, multiplication, multiplicationView, bands],
            [new DecimalDivisionModelGenerator(), DecimalDivisionModelGeneratorSchema, division, divisionView, bands.filter(([, upper]) => [100, 120, 1000].includes(upper))]
        ] as const) {
            expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
            for (const [label, upper] of choices) {
                const labels = [...spec.generalLabels, ...view.generalLabels, label];
                const target = {id: 'decimal-model-range', labels};
                const direct = extractConfig(schema, labels);
                const planned = resolveSchemaChoices(schema, labels, {range: [label]});
                expect(planned.config).toEqual(direct.config);
                expect(direct.config.range).toEqual(createCanonicalNumericRange(upper));
                const match = planModelCompatibility(target, {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                    {viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view});
                expect(match.supported).toBe(true);
                if (!match.supported) throw new Error('Expected decimal method range match');
                const input = {generator: instance, generatorSpec: spec, viewSchema: {}, viewSpec: view, plan: match.plan,
                    sampleKey: `${target.id}#${spec.generatorId}#${view.viewId}#train#question#inst:0`, seed: 42, attempt: 1};
                const draw = generatePlannedDraw(input);
                expect(draw.labels).toContain(label);
                expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
            }
        }
    });

    it('rejects unsupported or malformed bands without drawing entropy', () => {
        const draw = vi.spyOn(random, 'random');
        for (const [instance, upper] of [[new DecimalMultiplicationModelGenerator(), 5], [new DecimalDivisionModelGenerator(), 100]] as const) {
            for (const range of [null, createCanonicalNumericRange(100000), createCanonicalNumericRange(100, 5),
                {...createCanonicalNumericRange(upper), maximumAbove: 0}, {...createCanonicalNumericRange(upper), minimumBelow: 10}])
                expect(() => instance.generate({range} as never)).toThrow();
            expect(() => instance.generate({})).toThrow(/range/);
        }
        expect(draw).not.toHaveBeenCalled();
    });
});
