import {Ability, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measurement-data-table',
    generalLabels: [
        Scope.PhysicalRuler,
        Scope.DataTable,
        Ability.ProcedureExecution
    ]
};

export const MeasurementDataTableViewSchema = {
    useInchScale: [[Scope.InchScale], hasLabel(Scope.InchScale)]
} as const;
export type MeasurementDataTableViewConfig = ConfigFromSchema<typeof MeasurementDataTableViewSchema>;
