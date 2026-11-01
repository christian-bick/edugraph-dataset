import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {spec as viewSpec, NumbersDecimalExpandedFormViewSchema} from '../../../visuals/views/numbers/numbers-decimal-expanded-form/spec.ts';
import {DecimalPlaceValueExpandedGenerator} from './generator.ts';
import {DecimalPlaceValueExpandedGeneratorSchema, spec} from './spec.ts';

describe('DecimalPlaceValueExpandedGenerator spec', () => {
    it('keeps only the reviewed mathematical claims invariant', () => {
        expect(spec.generalLabels).toEqual([
            Area.PlaceValue,
            Area.Sum,
            Scope.ThousandthDecimals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ]);
        expect(findSchemaFallbackContractIssues(DecimalPlaceValueExpandedGeneratorSchema)).toEqual([]);
        expect(normalizeSchemaChoices(DecimalPlaceValueExpandedGeneratorSchema, [], 'generator').find(field => field.field === 'requireZeroCoefficient')!.alternatives
            .map(alternative => alternative.labels)).toEqual([[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]);
    });

    it('resolves the Grade 5 decimal expansion target to an exact canonical model', () => {
        const stub = generateWithLabels(new DecimalPlaceValueExpandedGenerator(), [
            Area.PlaceValue,
            Area.Sum,
            Scope.ThousandthDecimals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ])!;
        expect(stub.labels).toHaveLength(2);
        expect(stub.labels.some(label => [Scope.NumbersWithZero, Scope.NumbersWithoutZero].includes(label as never))).toBe(true);
        expect(stub.data.kind).toBe('decimal-place-value-expanded');
        expect(stub.data.sumTerms.length).toBeGreaterThanOrEqual(2);
        expect(stub.data.sumTerms.reduce((sum, term) => sum + term.contributionInThousandths, 0))
            .toBe(stub.data.valueInThousandths);
    });

    it.each([Scope.NumbersWithZero, Scope.NumbersWithoutZero])('matches and resolves the explicit profile %s', zeroLabel => {
        const labels = [...spec.generalLabels, ...viewSpec.generalLabels, zeroLabel];
        const result = planModelCompatibility({id: 'decimal-expanded-profile', labels},
            {generatorId: spec.generatorId, schema: DecimalPlaceValueExpandedGeneratorSchema, generalLabels: spec.generalLabels, spec},
            {viewId: viewSpec.viewId, schema: NumbersDecimalExpandedFormViewSchema, generalLabels: viewSpec.generalLabels, spec: viewSpec});
        expect(result.supported).toBe(true);
        const resolved = extractConfig(DecimalPlaceValueExpandedGeneratorSchema, labels);
        expect(resolved.config.requireZeroCoefficient).toBe(zeroLabel === Scope.NumbersWithZero);
        expect(resolved.resolvedLabels).toContain(zeroLabel);
        expect(resolved.resolvedLabels).toHaveLength(2);
        const data = new DecimalPlaceValueExpandedGenerator().generate(resolved.config)!.data;
        expect(data.places.some(place => place.digit === 0)).toBe(zeroLabel === Scope.NumbersWithZero);
    });
});
