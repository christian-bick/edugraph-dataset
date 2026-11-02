import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {spec as viewSpec} from '../../../visuals/views/numbers/numbers-rounding-line/spec.ts';
import {IntegerRoundingGenerator} from './generator.ts';
import {roundingDomain, integerRoundingQuantities} from './domain.ts';
import {roundingPlaces} from './endpoint-profile.ts';
import {IntegerRoundingGeneratorSchema as schema, spec} from './spec.ts';

const generator = new IntegerRoundingGenerator();
const plan = (labels: string[]) => planModelCompatibility({id: 'rounding', labels},
    {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
    {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: {}, spec: viewSpec});

describe('IntegerRoundingGenerator canonical configuration', () => {
    it('executes every feasible endpoint/place/bound choice directly and through real-view plans', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        for (const [magnitude, place] of roundingPlaces) for (const zero of [true, false]) {
            for (const {range, labels: rangeLabels} of canonicalRangeProfiles) {
                if (!roundingDomain(place, zero, range).count) continue;
                const labels = [Area.IntegerRounding, Ability.ProcedureExecution, magnitude,
                    zero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero, ...rangeLabels];
                const result = plan(labels);
                expect(result.supported).toBe(true);
                if (!result.supported) continue;
                setSeed(17);
                const resolved = extractConfig(schema, labels);
                const direct = generator.generate(resolved.config)!;
                expect(hasCanonicalRangeWitness(integerRoundingQuantities(direct.data), range)).toBe(true);
                expect(direct.data.lowerMultiple === 0).toBe(zero);
                const input = {generator, generatorSpec: spec, viewSchema: {}, viewSpec, plan: result.plan,
                    sampleKey: 'rounding#integer-rounding#numbers-rounding-line#train#question#inst:0', attempt: 1, seed: 42};
                const draw = generatePlannedDraw(input), state = getRandomState();
                expect(hasCanonicalRangeWitness(integerRoundingQuantities(draw.stub!.data), resolveCanonicalRangeFromLabels(draw.labels)!)).toBe(true);
                expect(generatePlannedDraw({...input, replay: draw.replay})).toEqual(draw);
                expect(getRandomState()).toBe(state);
            }
        }
    });
    it('filters broad direct magnitude/zero choices by the requested canonical band', () => {
        for (const labels of [[], [Scope.NumbersSmaller1000], [Scope.NumbersSmaller1000000],
            [Scope.NumbersSmaller10], [Scope.NumbersSmaller100000, Scope.NumbersWithZero]]) {
            for (let seed = 0; seed < 40; seed++) {
                setSeed(`broad-rounding-${seed}`);
                const resolved = extractConfig(schema, labels), data = generator.generate(resolved.config)!.data;
                expect(hasCanonicalRangeWitness(integerRoundingQuantities(data), resolved.config.range!)).toBe(true);
                expect(data.lowerMultiple === 0).toBe(resolved.config.zeroEndpoint);
                for (const label of labels) expect(resolved.resolvedLabels).toContain(label);
            }
        }
        for (const magnitude of [Scope.StepsOf10, Scope.StepsOf100, Scope.StepsOf1000, Scope.StepsOf10000, Scope.StepsOf100000]) {
            const resolved = extractConfig(schema, [magnitude, Scope.NumbersSmaller1000000]);
            expect(generator.generate(resolved.config)).not.toBeNull();
        }
    });
    it('keeps explicit infeasible endpoint/range combinations outside matching', () => {
        for (const labels of [[Scope.StepsOf10, Scope.NumbersWithZero, Scope.NumbersSmaller1000],
            [Scope.StepsOf1000, Scope.NumbersSmaller1000], [Scope.NumbersWithZero, Scope.NumbersLarger5],
            [Scope.NumbersWithZero, Scope.NumbersWithoutZero], [Scope.StepsOf10, Scope.StepsOf100]]) {
            expect(plan(labels).supported).toBe(false);
            expect(() => extractConfig(schema, labels)).toThrow();
        }
    });
});
