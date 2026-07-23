import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget, OntologyTodo } from '../../types/ml-engine.ts';

// ==========================================
// 1. Operations and Algebraic Thinking (1.OA)
// ==========================================

// --- 1.OA.A.1: Addition and subtraction word problems within 20 ---
const wordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20,
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

// --- 1.OA.A.2: Word problems with three addends (sum <= 20) ---
const threeAddendsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Area.Sum,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20,
        Scope.PhysicalNumbers,
        Ability.TextualReception
    ]);

// --- 1.OA.B.3: Apply properties of operations (commutative/associative) ---
const propertiesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.CommutativeLaw],
        [Area.AssociativeLaw]
    ]);

// --- 1.OA.B.4: Understand subtraction as an unknown-addend problem ---
const unknownAddendBuilder = new DatasetPermutationBuilder()
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

// --- 1.OA.C.5: Relate counting to addition and subtraction ---
const relateCountingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.AdditiveCount],
        [Scope.SubtractiveCount]
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- 1.OA.C.6: Add and subtract within 20, fluency within 10 ---
const fluencyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ])
    .applyLabelVariants([
        [Scope.NumbersWithZero],
        [Scope.NumbersWithoutZero]
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- 1.OA.D.7: Meaning of the equal sign, judge equations as true or false ---
const equalSignBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20,
        Ability.PlausibilityEvaluation
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// --- 1.OA.D.8: Determine the unknown whole number in an equation ---
const unknownNumberBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20,
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
// 2. Number and Operations in Base Ten (1.NBT)
// ==========================================

// --- 1.NBT.A.1: Count to 120 ---
const orderNumbersBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericOrder,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller100,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersWithZero],
        [Scope.NumbersWithoutZero]
    ])
    .applyLabelVariants([
        [Scope.Most],
        [Scope.Least]
    ]);

// --- 1.NBT.A.1: Read and write numerals ---
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

// --- 1.NBT.A.1: Represent a number of objects with a written numeral ---
const representCountsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.NumbersWithZero,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- 1.NBT.B.2a: 10 as a bundle of ten ones ---
const tenBundleBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ]);

// --- 1.NBT.B.2b: Teen numbers ---
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

// --- 1.NBT.B.2c: Multiples of 10 as a number of tens ---
const multiplesOfTenBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller100,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ]);

// --- 1.NBT.B.3: Compare two two-digit numbers ---
const compareTwoDigitBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericComparison,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersLarger10,
        Scope.NumbersSmaller100,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.Greater],
        [Scope.Less],
        [Scope.Equal]
    ]);

// --- 1.NBT.C.4: Add within 100 ---
const addWithin100Builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller100,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersWithZero],
        [Scope.NumbersWithoutZero]
    ]);

// --- 1.NBT.C.5: Mentally find 10 more or 10 less ---
const tenMoreLessBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller100,
        Scope.DerivedCount,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Increment],
        [Area.Decrement]
    ]);

// --- 1.NBT.C.6: Subtract multiples of 10 from multiples of 10 ---
const subtractTensBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Subtraction,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithZero,
        Scope.NumbersSmaller100,
        Ability.ProcedureExecution
    ]);

// ==========================================
// 3. Measurement and Data (1.MD)
// ==========================================

// --- 1.MD.A.1: Order three objects by length ---
const orderLengthsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Measurement,
        Area.ObjectSorting,
        Scope.LengthMeasurement,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.Least],
        [Scope.Most]
    ]);

// --- 1.MD.A.2: Express length as a whole number of iterated units ---
const measureLengthBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Measurement,
        Scope.LengthMeasurement,
        Scope.IntegerNumbers
    ])
    .applyLabelVariants([
        [Ability.ProcedureExecution],
        [Ability.VisualArticulation]
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- 1.MD.B.3: Tell and write time in hours and half-hours ---
const timeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.AnalogClock
    ])
    .applyLabelVariants([
        [Scope.HourIntervals],
        [Scope.MinuteIntervals]
    ])
    .applyLabelVariants([
        [Ability.ProcedureExecution],
        [Ability.VisualArticulation]
    ]);

// --- 1.MD.C.4: Organize, represent and interpret data ---
const interpretDataBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Area.ObjectSorting,
        Area.CollectionSense,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Scope.ShapeProperties],
        []
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- 1.MD.C.4: How many more or less in one category than in another ---
const compareDataBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Area.ObjectSorting,
        Area.NumericOrder,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.Least],
        [Scope.Most]
    ])
    .applyLabelVariants([
        [Scope.ShapeProperties],
        []
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// ==========================================
// 4. Geometry (1.G)
// ==========================================

// --- 1.G.A.1: Build and draw shapes possessing defining attributes ---
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

// --- 1.G.A.2: Compose two-dimensional shapes into composite shapes ---
const composeShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeComposition,
        Ability.ConceptComposition
    ])
    .applyLabelVariants([
        [Area.Rectangle],
        [Area.Square]
    ]);

// --- 1.G.A.3: Partition circles and rectangles into halves and fourths ---
const partitionShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionNotation,
        Scope.ShapeProperties,
        Ability.ConceptDerivation
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Rectangle]
    ]);

// Standard exports following universal convention
export const spec: CompetencyTarget[] = [
    // 1.OA - Operations and Algebraic Thinking
    ...toTargets('1.OA.A.1-word-problems', wordProblemsBuilder),
    ...toTargets('1.OA.B.4-unknown-addend', unknownAddendBuilder),
    ...toTargets('1.OA.C.5-relate-counting', relateCountingBuilder),
    ...toTargets('1.OA.C.6-fluency', fluencyBuilder),
    ...toTargets('1.OA.D.8-unknown-number', unknownNumberBuilder),
    // 1.NBT - Number and Operations in Base Ten
    ...toTargets('1.NBT.A.1-order-numbers', orderNumbersBuilder),
    ...toTargets('1.NBT.A.1-write-numerals', writeNumeralsBuilder),
    ...toTargets('1.NBT.A.1-represent-counts', representCountsBuilder),
    ...toTargets('1.NBT.B.2b-teen-numbers', teenNumbersBuilder),
    ...toTargets('1.NBT.B.3-compare-two-digit', compareTwoDigitBuilder),
    ...toTargets('1.NBT.C.4-add-within-100', addWithin100Builder),
    // 1.MD - Measurement and Data
    ...toTargets('1.MD.A.2-measure-length', measureLengthBuilder),
    ...toTargets('1.MD.B.3-time', timeBuilder),
    ...toTargets('1.MD.C.4-interpret-data', interpretDataBuilder),
    ...toTargets('1.MD.C.4-compare-data', compareDataBuilder),
    // 1.G - Geometry
    ...toTargets('1.G.A.1-build-shapes', buildShapesBuilder),
    ...toTargets('1.G.A.1-draw-shapes', drawShapesBuilder),
    ...toTargets('1.G.A.2-compose-shapes', composeShapesBuilder)
];

export const implementationTodos: CompetencyTarget[] = [
    ...toTargets('1.OA.A.1-word-problems-unknowns', wordProblemsBuilder, 'Unknowns in all positions are not expressible; the arithmetic generator and word-problem view only produce result-unknown problems.'),
    ...toTargets('1.OA.A.2-three-addends', threeAddendsBuilder, 'The arithmetic generator only produces binary operations; there is no support for three addends.'),
    ...toTargets('1.OA.B.3-properties', propertiesBuilder, 'No generator/view exercises arithmetic laws (Area.CommutativeLaw / Area.AssociativeLaw).'),
    ...toTargets('1.OA.B.4-unknown-addend-full', unknownAddendBuilder, 'Only the make-ten complement case (Area.Difference within 10) is covered; general unknown-addend problems within 20 have no generator support.'),
    ...toTargets('1.OA.D.7-equal-sign', equalSignBuilder, 'No generator/view produces true/false equation judgment tasks (Ability.PlausibilityEvaluation).'),
    ...toTargets('1.OA.D.8-unknown-operand', unknownNumberBuilder, 'The operations-boxes view only leaves the result blank; unknowns in the first or second operand position are not supported.'),
    ...toTargets('1.NBT.A.1-count-to-120', orderNumbersBuilder, 'The range 100-120 is not expressible (ordering/counting generators cap at Scope.NumbersSmaller100), so permutations stop below 100.'),
    ...toTargets('1.NBT.B.2a-ten-bundle', tenBundleBuilder, 'No generator/view exercises bundling ten ones into a "ten" (Area.PlaceValue with exactly 10).'),
    ...toTargets('1.NBT.B.2c-multiples-of-ten', multiplesOfTenBuilder, 'There is no way to express "multiples of 10" via ontology labels and no generator producing tens-bundle decompositions of 10-90.'),
    ...toTargets('1.NBT.C.5-ten-more-less', tenMoreLessBuilder, 'The counting-inc-dec generator only steps by one and caps at Scope.NumbersSmaller20; ten-jumps within 100 are not supported.'),
    ...toTargets('1.NBT.C.6-subtract-tens', subtractTensBuilder, 'Multiples of 10 operands are not expressible via ontology labels and the arithmetic generator has no such constraint.'),
    ...toTargets('1.MD.A.1-order-lengths', orderLengthsBuilder, 'The measurement-compare generator only compares two objects; ordering three objects and indirect comparison are not supported.'),
    ...toTargets('1.MD.B.3-digital-clocks', timeBuilder, 'Digital clocks (Scope.DigitalClock) have no view; and there is no scope label restricting minutes to half-hour granularity.'),
    ...toTargets('1.G.A.1-defining-attributes', buildShapesBuilder, 'Distinguishing defining vs. non-defining attributes (closed/three-sided vs. color/orientation/size) has no generator/view support.'),
    ...toTargets('1.G.A.2-compose-other-shapes', composeShapesBuilder, 'The shapes-compose-shapes generator only supports rectangle and square as composition targets; trapezoids, half-circles, quarter-circles, and 3D compositions are not supported.'),
    ...toTargets('1.G.A.3-partition-shapes', partitionShapesBuilder, 'No generator/view supports partitioning shapes into equal shares (halves/fourths/quarters).')
];

export const ontologyTodos: OntologyTodo[] = [
    {
        standardId: '1.NBT.B.2c',
        title: 'Multiples of 10 Scope Label',
        description: 'No ontology Scope exists to express "multiples of 10" (e.g., 10, 20, 30, ... 90).'
    },
    {
        standardId: '1.MD.B.3',
        title: 'Half-Hour Granularity Scope Label',
        description: 'No ontology Scope exists to restrict minute clock times to half-hour granularity.'
    },
    {
        standardId: '1.G.A.2',
        title: 'Half-Circle & Quarter-Circle Shapes',
        description: 'No ontology Area concepts exist for half-circles or quarter-circles.'
    }
];

// Backwards-compatibility aliases
export const Grade1Spec = spec;
export const Grade1ImplementationTodos = implementationTodos;
export const Grade1OntologyTodos = ontologyTodos;
