import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-form-pattern-pairs',
    generalLabels: [Area.OrderedCoordinatePair, Scope.ArabicNumerals, Ability.Formalization],
    compatibility: [
        requireTargetLabels('form-pattern-pairs-request', [Area.OrderedCoordinatePair])
    ]
};

export const CoordinateFormPatternPairsViewSchema = {} as const;

export type CoordinateFormPatternPairsViewConfig = ConfigFromSchema<typeof CoordinateFormPatternPairsViewSchema>;
