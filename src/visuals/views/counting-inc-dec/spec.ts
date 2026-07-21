import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';


export const CountingIncDecViewSchema = {} as const;

export type CountingIncDecViewConfig = ConfigFromSchema<typeof CountingIncDecViewSchema>;

export const spec: ViewSpec = {
    viewId: 'counting-inc-dec',
    generalLabels: [
        Scope.ArabicNumerals,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ],
};
