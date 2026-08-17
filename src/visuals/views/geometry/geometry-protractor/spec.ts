import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-protractor',
    generalLabels: [Scope.Protractor, Ability.ProcedureExecution]
};

export const GeometryProtractorViewSchema = {} as const;

export type GeometryProtractorViewConfig = ConfigFromSchema<
    typeof GeometryProtractorViewSchema
>;
