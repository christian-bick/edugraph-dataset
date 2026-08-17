import {Ability, Area, Scope} from 'edugraph-ts';
import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import {CompetencyTarget} from '../../types/ml-engine.ts';

const generateShapePattern = new DatasetPermutationBuilder().addLabels([
    Area.PatternRecognition,
    Scope.VisualGeometry,
    Ability.VisualArticulation
]);

const identifyShapePatternFeature = new DatasetPermutationBuilder().addLabels([
    Area.PatternRecognition,
    Scope.VisualGeometry,
    Ability.ConceptClassification
]);

const explainShapePatternFeature = new DatasetPermutationBuilder().addLabels([
    Area.PatternRecognition,
    Scope.VisualGeometry,
    Ability.ProcedureUnderstanding,
    Ability.TextualArticulation
]);

export const spec: CompetencyTarget[] = [
    ...toTargets('test-shape-pattern-generate', generateShapePattern),
    ...toTargets('test-shape-pattern-identify', identifyShapePatternFeature),
    ...toTargets('test-shape-pattern-explain', explainShapePatternFeature)
];
