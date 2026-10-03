import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
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
            Scope.DecimalNumbers
        ]);
        expect(DecimalPlaceValueScalingGeneratorSchema).toEqual({});
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
        expect(stub.labels).toEqual([]);
        expect(stub.data.kind).toBe('decimal-adjacent-place-scaling');
        expect(stub.data.higherPlace.digitValueInThousandths)
            .toBe(stub.data.lowerPlace.digitValueInThousandths * 10);
    });
});
