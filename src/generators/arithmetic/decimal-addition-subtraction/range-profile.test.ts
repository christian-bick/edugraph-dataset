import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import * as random from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {createDecimalAddSubtractProblem, decimalColumnRangePools, decimalZeroPools, DecimalAdditionSubtractionGenerator} from './generator.ts';
import {DecimalAdditionSubtractionGeneratorSchema as schema, spec} from './spec.ts';

afterEach(() => vi.restoreAllMocks());
const independentMaximum = (operation: 'addition' | 'subtraction', first: number, second: number) => {
    const a = first % 10, b = second % 10, x = Math.floor(first / 10) % 10, y = Math.floor(second / 10) % 10;
    if (operation === 'addition') return Math.max(10, a + b, x + y + Number(a + b >= 10));
    const borrowHundredth = a < b, borrowTenth = x - Number(borrowHundredth) < y;
    return Math.max(10, a + 10 * Number(borrowHundredth), x + 10 * Number(borrowTenth));
};

describe('canonical decimal unit-exchange ranges', () => {
    it('partitions every original scenario path exactly and preserves its conditional pair law', () => {
        const expectedCounts = {
            'addition:false': [0, 7236], 'addition:true': [6453, 26316],
            'subtraction:false': [0, 108], 'subtraction:true': [3213, 16389]
        };
        for (const operation of ['addition', 'subtraction'] as const) for (const zero of [false, true]) {
            const original = decimalZeroPools(operation, zero);
            const seen = new Map<string, Set<string>>();
            const unique = [new Set<string>(), new Set<string>()];
            for (const [index, upper] of [10, 20].entries()) {
                const range = createCanonicalNumericRange(upper);
                const pools = decimalColumnRangePools(operation, zero, range);
                expect(decimalColumnRangePools(operation, zero, range)).toBe(pools);
                for (const pool of pools) {
                    const source = original.find(value => value.profile === pool.profile)!;
                    expect(pool.weight / pool.pairs.length).toBeCloseTo(source.weight / source.pairs.length, 15);
                    const sourceKeys = new Set(source.pairs.map(pair => pair.join(':')));
                    const visited = seen.get(pool.profile) ?? new Set<string>();
                    for (const [first, second] of pool.pairs) {
                        const key = `${first}:${second}`;
                        if (!sourceKeys.has(key) || visited.has(key)) throw new Error(`Lost/duplicated original path ${pool.profile}:${key}`);
                        visited.add(key);
                        unique[index]!.add(key);
                        const maximum = independentMaximum(operation, first, second);
                        if (maximum > upper || maximum <= range.maximumAbove) throw new Error(`Wrong canonical maximum ${operation}:${key}:${maximum}`);
                        // Both actual decimal operands are <5: no positive lower bound can be tight.
                        if (first / 100 >= 5 || second / 100 >= 5) throw new Error('Unexpected source operand envelope');
                    }
                    seen.set(pool.profile, visited);
                }
            }
            for (const pool of original) expect(seen.get(pool.profile)?.size).toBe(pool.pairs.length);
            expect(unique.map(values => values.size)).toEqual(expectedCounts[`${operation}:${zero}`]);
        }
    });

    it('resolves all feasible operation/zero/range bindings directly and in planned configuration', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        const generator = new DecimalAdditionSubtractionGenerator();
        for (const [area, operation] of [[Area.Addition, 'addition'], [Area.Subtraction, 'subtraction']] as const)
            for (const [zeroLabel, zeroPresence] of [[Scope.NumbersWithZero, true], [Scope.NumbersWithoutZero, false]] as const)
                for (const [bound, upper] of [[Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20]] as const) {
                    const labels = [area, zeroLabel, bound, Scope.HundredthDecimals];
                    const match = planModelCompatibility({id: 'column-range', labels},
                        {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                        {viewId: 'range-test', generalLabels: [], schema: {}, spec: {viewId: 'range-test', generalLabels: []}});
                    if (!zeroPresence && upper === 10) {
                        expect(match.supported).toBe(false);
                        expect(() => extractConfig(schema, labels)).toThrow();
                        continue;
                    }
                    expect(match.supported).toBe(true);
                    const direct = extractConfig(schema, labels);
                    const planned = resolveSchemaChoices(schema, labels, {operation: [area], zeroPresence: [zeroLabel], range: [bound]});
                    expect(planned.config).toEqual(direct.config);
                    expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
                    expect(direct.config).toEqual({operation, zeroPresence, range: createCanonicalNumericRange(upper)});
                    const data = generator.generate(direct.config)!.data;
                    expect(hasCanonicalRangeWitness([data.first.valueInHundredths / 100, data.second.valueInHundredths / 100,
                        data.result.valueInHundredths / 100, 1, 10, ...data.model.steps.flatMap(step => [...Object.values(step.before), ...Object.values(step.after)])], direct.config.range!)).toBe(true);
                }
        for (let seed = 0; seed < 32; seed++) {
            random.setSeed(seed);
            expect(extractConfig(schema, [Area.Addition, Scope.NumbersSmaller10]).config.zeroPresence).toBe(true);
            expect(extractConfig(schema, [Area.Subtraction, Scope.NumbersWithoutZero]).config.range!.max).toBe(20);
        }
        expect(planModelCompatibility({id: 'integer-fluency', labels: [Area.Addition, Scope.NumbersSmaller20, Scope.NumbersWithoutZero]},
            {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
            {viewId: 'range-test', generalLabels: [], schema: {}, spec: {viewId: 'range-test', generalLabels: []}}).supported).toBe(false);
    });

    it('rejects malformed or infeasible range claims before sampling', () => {
        const draw = vi.spyOn(random, 'random');
        const generator = new DecimalAdditionSubtractionGenerator();
        for (const range of [null, createCanonicalNumericRange(5), createCanonicalNumericRange(20, 5),
            {...createCanonicalNumericRange(10), maximumAbove: 0}, {...createCanonicalNumericRange(10), minimumBelow: 20}])
            expect(() => generator.generate({operation: 'addition', zeroPresence: true, range} as never)).toThrow();
        expect(() => generator.generate({operation: 'subtraction', zeroPresence: false, range: createCanonicalNumericRange(10)})).toThrow(/No unit-exchange/);
        expect(draw).not.toHaveBeenCalled();
        const example = createDecimalAddSubtractProblem('addition', 5, 5)!;
        expect(example.model.steps.some(step => Object.values(step.before).includes(10))).toBe(true);
        expect(independentMaximum('addition', 5, 5)).toBe(10);
    });
});
