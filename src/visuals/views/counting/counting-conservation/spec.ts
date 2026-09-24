import {rejectTargetLabels} from '../../../../lib/target-policies.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'counting-conservation',
    compatibility: [
        rejectTargetLabels('counting-capacity', [
            ...deductAdmitting([Scope.NumbersLarger20])
        ])
    ],
    generalLabels: [
        Area.NumericIdentity,
        Ability.DirectUnderstanding,
        Scope.PhysicalNumbers
    ],
};


export const CountingConservationViewSchema = {} as const;

export type CountingConservationViewConfig = ConfigFromSchema<typeof CountingConservationViewSchema>;
