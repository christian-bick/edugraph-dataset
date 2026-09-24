import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-write-standard',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.VisualArticulation
    ],
    compatibility: [
        requireTargetLabels('digit-notation-request', [Area.DigitNotation])
    ]
};


export const NumbersWriteStandardViewSchema = {
} as const;

export type NumbersWriteStandardViewConfig = ConfigFromSchema<typeof NumbersWriteStandardViewSchema>;
