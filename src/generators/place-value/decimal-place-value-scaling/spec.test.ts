import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {DecimalPlaceValueScalingGenerator} from './generator.ts';
import {DecimalPlaceValueScalingGeneratorSchema as schema, spec} from './spec.ts';
import {scalingRangePairs} from './range-profile.ts';

describe('decimal-place-value-scaling truthful zero ownership', () => {
    it('keeps zero absence invariant and only mathematical ranges parameterized', () => {
        expect(spec.generalLabels).toContain(Scope.NumbersWithoutZero);
        expect(spec.generalLabels).not.toContain(Scope.NumbersWithZero);
        expect(Object.keys(schema)).toEqual(['range']);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        const [field] = normalizeSchemaChoices(schema, [], 'generator');
        expect(field!.alternatives.map(choice => choice.labels.join('|')).sort())
            .toEqual(scalingRangePairs.map(([label]) => label).sort());
    });

    it.each(scalingRangePairs)('resolves %s before creating positive assessed quantities', (bound) => {
        const generator = new DecimalPlaceValueScalingGenerator();
        const stub = generateWithLabels(generator, [bound])!;
        expect(stub.labels).toEqual([bound]);
        const data = stub.data;
        const quantities = [data.numberInThousandths / 1000, data.higherPlace.digitValueInThousandths / 1000, data.lowerPlace.digitValueInThousandths / 1000, data.scale.factor, data.scale.reciprocalNumerator / data.scale.reciprocalDenominator];
        expect(quantities.every(value => value > 0)).toBe(true);
        expect(hasCanonicalRangeWitness(quantities, schema.range[1]([bound])!)).toBe(true);
    });
});
