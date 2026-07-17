import {ViewSpec} from '../../../types/view-spec.ts';
import {Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {hasSubConcept} from '../../../lib/resolvers.ts';

export const CountingIncDecGeneralLabels = [
    Scope.ArabicNumerals
];

export const CountingIncDecViewSchema = {
    wantsSubtractive: [
        [Scope.SubtractiveCount], // TODO: Consider ontological relations if applicable
        hasSubConcept(Scope.SubtractiveCount)
    ],
    wantsAdditive: [
        [Scope.AdditiveCount], // TODO: Consider ontological relations if applicable
        hasSubConcept(Scope.AdditiveCount)
    ]
} as const;

export type CountingIncDecViewConfig = ConfigFromSchema<typeof CountingIncDecViewSchema>;

export const spec: ViewSpec = {
    viewId: 'counting-inc-dec',
    supportedLabels: [
        ...CountingIncDecGeneralLabels,
        Scope.SubtractiveCount,
        Scope.AdditiveCount
    ],
};
