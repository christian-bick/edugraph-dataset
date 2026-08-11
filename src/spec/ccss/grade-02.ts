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
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.PhysicalRuler],
        [Scope.Tapemeter]
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
        Scope.NumbersWithZero,
        Scope.NumbersSmaller100,
        Ability.VisualArticulation
    ]);

// --- 2.MD.B.6: Represent sums and differences on a number line ---
const numberLineArithmeticBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.Numberline,
        Scope.NumbersWithZero,
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
        [Scope.Coins, Scope.MinorDenomination],
        [Scope.Banknotes, Scope.MajorDenomination],
        [Scope.Coins, Scope.MinorDenomination, Scope.Banknotes, Scope.MajorDenomination]
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
    ...toTargets('2.OA.B.2-fluency', fluencyWithin20Builder),
    // 2.NBT - Number and Operations in Base Ten
    ...toTargets('2.NBT.A.4-compare-three-digit', compareThreeDigitBuilder),
    ...toTargets('2.NBT.B.5-fluency', fluencyWithin100Builder),
    ...toTargets('2.NBT.B.6-two-three-addends', twoThreeAddendsBuilder),
    ...toTargets('2.NBT.B.7-written-add-subtract', writtenAddSubtractBuilder),
    // 2.G - Geometry
    ...toTargets('2.G.A.1-identify-supported-shapes', identifySupportedShapesBuilder)
];

const wordProblemsWithin100Implementation = defineImplementation({
    id: 'word-problems-within-100',
    description: 'Extend arithmetic stories and layouts to one- and two-step problems within 100.',
    generators: [
        { module: 'arithmetic-ops-pairs', strategy: 'reuse' },
        { module: 'arithmetic-ops-triples', strategy: 'expand' }
    ],
    views: [{ module: 'operations-word-problem', strategy: 'expand' }]
});

const placeValueHundredsImplementation = defineImplementation({
    id: 'place-value-hundreds',
    description: 'Extend place-value bundles through hundreds.',
    generators: [{ module: 'place-value-bundles', strategy: 'expand' }],
    views: [{ module: 'place-value-tens-bundles', strategy: 'expand' }]
});

const countingSequencesTo1000Implementation = defineImplementation({
    id: 'counting-sequences-to-1000',
    description: 'Extend counting sequences through 1000 with steps of 1, 5, 10, and 100.',
    generators: [{ module: 'counting-sequence', strategy: 'expand' }],
    views: [{ module: 'counting-number-sequence', strategy: 'expand' }]
});

const numberNotationTo1000Implementation = defineImplementation({
    id: 'number-notation-to-1000',
    description: 'Extend numeral reading and writing through 1000 and add written number names.',
    generators: [{ module: 'writing', strategy: 'expand' }],
    views: [
        { module: 'numbers-read-standard', strategy: 'expand' },
        { module: 'numbers-write-standard', strategy: 'expand' },
        { module: 'numbers-write-name', strategy: 'new' }
    ]
});

const expandedPlaceValueNotationImplementation = defineImplementation({
    id: 'expanded-place-value-notation',
    description: 'Add expanded-form generation and rendering for three-digit place value.',
    generators: [{ module: 'place-value-expanded', strategy: 'new' }],
    views: [{ module: 'place-value-expanded-form', strategy: 'new' }]
});

const multiDigitPlaceValueArithmeticImplementation = defineImplementation({
    id: 'multi-digit-place-value-arithmetic',
    description: 'Add concrete regrouping, written-method mapping, and strategy explanations.',
    generators: [{ module: 'place-value-arithmetic', strategy: 'new' }],
    views: [
        { module: 'place-value-arithmetic-model', strategy: 'new' },
        { module: 'place-value-arithmetic-explanation', strategy: 'new' }
    ]
});

const placeValueOffsetsTo1000Implementation = defineImplementation({
    id: 'place-value-offsets-to-1000',
    description: 'Extend ten-more/less relationships through hundreds and steps of 100.',
    generators: [{ module: 'counting-inc-dec', strategy: 'expand' }],
    views: [{ module: 'counting-ten-more-less', strategy: 'expand' }]
});

const standardLengthToolsImplementation = defineImplementation({
    id: 'standard-length-tools',
    description: 'Support selecting and visibly using standard metric length tools.',
    generators: [
        { module: 'measurement-attribute', strategy: 'expand' },
        { module: 'measurement-length', strategy: 'reuse' }
    ],
    views: [
        { module: 'measure-select-tool', strategy: 'new' },
        { module: 'measure-length-integer', strategy: 'expand' }
    ]
});

const lengthEstimationImplementation = defineImplementation({
    id: 'length-estimation',
    description: 'Add metric length-estimation problems and an estimation layout.',
    generators: [{ module: 'measurement-length', strategy: 'expand' }],
    views: [{ module: 'measure-length-estimate', strategy: 'new' }]
});

const lengthComparisonByMeasureImplementation = defineImplementation({
    id: 'length-comparison-by-measure',
    description: 'Extend measured comparisons to explicit numerical length differences.',
    generators: [{ module: 'measurement-compare', strategy: 'expand' }],
    views: [{ module: 'measure-compare', strategy: 'expand' }]
});

const lengthArithmeticImplementation = defineImplementation({
    id: 'length-arithmetic',
    description: 'Extend word-problem layouts to same-unit length arithmetic.',
    generators: [{ module: 'arithmetic-ops-pairs', strategy: 'reuse' }],
    views: [{ module: 'operations-word-problem', strategy: 'expand' }]
});

const numberLineArithmeticImplementation = defineImplementation({
    id: 'number-line-arithmetic',
    description: 'Add a number-line layout for whole-number representation and arithmetic.',
    generators: [
        { module: 'writing', strategy: 'reuse' },
        { module: 'arithmetic-ops-pairs', strategy: 'reuse' }
    ],
    views: [{ module: 'operations-number-line', strategy: 'new' }]
});

const timeFiveMinuteImplementation = defineImplementation({
    id: 'time-five-minute',
    description: 'Extend time generation to five-minute intervals for existing clock layouts.',
    generators: [{ module: 'time', strategy: 'expand' }],
    views: [
        { module: 'time-analog', strategy: 'reuse' },
        { module: 'time-digital', strategy: 'reuse' }
    ]
});

const usMoneyWordProblemsImplementation = defineImplementation({
    id: 'us-money-word-problems',
    description: 'Add abstract dollar-denomination word problems with currency notation.',
    generators: [{ module: 'currency-arithmetic', strategy: 'new' }],
    views: [{ module: 'currency-word-problem', strategy: 'new' }]
});

const measurementDataImplementation = defineImplementation({
    id: 'measurement-data',
    description: 'Add generation and tabular presentation of whole-unit measurement data.',
    generators: [{ module: 'measurement-data', strategy: 'new' }],
    views: [{ module: 'measurement-data-table', strategy: 'new' }]
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
    description: 'Extend shape partitioning to rectangular arrays and square counting.',
    generators: [{ module: 'shape-partition', strategy: 'expand' }],
    views: [{ module: 'shape-partition-equal', strategy: 'expand' }]
});

const equalShareShapeEquivalenceImplementation = defineImplementation({
    id: 'equal-share-shape-equivalence',
    description: 'Add paired partitions showing equal shares with different geometries.',
    generators: [{ module: 'shape-partition-equivalence', strategy: 'new' }],
    views: [{ module: 'shape-partition-equivalence', strategy: 'new' }]
});

export const implementationTodos: ImplementationTodo[] = [
    // 2.OA - Operations and Algebraic Thinking
    ...toImplementationTodos(
        '2.OA.A.1-one-step-word-problems',
        oneStepWordProblemsBuilder,
        wordProblemsWithin100Implementation,
        'Render one-step stories and equations with unknowns in the source-required positions and values within 100.'
    ),
    ...toImplementationTodos(
        '2.OA.A.1-two-step-word-problems',
        twoStepWordProblemsBuilder,
        wordProblemsWithin100Implementation,
        'Render genuinely connected two-step stories and equations, including mixed-operation cases, with values within 100.'
    ),
    // 2.NBT - Number and Operations in Base Ten
    ...toImplementationTodos(
        '2.NBT.A.1a-ten-tens-make-hundred',
        tenTensMakeHundredBuilder,
        placeValueHundredsImplementation,
        'Show ten distinct tens bundled and renamed as one hundred.'
    ),
    ...toImplementationTodos(
        '2.NBT.A.1b-hundreds',
        hundredsBuilder,
        placeValueHundredsImplementation,
        'Represent 100 through 900 as one through nine hundreds with zero tens and zero ones.'
    ),
    ...toImplementationTodos(
        '2.NBT.A.2-count-within-1000',
        countWithin1000Builder,
        countingSequencesTo1000Implementation,
        'Show a visible sequence with a missing continuation and the requested step through 1000.'
    ),
    ...toImplementationTodos(
        '2.NBT.A.3-base-ten-numerals',
        baseTenNumeralsBuilder,
        numberNotationTo1000Implementation,
        'Pair three-digit numerals with an inspectable read prompt, word answer, or written numeral response without claiming oral performance.'
    ),
    ...toImplementationTodos(
        '2.NBT.A.3-number-names',
        numberNamesBuilder,
        numberNotationTo1000Implementation,
        'Show a numeral and its correctly written number name.'
    ),
    ...toImplementationTodos(
        '2.NBT.A.3-expanded-form',
        expandedFormBuilder,
        expandedPlaceValueNotationImplementation,
        'Decompose a numeral into a visible sum of its non-zero hundreds, tens, and ones values.'
    ),
    ...toImplementationTodos(
        '2.NBT.B.7-concrete-regrouping',
        concreteRegroupingBuilder,
        multiDigitPlaceValueArithmeticImplementation,
        'Show hundreds, tens, and ones models composing or decomposing during addition or subtraction.'
    ),
    ...toImplementationTodos(
        '2.NBT.B.7-model-to-written-method',
        modelToWrittenMethodBuilder,
        multiDigitPlaceValueArithmeticImplementation,
        'Map the same values and regrouping steps from a concrete model into a written method.'
    ),
    ...toImplementationTodos(
        '2.NBT.B.8-place-value-offsets',
        placeValueOffsetsBuilder,
        placeValueOffsetsTo1000Implementation,
        'Show starting and result numerals with place-value evidence for adding or subtracting ten or one hundred.'
    ),
    ...toImplementationTodos(
        '2.NBT.B.9-explain-strategies',
        explainStrategiesBuilder,
        multiDigitPlaceValueArithmeticImplementation,
        'Prompt for an explanation and provide visible place-value and equation evidence that makes it assessable.'
    ),
    // 2.MD - Measurement and Data
    ...toImplementationTodos(
        '2.MD.A.1-select-length-tool',
        selectLengthToolBuilder,
        standardLengthToolsImplementation,
        'Show an object and competing tools with the appropriate length tool visibly selected.'
    ),
    ...toImplementationTodos(
        '2.MD.A.1-use-length-tool',
        useLengthToolBuilder,
        standardLengthToolsImplementation,
        'Align the selected tool to an object and show a readable scale, unit, and measured answer.'
    ),
    ...toImplementationTodos(
        '2.MD.A.3-estimate-metric-lengths',
        estimateMetricLengthBuilder,
        lengthEstimationImplementation,
        'Show a familiar object or span, named metric unit, estimate prompt, and plausible answer.'
    ),
    ...toImplementationTodos(
        '2.MD.A.4-measured-length-difference',
        measuredLengthDifferenceBuilder,
        lengthComparisonByMeasureImplementation,
        'Show two measured objects in a common unit and their numerical length difference.'
    ),
    ...toImplementationTodos(
        '2.MD.B.5-length-word-problems',
        lengthWordProblemsBuilder,
        lengthArithmeticImplementation,
        'Show same-unit quantities in a story whose equation, unknown, and solution agree.'
    ),
    ...toImplementationTodos(
        '2.MD.B.6-number-line-representation',
        numberLineRepresentationBuilder,
        numberLineArithmeticImplementation,
        'Show equally spaced labeled points beginning at zero and mark a requested whole number as a length.'
    ),
    ...toImplementationTodos(
        '2.MD.B.6-number-line-arithmetic',
        numberLineArithmeticBuilder,
        numberLineArithmeticImplementation,
        'Show directional jumps, endpoints, an equation, and an answer that agree.'
    ),
    ...toImplementationTodos(
        '2.MD.C.7-nearest-five-minute-time',
        nearestFiveMinuteTimeBuilder,
        timeFiveMinuteImplementation,
        'Show multiples-of-five minute values with matching analog or digital displays and read or written answers.'
    ),
    ...toImplementationTodos(
        '2.MD.C.8-currency-word-problems',
        currencyWordProblemsBuilder,
        usMoneyWordProblemsImplementation,
        'Show currency representations and values in a story with correct arithmetic, units, answer, and dollar or cent notation.'
    ),
    ...toImplementationTodos(
        '2.MD.D.9-generate-measurement-data',
        measurementDataBuilder,
        measurementDataImplementation,
        'Show several whole-unit length measurements and the collected data list.'
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

export const ontologyTodos: OntologyTodo[] = [{
    standardId: '2.OA.C.3',
    title: 'Classify object-group parity',
    description: 'Broaden Area.OddsAndEvens from a final-digit divisibility shortcut to the general study, understanding, and application of integer parity. Preserve the shortcut as a narrower method if needed. The eventual target combines OddsAndEvens, EvenNumbers or OddNumbers, PhysicalNumbers, NumbersSmaller20, and ConceptClassification; pairing is visible evidence, while StepsOf2 applies only to an explicit counting-by-twos realization.'
}, {
    standardId: '2.OA.C.3',
    title: 'Express an even number as two equal addends',
    description: 'Add domain-neutral equation and relation-form distinctions plus a distinction for equal operand values. The eventual target combines Equation, ValueExpressionRelation, Addition, TwoOperands, EqualOperandValues, and EvenNumbers.'
}, {
    standardId: '2.OA.C.4',
    title: 'Add objects in a rectangular array',
    description: 'Add NumberArray under VisualNumbers as a sibling of TenFrame, integrating BoxArrangement so a number-representing array is distinguishable from a generic spatial arrangement.'
}, {
    standardId: '2.OA.C.4',
    title: 'Express an array total as equal addends',
    description: 'Combine NumberArray with the equation, value-expression relation, and equal-operand-value distinctions. BoxArrangement supplies the row and column layout through the array representation.'
}, {
    standardId: '2.NBT.B.6',
    title: 'Add four two-digit numbers',
    description: 'Add FourOperands to the operand-cardinality branch, which currently stops at ThreeOperands.'
}, {
    standardId: '2.MD.A.2',
    title: 'Relate measurement to unit size',
    description: 'Add a unit-size or comparative-measurement relation that can require two measurements of one object using differently sized units.'
}, {
    standardId: '2.MD.C.7',
    title: 'Use a.m. and p.m.',
    description: 'Add a day-period or meridiem family under TimeAbstraction with mutually exclusive ante-meridiem and post-meridiem children, combined explicitly with clock scopes only when required.'
}, {
    standardId: '2.MD.C.8',
    title: 'Use quarter, dime, nickel, and penny values',
    description: 'Add abstract minor-denomination ratio scopes for one quarter, one tenth, one twentieth, and one hundredth of the major denomination. Combine them with Dollar and Coins without adding US-specific coin identities.'
}, {
    standardId: '2.MD.D.9',
    title: 'Represent measurements with a line plot',
    description: 'Add LinePlot below a new StatisticalRepresentation family within RepresentationalScope. It is distinct from coordinate-plane LineGraphing.'
}, {
    standardId: '2.MD.D.10',
    title: 'Draw picture and bar graphs',
    description: 'Add PictureGraph and BarGraph under StatisticalRepresentation, plus an orthogonal single-unit-scale distinction if graph scale must be independently permuted.'
}, {
    standardId: '2.MD.D.10',
    title: 'Solve problems from a bar graph',
    description: 'Add the bar-graph representation distinction required before expressing the operation and interpretation target.'
}];

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
