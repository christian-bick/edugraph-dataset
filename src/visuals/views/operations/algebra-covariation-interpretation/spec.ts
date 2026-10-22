import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

const proofAreas = [Area.AlgebraicModeling, Area.IndependentVariable, Area.DependentVariable] as const;
export const spec: ViewSpec = {
    viewId: 'algebra-covariation-interpretation',
    generalLabels: [Scope.TabularAlgebraicRepresentation, Scope.GraphicalAlgebraicRepresentation, Scope.CartesianCoordinateSystem, Ability.Interpretation, Ability.VisualReception],
    compatibility: [requireTargetLabels('covariation-interpretation-task', [Area.IndependentVariable, Area.DependentVariable]), {
        id: 'covariation-designated-dependency-evidence',
        dependencies: proofAreas.map(label => ({scope: 'generator' as const, label})),
        predicate: labels => labels.has('generator', Area.IndependentVariable) && labels.has('generator', Area.DependentVariable) && !labels.has('generator', Area.AlgebraicModeling)
    }]
};
export const AlgebraCovariationInterpretationViewSchema = {} as const;
export type AlgebraCovariationInterpretationViewConfig = ConfigFromSchema<typeof AlgebraCovariationInterpretationViewSchema>;
