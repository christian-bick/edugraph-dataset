import {Ability, Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-boxes',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.Formalization,
        Area.Equation,
        Scope.ExpressionOnOneSide
    ]
};

export const OperationsBoxesViewSchema = {
    invertProcedure: [
        [Ability.ProcedureInversion],
        hasLabel(Ability.ProcedureInversion)
    ]
} as const;

export type OperationsBoxesViewConfig = ConfigFromSchema<typeof OperationsBoxesViewSchema>;
