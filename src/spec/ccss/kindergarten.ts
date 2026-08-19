import DatasetPermutationBuilder, {toTargets} from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';

// ==========================================
// 1. Counting and Cardinality (K.CC)
// ==========================================

// --- K.CC.A.1: Count to 100 by ones and by tens ---
const countTo100Builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersSmaller100,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.After,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.StepsOf1], // count by ones
        [Scope.StepsOf10, Scope.MultiplesOf10] // count by tens through decade values
    ]);

// --- K.CC.A.2: Start from a given number ---
// `NumbersLarger5` is an intentional pragmatic approximation: the standard
// permits any supplied starting number in the known sequence, while the
// ontology has no separate given-start scope. Requiring values from 5 onward
// keeps the generated task visibly distinct from counting from the beginning
// without claiming that 5 is a pedagogically meaningful boundary.
const countFrom5Builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.StepsOf1,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger5,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.After,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- K.CC.A.3: Write numbers from 0 to 20 (stroke writing) ---
const writeNumeralsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Scope.NumbersWithoutZero, Scope.NumbersSmaller10],
        [Scope.NumbersWithoutZero, Scope.NumbersSmaller20],
        [Scope.NumbersWithZero, Scope.NumbersSmaller20]
    ]);

// --- K.CC.A.3: Represent a number of objects with a written numeral 0-20 ---
const representCountsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.PhysicalNumbers,
        Ability.Formalization
    ])
    .applyLabelVariants([
        [Scope.NumbersWithoutZero, Scope.NumbersSmaller10],
        [Scope.NumbersWithoutZero, Scope.NumbersSmaller20],
        [Scope.NumbersWithZero, Scope.NumbersSmaller20]
    ]);

// --- K.CC.B.4b: Conservation (count is independent of arrangement/order) ---
const conservationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Area.NumericIdentity,
        Scope.PhysicalNumbers,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.AdditiveCount,
        Ability.DirectUnderstanding
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- K.CC.B.4c: Each successive number name refers to a quantity one larger ---
// The successor principle (the next number is exactly one more) is the
// increment operation (Area.Increment), which both distinguishes it from
// one-to-one counting (K.CC.B.4a) and routes it to the counting-inc-dec view
// that renders the +1 step.
const oneLargerBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Area.Increment,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.PhysicalNumbers,
        Scope.AdditiveCount,
        Scope.StepsOf1,
        Scope.After,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- K.CC.B.5: Count to answer "how many?" ---
const howManyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.AdditiveCount,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.LinearArrangement, Scope.NumbersSmaller20],
        [Scope.CircularArrangement, Scope.NumbersSmaller20],
        [Scope.ScatteredArrangement, Scope.NumbersSmaller10],
        [Scope.BoxArrangement, Scope.NumbersSmaller10]
    ]);

const createCompareGroupsBuilder = (strategyLabels: string[]): DatasetPermutationBuilder =>
    new DatasetPermutationBuilder()
    .addLabels([
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller10,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution,
        ...strategyLabels
    ])
    .applyLabelVariants([
        [Area.NumericInequality, Scope.Greater],
        [Area.NumericInequality, Scope.Less],
        [Area.NumericEquality, Scope.Equal]
    ]);

// --- K.CC.C.6: Compare groups by counting each quantity ---
const compareGroupsByCountingBuilder = createCompareGroupsBuilder([
    Area.NumerationWithIntegers,
    Scope.AdditiveCount
]);

// --- K.CC.C.6: Compare groups by matching objects one-to-one ---
const compareGroupsByMatchingBuilder = createCompareGroupsBuilder([
    Area.SetComparison
]);

// --- K.CC.C.7: Compare two numbers between 1 and 10 presented as written numerals ---
const compareNumeralsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller10,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.NumericInequality, Scope.Greater],
        [Area.NumericInequality, Scope.Less],
        [Area.NumericEquality, Scope.Equal]
    ]);

// ==========================================
// 2. Operations and Algebraic Thinking (K.OA)
// ==========================================

// --- K.OA.A.1: Represent addition and subtraction with objects/drawings ---
const representOperationsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller10,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// --- K.OA.A.2: Solve addition and subtraction word problems within 10 ---
const wordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.SingleStep,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller10,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// --- K.OA.A.3: Decompose numbers less than or equal to 10 into pairs ---
const decomposeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Area.PartitionOfCollections,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller10,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ]);

// --- K.OA.A.4: For any number from 1 to 9, find the number that makes 10 ---
const makeTenBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Difference,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller10,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ]);

// --- K.OA.A.5: Fluently add and subtract within 5 ---
const fluencyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller5,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// ==========================================
// 3. Number and Operations in Base Ten (K.NBT)
// ==========================================

const createTeenNumbersBuilder = (direction: string): DatasetPermutationBuilder =>
    new DatasetPermutationBuilder()
    .addLabels([
        direction,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ]);

// --- K.NBT.A.1: Compose teen numbers from ten ones and further ones ---
const composeTeenNumbersBuilder = createTeenNumbersBuilder(Area.UnionOfCollections);

// --- K.NBT.A.1: Decompose teen numbers into ten ones and further ones ---
const decomposeTeenNumbersBuilder = createTeenNumbersBuilder(Area.PartitionOfCollections);

// ==========================================
// 4. Measurement and Data (K.MD)
// ==========================================

// --- K.MD.A.1: Describe measurable attributes of objects ---
const measurableAttributesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringObjects,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Scope.LengthMeasurement],
        [Scope.WeightMeasurement]
    ]);

// --- K.MD.A.2: Directly compare two objects with a common measurable attribute ---
const compareAttributesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Measurement,
        Ability.VisualReception
    ])
    .applyLabelVariants([
        [Scope.LengthMeasurement],
        [Scope.WeightMeasurement]
    ])
    .applyLabelVariants([
        [Scope.Greater],
        [Scope.Less]
    ]);

// --- K.MD.B.3: Classify objects into categories and count them ---
const classifyCountBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Area.ObjectSorting,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller10,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Scope.ShapeProperties],
    ]);

// --- K.MD.B.3: Sort the categories by count ---
const sortByCountBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Area.ObjectSorting,
        Area.NumericOrder,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller10,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.Least],
        [Scope.Most]
    ])
    .applyLabelVariants([
        [Scope.ShapeProperties],
    ]);

// ==========================================
// 5. Geometry (K.G)
// ==========================================

// --- K.G.A.1: Describe objects in the environment using names of shapes ---
const envShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeNaming,
        Scope.PhysicalGeometry,
        Ability.VisualRecognition
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Square],
        [Area.Rectangle]
    ]);

const envShapesOtherBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeNaming,
        Scope.PhysicalGeometry,
        Ability.VisualRecognition
    ])
    .applyLabelVariants([
        [Area.Triangle],
        [Area.Hexagon]
    ]);

// --- K.G.A.1: Describe relative positions of objects ---
const positionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.SpatialPosition,
        Ability.SpatialInterpretation
    ])
    .applyLabelVariants([
        [Scope.Above],
        [Scope.Below],
        [Scope.Beside],
        [Scope.Behind]
    ]);

const positionsAheadBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.SpatialPosition,
        Ability.SpatialInterpretation
    ])
    .applyLabelVariants([
        [Scope.Ahead]
    ]);

// --- K.G.A.2: Correctly name shapes ---
const shapeNamingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeNaming,
        Area.ShapeResizingConservation,
        Ability.VisualRecognition
    ])
    .applyLabelVariants([
        [Area.Triangle, Area.ShapeRotationConservation],
        [Area.Square, Area.ShapeRotationConservation],
        [Area.Rectangle, Area.ShapeRotationConservation],
        [Area.Circle],
        [Area.Hexagon, Area.ShapeRotationConservation],
        [Area.Cube, Area.ShapeRotationConservation],
        [Area.Sphere],
        [Area.Cone, Area.ShapeRotationConservation],
        [Area.Cylinder, Area.ShapeRotationConservation]
    ]);

// --- K.G.A.3: Identify shapes as 2D or 3D ---
const classifyDimBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeClassification,
        Scope.ShapeProperties,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Area.Circle, Scope.TwoDimensional],
        [Area.Square, Scope.TwoDimensional],
        [Area.Rectangle, Scope.TwoDimensional],
        [Area.Triangle, Scope.TwoDimensional],
        [Area.Hexagon, Scope.TwoDimensional],
        [Area.Cube, Scope.ThreeDimensional],
        [Area.Cone, Scope.ThreeDimensional],
        [Area.Cylinder, Scope.ThreeDimensional],
        [Area.Sphere, Scope.ThreeDimensional]
    ]);

// --- K.G.B.4: Analyze and compare shapes ---
const compareShapeAttributesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeIdentity,
        Area.NumericComparison,
        Scope.ShapeAttributes,
        Ability.VisualReception
    ])
    .applyLabelVariants([
        [Area.Triangle],
        [Area.Square],
        [Area.Rectangle],
        [Area.Hexagon],
        [Area.Circle],
        [Area.Cube],
        [Area.Cone],
        [Area.Cylinder],
        [Area.Sphere]
    ]);

// --- K.G.B.4: Find shapes sharing an attribute ---
const sameAttributeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ObjectSorting,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Area.Sphere, Scope.Rollable],
        [Area.Cube, Scope.Stackable],
        [Area.Rectangle, Scope.Foldable]
    ]);

// --- K.G.B.5: Model shapes by building them ---
const buildShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeIdentity,
        Scope.ShapeAttributes,
        Scope.GeometrySticks,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.Triangle],
        [Area.Square],
        [Area.Rectangle],
        [Area.Hexagon]
    ]);

// --- K.G.B.5: Model shapes by drawing them ---
const drawShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRotationConservation,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.Circle, Area.CircularShapeDrawing],
        [Area.Square, Area.LinearShapeDrawing],
        [Area.Triangle, Area.LinearShapeDrawing]
    ]);

// --- K.G.B.6: Compose simple shapes ---
const composeShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeSynthesis,
        Scope.SingleLevelComposition,
        Ability.ConceptComposition
    ])
    .applyLabelVariants([
        [Area.Rectangle],
        [Area.Square]
    ]);

const composeShapesOtherBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeSynthesis,
        Scope.SingleLevelComposition,
        Ability.ConceptComposition
    ])
    .applyLabelVariants([
        [Area.Triangle],
        [Area.Hexagon]
    ]);

// Standard exports following universal convention
export const spec: CompetencyTarget[] = [
    // K.CC - Counting and Cardinality
    ...toTargets('K.CC.A.1-count-to-100', countTo100Builder),
    ...toTargets('K.CC.A.2-count-from-number', countFrom5Builder),
    ...toTargets('K.CC.A.3-write-numerals', writeNumeralsBuilder),
    ...toTargets('K.CC.A.3-represent-counts', representCountsBuilder),
    ...toTargets('K.CC.B.4b-conservation', conservationBuilder),
    ...toTargets('K.CC.B.4c-one-larger', oneLargerBuilder),
    ...toTargets('K.CC.B.5-how-many', howManyBuilder),
    ...toTargets('K.CC.C.6-compare-groups-by-counting', compareGroupsByCountingBuilder),
    ...toTargets('K.CC.C.6-compare-groups-by-matching', compareGroupsByMatchingBuilder),
    ...toTargets('K.CC.C.7-compare-numerals', compareNumeralsBuilder),
    // K.OA - Operations and Algebraic Thinking
    ...toTargets('K.OA.A.1-represent-operations', representOperationsBuilder),
    ...toTargets('K.OA.A.2-word-problems', wordProblemsBuilder),
    ...toTargets('K.OA.A.3-decompose', decomposeBuilder),
    ...toTargets('K.OA.A.4-make-ten', makeTenBuilder),
    ...toTargets('K.OA.A.5-fluency', fluencyBuilder),
    // K.NBT - Number and Operations in Base Ten
    ...toTargets('K.NBT.A.1-compose-teen-numbers', composeTeenNumbersBuilder),
    ...toTargets('K.NBT.A.1-decompose-teen-numbers', decomposeTeenNumbersBuilder),
    // K.MD - Measurement and Data
    ...toTargets('K.MD.A.1-measurable-attributes', measurableAttributesBuilder),
    ...toTargets('K.MD.A.2-compare-attributes', compareAttributesBuilder),
    ...toTargets('K.MD.B.3-classify-count', classifyCountBuilder),
    ...toTargets('K.MD.B.3-sort-by-count', sortByCountBuilder),
    // K.G - Geometry
    ...toTargets('K.G.A.1-env-shapes', envShapesBuilder),
    ...toTargets('K.G.A.1-env-shapes-other', envShapesOtherBuilder),
    ...toTargets('K.G.A.1-positions', positionsBuilder),
    ...toTargets('K.G.A.1-positions-ahead', positionsAheadBuilder),
    ...toTargets('K.G.A.2-shape-naming', shapeNamingBuilder),
    ...toTargets('K.G.A.3-classify-dim', classifyDimBuilder),
    ...toTargets('K.G.B.4-compare-shape-attributes', compareShapeAttributesBuilder),
    ...toTargets('K.G.B.4-same-attribute', sameAttributeBuilder),
    ...toTargets('K.G.B.5-build-shapes', buildShapesBuilder),
    ...toTargets('K.G.B.5-draw-shapes', drawShapesBuilder),
    ...toTargets('K.G.B.6-compose-shapes', composeShapesBuilder),
    ...toTargets('K.G.B.6-compose-shapes-other', composeShapesOtherBuilder)
];

export const implementationTodos: ImplementationTodo[] = [];

export const ontologyTodos: OntologyTodo[] = [];

export const beyondScope: BeyondScopeEntry[] = [{
    standardId: 'K.CC.B.4a',
    title: 'Spoken one-to-one counting',
    description: 'Requires observing a learner say number names in order while pairing each spoken name with exactly one object; the static visual dataset cannot capture spoken, temporal performance.'
}, {
    standardId: 'K.CC.B.4b',
    title: 'Spoken cardinality',
    description: 'Requires evidence that the learner understands the last number name said as the cardinality of the counted set; the conservation component remains represented in spec.'
}];

export const equivalentTargets: TargetEquivalence[] = [];
