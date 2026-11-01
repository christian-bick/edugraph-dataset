import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-conversion-problems',
    generalLabels: [Scope.ArabicNumerals, Scope.Base10, Ability.TextualReception, Ability.ProcedureExecution],
    compatibility: [
        requireTargetLabels('measurement-story-request', [Ability.TextualReception]),
        requireTargetLabels('conversion-story-request', [Area.UnitConversion])
    ]
};

export const MeasureConversionProblemsViewSchema = {} as const;

export type MeasureConversionProblemsViewConfig = ConfigFromSchema<
    typeof MeasureConversionProblemsViewSchema
>;
