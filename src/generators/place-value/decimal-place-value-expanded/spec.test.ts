import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {DecimalPlaceValueExpandedGenerator} from './generator.ts';
import {DecimalPlaceValueExpandedGeneratorSchema as schema, spec} from './spec.ts';
import {expandedRangePairs} from './range-profile.ts';

describe('decimal-place-value-expanded truthful zero ownership', () => {
    it('keeps zero absence invariant and only mathematical ranges parameterized', () => {
        expect(spec.generalLabels).toContain(Scope.NumbersWithoutZero);
        expect(spec.generalLabels).not.toContain(Scope.NumbersWithZero);
        expect(Object.keys(schema)).toEqual(['range']);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        const [field] = normalizeSchemaChoices(schema, [], 'generator');
        expect(field!.alternatives.map(choice => choice.labels.join('|')).sort())
            .toEqual(expandedRangePairs.map(([label]) => label).sort());
    });

    it.each(expandedRangePairs)('resolves %s before creating positive assessed quantities', (bound) => {
        const generator = new DecimalPlaceValueExpandedGenerator();
        const stub = generateWithLabels(generator, [bound])!;
        expect(stub.labels).toEqual([bound]);
        const data = stub.data;
        const quantities = [data.valueInThousandths / 1000, ...data.sumTerms.flatMap(term => [term.digit, term.unitNumerator / term.unitDenominator, term.contributionInThousandths / 1000])];
        expect(quantities.every(value => value > 0)).toBe(true);
        expect(hasCanonicalRangeWitness(quantities, schema.range[1]([bound])!)).toBe(true);
    });
});
