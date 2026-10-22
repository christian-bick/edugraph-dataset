import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

const proofAreas = [Area.AlgebraicModeling, Area.IndependentVariable, Area.DependentVariable] as const;
export const spec: ViewSpec = {
    viewId: 'algebra-covariation-table-graph',
    generalLabels: [Area.OrderedCoordinatePair, Area.PointPlotting, Scope.TabularAlgebraicRepresentation, Scope.GraphicalAlgebraicRepresentation, Scope.CartesianCoordinateSystem, Ability.Formalization, Ability.VisualArticulation],
    compatibility: [requireTargetLabels('covariation-table-graph-task', [Area.PointPlotting]), {
        id: 'covariation-numerical-correspondence-evidence',
        dependencies: proofAreas.map(label => ({scope: 'generator' as const, label})),
        predicate: labels => proofAreas.every(label => !labels.has('generator', label))
    }]
};
export const AlgebraCovariationTableGraphViewSchema = {} as const;
export type AlgebraCovariationTableGraphViewConfig = ConfigFromSchema<typeof AlgebraCovariationTableGraphViewSchema>;
