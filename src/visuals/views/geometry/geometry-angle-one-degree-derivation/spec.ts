import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-angle-one-degree-derivation',
    generalLabels: [Ability.ConceptDerivation]
};

export const GeometryAngleOneDegreeDerivationViewSchema = {} as const;

export type GeometryAngleOneDegreeDerivationViewConfig = ConfigFromSchema<
    typeof GeometryAngleOneDegreeDerivationViewSchema
>;
