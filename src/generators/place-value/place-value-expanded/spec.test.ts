import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {PlaceValueExpandedGenerator} from './generator.ts';

describe('PlaceValueExpandedGenerator spec integration', () => {
    const generator = new PlaceValueExpandedGenerator();

    it.each([
        [Scope.TwoOperands, 2],
        [Scope.ThreeOperands, 3]
    ] as const)('resolves %s labels', (operandCardinality, expectedLength) => {
        const stub = generateWithLabels(generator, [
            Area.PlaceValue,
            Area.Sum,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersLarger100,
            Scope.NumbersSmaller1000,
            operandCardinality,
            Ability.Formalization
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.terms).toHaveLength(expectedLength);
        expect(stub!.tags).toContain(operandCardinality);
    });
});
