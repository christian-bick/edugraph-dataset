import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {DecimalPlaceValueScalingGenerator} from './generator.ts';
import {DecimalPlaceValueScalingGeneratorSchema, spec} from './spec.ts';

describe('DecimalPlaceValueScalingGenerator spec', () => {
    it('keeps the bidirectional adjacent-place claims invariant', () => {
        expect(spec.generalLabels).toEqual([
        Area.PlaceValue,
        Area.ProportionalScaling,
        Area.Multiplication,
        Area.Division,
        Scope.Base10,
        Scope.DecimalNumbers,
        Scope.NumbersWithoutNegatives
    ]);
        expect(findSchemaFallbackContractIssues(DecimalPlaceValueScalingGeneratorSchema)).toEqual([]);
        expect(normalizeSchemaChoices(DecimalPlaceValueScalingGeneratorSchema, [], 'generator')[0].alternatives
            .map(alternative => alternative.labels)).toEqual([[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]);
    });

    it('resolves a Grade 5 decimal scaling target to the exact canonical model', () => {
        const stub = generateWithLabels(new DecimalPlaceValueScalingGenerator(), [
            Area.PlaceValue,
            Area.ProportionalScaling,
            Area.Multiplication,
            Area.Division,
            Scope.Base10,
            Scope.DecimalNumbers
        ])!;
        expect(stub.labels).toHaveLength(1);
        expect([Scope.NumbersWithZero, Scope.NumbersWithoutZero]).toContain(stub.labels[0]);
        expect(stub.data.kind).toBe('decimal-adjacent-place-scaling');
        expect(stub.data.higherPlace.digitValueInThousandths)
            .toBe(stub.data.lowerPlace.digitValueInThousandths * 10);
    });

    it.each([Scope.NumbersWithZero, Scope.NumbersWithoutZero])('resolves the explicit coefficient profile %s', label => {
        const resolved = extractConfig(DecimalPlaceValueScalingGeneratorSchema, [label]);
        expect(resolved.config.requireZeroCoefficient).toBe(label === Scope.NumbersWithZero);
        expect(resolved.resolvedLabels).toEqual([label]);
        const data = new DecimalPlaceValueScalingGenerator().generate(resolved.config).data;
        expect(data.digits.includes(0)).toBe(label === Scope.NumbersWithZero);
    });
});
