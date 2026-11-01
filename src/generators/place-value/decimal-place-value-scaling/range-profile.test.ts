import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {setSeed} from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {spec as viewSpec, NumbersDecimalPlaceValueScalingViewSchema} from '../../../visuals/views/numbers/numbers-decimal-place-value-scaling/spec.ts';
import {DecimalPlaceValueScalingGenerator} from './generator.ts';
import {scalingRangePairs, resolveScalingRange} from './range-profile.ts';
import {DecimalPlaceValueScalingGeneratorSchema as schema, spec} from './spec.ts';

describe('adjacent-place correlated decimal ranges', () => {
    it('resolves exactly seven feasible combinations in direct and planned paths', () => {
        for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) for (const [bound, upper] of scalingRangePairs) {
            const labels = [...spec.generalLabels, ...viewSpec.generalLabels, zero, bound];
            const match = planModelCompatibility({id: 'scaling-range', labels},
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: NumbersDecimalPlaceValueScalingViewSchema, spec: viewSpec});
            if (zero === Scope.NumbersWithoutZero && upper <= 100) {
                expect(match.supported).toBe(false);
                expect(() => extractConfig(schema, labels)).toThrow();
                continue;
            }
            expect(match.supported).toBe(true);
            const direct = extractConfig(schema, labels);
            const planned = resolveSchemaChoices(schema, labels, {requireZeroCoefficient: [zero], range: [bound]});
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
            expect(direct.config.range).toEqual(createCanonicalNumericRange(upper));
            const data = new DecimalPlaceValueScalingGenerator().generate(direct.config).data;
            expect(hasCanonicalRangeWitness([data.numberInThousandths / 1000,
                data.higherPlace.digitValueInThousandths / 1000, data.lowerPlace.digitValueInThousandths / 1000,
                data.scale.factor, data.scale.reciprocalNumerator / data.scale.reciprocalDenominator], direct.config.range!)).toBe(true);
        }
    });

    it('filters impossible fallback combinations before choosing', () => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const smaller = extractConfig(schema, [Scope.NumbersSmaller20]);
            expect(smaller.config.requireZeroCoefficient).toBe(true);
            const noZero = extractConfig(schema, [Scope.NumbersWithoutZero]);
            expect([120, 1000]).toContain(noZero.config.range?.max);
            const unspecified = extractConfig(schema, []);
            expect(unspecified.config.requireZeroCoefficient || unspecified.config.range!.max > 100).toBe(true);
        }
        expect(resolveScalingRange([])).toBeUndefined();
        expect(() => resolveScalingRange([Scope.NumbersSmaller10, Scope.NumbersSmaller20])).toThrow(/Ambiguous/);
    });
});
