import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, extractSchemaLabels} from '../../../../lib/utils.ts';
import {
    spec,
    OperationsWordProblemWithin100InversionViewSchema
} from './spec.ts';

describe('operations-word-problem-within-100-inversion view spec', () => {
    it('owns inversion and selects the declared centimeter context', () => {
        expect(spec.generalLabels).toEqual([
            Ability.TextualReception,
            Ability.ProcedureInversion,
            Scope.ArabicNumerals
        ]);
        expect(extractSchemaLabels(OperationsWordProblemWithin100InversionViewSchema))
            .toEqual([Scope.CentimeterScale]);
        expect(extractConfig(
            OperationsWordProblemWithin100InversionViewSchema,
            [Scope.CentimeterScale]
        ).config.useLengthContext).toBe(true);
    });
});
