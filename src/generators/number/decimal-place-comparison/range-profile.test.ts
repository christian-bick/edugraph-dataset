import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import * as rng from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {spec as viewSpec, NumbersDecimalPlaceComparisonViewSchema} from '../../../visuals/views/numbers/numbers-decimal-place-comparison/spec.ts';
import {DecimalPlaceComparisonGenerator} from './generator.ts';
import {comparisonRangeMappings, supportsComparisonRange} from './range-profile.ts';
import {DecimalPlaceComparisonGeneratorSchema as schema, spec} from './spec.ts';

afterEach(() => vi.restoreAllMocks());
const profiles = [[Area.NumericInequality, Scope.Greater, Scope.NumbersWithZero],
    [Area.NumericInequality, Scope.Greater, Scope.NumbersWithoutZero], [Area.NumericEquality, Scope.Equal, Scope.NumbersWithZero],
    [Area.NumericInequality, Scope.Less, Scope.NumbersWithZero], [Area.NumericInequality, Scope.Less, Scope.NumbersWithoutZero]] as const;

describe('decimal comparison correlated range choices', () => {
    it('resolves precisely twenty-four relation/range profiles through both paths', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        let supported = 0;
        for (const [area, relation, zero] of profiles) for (const [bounds, range] of comparisonRangeMappings) {
            const labels = [...spec.generalLabels, ...viewSpec.generalLabels, area, relation, zero, ...bounds];
            const match = planModelCompatibility({id: 'comparison-range', labels},
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: NumbersDecimalPlaceComparisonViewSchema, spec: viewSpec});
            if (!supportsComparisonRange(zero === Scope.NumbersWithoutZero, range)) {
                expect(match.supported).toBe(false);
                expect(() => extractConfig(schema, labels)).toThrow();
                continue;
            }
            supported++;
            expect(match.supported).toBe(true);
            const direct = extractConfig(schema, labels);
            const planned = resolveSchemaChoices(schema, labels, {comparisonKind: [area], relation: [relation, zero], range: [...bounds]});
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
            expect(direct.config.range).toEqual(range);
            const data = new DecimalPlaceComparisonGenerator().generate(direct.config)!.data;
            expect(hasCanonicalRangeWitness([data.left, data.right].flatMap(operand =>
                [operand.valueInThousandths / 1000, ...operand.wholeDigits, ...operand.fractionalDigits]), range)).toBe(true);
        }
        expect(supported).toBe(24);
    });

    it('retains equality completion and filters range/zero fallbacks before selecting', () => {
        for (let seed = 0; seed < 40; seed++) {
            rng.setSeed(seed);
            const small = extractConfig(schema, [Area.NumericInequality, Scope.Less, Scope.NumbersSmaller20]);
            expect(small.config.relation).toBe('less-zero');
            const lower = extractConfig(schema, [Area.NumericInequality, Scope.Greater, Scope.NumbersLarger5]);
            expect(lower.config.relation).toBe('greater-nonzero');
            expect(lower.config.range?.min).toBe(5);
            const nonzero = extractConfig(schema, [Area.NumericInequality, Scope.Greater, Scope.NumbersWithoutZero]);
            expect([120, 1000]).toContain(nonzero.config.range?.max);
            const equal = extractConfig(schema, [Area.NumericEquality, Scope.Equal]);
            expect(equal.resolvedLabels).toContain(Scope.NumbersWithZero);
            expect(equal.config.range?.min).toBe(0);
        }
    });

    it('rejects empty relation/range combinations before consuming randomness', () => {
        const draw = vi.spyOn(rng, 'random');
        const generator = new DecimalPlaceComparisonGenerator();
        expect(() => generator.generate({comparisonKind: 'equality', relation: 'equal', range: comparisonRangeMappings[6][1]})).toThrow(/No operand/);
        expect(() => generator.generate({comparisonKind: 'inequality', relation: 'less-nonzero', range: comparisonRangeMappings[0][1]})).toThrow(/No operand/);
        expect(draw).not.toHaveBeenCalled();
    });
});
