import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-parity',
    generalLabels: [
        Scope.PhysicalNumbers,
        Ability.ConceptClassification
    ]
};

export const CountingObjectsParityViewSchema = {} as const;

export type CountingObjectsParityViewConfig = ConfigFromSchema<typeof CountingObjectsParityViewSchema>;
