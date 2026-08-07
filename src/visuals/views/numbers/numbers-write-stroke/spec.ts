import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-write-stroke',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.VisualArticulation
    ],
    rejectedLabels: [Area.NumerationWithIntegers],
};


export const NumbersWriteStrokeViewSchema = {
} as const;

export type NumbersWriteStrokeViewConfig = ConfigFromSchema<typeof NumbersWriteStrokeViewSchema>;
