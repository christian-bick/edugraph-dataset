import DatasetPermutationBuilder, {
    defineImplementation,
    toImplementationTodos,
    toTargets
} from '../../lib/dataset-permutation-builder.ts';
import { Ability, Area, Scope } from 'edugraph-ts';
import {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';

// ==========================================
// 1. Operations and Algebraic Thinking (2.OA)
// ==========================================

// --- 2.OA.A.1: One-step word problems within 100 ---
const oneStepWordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// --- 2.OA.A.1: Two-step word problems within 100 ---
const twoStepWordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ThreeOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction],
        [Area.Addition, Area.Subtraction]
    ]);

// --- 2.OA.B.2: Compute within 20 ---
const fluencyWithin20Builder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
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

// --- 2.OA.C.3: Classify a physical group as odd or even ---
const objectGroupParityBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.OddAndEvenGroups,
        Scope.PhysicalNumbers,
        Scope.NumbersSmaller20,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Scope.EvenNumbers],
        [Scope.OddNumbers]
    ]);

// --- 2.OA.C.3: Express an even number as two equal addends ---
const evenEqualAddendsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Area.Equation,
        Area.IteratedOperation,
        Scope.EvenNumbers,
        Scope.ExpressionOnOneSide,
        Scope.TwoOperands,
        Scope.NumbersSmaller20,
        Ability.Formalization
    ]);

// --- 2.OA.C.4: Add objects in a rectangular number array ---
const numberArrayTotalBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Scope.NumberArray,
        Ability.ProcedureExecution
    ]);

// --- 2.OA.C.4: Express an array total as equal addends ---
const numberArrayEquationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Area.Equation,
        Area.IteratedOperation,
        Scope.NumberArray,
        Scope.ExpressionOnOneSide,
        Ability.Formalization
    ]);

// ==========================================
// 2. Number and Operations in Base Ten (2.NBT)
// ==========================================

// --- 2.NBT.A.1a: Ten tens make one hundred ---
const tenTensMakeHundredBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Scope.MultiplesOf100,
        Scope.NumbersSmaller120,
        Scope.NumbersWithoutZero,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ]);

// --- 2.NBT.A.1b: One to nine hundreds ---
const hundredsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Scope.MultiplesOf100,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersSmaller1000,
        Scope.NumbersWithoutZero,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ]);

// --- 2.NBT.A.2: Count and skip-count within 1000 ---
const countWithin1000Builder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.After,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersSmaller1000,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.StepsOf1],
        [Scope.StepsOf5],
        [Scope.StepsOf10],
        [Scope.StepsOf100]
    ]);

// --- 2.NBT.A.3: Read and write base-ten numerals ---
const baseTenNumeralsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger120,
        Scope.NumbersSmaller1000
    ])
    .applyLabelVariants([
        [Ability.TextualReception],
        [Ability.VisualArticulation]
    ]);

// --- 2.NBT.A.3: Write number names ---
const numberNamesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumberNotation,
        Scope.Base10,
        Scope.NumbersSmaller1000,
        Ability.TextualArticulation
    ]);

// --- 2.NBT.A.3: Write expanded form ---
const expandedFormBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Area.Sum,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger100,
        Scope.NumbersSmaller1000,
        Ability.Formalization
    ])
    .applyLabelVariants([
        [Scope.TwoOperands],
        [Scope.ThreeOperands]
    ]);

// --- 2.NBT.A.4: Compare three-digit numbers ---
const compareThreeDigitBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericComparison,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger100,
        Scope.NumbersSmaller1000,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.Greater],
        [Scope.Equal],
        [Scope.Less]
    ]);

// --- 2.NBT.B.5: Compute within 100 ---
const fluencyWithin100Builder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller100,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// --- 2.NBT.B.6: Add two or three two-digit numbers ---
const twoThreeAddendsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger10,
        Scope.NumbersSmaller100,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.TwoOperands],
        [Scope.ThreeOperands]
    ]);

// --- 2.NBT.B.6: Add four two-digit numbers ---
const fourAddendsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Addition,
        Scope.FourOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger10,
        Scope.NumbersSmaller100,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ]);

// --- 2.NBT.B.7: Written addition and subtraction within 1000 ---
const writtenAddSubtractBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersSmaller1000,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// --- 2.NBT.B.7: Concrete place-value regrouping ---
const concreteRegroupingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Area.IntegerRegrouping,
        Scope.PhysicalNumbers,
        Scope.TwoOperands,
        Scope.NumbersSmaller1000,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// --- 2.NBT.B.7: Relate a concrete model to a written method ---
const modelToWrittenMethodBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Area.IntegerRegrouping,
        Scope.PhysicalNumbers,
        Scope.TwoOperands,
        Scope.NumbersSmaller1000,
        Ability.ProcedureUnderstanding,
        Ability.Formalization
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// --- 2.NBT.B.8: Ten or one hundred more or less ---
const placeValueOffsetsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.Base10,
        Scope.NumbersLarger100,
        Scope.NumbersSmaller1000,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.Increment],
        [Area.Decrement]
    ])
    .applyLabelVariants([
        [Scope.StepsOf10],
        [Scope.StepsOf100]
    ]);

// --- 2.NBT.B.9: Explain addition and subtraction strategies ---
const explainStrategiesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PlaceValue,
        Scope.TwoOperands,
        Scope.NumbersSmaller1000,
        Ability.TextualArticulation,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// ==========================================
// 3. Measurement and Data (2.MD)
// ==========================================

// --- 2.MD.A.1: Select a length-measurement tool ---
const selectLengthToolBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Scope.PhysicalRuler],
        [Scope.Tapemeter]
    ]);

// --- 2.MD.A.1: Use a length-measurement tool ---
const useLengthToolBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Scope.IntegerNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.PhysicalRuler],
        [Scope.Tapemeter]
    ]);

// --- 2.MD.A.2: Relate measurement value to unit size ---
const unitScaleRelationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.UnitScaleRelation,
        Scope.LengthMeasurement,
        Ability.ConceptDerivation
    ]);

// --- 2.MD.A.3: Estimate metric lengths ---
const estimateMetricLengthBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Estimation,
        Scope.LengthMeasurement,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.CentimeterScale],
        [Scope.MeterScale]
    ]);

// --- 2.MD.A.4: Measure a length difference ---
const measuredLengthDifferenceBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Difference,
        Scope.LengthMeasurement,
        Scope.DirectRelation,
        Ability.ProcedureExecution
    ]);

// --- 2.MD.B.5: Same-unit length word problems ---
const lengthWordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.LengthMeasurement,
        Scope.TwoOperands,
        Scope.NumbersSmaller100,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// --- 2.MD.B.6: Represent whole numbers on a number line ---
const numberLineRepresentationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumerationWithIntegers,
        Scope.Numberline,
        Scope.NumbersSmaller100,
        Ability.VisualArticulation
    ]);

// --- 2.MD.B.6: Represent sums and differences on a number line ---
const numberLineArithmeticBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.Numberline,
        Scope.NumbersSmaller100,
        Scope.TwoOperands,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// --- 2.MD.C.7: Tell and write time to the nearest five minutes ---
const nearestFiveMinuteTimeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringTime,
        Scope.MinuteIntervals,
        Scope.StepsOf5
    ])
    .applyLabelVariants([
        [Scope.AnalogClock],
        [Scope.DigitalClock]
    ])
    .applyLabelVariants([
        [Ability.ProcedureExecution],
        [Ability.VisualArticulation]
    ])
    .applyLabelVariants([
        [Scope.AnteMeridiem],
        [Scope.PostMeridiem]
    ]);

// --- 2.MD.C.8: Generic currency word problems ---
const currencyWordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.Dollar,
        Scope.TwoOperands,
        Ability.TextualReception
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ])
    .applyLabelVariants([
        [Scope.Coins, Scope.QuarterDenomination],
        [Scope.Coins, Scope.TenthDenomination],
        [Scope.Coins, Scope.TwentiethDenomination],
        [Scope.Coins, Scope.HundredthDenomination],
        [Scope.Banknotes, Scope.MajorDenomination],
        [Scope.Coins, Scope.QuarterDenomination, Scope.Banknotes, Scope.MajorDenomination],
        [Scope.Coins, Scope.TenthDenomination, Scope.Banknotes, Scope.MajorDenomination],
        [Scope.Coins, Scope.TwentiethDenomination, Scope.Banknotes, Scope.MajorDenomination],
        [Scope.Coins, Scope.HundredthDenomination, Scope.Banknotes, Scope.MajorDenomination]
    ]);

// --- 2.MD.D.9: Generate length-measurement data ---
const measurementDataBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Scope.IntegerNumbers,
        Ability.ProcedureExecution
    ]);

// --- 2.MD.D.9: Represent measurements with a line plot ---
const measurementLinePlotBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Scope.IntegerNumbers,
        Scope.LinePlot,
        Scope.StepsOf1,
        Ability.VisualArticulation
    ]);

// --- 2.MD.D.10: Draw a single-unit picture graph ---
const pictureGraphBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Scope.IntegerNumbers,
        Scope.PictureGraph,
        Scope.StepsOf1,
        Ability.VisualArticulation
    ]);

// --- 2.MD.D.10: Draw a single-unit bar graph ---
const barGraphBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Scope.IntegerNumbers,
        Scope.BarGraph,
        Scope.StepsOf1,
        Ability.VisualArticulation
    ]);

// --- 2.MD.D.10: Solve arithmetic problems from a bar graph ---
const barGraphProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Statistics,
        Scope.IntegerNumbers,
        Scope.BarGraph,
        Scope.StepsOf1,
        Scope.TwoOperands,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction]
    ]);

// ==========================================
// 4. Geometry (2.G)
// ==========================================

// --- 2.G.A.1: Identify currently supported named shapes ---
const identifySupportedShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeIdentity,
        Ability.VisualRecognition
    ])
    .applyLabelVariants([
        [Area.Triangle],
        [Area.Hexagon],
        [Area.Cube]
    ]);

// --- 2.G.A.1: Identify additional named shapes ---
const identifyAdditionalShapesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeIdentity,
        Scope.ShapeAttributes,
        Ability.VisualRecognition
    ])
    .applyLabelVariants([
        [Area.Quadrilateral],
        [Area.Pentagon]
    ]);

// --- 2.G.A.1: Recognize shapes from specified attribute counts ---
const recognizeShapeAttributeCountsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRecognition,
        Scope.ShapeAttributes,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([
        [Scope.VertexCount],
        [Scope.FaceCount, Scope.Equal]
    ]);

// --- 2.G.A.1: Draw shapes from specified attribute counts ---
const drawShapeAttributeCountsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeRecognition,
        Scope.ShapeAttributes,
        Ability.ConceptSpecification,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [Scope.VertexCount],
        [Scope.FaceCount, Scope.Equal]
    ]);

// --- 2.G.A.2: Partition a rectangle into rows and columns of squares ---
const rectangularSquarePartitionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Rectangle,
        Area.Square,
        Area.ShapeComposition,
        Scope.BoxArrangement,
        Scope.EqualShares,
        Ability.VisualArticulation
    ]);

// --- 2.G.A.2: Count the squares in a rectangular array ---
const rectangularSquareCountBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Rectangle,
        Area.Square,
        Area.ShapeComposition,
        Scope.BoxArrangement,
        Scope.EqualShares,
        Ability.ProcedureExecution
    ]);

// --- 2.G.A.3: Equal shares of identical wholes may differ in shape ---
const equalShareShapeEquivalenceBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeEquivalenceRelations,
        Scope.EqualShares,
        Ability.ConceptDerivation
    ])
    .applyLabelVariants([
        [Area.Circle],
        [Area.Rectangle]
    ]);

export const spec: CompetencyTarget[] = [
    // 2.OA - Operations and Algebraic Thinking
    ...toTargets('2.OA.A.1-one-step-word-problems', oneStepWordProblemsBuilder),
    ...toTargets('2.OA.A.1-two-step-word-problems', twoStepWordProblemsBuilder),
    ...toTargets('2.OA.B.2-fluency', fluencyWithin20Builder),
    ...toTargets('2.OA.C.3-object-group-parity', objectGroupParityBuilder),
    ...toTargets('2.OA.C.3-even-equal-addends', evenEqualAddendsBuilder),
    ...toTargets('2.OA.C.4-number-array-total', numberArrayTotalBuilder),
    ...toTargets('2.OA.C.4-number-array-equation', numberArrayEquationBuilder),
    // 2.NBT - Number and Operations in Base Ten
    ...toTargets('2.NBT.A.1a-ten-tens-make-hundred', tenTensMakeHundredBuilder),
    ...toTargets('2.NBT.A.1b-hundreds', hundredsBuilder),
    ...toTargets('2.NBT.A.2-count-within-1000', countWithin1000Builder),
    ...toTargets('2.NBT.A.3-base-ten-numerals', baseTenNumeralsBuilder),
    ...toTargets('2.NBT.A.3-number-names', numberNamesBuilder),
    ...toTargets('2.NBT.A.3-expanded-form', expandedFormBuilder),
    ...toTargets('2.NBT.A.4-compare-three-digit', compareThreeDigitBuilder),
    ...toTargets('2.NBT.B.5-fluency', fluencyWithin100Builder),
    ...toTargets('2.NBT.B.6-two-three-addends', twoThreeAddendsBuilder),
    ...toTargets('2.NBT.B.6-four-addends', fourAddendsBuilder),
    ...toTargets('2.NBT.B.7-written-add-subtract', writtenAddSubtractBuilder),
    ...toTargets('2.NBT.B.7-concrete-regrouping', concreteRegroupingBuilder),
    ...toTargets('2.NBT.B.7-model-to-written-method', modelToWrittenMethodBuilder),
    ...toTargets('2.NBT.B.8-place-value-offsets', placeValueOffsetsBuilder),
    ...toTargets('2.NBT.B.9-explain-strategies', explainStrategiesBuilder),
    // 2.MD - Measurement and Data
    ...toTargets('2.MD.A.1-select-length-tool', selectLengthToolBuilder),
    ...toTargets('2.MD.A.1-use-length-tool', useLengthToolBuilder),
    ...toTargets('2.MD.A.2-unit-scale-relation', unitScaleRelationBuilder),
    ...toTargets('2.MD.A.3-estimate-metric-lengths', estimateMetricLengthBuilder),
    ...toTargets('2.MD.A.4-measured-length-difference', measuredLengthDifferenceBuilder),
    ...toTargets('2.MD.B.5-length-word-problems', lengthWordProblemsBuilder),
    ...toTargets('2.MD.B.6-number-line-representation', numberLineRepresentationBuilder),
    ...toTargets('2.MD.B.6-number-line-arithmetic', numberLineArithmeticBuilder),
    ...toTargets('2.MD.C.7-nearest-five-minute-time', nearestFiveMinuteTimeBuilder),
    ...toTargets('2.MD.C.8-currency-word-problems', currencyWordProblemsBuilder),
    // 2.G - Geometry
    ...toTargets('2.G.A.1-identify-supported-shapes', identifySupportedShapesBuilder)
];

const measurementDataImplementation = defineImplementation({
    id: 'measurement-data',
    description: 'Add generation and tabular or line-plot presentation of whole-unit measurement data.',
    generators: [{ module: 'measurement-data', strategy: 'new' }],
    views: [
        { module: 'measurement-data-table', strategy: 'new' },
        { module: 'measurement-line-plot', strategy: 'new' }
    ]
});

const statisticalGraphsImplementation = defineImplementation({
    id: 'statistical-graphs',
    description: 'Add single-unit picture and bar graphs, including arithmetic interpretation of bar-graph data.',
    generators: [{ module: 'statistical-graphs', strategy: 'new' }],
    views: [
        { module: 'data-picture-graph', strategy: 'new' },
        { module: 'data-bar-graph', strategy: 'new' }
    ]
});

const shapeIdentityExtendedImplementation = defineImplementation({
    id: 'shape-identity-extended',
    description: 'Extend shape identity and naming to quadrilaterals and pentagons.',
    generators: [{ module: 'shape-identity', strategy: 'expand' }],
    views: [{ module: 'shape-naming', strategy: 'expand' }]
});

const shapeAttributeCountsImplementation = defineImplementation({
    id: 'shape-attribute-counts',
    description: 'Extend shape classification and construction to stated attribute counts.',
    generators: [
        { module: 'shape-classify-attributes', strategy: 'expand' },
        { module: 'shape-build-shape', strategy: 'expand' }
    ],
    views: [
        { module: 'shape-classify-attributes', strategy: 'expand' },
        { module: 'shape-build-shape', strategy: 'expand' }
    ]
});

const rectangularSquareArraysImplementation = defineImplementation({
    id: 'rectangular-square-arrays',
    description: 'Add rectangular square-array generation and rendering without adding an independent array branch to equal-share partitioning.',
    generators: [{ module: 'shape-square-array', strategy: 'new' }],
    views: [{ module: 'shape-square-array', strategy: 'new' }]
});

const equalShareShapeEquivalenceImplementation = defineImplementation({
    id: 'equal-share-shape-equivalence',
    description: 'Add paired partitions showing equal shares with different geometries.',
    generators: [{ module: 'shape-partition-equivalence', strategy: 'new' }],
    views: [{ module: 'shape-partition-equivalence', strategy: 'new' }]
});

export const implementationTodos: ImplementationTodo[] = [
    // 2.OA - Operations and Algebraic Thinking
    // 2.NBT - Number and Operations in Base Ten
    // 2.MD - Measurement and Data
    ...toImplementationTodos(
        '2.MD.D.9-generate-measurement-data',
        measurementDataBuilder,
        measurementDataImplementation,
        'Show several whole-unit length measurements and the collected data list.'
    ),
    ...toImplementationTodos(
        '2.MD.D.9-measurement-line-plot',
        measurementLinePlotBuilder,
        measurementDataImplementation,
        'Plot the collected whole-unit measurements as frequency marks on a visibly single-unit numerical scale.'
    ),
    ...toImplementationTodos(
        '2.MD.D.10-picture-graph',
        pictureGraphBuilder,
        statisticalGraphsImplementation,
        'Draw categorical data as repeated pictures or symbols with a one-unit key.'
    ),
    ...toImplementationTodos(
        '2.MD.D.10-bar-graph',
        barGraphBuilder,
        statisticalGraphsImplementation,
        'Draw categorical data as bars against a visibly single-unit numerical scale.'
    ),
    ...toImplementationTodos(
        '2.MD.D.10-bar-graph-problems',
        barGraphProblemsBuilder,
        statisticalGraphsImplementation,
        'Show a bar graph together with a put-together, take-apart, or comparison computation whose values and answer agree with the bars.'
    ),
    // 2.G - Geometry
    ...toImplementationTodos(
        '2.G.A.1-identify-additional-shapes',
        identifyAdditionalShapesBuilder,
        shapeIdentityExtendedImplementation,
        'Show a generic quadrilateral or pentagon with defining-attribute cues and an explicit name response.'
    ),
    ...toImplementationTodos(
        '2.G.A.1-recognize-attribute-counts',
        recognizeShapeAttributeCountsBuilder,
        shapeAttributeCountsImplementation,
        'State an attribute condition and show a selected shape that visibly satisfies it.'
    ),
    ...toImplementationTodos(
        '2.G.A.1-draw-attribute-counts',
        drawShapeAttributeCountsBuilder,
        shapeAttributeCountsImplementation,
        'State the required attributes and show a solution drawing whose vertex or face condition is inspectable.'
    ),
    ...toImplementationTodos(
        '2.G.A.2-partition-rectangle',
        rectangularSquarePartitionBuilder,
        rectangularSquareArraysImplementation,
        'Tile a rectangle with same-size square cells organized in rows and columns without gaps or overlap.'
    ),
    ...toImplementationTodos(
        '2.G.A.2-count-squares',
        rectangularSquareCountBuilder,
        rectangularSquareArraysImplementation,
        'Show the rectangular square array together with an explicit count and total.'
    ),
    ...toImplementationTodos(
        '2.G.A.3-equal-shares-different-shapes',
        equalShareShapeEquivalenceBuilder,
        equalShareShapeEquivalenceImplementation,
        'Show identical wholes partitioned into equal-area pieces of visibly different shapes with an explicit equivalence conclusion.'
    )
];

export const ontologyTodos: OntologyTodo[] = [];

export const beyondScope: BeyondScopeEntry[] = [{
    standardId: '2.OA.B.2',
    title: 'Use mental strategies',
    description: 'A static question and solution can show a strategy representation but cannot establish that the learner performed the operation mentally.'
}, {
    standardId: '2.OA.B.2',
    title: 'Know sums from memory',
    description: 'Memory retrieval and fluency timing are latent temporal performance; a correct static answer cannot distinguish recall from calculation.'
}, {
    standardId: '2.NBT.A.3',
    title: 'Read numbers aloud',
    description: 'Written numeral and number-name correspondence is representable, but a static artifact cannot establish spoken reading or pronunciation.'
}, {
    standardId: '2.MD.A.3',
    title: 'Estimate lengths in inches and feet',
    description: 'Imperial length units are intentionally excluded from the ontology and generated dataset for now; the metric-equivalent competency remains in implementation scope.'
}];

export const equivalentTargets: TargetEquivalence[] = [{
    targets: ['1.OA.D.8-unknown-number', '2.OA.B.2-fluency'],
    reason: 'The Grade 1 missing-result slice and the visible Grade 2 computation slice both require direct procedure execution within 20; ProcedureInversion continues to distinguish missing-operand tasks.'
}];
