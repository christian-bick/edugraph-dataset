import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, extractSchemaLabels} from '../../../../lib/utils.ts';
import {
    spec,
    OperationsWordProblemWithin100InversionViewSchema
} from './spec.ts';

describe('operations-word-problem-within-100-inversion view spec', () => {
    it('owns inversion while retaining the non-Ability length parameter', () => {
        expect(spec.generalLabels).toEqual([
            Ability.TextualReception,
            Ability.ProcedureInversion,
            Scope.ArabicNumerals
        ]);
        expect(extractSchemaLabels(OperationsWordProblemWithin100InversionViewSchema))
            .toEqual([Scope.LengthMeasurement]);
        expect(extractConfig(
            OperationsWordProblemWithin100InversionViewSchema,
            [Scope.LengthMeasurement]
        ).config.useLengthContext).toBe(true);
    });
});
