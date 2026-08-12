import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-write-stroke',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.VisualArticulation
    ],
    rejectedLabels: [Area.NumerationWithIntegers, ...deductAdmitting([Scope.NumbersLarger120])],
};


export const NumbersWriteStrokeViewSchema = {
} as const;

export type NumbersWriteStrokeViewConfig = ConfigFromSchema<typeof NumbersWriteStrokeViewSchema>;
