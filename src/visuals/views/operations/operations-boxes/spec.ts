import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';
import {hasLabel} from '../../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'operations-boxes',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ],
    rejectedLabels: [
        Area.CommutativeLaw,
        Area.AssociativeLaw
    ]
};


export const OperationsBoxesViewSchema = {
    invertProcedure: [
        [Ability.ProcedureInversion],
        hasLabel(Ability.ProcedureInversion)
    ],
    unknownAddendMode: [
        [Area.Difference],
        hasLabel(Area.Difference)
    ]
} as const;

export type OperationsBoxesViewConfig = ConfigFromSchema<typeof OperationsBoxesViewSchema>;
