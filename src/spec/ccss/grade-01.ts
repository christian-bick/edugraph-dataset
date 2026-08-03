import DatasetPermutationBuilder, { toTargets } from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { CompetencyTarget, OntologyTodo, TargetEquivalence } from '../../types/ml-engine.ts';

// ==========================================
// 1. Operations and Algebraic Thinking (1.OA)
// ==========================================

// --- 1.OA.A.1: Addition and subtraction word problems within 20 ---
const wordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// --- 1.OA.A.2: Word problems with three addends (sum <= 20) ---
// TODO [1.OA.A.2]: Parked in ontologyTodos until operand count can be
// stated explicitly. Reference builder:
// const threeAddendsBuilder = new DatasetPermutationBuilder()
//     .addLabels([
//         Area.Addition,
//         Area.Sum,
//         Scope.ArabicNumerals,
//         Scope.Base10,
//         Scope.NumbersWithoutNegatives,
//         Scope.NumbersSmaller20,
//         Scope.PhysicalNumbers,
//         Ability.TextualReception
//     ]);

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
// This reverses the operation to recover a missing input, so the competency is
// explicitly scoped to procedure inversion rather than procedure execution.
const unknownAddendBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.ProcedureInversion
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
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
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
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
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

const unknownOperandBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.ProcedureInversion
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
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
        [Scope.NumbersWithoutZero, Scope.Most],
        [Scope.NumbersWithoutZero, Scope.Least],
        [Scope.NumbersWithZero, Scope.Least]
    ]);

// --- 1.NBT.A.1: Read and write numerals ---
const writeNumeralsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersWithoutZero, Scope.NumbersSmaller10],
        [Scope.NumbersWithoutZero, Scope.NumbersSmaller20],
        [Scope.NumbersWithZero, Scope.NumbersSmaller20]
    ]);

// --- 1.NBT.A.1: Represent a number of objects with a written numeral ---
const representCountsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersWithoutZero, Scope.NumbersSmaller10],
        [Scope.NumbersWithoutZero, Scope.NumbersSmaller20],
        [Scope.NumbersWithZero, Scope.NumbersSmaller20]
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
// Grade 1 frames teen numbers explicitly as place value ("a ten and some ones",
// CCSS cluster 1.NBT.B "Understand place value"), whereas K.NBT.A.1 treats the
// same 10+n decomposition as "foundations for place value". Area.PlaceValue
// carries that distinction and keeps the two teen definitions distinguishable.
const teenNumbersBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Sum,
        Area.PlaceValue,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
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
        Scope.MultiplesOf10,
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
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.ProcedureExecution
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
        Scope.MultiplesOf10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller100,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.NumbersWithoutZero],
        [Scope.NumbersWithZero]
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

// --- 1.MD.B.3: Tell and write time in hours ---
const hourTimeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.AnalogClock,
        Scope.HourIntervals
    ])
    .applyLabelVariants([
        [Ability.ProcedureExecution],
        [Ability.VisualArticulation]
    ]);

// --- 1.MD.B.3: Tell and write time in half-hours ---
const halfHourTimeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.AnalogClock,
        Scope.HalfHourIntervals
    ])
    .applyLabelVariants([
        [Ability.ProcedureExecution],
        [Ability.VisualArticulation]
    ]);

// --- 1.MD.B.3: Tell and write time using digital clocks ---
const digitalTimeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.DigitalClock
    ])
    .applyLabelVariants([
        [Scope.HourIntervals],
        [Scope.HalfHourIntervals]
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
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.Circle, Area.CircularShapeDrawing],
        [Area.Square, Area.LinearShapeDrawing],
        [Area.Triangle, Area.LinearShapeDrawing]
    ]);

// --- 1.G.A.2: Compose two-dimensional shapes into composite shapes ---
const composeShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeComposition,
        Ability.ConceptComposition
    ])
    .applyLabelVariants([
        [Area.Rectangle],
        [Area.Square],
        [Area.Triangle],
        [Area.Trapezoid],
        [Area.HalfCircle],
        [Area.QuarterCircle],
        [Area.Cube],
        [Area.RectangularPrism],
        [Area.Cone],
        [Area.Cylinder]
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

// Standard exports following universal convention.
// Partially supported or ontologically indistinguishable grade-one competencies
// remain in implementationTodos until a generator/view can prove the complete
// standard without curriculum-specific range or mode shims.
export const spec: CompetencyTarget[] = [
    // 1.OA - Operations and Algebraic Thinking
    ...toTargets('1.OA.A.1-word-problems', wordProblemsBuilder),
    ...toTargets('1.OA.B.3-properties', propertiesBuilder),
    ...toTargets('1.OA.B.4-unknown-addend', unknownAddendBuilder),
    ...toTargets('1.OA.C.5-relate-counting', relateCountingBuilder),
    ...toTargets('1.OA.C.6-fluency', fluencyBuilder),
    ...toTargets('1.OA.D.7-equal-sign', equalSignBuilder),
    ...toTargets('1.OA.D.8-unknown-number', unknownNumberBuilder),
    ...toTargets('1.OA.D.8-unknown-operand', unknownOperandBuilder),
    // 1.NBT - Number and Operations in Base Ten
    ...toTargets('1.NBT.A.1-order-numbers', orderNumbersBuilder),
    ...toTargets('1.NBT.B.2b-teen-numbers', teenNumbersBuilder),
    ...toTargets('1.NBT.B.2c-multiples-of-ten', multiplesOfTenBuilder),
    ...toTargets('1.NBT.B.3-compare-two-digit', compareTwoDigitBuilder),
    ...toTargets('1.NBT.C.4-add-within-100', addWithin100Builder),
    ...toTargets('1.NBT.C.6-subtract-tens', subtractTensBuilder),
    // 1.MD - Measurement and Data
    ...toTargets('1.MD.A.2-measure-length', measureLengthBuilder),
    ...toTargets('1.MD.B.3-time', hourTimeBuilder),
    ...toTargets('1.MD.B.3-half-hour-time', halfHourTimeBuilder),
    ...toTargets('1.MD.B.3-digital-clocks', digitalTimeBuilder),
    ...toTargets('1.MD.C.4-interpret-data', interpretDataBuilder),
    ...toTargets('1.MD.C.4-compare-data', compareDataBuilder)
];

export const implementationTodos: CompetencyTarget[] = [
    ...toTargets('1.NBT.A.1-count-to-120', orderNumbersBuilder, 'The exact range through 120 is not expressible; ordering and counting generators currently support only the ontology range below 100.'),
    ...toTargets('1.NBT.A.1-write-numerals', writeNumeralsBuilder, 'Writing numerals coincides with K.CC.A.3 within the supported range; the grade-1 extension through 120 is unsupported.'),
    ...toTargets('1.NBT.A.1-represent-counts', representCountsBuilder, 'Representing a count with a written numeral coincides with K.CC.A.3 within the supported range; the grade-1 extension through 120 is unsupported.'),
    ...toTargets('1.NBT.B.2a-ten-bundle', tenBundleBuilder, 'All place-value-bundles outputs are multiples of ten. The current labels do not distinguish exactly one ten from other whole-ten quantities within the resolved range.'),
    ...toTargets('1.NBT.C.5-ten-more-less', tenMoreLessBuilder, 'The counting-inc-dec generator models changes of one. Existing place-value bundle tasks represent whole tens but do not model ten more or ten less from an arbitrary number.'),
    ...toTargets('1.MD.A.1-order-lengths', orderLengthsBuilder, 'The current measurement-order exercise directly orders three visible lengths but does not implement the standard\'s separate indirect-comparison competency using a third object.'),
    ...toTargets('1.G.A.1-defining-attributes', buildShapesBuilder, 'Building shapes coincides with K.G.B.5; the grade-1 elevation of distinguishing defining from non-defining attributes needs a separately scoped generator/view.'),
    ...toTargets('1.G.A.1-draw-shapes', drawShapesBuilder, 'Drawing shapes coincides with K.G.B.5; the grade-1 defining-attribute elevation is not represented.'),
    ...toTargets('1.G.A.2-compose-other-shapes', composeShapesBuilder, 'The current composition generator/view exercises one-stage composition but does not compose a new shape from an existing composite shape.'),
    ...toTargets('1.G.A.3-partition-shapes', partitionShapesBuilder, 'The current partition exercise shows two or four equal parts but does not cover the required halves/fourths/quarters language, whole-as-shares descriptions, or the comparison that more equal shares are smaller.')
];

export const ontologyTodos: OntologyTodo[] = [{
    standardId: '1.OA.A.2',
    title: 'Represent arithmetic operand count',
    description: 'Add Scope.OperandCount with child scopes Scope.TwoOperands and Scope.ThreeOperands. Apply ThreeOperands to the three-addend competency and TwoOperands to arity-constrained binary arithmetic targets so pair and triple generators can be distinguished without overloading Area or Ability labels.'
}];

export const equivalentTargets: TargetEquivalence[] = [{
    targets: ['1.OA.B.4-unknown-addend', '1.OA.D.8-unknown-operand'],
    reason: 'At the supported level, both standards require the same addition/subtraction inversion task; their conceptual framing is not distinguishable by the ontology.'
}];
