import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-division-area-model',
    compatibility: [requireTargetLabels('partial-quotient-method', [Area.DivisionPartialQuotients])],
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding
    ]
};

export const OperationsDivisionAreaModelViewSchema = {} as const;

export type OperationsDivisionAreaModelViewConfig = ConfigFromSchema<
    typeof OperationsDivisionAreaModelViewSchema
>;
