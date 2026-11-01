import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {setSeed} from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {spec as viewSpec, NumbersDecimalExpandedFormViewSchema} from '../../../visuals/views/numbers/numbers-decimal-expanded-form/spec.ts';
import {DecimalPlaceValueExpandedGenerator} from './generator.ts';
import {expandedRangePairs, resolveExpandedRange} from './range-profile.ts';
import {DecimalPlaceValueExpandedGeneratorSchema as schema, spec} from './spec.ts';

describe('expanded decimal correlated range choices', () => {
    it('resolves precisely the eight feasible combinations in both configuration paths', () => {
        for (const zero of [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) for (const [bound, upper] of expandedRangePairs) {
            const labels = [...spec.generalLabels, ...viewSpec.generalLabels, zero, bound];
            const match = planModelCompatibility({id: 'expanded-range', labels},
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: NumbersDecimalExpandedFormViewSchema, spec: viewSpec});
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
            const data = new DecimalPlaceValueExpandedGenerator().generate(direct.config)!.data;
            const quantities = [data.valueInThousandths / 1000,
                ...data.sumTerms.flatMap(term => [term.digit, term.unitNumerator / term.unitDenominator, term.contributionInThousandths / 1000])];
            expect(hasCanonicalRangeWitness(quantities, direct.config.range!)).toBe(true);
        }
    });

    it('filters impossible direct fallbacks before selecting a correlated profile', () => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const smaller = extractConfig(schema, [Scope.NumbersSmaller20]);
            expect(smaller.config.requireZeroCoefficient).toBe(true);
            const noZero = extractConfig(schema, [Scope.NumbersWithoutZero]);
            expect([120, 1000]).toContain(noZero.config.range?.max);
            const unspecified = extractConfig(schema, []);
            expect(unspecified.config.requireZeroCoefficient || unspecified.config.range!.max > 100).toBe(true);
        }
        expect(resolveExpandedRange([])).toBeUndefined();
        expect(() => resolveExpandedRange([Scope.NumbersSmaller5, Scope.NumbersSmaller10])).toThrow(/Ambiguous/);
    });
});
