import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-pattern-correspondence-explanation',
    generalLabels: [Scope.ArabicNumerals, Ability.Interpretation, Ability.TextualArticulation],
    compatibility: [
        requireTargetLabels('pattern-correspondence-explanation-request', [Area.PatternCorrespondence, Ability.TextualArticulation])
    ]
};

export const OperationsPatternCorrespondenceExplanationViewSchema = {} as const;

export type OperationsPatternCorrespondenceExplanationViewConfig = ConfigFromSchema<typeof OperationsPatternCorrespondenceExplanationViewSchema>;
