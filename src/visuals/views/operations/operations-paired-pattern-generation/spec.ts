import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-paired-pattern-generation',
    generalLabels: [Area.PatternGeneration, Scope.ArabicNumerals, Ability.ProcedureExecution],
    compatibility: [
        requireTargetLabels('paired-pattern-generation-request', [Area.PatternGeneration])
    ]
};

export const OperationsPairedPatternGenerationViewSchema = {} as const;

export type OperationsPairedPatternGenerationViewConfig = ConfigFromSchema<typeof OperationsPairedPatternGenerationViewSchema>;
