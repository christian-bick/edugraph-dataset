import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'coordinate-system-specification',
    generalLabels: [Scope.CartesianCoordinateSystem, Scope.TwoDimensional, Ability.ConceptSpecification]
};

export const CoordinateSystemSpecificationViewSchema = {} as const;
export type CoordinateSystemSpecificationViewConfig = ConfigFromSchema<
    typeof CoordinateSystemSpecificationViewSchema
>;
