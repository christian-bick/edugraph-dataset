import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {setSeed} from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {spec as viewSpec, NumbersDecimalRoundingLineViewSchema} from '../../../visuals/views/numbers/numbers-decimal-rounding-line/spec.ts';
import {DecimalRoundingGenerator} from './generator.ts';
import {roundingRanges, supportsRoundingRange} from './range-profile.ts';
import {DecimalRoundingGeneratorSchema as schema, spec} from './spec.ts';

describe('decimal rounding correlated range profiles', () => {
    it('resolves all twelve supported combinations in direct and planned paths', () => {
        let supported = 0;
        for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) for (const [bounds, range] of roundingRanges) {
            const labels = [...spec.generalLabels, ...viewSpec.generalLabels, zero, ...bounds];
            const match = planModelCompatibility({id: 'rounding-range', labels},
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: NumbersDecimalRoundingLineViewSchema, spec: viewSpec});
            if (!supportsRoundingRange(zero === Scope.NumbersWithZero, range)) {
                expect(match.supported).toBe(false);
                expect(() => extractConfig(schema, labels)).toThrow();
                continue;
            }
            supported++;
            expect(match.supported).toBe(true);
            const direct = extractConfig(schema, labels);
            const planned = resolveSchemaChoices(schema, labels, {requireZeroEndpoint: [zero], range: [...bounds]});
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
            expect(direct.config.range).toEqual(range);
            const data = new DecimalRoundingGenerator().generate(direct.config).data;
            expect(hasCanonicalRangeWitness([data.inputInTenThousandths, data.lowerCandidateInTenThousandths,
                data.upperCandidateInTenThousandths, data.midpointInTenThousandths, data.roundedInTenThousandths,
                data.distanceToLowerInTenThousandths, data.distanceToUpperInTenThousandths].map(value => value / 10000), range)).toBe(true);
        }
        expect(supported).toBe(12);
    });

    it('filters zero/positive-range correlations before direct fallback sampling', () => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const positive = extractConfig(schema, [Scope.NumbersLarger10]);
            expect(positive.config.requireZeroEndpoint).toBe(false);
            expect(positive.config.range?.min).toBe(10);
            const high = extractConfig(schema, [Scope.NumbersSmaller120]);
            expect(high.config.requireZeroEndpoint).toBe(false);
            const zero = extractConfig(schema, [Scope.NumbersWithZero]);
            expect([5, 10, 100]).toContain(zero.config.range?.max);
            expect(zero.config.range?.min).toBe(0);
        }
    });
});
