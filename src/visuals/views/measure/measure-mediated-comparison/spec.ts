import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'measure-mediated-comparison',
    generalLabels: [Ability.ConceptDerivation]
};

export const MeasureMediatedComparisonViewSchema = {} as const;

export type MeasureMediatedComparisonViewConfig = ConfigFromSchema<typeof MeasureMediatedComparisonViewSchema>;
