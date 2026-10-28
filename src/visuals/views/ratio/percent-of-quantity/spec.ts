import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'percent-of-quantity',
    generalLabels: [Ability.ProcedureExecution, Scope.ArabicNumerals, Scope.Base10]
};

export const PercentOfQuantityViewSchema = {} as const;
export type PercentOfQuantityViewConfig = ConfigFromSchema<typeof PercentOfQuantityViewSchema>;
