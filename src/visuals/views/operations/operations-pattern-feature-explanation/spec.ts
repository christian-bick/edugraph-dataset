import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-pattern-feature-explanation',
    generalLabels: [
        Area.EmergentFeatureRecognition,
        Area.PatternGeneration,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding,
        Ability.TextualArticulation
    ],
    compatibility: [
        requireTargetLabels('emergent-feature-execution-request', [Area.EmergentFeatureRecognition, Ability.ProcedureExecution])
    ]
};

export const OperationsPatternFeatureExplanationViewSchema = {} as const;

export type OperationsPatternFeatureExplanationViewConfig = ConfigFromSchema<
    typeof OperationsPatternFeatureExplanationViewSchema
>;
