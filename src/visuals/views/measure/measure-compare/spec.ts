import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measure-compare',
    generalLabels: [
        Scope.NumericRange,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution,
    ],
};


export const MeasureCompareViewSchema = {} as const;

export type MeasureCompareViewConfig = ConfigFromSchema<typeof MeasureCompareViewSchema>;
