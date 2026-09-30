import DatasetPermutationBuilder, {
    defineImplementationPackage,
    toImplementationTodos
} from '../../lib/dataset-permutation-builder.ts';
import {defineOntologyPackage, toOntologyTodo} from '../../lib/ontology-todo.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import type {
    BeyondScopeEntry,
    CompetencyTarget,
    ImplementationTodo,
    OntologyTodo,
    TargetEquivalence
} from '../../types/ml-engine.ts';

// Operations and Algebraic Thinking (5.OA)

const groupedExpressionsImplementation = defineImplementationPackage({
    id: 'grouped-numerical-expressions',
    description: 'Construct meaningful grouping and evaluate numerical expressions with grouping-first reasoning.',
    generators: [{module: 'arithmetic-grouped-expressions', strategy: 'new'}],
    views: [
        {module: 'operations-grouping-write', strategy: 'new'},
        {module: 'operations-grouping-evaluate', strategy: 'new'}
    ]
});

const patternCorrespondenceImplementation = defineImplementationPackage({
    id: 'paired-pattern-correspondence',
    description: 'Infer and explain relationships between aligned terms of two numerical patterns.',
    generators: [{module: 'arithmetic-paired-patterns', strategy: 'new'}],
    views: [
        {module: 'operations-pattern-correspondence', strategy: 'new'},
        {module: 'operations-pattern-correspondence-explanation', strategy: 'new'}
    ]
});

const patternCoordinateImplementation = defineImplementationPackage({
    id: 'pattern-coordinate-plotting',
    description: 'Plot supplied ordered coordinate pairs drawn from corresponding numerical-pattern terms.',
    generators: [{module: 'coordinate-pattern-pairs', strategy: 'new'}],
    views: [{module: 'coordinate-plot-pattern-pairs', strategy: 'new'}]
});

const useGroupingBuilder = new DatasetPermutationBuilder().addLabels([
    Area.ParenthesesUsage,
    Area.OrderOfOperations,
    Scope.ArabicNumerals,
    Ability.Formalization
]);

const evaluateGroupedExpressionsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.ParenthesesUsage,
    Area.OrderOfOperations,
    Scope.ArabicNumerals,
    Ability.ProcedureExecution
]);

const identifyPatternCorrespondenceBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PatternCorrespondence,
    Scope.ArabicNumerals,
    Ability.ConceptDerivation
]);

const explainPatternCorrespondenceBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PatternCorrespondence,
    Scope.ArabicNumerals,
    Ability.Interpretation,
    Ability.TextualArticulation
]);

const graphPatternPairsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PointPlotting,
    Scope.CartesianCoordinateSystem,
    Scope.IntegerNumbers,
    Scope.NumbersWithoutNegatives,
    Ability.VisualArticulation
]);

// Number and Operations in Base Ten (5.NBT)

const decimalPlaceScalingImplementation = defineImplementationPackage({
    id: 'decimal-adjacent-place-scaling',
    description: 'Relate adjacent whole-number and fractional place values in both reciprocal directions.',
    generators: [{module: 'decimal-place-value-scaling', strategy: 'new'}],
    views: [{module: 'numbers-decimal-place-value-scaling', strategy: 'new'}]
});

const decimalRoundingImplementation = defineImplementationPackage({
    id: 'decimal-place-rounding',
    description: 'Round decimals to an explicitly requested whole-number or fractional place.',
    generators: [{module: 'decimal-rounding', strategy: 'new'}],
    views: [{module: 'numbers-decimal-rounding-line', strategy: 'new'}]
});

const standardMultiplicationImplementation = defineImplementationPackage({
    id: 'whole-number-standard-multiplication',
    description: 'Execute the conventional written multiplication algorithm for multi-digit whole-number factors.',
    generators: [{module: 'standard-algorithm-multiplication', strategy: 'new'}],
    views: [{module: 'operations-multiplication-standard-algorithm', strategy: 'new'}]
});

const twoDigitDivisionImplementation = defineImplementationPackage({
    id: 'two-digit-divisor-division',
    description: 'Extend partial-quotient division and its illustrated explanation to two-digit divisors, including exact division.',
    generators: [{module: 'multi-digit-division', strategy: 'expand'}],
    views: [{module: 'operations-division-area-model', strategy: 'expand'}]
});

// DecimalNumbers includes base-ten whole-number examples as well as fractional places.
// Keep both directions and both place contexts in this complete competency.
const adjacentDecimalPlaceScalingBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PlaceValue,
    Area.ProportionalScaling,
    Area.Multiplication,
    Area.Division,
    Scope.Base10,
    Scope.DecimalNumbers,
    Ability.ConceptDerivation
]);

const roundDecimalsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.DecimalRounding,
    Scope.DecimalNumbers,
    Scope.ArabicNumerals,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Ability.ProcedureExecution
]);

const standardMultiplicationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.MultiplicationStandardAlgorithm,
    Scope.TwoOperands,
    Scope.IntegerNumbers,
    Scope.ArabicNumerals,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.MultipleDigitSmallestOperand,
    Ability.ProcedureExecution
]);

// Do not inherit the Grade 4 producer's nonzero-remainder restriction.
const twoDigitDivisorDivisionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DivisionPartialQuotients,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.TwoDigitDivisor,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Scope.TwoDigitDividend],
        [Scope.ThreeDigitDividend],
        [Scope.FourDigitDividend]
    ]);

const measurementUnitConversionImplementation = defineImplementationPackage({
    id: 'measurement-unit-conversion-decimals',
    description: 'Extend within-system conversion to integer and fractional decimal measurements in both directions, preserving exact unit equivalences.',
    generators: [
        {module: 'measurement-conversion', strategy: 'expand'}
    ],
    views: [
        {module: 'measure-conversion-execution', strategy: 'expand'}
    ]
});

const measurementMultistepConversionImplementation = defineImplementationPackage({
    id: 'measurement-multistep-conversions',
    description: 'Represent conversion and subsequent calculation in canonical multistep measurement stories with coherent units and equations.',
    generators: [
        {module: 'measurement-conversion-problems', strategy: 'new'}
    ],
    views: [
        {module: 'measure-conversion-problems', strategy: 'new'}
    ]
});

const fractionalMeasurementLinePlotImplementation = defineImplementationPackage({
    id: 'fractional-measurement-line-plots',
    description: 'Support denominator-specific measurement data and line-plot construction with halves, quarters and eighths.',
    generators: [
        {module: 'measurement-data', strategy: 'expand'}
    ],
    views: [
        {module: 'measurement-line-plot', strategy: 'expand'}
    ]
});

const measurementLinePlotFractionProblemsImplementation = defineImplementationPackage({
    id: 'measurement-line-plot-fraction-problems',
    description: 'Solve contextual problems from fractional measurement line plots using the Grade 5 operations, including equal redistribution.',
    generators: [
        {module: 'measurement-line-plot-problems', strategy: 'new'}
    ],
    views: [
        {module: 'measurement-line-plot-problems', strategy: 'new'}
    ]
});

const unitCubeVolumeImplementation = defineImplementationPackage({
    id: 'unit-cube-volume',
    description: 'Model complete unit-cube packings for unit specification, volume interpretation and counting in standard or improvised cubic units.',
    generators: [
        {module: 'volume-unit-cubes', strategy: 'new'}
    ],
    views: [
        {module: 'volume-unit-cube-specification', strategy: 'new'},
        {module: 'volume-packing-interpretation', strategy: 'new'},
        {module: 'volume-unit-cube-count', strategy: 'new'}
    ]
});

const rectangularPrismVolumeImplementation = defineImplementationPackage({
    id: 'rectangular-prism-volume',
    description: 'Connect whole-number rectangular-prism cube packings, triple products and volume formulas through separate explanation, construction and calculation tasks.',
    generators: [
        {module: 'volume-rectangular-prism', strategy: 'new'}
    ],
    views: [
        {module: 'volume-packing-product-explanation', strategy: 'new'},
        {module: 'volume-product-model', strategy: 'new'},
        {module: 'volume-formula-execution', strategy: 'new'},
        {module: 'volume-formula-story', strategy: 'new'}
    ]
});

const compositePrismVolumeImplementation = defineImplementationPackage({
    id: 'composite-prism-volume',
    description: 'Explain and apply volume additivity for exactly two nonoverlapping rectangular prisms in geometric and contextual tasks.',
    generators: [
        {module: 'volume-composite-prisms', strategy: 'new'}
    ],
    views: [
        {module: 'volume-additivity-explanation', strategy: 'new'},
        {module: 'volume-composite-execution', strategy: 'new'},
        {module: 'volume-composite-story', strategy: 'new'}
    ]
});

const coordinateSystemFoundationsImplementation = defineImplementationPackage({
    id: 'coordinate-system-foundations',
    description: 'Specify a Cartesian coordinate system through perpendicular axes, coherent scales and a shared zero origin.',
    generators: [
        {module: 'coordinate-system', strategy: 'new'}
    ],
    views: [
        {module: 'coordinate-system-specification', strategy: 'new'}
    ]
});

const contextualCoordinateGraphingImplementation = defineImplementationPackage({
    id: 'contextual-coordinate-graphing',
    description: 'Graph nonnegative ordered quantities from necessary real-world or mathematical context on named and scaled coordinate axes.',
    generators: [
        {module: 'coordinate-context', strategy: 'new'}
    ],
    views: [
        {module: 'coordinate-context-plotting', strategy: 'new'}
    ]
});

const shapeCategoryHierarchyImplementation = defineImplementationPackage({
    id: 'shape-category-hierarchy',
    description: 'Model a hierarchy of plane-shape categories for inherited-property inference and classification through defining attributes.',
    generators: [
        {module: 'shape-category-hierarchy', strategy: 'new'}
    ],
    views: [
        {module: 'shape-inherited-attributes', strategy: 'new'},
        {module: 'shape-hierarchy-classification', strategy: 'new'}
    ]
});

// Measurement and Data (5.MD)

const grade5MeasurementUnitPairs = [
    [Area.UnitMagnitudeScaling, Scope.KilometerScale, Scope.MeterScale],
    [Area.UnitMagnitudeScaling, Scope.MeterScale, Scope.CentimeterScale],
    [Area.UnitMagnitudeScaling, Scope.KilogramScale, Scope.GramScale],
    [Area.UnitFactorScaling, Scope.PoundScale, Scope.OunceScale],
    [Area.UnitMagnitudeScaling, Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale, Scope.MilliliterScale],
    [Area.UnitFactorScaling, Scope.HourIntervals, Scope.MinuteIntervals],
    [Area.UnitFactorScaling, Scope.MinuteIntervals, Scope.SecondIntervals]
];

const grade5MeasurementNumberKinds = [[Scope.IntegerNumbers], [Scope.DecimalNumbers]];

const grade5LinePlotDenominators = [
    [Scope.HalfFractions],
    [Scope.QuarterFractions],
    [Scope.EighthFractions]
];

const grade5LinePlotLabels = [
    Area.Statistics,
    Scope.ProvidedMeasurement,
    Scope.LinePlot,
    Scope.SingleFrameOfReference
];

const convertWithinSystemBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Ability.ProcedureExecution
    ])
    .applyLabelVariants(grade5MeasurementUnitPairs)
    .applyLabelVariants(grade5MeasurementNumberKinds);

const multistepConversionProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Equation,
        Scope.MultiStep,
        Ability.TextualReception,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants(grade5MeasurementUnitPairs)
    .applyLabelVariants(grade5MeasurementNumberKinds);

const constructGrade5FractionalLinePlotBuilder = new DatasetPermutationBuilder()
    .addLabels([
        ...grade5LinePlotLabels,
        Ability.VisualArticulation
    ])
    .applyLabelVariants(grade5LinePlotDenominators);

const linePlotFractionProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        ...grade5LinePlotLabels,
        Ability.ProcedureExecution,
        Ability.TextualReception
    ])
    .applyLabelVariants(grade5LinePlotDenominators)
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction],
        [Area.Multiplication],
        [Area.Division]
    ]);

const unitCubeSpecificationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Cube,
        Area.MeasuringVolumes,
        Scope.CubeScale,
        Ability.ConceptSpecification
    ]);

const volumeFromPackingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Cube,
        Area.MeasuringVolumes,
        Scope.CubeScale,
        Ability.Interpretation
    ]);

const countUnitCubesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringVolumes,
        Area.Numeration,
        Area.Cube,
        Scope.CubeScale,
        Scope.IntegerNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.CubicCentimeterScale],
        [Scope.CubicInchScale],
        [Scope.CubicFootScale],
        []
    ]);

const packingProductConnectionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.MeasuringVolumes,
        Area.VolumeCalculation,
        Area.RectangularPrism,
        Area.Multiplication,
        Area.Equation,
        Scope.CubeScale,
        Scope.IntegerNumbers,
        Ability.ProcedureUnderstanding,
        Ability.Formalization
    ]);

const representTripleProductsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.VolumeCalculation,
        Area.RectangularPrism,
        Area.Multiplication,
        Scope.CubeScale,
        Scope.IntegerNumbers,
        Scope.ThreeOperands,
        Ability.VisualArticulation
    ])
    .applyLabelVariants([
        [],
        [Area.AssociativeLaw]
    ]);

const rectangularPrismVolumeFormulasBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.VolumeCalculation,
        Area.RectangularPrism,
        Area.Multiplication,
        Area.Equation,
        Scope.IntegerNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.ThreeOperands],
        [Scope.TwoOperands]
    ])
    .applyLabelVariants([
        [],
        [Ability.TextualReception]
    ]);

const volumeAdditivityBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.VolumeCalculation,
        Area.RectangularPrism,
        Area.ShapeDecomposition,
        Area.Addition,
        Scope.IntegerNumbers,
        Ability.ProcedureUnderstanding
    ]);

const compositeVolumeBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.VolumeCalculation,
        Area.RectangularPrism,
        Area.ShapeDecomposition,
        Area.Addition,
        Area.Multiplication,
        Area.Equation,
        Scope.IntegerNumbers,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [],
        [Ability.TextualReception]
    ]);

// Geometry (5.G)

const defineCoordinateSystemBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.CoordinateAxes,
        Area.Origin,
        Scope.CartesianCoordinateSystem,
        Scope.TwoDimensional,
        Ability.ConceptSpecification
    ]);

const graphContextualPointsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PointPlotting,
        Scope.CartesianCoordinateSystem,
        Scope.NumbersWithoutNegatives,
        Ability.VisualArticulation,
        Ability.TextualReception
    ]);

const inheritedShapeAttributesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeSubsumption,
        Scope.ShapeAttributes,
        Scope.TwoDimensional,
        Ability.ConceptDerivation
    ]);

const classifyShapeHierarchyBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ShapeSubsumption,
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Scope.TwoDimensional,
        Ability.ConceptClassification,
        Ability.VisualArticulation
    ]);

// ==========================================
// Number and Operations—Fractions (5.NF)
// ==========================================

const fractionBenchmarkArithmeticImplementation = defineImplementationPackage({
    id: 'fraction-benchmark-arithmetic',
    description: 'Generate exact fraction operands, benchmark comparisons and bounds for estimation and answer-reasonableness tasks.',
    generators: [{module: 'fraction-benchmark-arithmetic', strategy: 'new'}],
    views: [
        {module: 'fractions-benchmark-estimate', strategy: 'new'},
        {module: 'fractions-benchmark-reasonableness', strategy: 'new'}
    ]
});

const fractionQuotientMeaningImplementation = defineImplementationPackage({
    id: 'fraction-quotient-meaning',
    description: 'Represent the equal-sharing and division relationship between a fraction numerator, denominator and value.',
    generators: [{module: 'fraction-quotient-model', strategy: 'new'}],
    views: [{module: 'fractions-quotient-interpretation', strategy: 'new'}]
});

const generalFractionProductsImplementation = defineImplementationPackage({
    id: 'general-fraction-products',
    description: 'Generate exact whole, fractional and mixed-number products with equal-partition relations for interpretation, story creation and contextual calculation.',
    generators: [{module: 'fraction-products', strategy: 'new'}],
    views: [
        {module: 'fractions-product-partition-interpretation', strategy: 'new'},
        {module: 'fractions-product-story-creation', strategy: 'new'},
        {module: 'fractions-product-word-problem', strategy: 'new'}
    ]
});

const fractionalRectangleAreaImplementation = defineImplementationPackage({
    id: 'fractional-rectangle-area',
    description: 'Model exact fractional rectangle dimensions and unit-fraction square tiles for area reasoning, computation and product construction.',
    generators: [{module: 'fraction-rectangle-area', strategy: 'new'}],
    views: [
        {module: 'fractions-area-tiling-understanding', strategy: 'new'},
        {module: 'fractions-rectangle-area', strategy: 'new'},
        {module: 'fractions-area-product-construction', strategy: 'new'}
    ]
});

const fractionScalingReasoningImplementation = defineImplementationPackage({
    id: 'fraction-scaling-reasoning',
    description: 'Model a positive reference quantity, fractional scale and product comparison for reasoning from the scale relative to one.',
    generators: [{module: 'fraction-scaling', strategy: 'new'}],
    views: [
        {module: 'fractions-scaling-comparison', strategy: 'new'},
        {module: 'fractions-scaling-explanation', strategy: 'new'}
    ]
});

const fractionEquivalenceUnitScalingImplementation = defineImplementationPackage({
    id: 'fraction-equivalence-unit-scaling',
    description: 'Extend fraction equivalence with an explicit n/n unit multiplier and interpret why multiplying by one preserves value.',
    generators: [{module: 'fraction-equivalence', strategy: 'expand'}],
    views: [{module: 'fractions-equivalence-unit-scaling', strategy: 'new'}]
});

const fractionBenchmarkEstimateBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericApproximation,
        Area.FractionReferenceComparison,
        Scope.FractionNumbers,
        Scope.SingleFrameOfReference,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const fractionBenchmarkReasonablenessBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionReferenceComparison,
        Scope.FractionNumbers,
        Scope.SingleFrameOfReference,
        Ability.PlausibilityEvaluation
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const fractionQuotientInterpretationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.FractionNotation,
    Area.Division,
    Scope.FractionNumbers,
    Ability.Interpretation
]);

const fractionPartitionProductBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Multiplication,
    Area.Division,
    Area.FractionNumeratorInterpretation,
    Area.FractionDenominatorInterpretation,
    Scope.FractionNumbers,
    Scope.EqualShares,
    Ability.Interpretation
]);

const fractionProductStoryCreationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Multiplication,
    Area.Division,
    Area.FractionNumeratorInterpretation,
    Area.FractionDenominatorInterpretation,
    Scope.FractionNumbers,
    Scope.EqualShares,
    Ability.TextualArticulation
]);

const fractionalRectangleTilingBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AreaCalculation,
    Area.Rectangle,
    Area.Square,
    Area.Multiplication,
    Scope.FractionNumbers,
    Scope.UnitFractions,
    Scope.BoxArrangement,
    Ability.ProcedureUnderstanding
]);

const fractionalRectangleAreaBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AreaCalculation,
    Area.Rectangle,
    Area.Multiplication,
    Scope.FractionNumbers,
    Scope.TwoOperands,
    Ability.ProcedureExecution
]);

const fractionAreaProductRepresentationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AreaCalculation,
    Area.Rectangle,
    Area.Multiplication,
    Scope.FractionNumbers,
    Scope.TwoOperands,
    Ability.VisualArticulation
]);

const fractionProductFactorComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ProportionalScaling,
        Area.Multiplication,
        Scope.FractionNumbers,
        Ability.Interpretation
    ])
    .applyLabelVariants([
        [Area.NumericInequality, Scope.Greater],
        [Area.NumericInequality, Scope.Less],
        [Area.NumericEquality, Scope.Equal]
    ]);

const fractionScalingExplanationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ProportionalScaling,
        Area.Multiplication,
        Area.NumericInequality,
        Ability.Interpretation,
        Ability.TextualArticulation
    ])
    .applyLabelVariants([
        [Scope.ImproperFractions, Scope.Greater],
        [Scope.ProperFractions, Scope.Less]
    ]);

const fractionEquivalenceUnitScalingBuilder = new DatasetPermutationBuilder().addLabels([
    Area.FractionEquivalence,
    Area.Multiplication,
    Area.ProportionalScaling,
    Scope.FractionNumbers,
    Scope.Equal,
    Ability.Interpretation
]);

const generalFractionProductProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Multiplication,
        Area.Equation,
        Scope.SingleFrameOfReference,
        Ability.TextualReception,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Scope.FractionNumbers], [Scope.MixedNumbers]]);

// Shared ontology packages; each leaf reference retains its complete competency.

const numericalExpressionOntology = defineOntologyPackage({
    id: 'numerical-expression-tasks',
    description: 'Add an eligible NumericalExpression Area in the mathematical-expression family for expressions composed of numbers and operations without a relational operator. Support writing and interpreting expression structure without requiring grouping symbols or evaluation.',
    changes: [
        { dimension: 'Area', entities: ['NumericalExpression'] }
    ]
});

const pairedPatternOntology = defineOntologyPackage({
    id: 'paired-pattern-context',
    description: 'Add a PairedPatterns Scope in pattern-task contexts for aligned numerical sequences generated simultaneously from their respective supplied rules and starting conditions. Preserve its distinction from generating one sequence and from interpreting a correspondence between sequences.',
    changes: [
        { dimension: 'Scope', entities: ['PairedPatterns'] }
    ]
});

const orderedCoordinatePairOntology = defineOntologyPackage({
    id: 'ordered-coordinate-pairs',
    description: 'Add an OrderedCoordinatePair Area in coordinate geometry and representation for forming and interpreting ordered components, their correspondence to named axes, travel from the origin, and contextual meanings, independently of locating and marking a point.',
    changes: [
        { dimension: 'Area', entities: ['OrderedCoordinatePair'] }
    ]
});

const powersOfTenOntology = defineOntologyPackage({
    id: 'powers-of-ten-context',
    description: 'Add a WholeNumberPowersOfTen Scope in numerical contexts for exponentiation, constraining the power base to ten and the exponent to a nonnegative integer. This power constraint is distinct from the existing Base10 positional-notation Scope.',
    changes: [
        { dimension: 'Scope', entities: ['WholeNumberPowersOfTen'] }
    ]
});

const decimalPrecisionOntology = defineOntologyPackage({
    id: 'decimal-place-precision',
    description: 'Add cumulative input/display precision Scopes in decimal-number contexts through tenths, hundredths, and thousandths, with capability to evidence each named deepest place. Distinguish these input/display bounds from the precision of intermediate values and results, and from the existing DecimalPrecission mathematical topic.',
    changes: [
        {
            dimension: 'Scope',
            entities: ['TenthsPrecision', 'HundredthsPrecision', 'ThousandthsPrecision']
        }
    ]
});

const unlikeDenominatorOntology = defineOntologyPackage({
    id: 'unlike-denominator-fraction-arithmetic',
    description: 'Add an UnlikeDenominators Scope in relational contexts for fractional operands, constraining the original operands before conversion to equivalent common-denominator forms. Preserve unlike-denominator arithmetic and word problems without imposing a least-common-denominator requirement.',
    changes: [
        { dimension: 'Scope', entities: ['UnlikeDenominators'] }
    ]
});

const fractionDivisionRolesOntology = defineOntologyPackage({
    id: 'fraction-division-operand-roles',
    description: 'Add role-specific numerical contexts for whole-number and unit-fraction dividends and divisors, and fractional or mixed-number quotients. Each Scope constrains its named role rather than every number in the artifact; divisors remain nonzero under the division contract. Distinguish the two unit-fraction division orientations and whole-number division with fractional results.',
    changes: [
        {
            dimension: 'Scope',
            entities: [
                'WholeNumberDividend',
                'WholeNumberDivisor',
                'UnitFractionDividend',
                'UnitFractionDivisor',
                'FractionalQuotient',
                'MixedNumberQuotient'
            ]
        }
    ]
});

// The current catalog cannot yet realize any complete reviewed Grade 5 target.
export const spec: CompetencyTarget[] = [];

export const implementationTodos: ImplementationTodo[] = [
    ...toImplementationTodos(
        '5.OA.A.1-use-grouping',
        useGroupingBuilder,
        groupedExpressionsImplementation,
        'Elicit grouping symbols that express a described calculation order; include parentheses, brackets and braces with mathematically necessary grouping.'
    ),
    ...toImplementationTodos(
        '5.OA.A.1-evaluate-grouped-expressions',
        evaluateGroupedExpressionsBuilder,
        groupedExpressionsImplementation,
        'Show a meaningfully grouped numeral expression and request its value; the solution preserves grouping-first steps and the final result.'
    ),
    ...toImplementationTodos(
        '5.OA.B.3-identify-pattern-correspondence',
        identifyPatternCorrespondenceBuilder,
        patternCorrespondenceImplementation,
        'Show aligned terms from two numerical sequences and elicit a relationship that holds across corresponding terms.'
    ),
    ...toImplementationTodos(
        '5.OA.B.3-explain-pattern-correspondence',
        explainPatternCorrespondenceBuilder,
        patternCorrespondenceImplementation,
        'Preserve both recurrence rules, starts and aligned terms; request a written explanation of why the correspondence holds.'
    ),
    ...toImplementationTodos(
        '5.OA.B.3-graph-pattern-pairs',
        graphPatternPairsBuilder,
        patternCoordinateImplementation,
        'Supply nonnegative integer ordered pairs with horizontal and vertical roles, and a labeled coordinate grid on which to plot them, including points on the axes.'
    ),
    ...toImplementationTodos(
        '5.NBT.A.1-adjacent-decimal-place-scaling',
        adjacentDecimalPlaceScalingBuilder,
        decimalPlaceScalingImplementation,
        'Use whole-number and decimal place charts in the same implementation; elicit both the ten-times and reciprocal one-tenth relationships between equal digits in adjacent places.'
    ),
    ...toImplementationTodos(
        '5.NBT.A.4-round-decimals',
        roundDecimalsBuilder,
        decimalRoundingImplementation,
        'Specify the rounding place and show the decimal input, adjacent rounding candidates and answer space; support requested fractional places as well as whole-number places.'
    ),
    ...toImplementationTodos(
        '5.NBT.B.5-multiplication-standard-algorithm',
        standardMultiplicationBuilder,
        standardMultiplicationImplementation,
        'Use multi-digit factors and expose the conventional vertical algorithm with aligned partial-product rows, carries and summation; a final-product-only equation is insufficient.'
    ),
    ...toImplementationTodos(
        '5.NBT.B.6-two-digit-divisor-division',
        twoDigitDivisorDivisionBuilder,
        twoDigitDivisionImplementation,
        'Compute and explain a quotient with a two-digit divisor using place-value partial quotients and coherent equations or area representation. Include exact division instead of retaining a nonzero-remainder invariant.'
    ),
    ...toImplementationTodos(
        '5.MD.A.1-convert-within-system',
        convertWithinSystemBuilder,
        measurementUnitConversionImplementation,
        'Convert the same measured quantity between the named units in both directions. Include actual fractional decimal values as well as integers, with exact factors and coherent results; do not limit the task to larger-to-smaller integer conversion.'
    ),
    ...toImplementationTodos(
        '5.MD.A.1-multistep-conversion-problems',
        multistepConversionProblemsBuilder,
        measurementMultistepConversionImplementation,
        'Use a necessary real-world story whose solution requires unit conversion followed by further calculation. Show the conversion equality and successive calculation steps with consistent units.'
    ),
    ...toImplementationTodos(
        '5.MD.B.2-construct-fractional-line-plot',
        constructGrade5FractionalLinePlotBuilder,
        fractionalMeasurementLinePlotImplementation,
        'Provide fractional measurement observations and an appropriately subdivided blank line plot. Ask for one mark per observation, preserve the requested denominator evidence, and reveal the completed frequency plot in the solution.'
    ),
    ...toImplementationTodos(
        '5.MD.B.2-line-plot-fraction-problems',
        linePlotFractionProblemsBuilder,
        measurementLinePlotFractionProblemsImplementation,
        'Supply a completed line plot and a necessary contextual question requiring the selected Grade 5 fraction operation. Include equal redistribution and coherent measurement units rather than restricting the task to shortest/longest arithmetic.'
    ),
    ...toImplementationTodos(
        '5.MD.C.3a-unit-cube',
        unitCubeSpecificationBuilder,
        unitCubeVolumeImplementation,
        'Identify or specify a cube whose every edge is one unit as the unit of volume. Make its one cubic unit distinguishable from the one-unit edge length and a face area.'
    ),
    ...toImplementationTodos(
        '5.MD.C.3b-volume-from-packing',
        volumeFromPackingBuilder,
        unitCubeVolumeImplementation,
        'Show congruent unit cubes that exhaust a solid without gaps or overlaps, and ask why a packing of n cubes gives a volume of n cubic units.'
    ),
    ...toImplementationTodos(
        '5.MD.C.4-count-unit-cubes',
        countUnitCubesBuilder,
        unitCubeVolumeImplementation,
        'Expose all cubes through unambiguous layers or an exploded solid and ask for the counted volume. Use the selected standard cubic unit, or explicitly define the improvised cube unit when no standard scale is requested.'
    ),
    ...toImplementationTodos(
        '5.MD.C.5a-packing-product-connection',
        packingProductConnectionBuilder,
        rectangularPrismVolumeImplementation,
        'Show whole-number prism edges and complete unit-cube layers. Request an explanation and equations connecting the cube count to length times width times height and, equivalently, base area times height.'
    ),
    ...toImplementationTodos(
        '5.MD.C.5a-represent-triple-products',
        representTripleProductsBuilder,
        rectangularPrismVolumeImplementation,
        'Ask the learner to construct or annotate a prism model of a three-factor whole-number product. When associativity is requested, show equivalent parenthesizations through regrouped cube layers.'
    ),
    ...toImplementationTodos(
        '5.MD.C.5b-volume-formulas',
        rectangularPrismVolumeFormulasBuilder,
        rectangularPrismVolumeImplementation,
        'Calculate prism volume from either three supplied edge lengths or supplied base area and height, with formula substitution and cubic units. The contextual leaf must require understanding the story to obtain the relevant measurements.'
    ),
    ...toImplementationTodos(
        '5.MD.C.5c-volume-additivity',
        volumeAdditivityBuilder,
        compositePrismVolumeImplementation,
        'Explain why two nonoverlapping rectangular prisms exhaust the composite solid and why their volumes may be added. Shared boundary faces must not be treated as overlapping volume.'
    ),
    ...toImplementationTodos(
        '5.MD.C.5c-composite-volume',
        compositeVolumeBuilder,
        compositePrismVolumeImplementation,
        'Calculate the volumes of exactly two nonoverlapping rectangular-prism parts from their dimensions and add them. Geometric and necessary real-world story tasks use separate leaves with coherent equations and cubic units.'
    ),
    ...toImplementationTodos(
        '5.G.A.1-define-coordinate-system',
        defineCoordinateSystemBuilder,
        coordinateSystemFoundationsImplementation,
        'Complete or specify a two-dimensional coordinate system with perpendicular named axes, a common zero origin, coherent scales and the correspondence between axis and coordinate names.'
    ),
    ...toImplementationTodos(
        '5.G.A.2-graph-contextual-points',
        graphContextualPointsBuilder,
        contextualCoordinateGraphingImplementation,
        'Use necessary real-world or mathematical prose to supply paired quantities, then ask the learner to mark the corresponding first-quadrant points on named and scaled coordinate axes.'
    ),
    ...toImplementationTodos(
        '5.G.B.3-inherited-shape-attributes',
        inheritedShapeAttributesBuilder,
        shapeCategoryHierarchyImplementation,
        'Provide a plane-shape category inclusion and a defining property of the broader category. Ask the learner to infer and justify the inherited property of the narrower category.'
    ),
    ...toImplementationTodos(
        '5.G.B.4-classify-shape-hierarchy',
        classifyShapeHierarchyBuilder,
        shapeCategoryHierarchyImplementation,
        'Ask the learner to place plane figures or categories into a multilevel hierarchy using defining properties, preserving inclusions such as squares within both rectangles and rhombuses.'
    ),
    ...toImplementationTodos(
        '5.NF.A.2-benchmark-estimate',
        fractionBenchmarkEstimateBuilder,
        fractionBenchmarkArithmeticImplementation,
        'Ask for an approximate sum or difference without exact arithmetic; visible operand fractions, benchmark comparisons and worked bounds share one reference whole.'
    ),
    ...toImplementationTodos(
        '5.NF.A.2-benchmark-reasonableness',
        fractionBenchmarkReasonablenessBuilder,
        fractionBenchmarkArithmeticImplementation,
        'Present reasonable and unreasonable candidate fraction sums or differences and ask for a judgment justified by benchmark bounds relative to the same whole.'
    ),
    ...toImplementationTodos(
        '5.NF.B.3-interpret-quotient',
        fractionQuotientInterpretationBuilder,
        fractionQuotientMeaningImplementation,
        'Pair a fraction with equal sharing or an equivalent division equation and ask why dividing its numerator by its denominator gives its value.'
    ),
    ...toImplementationTodos(
        '5.NF.B.4a-partition-product',
        fractionPartitionProductBuilder,
        generalFractionProductsImplementation,
        'Show b equal parts of a whole or fractional quantity q and a selected parts; ask how the model represents (a/b) times q and the equivalent sequence a times q divided by b.'
    ),
    ...toImplementationTodos(
        '5.NF.B.4a-create-product-story',
        fractionProductStoryCreationBuilder,
        generalFractionProductsImplementation,
        'Provide a fraction-of-quantity equation or partition model and ask for a coherent written story preserving the numerator, denominator, equal parts and quantities, including fractional q.'
    ),
    ...toImplementationTodos(
        '5.NF.B.4b-tile-fractional-rectangle',
        fractionalRectangleTilingBuilder,
        fractionalRectangleAreaImplementation,
        'Show fractional side lengths and square tiles with explicit unit-fraction side lengths and areas; ask why the tiled area equals the product of the rectangle sides. Preserve the outer rectangle, including unequal sides, separately from its square tiles.'
    ),
    ...toImplementationTodos(
        '5.NF.B.4b-calculate-fractional-area',
        fractionalRectangleAreaBuilder,
        fractionalRectangleAreaImplementation,
        'Provide a rectangle with two fractional side measurements and require their product as its area, with consistent square units.'
    ),
    ...toImplementationTodos(
        '5.NF.B.4b-represent-fraction-product',
        fractionAreaProductRepresentationBuilder,
        fractionalRectangleAreaImplementation,
        'Give two fraction factors and ask the learner to construct or annotate a rectangle whose side lengths and area represent their product.'
    ),
    ...toImplementationTodos(
        '5.NF.B.5a-compare-product-factor',
        fractionProductFactorComparisonBuilder,
        fractionScalingReasoningImplementation,
        'Keep the product uncomputed and ask for its relation to a positive reference factor, using the other factor being above, below or equal to one; require an interpretation without evaluating the multiplication.'
    ),
    ...toImplementationTodos(
        '5.NF.B.5b-explain-fraction-scaling',
        fractionScalingExplanationBuilder,
        fractionScalingReasoningImplementation,
        'Ask for a written explanation of why a positive quantity grows under a fraction strictly greater than one or shrinks under a fraction less than one; include whole-number enlargement as a familiar comparison.'
    ),
    ...toImplementationTodos(
        '5.NF.B.5b-equivalence-unit-scaling',
        fractionEquivalenceUnitScalingBuilder,
        fractionEquivalenceUnitScalingImplementation,
        'Expose a/b times n/n = na/nb with n/n equal to one and ask why this unit scaling changes the fraction representation while preserving its quantity.'
    ),
    ...toImplementationTodos(
        '5.NF.B.6-fraction-product-problems',
        generalFractionProductProblemsBuilder,
        generalFractionProductsImplementation,
        'Use necessary story quantities, a matching equation or model and a calculated answer for multiplication of two fractions and mixed numbers under one reference whole; include the complete fraction product domain beyond iterated whole-number multiplication.'
    ),
];

export const ontologyTodos: OntologyTodo[] = [
    toOntologyTodo(
        '5.OA.A.2',
        'Write numerical expressions from described calculations',
        numericalExpressionOntology,
        'Express a described calculation as a numerical expression without a relation sign. Preserve the general expression-writing competency without requiring grouping symbols or a computed value.'
    ),
    toOntologyTodo(
        '5.OA.A.2',
        'Interpret numerical expression structure without evaluation',
        numericalExpressionOntology,
        'Interpret how the operations and grouping in a numerical expression relate quantities, including multiplicative comparisons, without calculating the indicated result or replacing the task with equation solving.'
    ),
    toOntologyTodo(
        '5.OA.B.3',
        'Generate aligned numerical patterns from paired rules',
        pairedPatternOntology,
        'Generate both numerical sequences from their respective given rules and starting conditions, retaining aligned corresponding terms. A single generated sequence does not express the complete paired-rule competency.'
    ),
    toOntologyTodo(
        '5.OA.B.3',
        'Form ordered pairs from corresponding pattern terms',
        orderedCoordinatePairOntology,
        'Form ordered coordinate pairs from corresponding terms of two numerical patterns while preserving which sequence supplies each component. Pair formation is distinct from plotting the resulting points.'
    ),
    toOntologyTodo(
        '5.NBT.A.2',
        'Explain zero patterns in products by powers of ten',
        powersOfTenOntology,
        'Explain why multiplication by powers of ten with nonnegative integer exponents produces the observed zero patterns. Connect the exponent, repeated factors of ten, and base-ten place values through visible equations and written reasoning.'
    ),
    toOntologyTodo(
        '5.NBT.A.2',
        'Explain decimal placement under powers-of-ten scaling',
        powersOfTenOntology,
        'Explain decimal-placement patterns when a decimal is multiplied or divided by a power of ten with a nonnegative integer exponent. Preserve both operation directions and connect before-and-after values to their changed place values.'
    ),
    toOntologyTodo(
        '5.NBT.A.2',
        'Denote powers of ten using whole-number exponents',
        powersOfTenOntology,
        'Represent a repeated product of tens or its equivalent value using exponent notation with base ten and a nonnegative integer exponent. The requested response must express the power, rather than only evaluate it.'
    ),
    toOntologyTodo(
        '5.NBT.A.3a',
        'Read base-ten decimal numerals through thousandths',
        decimalPrecisionOntology,
        'Read the meaning of base-ten decimal numerals through thousandths, including values whose interpretation requires the thousandths place. Preserve the full precision progression rather than using the current tenths-and-hundredths task family.'
    ),
    toOntologyTodo(
        '5.NBT.A.3a',
        'Write base-ten decimal numerals through thousandths',
        decimalPrecisionOntology,
        'Write a decimal numeral from a number name or place-value representation through thousandths, with values that require the deepest named place and a coherent correspondence between the representation and numeral.'
    ),
    toOntologyTodo(
        '5.NBT.A.3a',
        'Write decimal number names through thousandths',
        decimalPrecisionOntology,
        'Express decimals through thousandths in written number names that preserve the value and named fractional place. The task must elicit number-name output rather than numeral copying.'
    ),
    toOntologyTodo(
        '5.NBT.A.3a',
        'Write decimal expanded form through thousandths',
        decimalPrecisionOntology,
        'Express a decimal through thousandths as a coherent sum of digit-times-place contributions, including fractional place values, and relate the expanded expression to the original numeral.'
    ),
    toOntologyTodo(
        '5.NBT.A.3b',
        'Compare decimals through thousandths by place value',
        decimalPrecisionOntology,
        'Compare two decimals through thousandths using the meaning of each digit position, and record the result with greater-than, equal-to, or less-than symbols. Include deciding places through thousandths rather than duplicating the Grade 4 hundredths comparison domain.'
    ),
    toOntologyTodo(
        '5.NBT.B.7',
        'Add decimals with models, a written method, and reasoning',
        decimalPrecisionOntology,
        'Add decimals through hundredths using concrete-model drawings and place-value or operation relationships, relate the strategy to a written calculation, and explain why it works. The input/display precision bound must not silently constrain every intermediate value or result.'
    ),
    toOntologyTodo(
        '5.NBT.B.7',
        'Subtract decimals with models, a written method, and reasoning',
        decimalPrecisionOntology,
        'Subtract decimals through hundredths using concrete-model drawings and place-value or operation relationships, relate the strategy to a written calculation, and explain why it works. Keep the model, written method, and reasoning together as the complete subtraction competency.'
    ),
    toOntologyTodo(
        '5.NBT.B.7',
        'Multiply decimals with models, a written method, and reasoning',
        decimalPrecisionOntology,
        'Multiply decimals through hundredths using concrete-model drawings and place-value or operation relationships, relate the strategy to a written calculation, and explain why it works. Distinguish operand precision from the precision required by intermediate products and the result.'
    ),
    toOntologyTodo(
        '5.NBT.B.7',
        'Divide decimals with models, a written method, and reasoning',
        decimalPrecisionOntology,
        'Divide decimals through hundredths using concrete-model drawings and place-value or operation relationships, relate the strategy to a written calculation, and explain why it works. Do not replace the complete competency with the single decimal-divisor-shift strategy.'
    ),
    toOntologyTodo(
        '5.G.A.1',
        'Interpret ordered coordinate components and axis correspondence',
        orderedCoordinatePairOntology,
        'Interpret the first and second components of an ordered coordinate pair as travel from the origin along their corresponding named axes. Preserve the order and axis conventions independently of the separate point-marking action.'
    ),
    toOntologyTodo(
        '5.G.A.2',
        'Interpret coordinate values in their situation',
        orderedCoordinatePairOntology,
        'Explain what each coordinate component of a point means in the represented real-world or mathematical situation, including its associated quantity and unit. Contextual interpretation remains distinct from graphing the point.'
    ),
    toOntologyTodo(
        '5.NF.A.1',
        'Add and subtract unlike-denominator fractions using equivalence',
        unlikeDenominatorOntology,
        'Add and subtract fractions with unlike original denominators, including mixed numbers, by replacing them with equivalent fractions that have common denominators. Preserve both operations and do not require the chosen common denominator to be the least one.'
    ),
    toOntologyTodo(
        '5.NF.A.2',
        'Solve same-whole fraction addition and subtraction word problems',
        unlikeDenominatorOntology,
        'Solve addition and subtraction word problems whose fractions refer to the same whole, including unlike-denominator cases, using visual fraction models or equations. Keep the full solving competency together rather than activating only its same-denominator subset.'
    ),
    toOntologyTodo(
        '5.NF.B.3',
        'Solve whole-number division stories with fractional quotients',
        fractionDivisionRolesOntology,
        'Solve word problems with a whole-number dividend and nonzero whole-number divisor whose quotient is a fraction or mixed number. Use a model or equation that preserves the dividend, divisor, and quotient roles and interprets the resulting share in context.'
    ),
    toOntologyTodo(
        '5.NF.B.7a',
        'Interpret a unit fraction divided by a whole number',
        fractionDivisionRolesOntology,
        'Interpret division with a unit-fraction dividend and a nonzero whole-number divisor using a coherent fraction model or division relation. Preserve which operand is the fractional quantity being divided.'
    ),
    toOntologyTodo(
        '5.NF.B.7a',
        'Compute a unit fraction divided by a whole number',
        fractionDivisionRolesOntology,
        'Compute the quotient of a unit-fraction dividend divided by a nonzero whole-number divisor, retaining the directional operand roles and a model or equation that exposes the resulting fractional quantity.'
    ),
    toOntologyTodo(
        '5.NF.B.7a',
        'Create a story for unit-fraction-by-whole-number division',
        fractionDivisionRolesOntology,
        'Write a story context for a specified unit-fraction dividend divided by a nonzero whole-number divisor. The quantities, sharing action, and resulting share must agree with the given division expression.'
    ),
    toOntologyTodo(
        '5.NF.B.7a',
        'Explain unit-fraction division through inverse multiplication',
        fractionDivisionRolesOntology,
        'Explain why a unit-fraction dividend divided by a nonzero whole-number divisor gives the stated quotient by showing that the quotient multiplied by the divisor reconstructs the unit-fraction dividend.'
    ),
    toOntologyTodo(
        '5.NF.B.7b',
        'Interpret a whole number divided by a unit fraction',
        fractionDivisionRolesOntology,
        'Interpret division with a whole-number dividend and a unit-fraction divisor using a coherent fraction model or division relation. Preserve the unit fraction as the size of each group rather than the quantity being shared.'
    ),
    toOntologyTodo(
        '5.NF.B.7b',
        'Compute a whole number divided by a unit fraction',
        fractionDivisionRolesOntology,
        'Compute the quotient of a whole-number dividend divided by a unit-fraction divisor, retaining the directional operand roles and a model or equation that exposes how many unit-fraction groups fit.'
    ),
    toOntologyTodo(
        '5.NF.B.7b',
        'Create a story for whole-number-by-unit-fraction division',
        fractionDivisionRolesOntology,
        'Write a story context for a specified whole-number dividend divided by a unit-fraction divisor. The available amount, unit-fraction group size, and number of groups must agree with the given division expression.'
    ),
    toOntologyTodo(
        '5.NF.B.7b',
        'Explain whole-number-by-unit-fraction division through multiplication',
        fractionDivisionRolesOntology,
        'Explain why a whole-number dividend divided by a unit-fraction divisor gives the stated quotient by showing that the quotient multiplied by the unit-fraction divisor reconstructs the whole-number dividend.'
    ),
    toOntologyTodo(
        '5.NF.B.7c',
        'Solve real-world problems in both unit-fraction division orientations',
        fractionDivisionRolesOntology,
        'Solve real-world problems involving both a unit fraction divided by a nonzero whole number and a whole number divided by a unit fraction. Use visual fraction models or equations that preserve the quantities, operand roles, and meaning of each quotient.'
    ),
];

export const beyondScope: BeyondScopeEntry[] = [];

export const equivalentTargets: TargetEquivalence[] = [];
