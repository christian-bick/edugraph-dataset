import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-write-count',
    generalLabels: [
        Scope.PhysicalNumbers,
        Ability.Formalization,
        Scope.ArabicNumerals
    ],
    compatibility: [
        requireTargetLabels('integer-numeration-request', [Area.NumerationWithIntegers])
    ]
};


export const NumbersWriteCountViewSchema = {
} as const;

export type NumbersWriteCountViewConfig = ConfigFromSchema<typeof NumbersWriteCountViewSchema>;
