import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const polygonPerimeterBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.PerimeterCalculation, Scope.IntegerNumbers, Ability.ProcedureExecution])
    .applyLabelVariants([[Area.Triangle], [Area.Quadrilateral], [Area.Pentagon], [Area.Hexagon]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-polygon-perimeter', polygonPerimeterBuilder)
];
