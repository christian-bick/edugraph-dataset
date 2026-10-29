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
        expect(normalizeSchemaChoices(DecimalRoundingGeneratorSchema, [], 'generator')[0].alternatives
            .map(alternative => alternative.labels)).toEqual([[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]);
    });

    it('resolves the Grade 5 rounding target to the canonical exact model', () => {
        const stub = generateWithLabels(new DecimalRoundingGenerator(), [
            Area.DecimalRounding,
            Scope.DecimalNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives
        ])!;
        expect(stub.labels).toHaveLength(1);
        expect([Scope.NumbersWithZero, Scope.NumbersWithoutZero]).toContain(stub.labels[0]);
        expect(stub.data.kind).toBe('decimal-place-rounding');
        expect(stub.data.roundedInTenThousandths)
            .toBe(stub.data.direction === 'down'
                ? stub.data.lowerCandidateInTenThousandths : stub.data.upperCandidateInTenThousandths);
    });

    it.each([Scope.NumbersWithZero, Scope.NumbersWithoutZero])('resolves the explicit endpoint profile %s', label => {
        const resolved = extractConfig(DecimalRoundingGeneratorSchema, [label]);
        expect(resolved.config.requireZeroEndpoint).toBe(label === Scope.NumbersWithZero);
        expect(resolved.resolvedLabels).toEqual([label]);
        const data = new DecimalRoundingGenerator().generate(resolved.config).data;
        expect(data.lowerCandidateInTenThousandths === 0).toBe(label === Scope.NumbersWithZero);
    });
});
