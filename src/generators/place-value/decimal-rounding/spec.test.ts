import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {DecimalRoundingGenerator} from './generator.ts';
import {DecimalRoundingGeneratorSchema, spec} from './spec.ts';

describe('DecimalRoundingGenerator spec', () => {
    it('owns only the invariant decimal rounding mathematics and numeric context', () => {
        expect(spec.generalLabels).toEqual([
            Area.DecimalRounding,
            Scope.DecimalNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ]);
        expect(findSchemaFallbackContractIssues(DecimalRoundingGeneratorSchema)).toEqual([]);
        expect(normalizeSchemaChoices(DecimalRoundingGeneratorSchema, [], 'generator').find(field => field.field === 'requireZeroEndpoint')!.alternatives
            .map(alternative => alternative.labels)).toEqual([[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]);
    });

    it('resolves the Grade 5 rounding target to the canonical exact model', () => {
        const stub = generateWithLabels(new DecimalRoundingGenerator(), [
            Area.DecimalRounding,
            Scope.DecimalNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ])!;
        expect(stub.labels.length).toBeGreaterThanOrEqual(2);
        expect(stub.labels.some(label => [Scope.NumbersWithZero, Scope.NumbersWithoutZero].includes(label as never))).toBe(true);
        expect(stub.data.kind).toBe('decimal-place-rounding');
        expect(stub.data.roundedInTenThousandths)
            .toBe(stub.data.direction === 'down'
                ? stub.data.lowerCandidateInTenThousandths : stub.data.upperCandidateInTenThousandths);
    });

    it.each([Scope.NumbersWithZero, Scope.NumbersWithoutZero])('resolves the explicit endpoint profile %s', label => {
        const resolved = extractConfig(DecimalRoundingGeneratorSchema, [label]);
        expect(resolved.config.requireZeroEndpoint).toBe(label === Scope.NumbersWithZero);
        expect(resolved.resolvedLabels).toContain(label);
        expect(resolved.resolvedLabels.length).toBeGreaterThanOrEqual(2);
        const data = new DecimalRoundingGenerator().generate(resolved.config).data;
        expect(data.lowerCandidateInTenThousandths === 0).toBe(label === Scope.NumbersWithZero);
    });
});
