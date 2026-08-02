import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {selectExactMatch} from '../../../../lib/resolvers.ts';


export const CountingIncDecViewSchema = {
    representation: [[Scope.PhysicalNumbers, Scope.ArabicNumerals], selectExactMatch]
} as const;

export type CountingIncDecViewConfig = ConfigFromSchema<typeof CountingIncDecViewSchema>;

export const spec: ViewSpec = {
    viewId: 'counting-inc-dec',
    generalLabels: [
        Ability.ProcedureExecution
    ],
};
