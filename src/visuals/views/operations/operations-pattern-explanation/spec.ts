import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-pattern-explanation',
    generalLabels: [
        Area.EmergentFeatureRecognition,
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding,
        Ability.TextualArticulation
    ],
    compatibility: [
        requireTargetLabels('emergent-feature-request', [Area.EmergentFeatureRecognition])
    ]
};

export const OperationsPatternExplanationViewSchema = {} as const;
export type OperationsPatternExplanationViewConfig = ConfigFromSchema<typeof OperationsPatternExplanationViewSchema>;
