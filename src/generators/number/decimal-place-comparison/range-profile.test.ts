import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import * as rng from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {spec as viewSpec, NumbersDecimalPlaceComparisonViewSchema} from '../../../visuals/views/numbers/numbers-decimal-place-comparison/spec.ts';
import {DecimalPlaceComparisonGenerator} from './generator.ts';
import {comparisonRangeMappings, supportsComparisonRange} from './range-profile.ts';
import {DecimalPlaceComparisonGeneratorSchema as schema, spec} from './spec.ts';

afterEach(() => vi.restoreAllMocks());
const profiles = [[Area.NumericInequality, Scope.Greater, 'greater', 9], [Area.NumericEquality, Scope.Equal, 'equal', 6],
    [Area.NumericInequality, Scope.Less, 'less', 9]] as const;
const generatorModel = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
const viewModel = {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: NumbersDecimalPlaceComparisonViewSchema, spec: viewSpec};

describe('decimal comparison correlated scalar choices', () => {
    it('keeps standalone schema fallbacks valid', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
    });

    it.each(profiles)('resolves every %s/%s scalar profile through direct and planned paths', (area, relation, nativeRelation, expected) => {
        let supported = 0;
        for (const [bounds, range] of comparisonRangeMappings) {
            const labels = [...spec.generalLabels, ...viewSpec.generalLabels, area, relation, ...bounds];
            const match = planModelCompatibility({id: 'comparison-range', labels}, generatorModel, viewModel);
            if (!supportsComparisonRange(nativeRelation, range)) {
                expect(match.supported).toBe(false);
                expect(() => extractConfig(schema, labels)).toThrow();
                continue;
            }
            supported++;
            expect(match.supported).toBe(true);
            const direct = extractConfig(schema, labels);
            const planned = resolveSchemaChoices(schema, labels, {comparisonKind: [area], relation: [relation], range: [...bounds]});
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
            expect(direct.config.range).toEqual(range);
            expect(direct.config.relation).toBe(nativeRelation);
            const data = new DecimalPlaceComparisonGenerator().generate(direct.config)!.data;
            expect(hasCanonicalRangeWitness([data.left.valueInThousandths / 1000, data.right.valueInThousandths / 1000], range)).toBe(true);
        }
        expect(supported).toBe(expected);
    });

    it('retains equality and lower-bound completion before selecting an instance', () => {
        for (let seed = 0; seed < 40; seed++) {
            rng.setSeed(seed);
            const small = extractConfig(schema, [Area.NumericInequality, Scope.Less, Scope.NumbersSmaller20]);
            expect(small.config.relation).toBe('less');
            const lower = extractConfig(schema, [Area.NumericInequality, Scope.Greater, Scope.NumbersLarger120]);
            expect(lower.config.relation).toBe('greater');
            expect(lower.config.range).toEqual(createCanonicalNumericRange(1000, 120));
            const equal = extractConfig(schema, [Area.NumericEquality, Scope.Equal]);
            expect(supportsComparisonRange('equal', equal.config.range!)).toBe(true);
            const data = new DecimalPlaceComparisonGenerator().generate(equal.config)!.data;
            expect(data.left.valueInThousandths).toBe(data.right.valueInThousandths);
        }
    });

    it('admits all zero-glyph scalars but rejects an actual-zero target claim', () => {
        expect(planModelCompatibility({id: 'actual-zero', labels: [Area.NumericInequality, Scope.Less, Scope.NumbersWithZero]},
            generatorModel, viewModel).supported).toBe(false);
        const match = planModelCompatibility({id: 'without-zero', labels: [Area.NumericInequality, Scope.Less, Scope.NumbersWithoutZero]},
            generatorModel, viewModel);
        expect(match.supported).toBe(true);
    });

    it('rejects empty or altered scalar profiles before consuming randomness', () => {
        const draw = vi.spyOn(rng, 'random');
        const generator = new DecimalPlaceComparisonGenerator();
        expect(() => generator.generate({comparisonKind: 'equality', relation: 'equal', range: createCanonicalNumericRange(1000)})).toThrow(/No operand/);
        expect(() => generator.generate({comparisonKind: 'inequality', relation: 'less', range: createCanonicalNumericRange(20)})).toThrow(/No operand/);
        expect(() => generator.generate({comparisonKind: 'inequality', relation: 'less',
            range: {...createCanonicalNumericRange(1000, 120), minimumBelow: 100}})).toThrow(/witness/);
        expect(() => generator.generate({comparisonKind: 'inequality', relation: 'less',
            range: createCanonicalNumericRange(10000)})).toThrow(/Unsupported/);
        expect(draw).not.toHaveBeenCalled();
    });
});
