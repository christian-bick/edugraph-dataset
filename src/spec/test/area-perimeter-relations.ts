import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const areaPerimeterRelationsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PerimeterCalculation,
    Area.AreaCalculation,
    Area.Rectangle,
    Scope.Equal,
]).applyLabelVariants([
    [Ability.ConceptClassification],
    [Ability.ProcedureUnderstanding, Ability.VisualArticulation]
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-area-perimeter-relations', areaPerimeterRelationsBuilder)
];
