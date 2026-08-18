import DatasetPermutationBuilder, {
    defineImplementationPackage,
    toImplementationTodos,
    toTargets
} from '../../lib/dataset-permutation-builder.ts';
import { Area, Scope, Ability } from 'edugraph-ts';
import { BeyondScopeEntry, CompetencyTarget, ImplementationTodo, OntologyTodo, TargetEquivalence } from '../../types/ml-engine.ts';

// ==========================================
// 1. Operations and Algebraic Thinking (1.OA)
// ==========================================

// --- 1.OA.A.1: Addition and subtraction word problems within 20 ---
const wordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.SingleStep,
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
const threeAddendsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Scope.ThreeOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20,
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

const arithmeticStrategyImplementation = defineImplementationPackage({
    id: 'grade1-add-subtract-strategies',
    description: 'Expand visible addition and subtraction strategy support within 20.',
    generators: [{ module: 'integer-add-subtract-strategies', strategy: 'expand' }],
    views: [{ module: 'operations-add-subtract-strategy', strategy: 'expand' }]
});

const arithmeticStrategyConstraints = [
    Scope.TwoOperands,
    Scope.ArabicNumerals,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.NumbersWithoutZero
];

// --- 1.OA.B.4: Understand subtraction as an unknown-addend problem ---
const unknownAddendStrategyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.SubtractionThinkAddition,
        ...arithmeticStrategyConstraints,
        Scope.NumbersSmaller20,
        Ability.ProcedureUnderstanding
    ]);

// --- 1.OA.C.5: Relate counting to addition and subtraction ---
const relateCountingStrategyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        ...arithmeticStrategyConstraints,
        Ability.ConceptDerivation
    ])
    .applyLabelVariants([
        [Area.AdditionCountingOn],
        [Area.SubtractionCountingBack]
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- 1.OA.C.6: Add and subtract within 20, fluency within 10 ---
const fluencyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
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

const subtractionMakeTenBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.SubtractionMakeTen,
        ...arithmeticStrategyConstraints,
        Scope.NumbersSmaller20,
        Ability.ProcedureUnderstanding
    ]);

const additionCountingOnBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AdditionCountingOn,
        ...arithmeticStrategyConstraints,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

const additionMakeTenBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AdditionMakeTen,
        ...arithmeticStrategyConstraints,
        Scope.NumbersSmaller20,
        Ability.ProcedureUnderstanding
    ]);

const subtractionThinkAdditionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.SubtractionThinkAddition,
        ...arithmeticStrategyConstraints,
        Scope.NumbersSmaller20,
        Ability.ProcedureUnderstanding
    ]);

const additionNearDoublesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AdditionNearDoubles,
        ...arithmeticStrategyConstraints,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Scope.NumbersSmaller10],
        [Scope.NumbersSmaller20]
    ]);

// --- 1.OA.D.7: Meaning of the equal sign, judge equations as true or false ---
const equalSignBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Equation,
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
        Area.Equation,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller20,
        Ability.Formalization
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

const unknownOperandBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Equation,
        Scope.TwoOperands,
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

// --- 1.NBT.A.1: Count to 120 from any starting number below 120 ---
const countTo120Builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.StepsOf1,
        Scope.After,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller120,
        Ability.ProcedureExecution
    ]);

// --- 1.NBT.A.1: Read numerals through 120 ---
const readNumeralsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller120,
        Ability.TextualReception
    ]);

// --- 1.NBT.A.1: Write numerals through 120 ---
const writeNumeralsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller120,
        Ability.VisualArticulation
    ]);

// --- 1.NBT.A.1: Represent a number of objects with a written numeral ---
const representCountsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.PhysicalNumbers,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller120,
        Ability.Formalization
    ]);

// --- 1.NBT.B.2a: 10 as a bundle of ten ones ---
const tenBundleBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Scope.MultiplesOf10,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller10,
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

const placeValueComparisonImplementation = defineImplementationPackage({
    id: 'grade1-place-value-comparison',
    description: 'Add a tens-and-ones comparison presentation for two-digit numbers.',
    generators: [{ module: 'comparison', strategy: 'reuse' }],
    views: [{ module: 'numbers-place-value-comparison', strategy: 'new' }]
});

// --- 1.NBT.B.3: Compare two two-digit numbers by tens and ones ---
const placeValueComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersLarger10,
        Scope.NumbersSmaller100,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.NumericInequality, Scope.Greater],
        [Area.NumericInequality, Scope.Less],
        [Area.NumericEquality, Scope.Equal]
    ]);

const placeValueArithmeticImplementation = defineImplementationPackage({
    id: 'grade1-place-value-add-subtract',
    description: 'Expand place-value arithmetic for Grade 1 operand shapes, conditional regrouping, written-method alignment, and explanation.',
    generators: [{ module: 'place-value-arithmetic', strategy: 'expand' }],
    views: [
        { module: 'place-value-arithmetic-model', strategy: 'expand' },
        { module: 'place-value-arithmetic-explanation', strategy: 'expand' }
    ]
});

const addAdditionOperandVariants = (builder: DatasetPermutationBuilder): DatasetPermutationBuilder => builder
    .applyLabelVariants([
        [Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand],
        [Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand, Area.IntegerRegrouping],
        [Scope.MultiplesOf10, Scope.TwoDigitLargestOperand]
    ]);

const createPlaceValueAdditionBuilder = (presentationLabels: string[]): DatasetPermutationBuilder =>
    addAdditionOperandVariants(new DatasetPermutationBuilder()
        .addLabels([
            Area.AdditionPlaceValuePartitioning,
            Scope.TwoOperands,
            Scope.NumbersSmaller100,
            Ability.ProcedureUnderstanding,
            ...presentationLabels
        ]));

// --- 1.NBT.C.4: Add within 100 using place-value models and explanations ---
const concretePlaceValueAdditionBuilder = createPlaceValueAdditionBuilder([Scope.PhysicalNumbers]);
const modelToWrittenAdditionBuilder = createPlaceValueAdditionBuilder([
    Scope.PhysicalNumbers,
    Ability.Formalization
]);
const explainPlaceValueAdditionBuilder = createPlaceValueAdditionBuilder([Ability.TextualArticulation]);

// --- 1.NBT.C.5: Mentally find 10 more or 10 less ---
const tenMoreLessBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Area.PlaceValue,
        Scope.Base10,
        Scope.StepsOf10,
        Scope.NumbersLarger10,
        Scope.NumbersSmaller100,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.Increment],
        [Area.Decrement]
    ]);

const createPlaceValueSubtractionBuilder = (presentationLabels: string[]): DatasetPermutationBuilder =>
    new DatasetPermutationBuilder()
        .addLabels([
            Area.SubtractionPlaceValuePartitioning,
            Scope.TwoOperands,
            Scope.MultiplesOf10,
            Scope.NumbersSmaller100,
            Scope.NumbersWithoutNegatives,
            Ability.ProcedureUnderstanding,
            ...presentationLabels
        ])
        .applyLabelVariants([
            [Scope.NumbersWithoutZero],
            [Scope.NumbersWithZero]
        ]);

// --- 1.NBT.C.6: Subtract multiples of 10 using place-value models and explanations ---
const concretePlaceValueSubtractionBuilder = createPlaceValueSubtractionBuilder([Scope.PhysicalNumbers]);
const modelToWrittenSubtractionBuilder = createPlaceValueSubtractionBuilder([
    Scope.PhysicalNumbers,
    Ability.Formalization
]);
const explainPlaceValueSubtractionBuilder = createPlaceValueSubtractionBuilder([Ability.TextualArticulation]);

// ==========================================
// 3. Measurement and Data (1.MD)
// ==========================================

// --- 1.MD.A.1: Directly order three objects by length ---
const directLengthComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Scope.DirectRelation,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.AscendingOrder],
        [Scope.DescendingOrder]
    ]);

// --- 1.MD.A.1: Compare two lengths through a third object ---
const mediatedLengthComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Scope.MediatedRelation,
        Ability.ConceptDerivation
    ]);

// --- 1.MD.A.2: Express length as a whole number of iterated units ---
const measureLengthBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringObjects,
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
        [Ability.VisualReception, Ability.Interpretation, Ability.Formalization],
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
        [Ability.VisualReception, Ability.Interpretation, Ability.Formalization],
        [Ability.VisualArticulation]
    ]);

const digitalTimeReadingImplementation = defineImplementationPackage({
    id: 'grade1-digital-time-reading',
    description: 'Add a digital-clock reading direction that exposes the display and withholds the answer.',
    generators: [{ module: 'time', strategy: 'reuse' }],
    views: [{ module: 'time-digital', strategy: 'expand' }]
});

// --- 1.MD.B.3: Construct a digital display from textual time ---
const digitalTimeConstructionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.DigitalClock,
        Ability.TextualReception,
        Ability.Formalization,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Scope.HourIntervals],
        [Scope.HalfHourIntervals]
    ]);

const digitalTimeReadingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.DigitalClock,
        Ability.VisualReception,
        Ability.Interpretation,
        Ability.Formalization
    ])
    .applyLabelVariants([
        [Scope.HourIntervals],
        [Scope.HalfHourIntervals]
    ]);

const categoricalDataImplementation = defineImplementationPackage({
    id: 'grade1-categorical-data',
    description: 'Expand unscaled three-category graph tasks for organization, category counts, and totals.',
    generators: [{ module: 'statistical-graphs', strategy: 'expand' }],
    views: [
        { module: 'data-picture-graph', strategy: 'expand' },
        { module: 'data-bar-graph', strategy: 'expand' }
    ]
});

// --- 1.MD.C.4: Organize and represent data in three categories ---
const organizeCategoricalDataBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.ObjectSorting,
        Scope.IntegerNumbers,
        Scope.StepsOf1,
        Ability.ConceptClassification,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Scope.PictureGraph],
        [Scope.BarGraph]
    ]);

// --- 1.MD.C.4: Read the count in one category ---
const readCategoryCountBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Scope.IntegerNumbers,
        Scope.StepsOf1,
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Scope.PictureGraph],
        [Scope.BarGraph]
    ]);

// --- 1.MD.C.4: Find the total across three categories ---
const categoricalDataTotalBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.Addition,
        Scope.IntegerNumbers,
        Scope.ThreeOperands,
        Scope.StepsOf1,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.PictureGraph],
        [Scope.BarGraph]
    ]);

// --- 1.MD.C.4: Compare two categories in an unscaled bar graph ---
const categoricalDataComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.Subtraction,
        Scope.IntegerNumbers,
        Scope.BarGraph,
        Scope.StepsOf1,
        Scope.SingleStep,
        Ability.ProcedureExecution
    ]);

// ==========================================
// 4. Geometry (1.G)
// ==========================================

// --- 1.G.A.1: Distinguish defining from non-defining attributes ---
const classifyShapeAttributesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Ability.ConceptClassification
    ]);

// --- 1.G.A.1: Build shapes possessing defining attributes ---
const buildShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Ability.ConceptSpecification,
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
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Ability.ConceptSpecification,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.Circle, Area.CircularShapeDrawing],
        [Area.Square, Area.LinearShapeDrawing],
        [Area.Triangle, Area.LinearShapeDrawing]
    ]);

// --- 1.G.A.2: Compose shapes in one level ---
const singleLevelCompositionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeSynthesis,
        Scope.SingleLevelComposition,
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

// --- 1.G.A.2: Compose a new shape from an intermediate composite ---
const multiLevelCompositionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeSynthesis,
        Scope.MultiLevelComposition,
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

// --- 1.G.A.3: Partition circles and rectangles into equal shares ---
const partitionEqualSharesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeDecomposition,
        Scope.EqualShares,
        Scope.UnitFractions,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Rectangle]
    ]);

// --- 1.G.A.3: Name individual shares as halves, fourths, or quarters ---
const nameUnitSharesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionInterpretation,
        Scope.EqualShares,
        Scope.UnitFractions,
        Ability.ActiveVocabulary
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Rectangle]
    ]);

// --- 1.G.A.3: Describe a whole as all of its equal shares ---
const composeWholeFromSharesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionInterpretation,
        Scope.EqualShares,
        Scope.UnitFractions,
        Ability.ConceptComposition
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Rectangle]
    ]);

// --- 1.G.A.3: Infer that more equal shares produce smaller shares ---
const compareUnitShareSizesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionCommonNumeratorComparison,
        Scope.EqualShares,
        Scope.UnitFractions,
        Scope.Less,
        Ability.ConceptDerivation
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Rectangle]
    ]);

// Standard exports following universal convention.
export const spec: CompetencyTarget[] = [
    // 1.OA - Operations and Algebraic Thinking
    ...toTargets('1.OA.A.1-word-problems', wordProblemsBuilder),
    ...toTargets('1.OA.A.2-three-addend-word-problems', threeAddendsBuilder),
    ...toTargets('1.OA.B.3-properties', propertiesBuilder),
    ...toTargets('1.OA.C.6-fluency', fluencyBuilder),
    ...toTargets('1.OA.C.6-subtraction-make-ten', subtractionMakeTenBuilder),
    ...toTargets('1.OA.D.7-equal-sign', equalSignBuilder),
    ...toTargets('1.OA.D.8-unknown-number', unknownNumberBuilder),
    ...toTargets('1.OA.D.8-unknown-operand', unknownOperandBuilder),
    // 1.NBT - Number and Operations in Base Ten
    ...toTargets('1.NBT.A.1-count-to-120', countTo120Builder),
    ...toTargets('1.NBT.A.1-read-numerals', readNumeralsBuilder),
    ...toTargets('1.NBT.A.1-write-numerals', writeNumeralsBuilder),
    ...toTargets('1.NBT.A.1-represent-counts', representCountsBuilder),
    ...toTargets('1.NBT.B.2a-ten-bundle', tenBundleBuilder),
    ...toTargets('1.NBT.B.2b-teen-numbers', teenNumbersBuilder),
    ...toTargets('1.NBT.B.2c-multiples-of-ten', multiplesOfTenBuilder),
    ...toTargets('1.NBT.C.5-ten-more-less', tenMoreLessBuilder),
    // 1.MD - Measurement and Data
    ...toTargets('1.MD.A.1-direct-length-order', directLengthComparisonBuilder),
    ...toTargets('1.MD.A.1-mediated-length-comparison', mediatedLengthComparisonBuilder),
    ...toTargets('1.MD.A.2-measure-length', measureLengthBuilder),
    ...toTargets('1.MD.B.3-time', hourTimeBuilder),
    ...toTargets('1.MD.B.3-half-hour-time', halfHourTimeBuilder),
    ...toTargets('1.MD.B.3-digital-construction', digitalTimeConstructionBuilder),
    ...toTargets('1.MD.C.4-bar-comparison', categoricalDataComparisonBuilder),
    // 1.G - Geometry
    ...toTargets('1.G.A.1-classify-shape-attributes', classifyShapeAttributesBuilder),
    ...toTargets('1.G.A.1-build-from-defining-attributes', buildShapesBuilder),
    ...toTargets('1.G.A.1-draw-from-defining-attributes', drawShapesBuilder),
    ...toTargets('1.G.A.2-single-level-composition', singleLevelCompositionBuilder),
    ...toTargets('1.G.A.2-multi-level-composition', multiLevelCompositionBuilder),
    ...toTargets('1.G.A.3-partition-equal-shares', partitionEqualSharesBuilder),
    ...toTargets('1.G.A.3-name-unit-shares', nameUnitSharesBuilder),
    ...toTargets('1.G.A.3-compose-whole-from-shares', composeWholeFromSharesBuilder),
    ...toTargets('1.G.A.3-compare-unit-share-sizes', compareUnitShareSizesBuilder)
];

export const implementationTodos: ImplementationTodo[] = [
    ...toImplementationTodos(
        '1.OA.B.4-unknown-addend-strategy',
        unknownAddendStrategyBuilder,
        arithmeticStrategyImplementation,
        'Show subtraction transformed into its related missing-addend equation and solved by counting up.'
    ),
    ...toImplementationTodos(
        '1.OA.C.5-counting-operation-relationship',
        relateCountingStrategyBuilder,
        arithmeticStrategyImplementation,
        'Explicitly connect a count sequence to its corresponding addition or subtraction equation.'
    ),
    ...toImplementationTodos(
        '1.OA.C.6-addition-counting-on',
        additionCountingOnBuilder,
        arithmeticStrategyImplementation,
        'Show visible count-on steps beginning at one addend and ending at the sum.'
    ),
    ...toImplementationTodos(
        '1.OA.C.6-addition-make-ten',
        additionMakeTenBuilder,
        arithmeticStrategyImplementation,
        'Decompose one addend, form ten, and add the remainder in visible steps.'
    ),
    ...toImplementationTodos(
        '1.OA.C.6-subtraction-think-addition',
        subtractionThinkAdditionBuilder,
        arithmeticStrategyImplementation,
        'Show the related missing-addend equation and the count-up decomposition.'
    ),
    ...toImplementationTodos(
        '1.OA.C.6-addition-near-doubles',
        additionNearDoublesBuilder,
        arithmeticStrategyImplementation,
        'Transform a near-double into a known double plus or minus one.'
    ),
    ...toImplementationTodos(
        '1.NBT.B.3-place-value-comparison',
        placeValueComparisonBuilder,
        placeValueComparisonImplementation,
        'Decompose both two-digit numerals into tens and ones before determining the comparison symbol.'
    ),
    ...toImplementationTodos(
        '1.NBT.C.4-concrete-place-value-addition',
        concretePlaceValueAdditionBuilder,
        placeValueArithmeticImplementation,
        'Show both operands as tens and ones, including composition of ten ones when required.'
    ),
    ...toImplementationTodos(
        '1.NBT.C.4-model-to-written-method',
        modelToWrittenAdditionBuilder,
        placeValueArithmeticImplementation,
        'Align the concrete place-value model with a complete written addition method.'
    ),
    ...toImplementationTodos(
        '1.NBT.C.4-explain-place-value-addition',
        explainPlaceValueAdditionBuilder,
        placeValueArithmeticImplementation,
        'Explain tens-with-tens, ones-with-ones, and any composed ten in authored steps.'
    ),
    ...toImplementationTodos(
        '1.NBT.C.6-concrete-place-value-subtraction',
        concretePlaceValueSubtractionBuilder,
        placeValueArithmeticImplementation,
        'Show tens bundles being removed or matched, including an equal-operands zero result.'
    ),
    ...toImplementationTodos(
        '1.NBT.C.6-model-to-written-method',
        modelToWrittenSubtractionBuilder,
        placeValueArithmeticImplementation,
        'Align the tens model with a complete written subtraction method.'
    ),
    ...toImplementationTodos(
        '1.NBT.C.6-explain-place-value-subtraction',
        explainPlaceValueSubtractionBuilder,
        placeValueArithmeticImplementation,
        'Explain subtraction through tens and the resulting positive or zero difference.'
    ),
    ...toImplementationTodos(
        '1.MD.B.3-read-digital-time',
        digitalTimeReadingBuilder,
        digitalTimeReadingImplementation,
        'Show a completed digital display in Question Mode while withholding the formalized time response.'
    ),
    ...toImplementationTodos(
        '1.MD.C.4-organize-represent-data',
        organizeCategoricalDataBuilder,
        categoricalDataImplementation,
        'Sort raw observations into three categories and represent them in the selected graph.'
    ),
    ...toImplementationTodos(
        '1.MD.C.4-read-category-count',
        readCategoryCountBuilder,
        categoricalDataImplementation,
        'Ask for the count in one named category of a completed three-category graph.'
    ),
    ...toImplementationTodos(
        '1.MD.C.4-find-total',
        categoricalDataTotalBuilder,
        categoricalDataImplementation,
        'Ask for and solve the total across all three categories of a completed graph.'
    )
];

export const ontologyTodos: OntologyTodo[] = [];

export const beyondScope: BeyondScopeEntry[] = [];

export const equivalentTargets: TargetEquivalence[] = [{
    targets: ['1.OA.C.6-subtraction-make-ten', '2.OA.B.2-subtraction-make-ten'],
    reason: 'Both standards require the same observable within-20 subtraction strategy: decompose the subtrahend, reach ten, and subtract the remainder.'
}];
