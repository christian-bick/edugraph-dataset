import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-number-array-interpretation',
    generalLabels: [
        Scope.NumberArray,
        Scope.ArabicNumerals,
        Ability.Interpretation
    ]
};

export const OperationsNumberArrayInterpretationViewSchema = {} as const;

export type OperationsNumberArrayInterpretationViewConfig = ConfigFromSchema<
    typeof OperationsNumberArrayInterpretationViewSchema
>;
