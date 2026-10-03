import {Ability} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-conversion-problems',
    generalLabels: [Ability.TextualReception, Ability.ProcedureExecution],
    compatibility: [
        requireTargetLabels('measurement-story-request', [Ability.TextualReception])
    ]
};

export const MeasureConversionProblemsViewSchema = {} as const;

export type MeasureConversionProblemsViewConfig = ConfigFromSchema<
    typeof MeasureConversionProblemsViewSchema
>;
