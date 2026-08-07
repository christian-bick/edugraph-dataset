import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-write-standard',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.VisualArticulation
    ],
    rejectedLabels: [Area.NumerationWithIntegers],
};


export const NumbersWriteStandardViewSchema = {
} as const;

export type NumbersWriteStandardViewConfig = ConfigFromSchema<typeof NumbersWriteStandardViewSchema>;
