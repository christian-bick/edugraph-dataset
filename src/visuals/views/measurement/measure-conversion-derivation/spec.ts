import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-conversion-derivation',
    generalLabels: [Ability.ConceptDerivation]
};

export const MeasureConversionDerivationViewSchema = {} as const;

export type MeasureConversionDerivationViewConfig = ConfigFromSchema<
    typeof MeasureConversionDerivationViewSchema
>;
