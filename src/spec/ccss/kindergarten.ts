import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget } from '../../types/ml-engine.ts';

// ==========================================
// 1. Counting and Cardinality (K.CC)
// ==========================================

// --- K.CC.A.1: Count to 100 by ones and by tens ---
// TODO [K.CC.A.1]: Not coverable. Counting generators cap at Scope.NumbersSmaller20 and
// there is no generator/view for the rote count sequence to 100 or for skip counting
// by tens (Scope.DerivedCount). Reference permutation:
// const countTo100Builder = new DatasetPermutationBuilder()
//     .addLabels([
//         Area.Numeration,
//         Scope.ArabicNumerals,
//         Scope.NumbersSmaller100,
//         Scope.NumbersWithoutZero,
//         Scope.NumbersWithoutNegatives,
//         Ability.ProcedureExecution
//     ])
//     .applyLabelVariants([
//         [Scope.AdditiveCount], // count by ones
//         [Scope.DerivedCount]   // skip count by tens
//     ]);

// --- K.CC.A.2: Count forward beginning from a given number ---
// TODO [K.CC.A.2]: Only ranges up to 20 are coverable (counting-inc-dec generator caps
// at Scope.NumbersSmaller20); counting forward within the full known sequence (up to 100)
// is not.
const countForwardBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Numeration,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.PhysicalNumbers,
        Scope.AdditiveCount,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- K.CC.A.3: Write numbers from 0 to 20 (stroke writing) ---
// TODO [K.CC.A.3]: The writing generator declares a range cap of Scope.NumbersSmaller10,
// so the teen numbers (11-20) required by the standard are not generated yet.
const writeNumeralsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- K.CC.A.3: Represent a number of objects with a written numeral 0-20 ---
const representCountsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Numeration,
        Scope.ArabicNumerals,
        Scope.NumbersWithZero,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- K.CC.B.4a: One-to-one correspondence when counting objects ---
const oneToOneBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Numeration,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.AdditiveCount,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- K.CC.B.4b: Cardinality (last number name tells the count) ---
const cardinalityBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Numeration,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.AdditiveCount,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- K.CC.B.4b: Conservation (count is independent of arrangement/order) ---
const conservationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Numeration,
        Area.NumericIdentity,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.AdditiveCount,
        Scope.NumericRange,
        Ability.DirectUnderstanding
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- K.CC.B.4c: Each successive number name refers to a quantity one larger ---
const oneLargerBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Numeration,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.PhysicalNumbers,
        Scope.AdditiveCount,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- K.CC.B.5: Count to answer "how many?" (line/circle up to 20, scattered up to 10)
//     and count out a given number of objects (covered by the count-out view matching
//     the same permutations) ---
// TODO [K.CC.B.5]: The rectangular array arrangement (Scope.BoxArrangement) is not
// supported by the counting views (only linear/circular/scattered arrangements).
const howManyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Numeration,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.AdditiveCount,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.LinearArrangement, Scope.NumbersSmaller20],
        [Scope.CircularArrangement, Scope.NumbersSmaller20],
        [Scope.ScatteredArrangement, Scope.NumbersSmaller10]
    ]);

// --- K.CC.C.6: Compare the number of objects in two groups (up to 10 objects) ---
const compareGroupsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericComparison,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller10,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.Greater],
        [Scope.Less],
        [Scope.Equal]
    ]);

// --- K.CC.C.7: Compare two numbers between 1 and 10 presented as written numerals ---
const compareNumeralsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericComparison,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller10,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.Greater],
        [Scope.Less],
        [Scope.Equal]
    ]);

// ==========================================
// 2. Operations and Algebraic Thinking (K.OA)
// ==========================================

// --- K.OA.A.1: Represent addition and subtraction with objects/drawings ---
// TODO [K.OA.A.1]: Not coverable. The operations-representation view exists only as a
// checklist stub (no spec.ts/view.tsx), so there is no view rendering object/drawing
// representations of addition and subtraction. Reference permutation:
// const representOperationsBuilder = new DatasetPermutationBuilder()
//     .addLabels([
//         Scope.ArabicNumerals,
//         Scope.Base10,
//         Scope.NumbersWithoutNegatives,
//         Scope.NumbersSmaller10,
//         Scope.PhysicalNumbers,
//         Ability.ProcedureExecution
//     ])
//     .applyLabelVariants([
//         [Area.Addition],
//         [Area.Subtraction]
//     ])
//     .applyLabelVariants([
//         [Scope.NumbersWithZero],
//         [Scope.NumbersWithoutZero]
//     ]);

// --- K.OA.A.2: Solve addition and subtraction word problems within 10 ---
const wordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller10,
        Scope.PhysicalNumbers,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ])
    .applyLabelVariants([
        [Scope.NumbersWithZero],
        [Scope.NumbersWithoutZero]
    ]);

// --- K.OA.A.3: Decompose numbers less than or equal to 10 into pairs ---
const decomposeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithZero,
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
// TODO [K.OA.A.5]: The ontology has no Scope.NumbersSmaller5, so the "within 5"
// restriction cannot be expressed; permutations use Scope.NumbersSmaller10 instead.
const fluencyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller10,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ])
    .applyLabelVariants([
        [Scope.NumbersWithZero],
        [Scope.NumbersWithoutZero]
    ]);

// ==========================================
// 3. Number and Operations in Base Ten (K.NBT)
// ==========================================

// --- K.NBT.A.1: Compose and decompose numbers 11-19 into ten ones and further ones
//     (composition and decomposition are covered by the two teen place-value views
//     matching the same permutation) ---
const teenNumbersBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Difference,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersLarger10,
        Scope.NumbersSmaller20,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ]);

// ==========================================
// 4. Measurement and Data (K.MD)
// ==========================================

// --- K.MD.A.1: Describe measurable attributes of objects (length, weight) ---
const measurableAttributesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringObjects,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.LengthMeasurement],
        [Scope.WeightMeasurement]
    ]);

// --- K.MD.A.2: Directly compare two objects with a common measurable attribute ---
const compareAttributesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Measurement,
        Area.ObjectSorting,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.LengthMeasurement],
        [Scope.WeightMeasurement]
    ])
    .applyLabelVariants([
        [Scope.Greater],
        [Scope.Less]
    ]);

// --- K.MD.B.3: Classify objects into categories and count them (counts <= 10) ---
const classifyCountBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Numeration,
        Area.ObjectSorting,
        Area.CollectionSense,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller10,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Scope.ShapeProperties],
        []
    ]);

// --- K.MD.B.3: Sort the categories by count (counts <= 10) ---
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
        []
    ]);

// ==========================================
// 5. Geometry (K.G)
// ==========================================

// --- K.G.A.1: Describe objects in the environment using names of shapes ---
// TODO [K.G.A.1]: The shape-env-shapes generator only supports circle, square and
// rectangle; further environment shapes (e.g. Area.Triangle, Area.Hexagon) are not
// supported yet.
const envShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRecognition,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Square],
        [Area.Rectangle]
    ]);

// --- K.G.A.1: Describe relative positions of objects (above, below, beside, behind) ---
// TODO [K.G.A.1]: "in front of" and "next to" (e.g. Scope.Ahead) are not supported by
// the shape-position generator (only Above/Below/Beside/Behind).
const positionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.SpatialModelling,
        Ability.SpatialInterpretation
    ])
    .applyLabelVariants([
        [Scope.Above],
        [Scope.Below],
        [Scope.Beside],
        [Scope.Behind]
    ]);

// --- K.G.A.2: Correctly name shapes regardless of orientation or size ---
const shapeNamingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeIdentity,
        Ability.VisualRecognition
    ])
    .applyLabelVariants([
        [Area.Triangle],
        [Area.Square],
        [Area.Rectangle],
        [Area.Circle],
        [Area.Hexagon],
        [Area.Cube],
        [Area.Sphere],
        [Area.Cone],
        [Area.Cylinder]
    ]);

// --- K.G.A.3: Identify shapes as two-dimensional or three-dimensional ---
const classifyDimBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRecognition,
        Scope.ShapeProperties,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Square],
        [Area.Rectangle],
        [Area.Triangle],
        [Area.Hexagon],
        [Area.Cube],
        [Area.Cone],
        [Area.Cylinder],
        [Area.Sphere]
    ]);

// --- K.G.B.4: Analyze and compare shapes (number of sides/vertices) ---
const compareShapeAttributesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRecognition,
        Area.NumericComparison,
        Scope.ShapeProperties,
        Ability.VisualDecomposition
    ])
    .applyLabelVariants([
        [Area.Triangle],
        [Area.Square],
        [Area.Rectangle],
        [Area.Hexagon],
        [Area.Circle]
    ]);

// --- K.G.B.4: Find shapes sharing an attribute (informal similarities/differences) ---
const sameAttributeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ObjectSorting,
        Scope.ShapeProperties,
        Ability.InductiveReasoning
    ])
    .applyLabelVariants([
        [Area.Sphere],
        [Area.Cube],
        [Area.Rectangle]
    ]);

// --- K.G.B.5: Model shapes by building them from components ---
const buildShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRecognition,
        Scope.ShapeProperties,
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
        Area.ShapeIdentity,
        Area.ShapePlotting,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Square],
        [Area.Triangle]
    ]);

// --- K.G.B.6: Compose simple shapes to form larger shapes ---
// TODO [K.G.B.6]: The shapes-compose-shapes generator only supports rectangle and
// square as composition targets (built from triangles); other target shapes
// (e.g. [Area.Triangle], [Area.Hexagon]) are not supported.
const composeShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeComposition,
        Ability.ConceptComposition
    ])
    .applyLabelVariants([
        [Area.Rectangle],
        [Area.Square]
    ]);

export const KindergartenSpec: CompetencyTarget[] = [
    // K.CC - Counting and Cardinality
    ...toTargets('K.CC.A.2-count-forward', countForwardBuilder),
    ...toTargets('K.CC.A.3-write-numerals', writeNumeralsBuilder),
    ...toTargets('K.CC.A.3-represent-counts', representCountsBuilder),
    ...toTargets('K.CC.B.4a-one-to-one', oneToOneBuilder),
    ...toTargets('K.CC.B.4b-cardinality', cardinalityBuilder),
    ...toTargets('K.CC.B.4b-conservation', conservationBuilder),
    ...toTargets('K.CC.B.4c-one-larger', oneLargerBuilder),
    ...toTargets('K.CC.B.5-how-many', howManyBuilder),
    ...toTargets('K.CC.C.6-compare-groups', compareGroupsBuilder),
    ...toTargets('K.CC.C.7-compare-numerals', compareNumeralsBuilder),
    // K.OA - Operations and Algebraic Thinking
    ...toTargets('K.OA.A.2-word-problems', wordProblemsBuilder),
    ...toTargets('K.OA.A.3-decompose', decomposeBuilder),
    ...toTargets('K.OA.A.4-make-ten', makeTenBuilder),
    ...toTargets('K.OA.A.5-fluency', fluencyBuilder),
    // K.NBT - Number and Operations in Base Ten
    ...toTargets('K.NBT.A.1-teen-numbers', teenNumbersBuilder),
    // K.MD - Measurement and Data
    ...toTargets('K.MD.A.1-measurable-attributes', measurableAttributesBuilder),
    ...toTargets('K.MD.A.2-compare-attributes', compareAttributesBuilder),
    ...toTargets('K.MD.B.3-classify-count', classifyCountBuilder),
    ...toTargets('K.MD.B.3-sort-by-count', sortByCountBuilder),
    // K.G - Geometry
    ...toTargets('K.G.A.1-env-shapes', envShapesBuilder),
    ...toTargets('K.G.A.1-positions', positionsBuilder),
    ...toTargets('K.G.A.2-shape-naming', shapeNamingBuilder),
    ...toTargets('K.G.A.3-classify-dim', classifyDimBuilder),
    ...toTargets('K.G.B.4-compare-shape-attributes', compareShapeAttributesBuilder),
    ...toTargets('K.G.B.4-same-attribute', sameAttributeBuilder),
    ...toTargets('K.G.B.5-build-shapes', buildShapesBuilder),
    ...toTargets('K.G.B.5-draw-shapes', drawShapesBuilder),
    ...toTargets('K.G.B.6-compose-shapes', composeShapesBuilder)
];
