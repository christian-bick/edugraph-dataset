import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope, deductCompatible} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';
import { hasLabel } from '../../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'measure-length-decimal',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.VisualReception,
        Ability.VisualArticulation,
        Ability.ProcedureExecution
    ],
    rejectedLabels: [
        Scope.IntegerNumbers,
        ...deductCompatible([Scope.NumbersLarger20, Scope.NumbersSmaller1000000])
    ]
};


export const MeasureLengthDecimalViewSchema = {
    isReverse: [[], hasLabel(Ability.VisualArticulation)]
} as const;

export type MeasureLengthDecimalViewConfig = ConfigFromSchema<typeof MeasureLengthDecimalViewSchema>;
