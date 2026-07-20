import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope, deductCompatible, CompetencyDescriptor} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';

export const spec: ViewSpec = {
    viewId: 'counting-conservation',
    generalLabels: [
        Area.Numeration,
        Area.NumericIdentity,
        Scope.AdditiveCount,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Ability.DirectUnderstanding,
        Scope.ArabicNumerals
    ],
};


export const CountingConservationViewSchema = {
    // TODO: Add ontological relations for other properties once supported (e.g., Numeration, NumericIdentity)
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller10000]),
        (labels: string[]) => resolveRangeFromLabels(deductCompatible(labels as CompetencyDescriptor[]))
    ]
} as const;

export type CountingConservationViewConfig = ConfigFromSchema<typeof CountingConservationViewSchema>;
