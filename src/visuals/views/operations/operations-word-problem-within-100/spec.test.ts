import {Ability} from 'edugraph-ts';
import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, extractSchemaLabels} from '../../../../lib/utils.ts';
import {spec, OperationsWordProblemWithin100ViewSchema} from './spec.ts';

describe('operations-word-problem-within-100 view spec', () => {
    it('selects a centimeter story for the declared length context', () => {
        expect(spec.generalLabels).toEqual([
            Ability.TextualReception,
            Scope.ArabicNumerals
        ]);
        expect(extractSchemaLabels(OperationsWordProblemWithin100ViewSchema))
            .toEqual([Scope.CentimeterScale]);
        expect(extractConfig(
            OperationsWordProblemWithin100ViewSchema,
            [Scope.CentimeterScale]
        ).config.useLengthContext).toBe(true);
    });
});
