import {requireTargetLabels, rejectTargetLabels} from '../../../../lib/target-policies.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-write-stroke',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.VisualArticulation
    ],
    compatibility: [
        requireTargetLabels('digit-notation-request', [Area.DigitNotation]),
        rejectTargetLabels('stroke-count-capacity', [...deductAdmitting([Scope.NumbersLarger120])])
    ],
};


export const NumbersWriteStrokeViewSchema = {
} as const;

export type NumbersWriteStrokeViewConfig = ConfigFromSchema<typeof NumbersWriteStrokeViewSchema>;
