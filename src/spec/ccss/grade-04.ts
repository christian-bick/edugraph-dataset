import DatasetPermutationBuilder, {
    defineImplementationPackage,
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
// Implementation packages
// ==========================================

const grade4FractionMultiplicationImplementation = defineImplementationPackage({
    id: 'grade4-fraction-multiplication',
    description: 'Interpret and solve whole-number-by-fraction multiplication with unit-fraction reasoning and visual models.',
    generators: [{ module: 'fraction-arithmetic', strategy: 'new' }],
    views: [
        { module: 'fractions-operation-model', strategy: 'new' },
        { module: 'fractions-word-problem', strategy: 'new' }
    ]
});

const tenthsHundredthsArithmeticImplementation = defineImplementationPackage({
    id: 'tenths-hundredths-arithmetic',
    description: 'Convert tenths to hundredths and add fractions expressed in tenths and hundredths.',
    generators: [
        { module: 'fraction-equivalence', strategy: 'expand' },
        { module: 'fraction-arithmetic', strategy: 'new' }
    ],
    views: [
        { module: 'fractions-equivalence-model', strategy: 'expand' },
        { module: 'fractions-operation-model', strategy: 'new' }
    ]
});

const decimalNotationGrade4Implementation = defineImplementationPackage({
    id: 'decimal-notation-grade4',
    description: 'Relate denominator-ten or denominator-hundred fractions to decimals, measurements, and number-line locations.',
    generators: [{ module: 'decimal-notation', strategy: 'new' }],
    views: [
        { module: 'numbers-decimal-notation', strategy: 'new' },
        { module: 'numbers-decimal-line', strategy: 'new' },
        { module: 'numbers-decimal-measurement', strategy: 'new' }
    ]
});

const decimalComparisonGrade4Implementation = defineImplementationPackage({
    id: 'decimal-comparison-grade4',
    description: 'Compare decimals to hundredths within the same whole and justify the comparison with visible place-value evidence.',
    generators: [{ module: 'decimal-comparison', strategy: 'new' }],
    views: [{ module: 'numbers-decimal-comparison', strategy: 'new' }]
});

// ==========================================
// Operations and Algebraic Thinking (4.OA)
// ==========================================

const multiplicativeComparisonEquationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Multiplication,
    Area.ProportionalScaling,
    Area.Equation,
    Scope.TwoOperands,
    Scope.ArabicNumerals,
    Ability.Interpretation
]);

const multiplicativeComparisonWordProblemBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.ProportionalScaling,
        Scope.SingleStep,
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.TextualReception
    ])
    .applyLabelVariants([[Area.Multiplication], [Area.Division]]);

const interpretedRemainderBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Division,
    Area.ImperfectDivisibility,
    Area.Modulo,
    Scope.MultiStep,
    Ability.TextualReception,
    Ability.ResultInterpretation
]);

const multistepLetterEquationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Equation,
        Scope.MultiStep,
        Scope.MultiLevelComposition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.NumbersSmaller1000000,
        Ability.TextualReception,
        Ability.Formalization
    ])
    .applyLabelVariants([
        [Area.Addition],
        [Area.Subtraction],
        [Area.Multiplication],
        [Area.Division],
        [Area.Addition, Area.Subtraction],
        [Area.Addition, Area.Multiplication],
        [Area.Addition, Area.Division],
        [Area.Subtraction, Area.Multiplication],
        [Area.Subtraction, Area.Division],
        [Area.Multiplication, Area.Division]
    ]);

const multistepReasonablenessBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Estimation,
        Area.IntegerRounding,
        Scope.MultiStep,
        Scope.NumbersSmaller1000000,
        Ability.TextualReception,
        Ability.ResultInterpretation,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction], [Area.Multiplication], [Area.Division]]);

const factorPairsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.FactorsAndMultiples,
    Area.Factorization,
    Scope.NumbersSmaller100,
    Ability.ProcedureExecution
]);

const oneDigitMultipleTestBuilder = new DatasetPermutationBuilder().addLabels([
    Area.FactorsAndMultiples,
    Area.PerfectDivisibility,
    Scope.NumbersSmaller100,
    Ability.ProcedureExecution
]);

const primeClassificationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PrimeNumbers,
    Area.Factorization,
    Scope.NumbersSmaller100,
    Ability.ConceptClassification
]);

const compositeClassificationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.CompositeNumbers,
    Area.Factorization,
    Scope.NumbersSmaller100,
    Ability.ConceptClassification
]);

const generateNumberPatternBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.PatternRecognition, Scope.ArabicNumerals, Scope.Base10, Ability.ProcedureExecution])
    .applyLabelVariants([[Area.Addition], [Area.Multiplication]]);

const identifyGeneratedNumberPatternFeatureBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PatternRecognition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.ProcedureExecution,
        Ability.ConceptClassification
    ])
    .applyLabelVariants([[Area.Addition], [Area.Multiplication]]);

const explainGeneratedNumberPatternFeatureBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.PatternRecognition,
        Scope.ArabicNumerals,
        Scope.Base10,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding,
        Ability.TextualArticulation
    ])
    .applyLabelVariants([
        [Area.Addition, Area.CommutativeLaw],
        [Area.Addition, Area.AssociativeLaw],
        [Area.Multiplication, Area.CommutativeLaw],
        [Area.Multiplication, Area.AssociativeLaw],
        [Area.Multiplication, Area.DistributiveLaw]
    ]);

const generateShapePatternBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PatternRecognition,
    Scope.VisualGeometry,
    Ability.VisualArticulation
]);

const identifyShapePatternFeatureBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PatternRecognition,
    Scope.VisualGeometry,
    Ability.ConceptClassification
]);

const explainShapePatternFeatureBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PatternRecognition,
    Scope.VisualGeometry,
    Ability.ProcedureUnderstanding,
    Ability.TextualArticulation
]);

// ==========================================
// Number and Operations in Base Ten (4.NBT)
// ==========================================

const adjacentPlaceScalingBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PlaceValue,
    Area.ProportionalScaling,
    Area.Multiplication,
    Area.Division,
    Scope.Base10,
    Scope.NumbersSmaller1000000,
    Ability.ConceptDerivation
]);

const readWriteBaseTenNumeralsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger1000,
        Scope.NumbersSmaller1000000
    ])
    .applyLabelVariants([[Ability.TextualReception], [Ability.VisualArticulation]]);

const writeNumberNamesBuilder = new DatasetPermutationBuilder().addLabels([
    Area.NumberNotation,
    Scope.Base10,
    Scope.NumbersLarger1000,
    Scope.NumbersSmaller1000000,
    Ability.TextualArticulation
]);

const writeExpandedFormBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PlaceValue,
    Area.Sum,
    Scope.ArabicNumerals,
    Scope.Base10,
    Scope.NumbersSmaller1000000,
    Ability.Formalization
]);

const compareMultiDigitNumbersBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger1000,
        Scope.NumbersSmaller1000000,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.NumericComparison, Scope.Greater], [Area.NumericComparison, Scope.Equal], [Area.NumericComparison, Scope.Less]]);

const grade4IntegerRoundingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.IntegerRounding,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller1000000,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([
        [Scope.StepsOf10],
        [Scope.StepsOf100],
        [Scope.StepsOf1000],
        [Scope.StepsOf10000],
        [Scope.StepsOf100000]
    ]);

const standardAlgorithmAddSubtractBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Scope.TwoOperands,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersLarger1000,
        Scope.NumbersSmaller1000000,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const grade4MultiDigitMultiplicationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Multiplication,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Scope.SingleDigitSmallestOperand, Scope.SingleDigitLargestOperand],
        [Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand],
        [Scope.SingleDigitSmallestOperand, Scope.ThreeDigitLargestOperand],
        [Scope.SingleDigitSmallestOperand, Scope.FourDigitLargestOperand],
        [Scope.TwoDigitSmallestOperand, Scope.TwoDigitLargestOperand]
    ]);

const grade4MultiDigitDivisionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.Division,
        Area.Modulo,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero,
        Scope.SingleDigitDivisor,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Scope.SingleDigitDividend],
        [Scope.TwoDigitDividend],
        [Scope.ThreeDigitDividend],
        [Scope.FourDigitDividend]
    ]);

// ==========================================
// Measurement and Data (4.MD)
// ==========================================

const measurementUnitPairs = [
    [Area.UnitMagnitudeScaling, Scope.LengthMeasurement, Scope.KilometerScale, Scope.MeterScale],
    [Area.UnitMagnitudeScaling, Scope.LengthMeasurement, Scope.MeterScale, Scope.CentimeterScale],
    [Area.UnitMagnitudeScaling, Scope.WeightMeasurement, Scope.KilogramScale, Scope.GramScale],
    [Area.UnitFactorScaling, Scope.WeightMeasurement, Scope.PoundScale, Scope.OunceScale],
    [Area.UnitMagnitudeScaling, Scope.VolumeMeasurement, Scope.LiquidVolumes, Scope.LiterScale, Scope.MilliliterScale],
    [Area.UnitFactorScaling, Scope.TimeMeasurement, Scope.HourIntervals, Scope.MinuteIntervals],
    [Area.UnitFactorScaling, Scope.TimeMeasurement, Scope.MinuteIntervals, Scope.SecondIntervals]
];

const relativeUnitSizesBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.MeasuringWithUnits, Area.UnitScaleRelation, Ability.ConceptDerivation])
    .applyLabelVariants(measurementUnitPairs);

const convertLargerToSmallerUnitsBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.MeasuringWithUnits, Ability.ProcedureExecution])
    .applyLabelVariants(measurementUnitPairs);

const twoColumnConversionTableBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.MeasuringWithUnits, Ability.Formalization])
    .applyLabelVariants(measurementUnitPairs);

const measurementKinds = [
    [Area.MeasuringWithUnits, Scope.LengthMeasurement],
    [Area.MeasuringWithUnits, Scope.TimeMeasurement],
    [Area.MeasuringWithUnits, Scope.VolumeMeasurement, Scope.LiquidVolumes],
    [Area.MeasuringWithUnits, Scope.WeightMeasurement],
    [Scope.Dollar]
];

const grade4MeasurementWordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([Scope.SingleStep, Scope.TwoOperands, Ability.TextualReception])
    .applyLabelVariants(measurementKinds)
    .applyLabelVariants([[Scope.IntegerNumbers], [Scope.FractionNumbers], [Scope.DecimalNumbers]])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction], [Area.Multiplication], [Area.Division]]);

const grade4MeasurementNumberLinesBuilder = new DatasetPermutationBuilder()
    .addLabels([Scope.Numberline, Ability.VisualArticulation])
    .applyLabelVariants(measurementKinds)
    .applyLabelVariants([[Scope.FractionNumbers], [Scope.DecimalNumbers]]);

const rectangleAreaFormulaBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AreaCalculation,
    Area.Equation,
    Area.Rectangle,
    Area.Multiplication,
    Scope.IntegerNumbers,
    Scope.TwoOperands,
    Ability.ProcedureExecution
]);

const rectanglePerimeterFormulaBuilder = new DatasetPermutationBuilder().addLabels([
    Area.PerimeterCalculation,
    Area.Equation,
    Area.Rectangle,
    Area.Addition,
    Scope.IntegerNumbers,
    Ability.ProcedureExecution
]);

const unknownRectangleDimensionBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.Equation, Area.Rectangle, Scope.IntegerNumbers, Ability.ProcedureInversion])
    .applyLabelVariants([
        [Area.AreaCalculation, Area.Multiplication, Scope.TwoOperands],
        [Area.PerimeterCalculation, Area.Addition]
    ]);

const constructFractionalLinePlotBuilder = new DatasetPermutationBuilder().addLabels([
    Area.Statistics,
    Area.MeasuringObjects,
    Scope.LengthMeasurement,
    Scope.FractionNumbers,
    Scope.LinePlot,
    Scope.SingleFrameOfReference,
    Ability.VisualArticulation
]);

const fractionLinePlotArithmeticBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionArithmetic,
        Area.Statistics,
        Area.MeasuringObjects,
        Scope.LengthMeasurement,
        Scope.FractionNumbers,
        Scope.LinePlot,
        Scope.SingleFrameOfReference,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const recognizeAngleArcBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AngleConcept,
    Area.RayConcept,
    Area.ArchConcept,
    Area.Circle,
    Area.FractionInterpretation,
    Scope.AngleMeasurement,
    Ability.Interpretation
]);

const deriveOneDegreeBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AngleConcept,
    Area.Circle,
    Area.FractionInterpretation,
    Scope.AngleMeasurement,
    Scope.DegreeScale,
    Scope.UnitFractions,
    Ability.ConceptDerivation
]);

const interpretDegreeIterationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AngleConcept,
    Area.AngleCalculation,
    Area.Iteration,
    Scope.AngleMeasurement,
    Scope.DegreeScale,
    Ability.Interpretation
]);

const measureAnglesBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AngleCalculation,
    Scope.DegreeScale,
    Scope.Protractor,
    Ability.ProcedureExecution
]);

const sketchAnglesBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AngleConcept,
    Scope.AngleMeasurement,
    Scope.DegreeScale,
    Ability.ConceptSpecification,
    Ability.VisualArticulation
]);

const additiveAngleMeasureBuilder = new DatasetPermutationBuilder().addLabels([
    Area.AdjacentAngles,
    Area.AngleCalculation,
    Area.Addition,
    Scope.AngleMeasurement,
    Scope.DegreeScale,
    Ability.ProcedureUnderstanding
]);

const unknownAnglesBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.AdjacentAngles,
        Area.AngleCalculation,
        Scope.AngleMeasurement,
        Scope.DegreeScale,
    ])
    .applyLabelVariants([
        [Area.Addition, Ability.ProcedureExecution],
        [Area.Subtraction, Ability.ProcedureInversion]
    ]);

// ==========================================
// Geometry (4.G)
// ==========================================

const geometricPrimitiveVariants = [
    [Area.PointConcept],
    [Area.LineConcept],
    [Area.LineSegment],
    [Area.RayConcept],
    [Area.RightAngle],
    [Area.AcuteAngle],
    [Area.ObtuseAngle],
    [Area.PerpendicularityRelation],
    [Area.ParallelismRelation]
];

const geometricPrimitiveDrawingVariants = [
    [Area.PointConcept],
    [Area.LinearDrawing, Area.LineConcept],
    [Area.LinearDrawing, Area.LineSegment],
    [Area.LinearDrawing, Area.RayConcept],
    [Area.LinearDrawing, Area.RightAngle],
    [Area.LinearDrawing, Area.AcuteAngle],
    [Area.LinearDrawing, Area.ObtuseAngle],
    [Area.LinearDrawing, Area.PerpendicularityRelation],
    [Area.LinearDrawing, Area.ParallelismRelation]
];

const drawGeometricPrimitivesBuilder = new DatasetPermutationBuilder()
    .addLabels([Ability.VisualArticulation])
    .applyLabelVariants(geometricPrimitiveDrawingVariants);

const identifyGeometricPrimitivesBuilder = new DatasetPermutationBuilder()
    .addLabels([Ability.VisualRecognition])
    .applyLabelVariants(geometricPrimitiveVariants);

const classifyByLineRelationsBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.ShapeClassification, Scope.ShapeAttributes, Ability.ConceptClassification])
    .applyLabelVariants([[Area.ParallelismRelation], [Area.PerpendicularityRelation]]);

const classifyByAngleSizeBuilder = new DatasetPermutationBuilder()
    .addLabels([Area.ShapeClassification, Scope.ShapeAttributes, Ability.ConceptClassification])
    .applyLabelVariants([[Area.RightAngle], [Area.AcuteAngle], [Area.ObtuseAngle]]);

const recognizeRightTrianglesBuilder = new DatasetPermutationBuilder().addLabels([
    Area.ShapeSubsumption,
    Area.RightTriangle,
    Area.RightAngle,
    Scope.ShapeAttributes,
    Ability.ConceptClassification,
    Ability.VisualRecognition
]);

const identifyLineSymmetryBuilder = new DatasetPermutationBuilder().addLabels([
    Area.ShapeReflection,
    Scope.Foldable,
    Ability.ConceptClassification,
    Ability.VisualRecognition
]);

const drawLineSymmetryBuilder = new DatasetPermutationBuilder().addLabels([
    Area.ShapeReflection,
    Scope.Foldable,
    Ability.VisualArticulation
]);

// ==========================================
// Number and Operations—Fractions (4.NF)
// ==========================================

const equivalentFractionScalingBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionEquivalence,
        Area.FractionNotation,
        Area.Multiplication,
        Scope.EqualShares,
        Scope.Equal,
        Scope.SingleFrameOfReference,
        Ability.ProcedureUnderstanding,
        Ability.Formalization
    ])
    .applyLabelVariants([[Scope.VisualNumbers], [Scope.Numberline]]);

const unlikeFractionComparisonBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionNotation,
        Scope.FractionNumbers,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([
        [Area.NumericInequality, Scope.Greater],
        [Area.NumericEquality, Scope.Equal],
        [Area.NumericInequality, Scope.Less]
    ]);

const interpretFractionAdditionSubtractionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionArithmetic,
        Area.FractionNotation,
        Scope.FractionNumbers,
        Scope.CommonDenominator,
        Scope.SingleFrameOfReference,
        Ability.Interpretation
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const decomposeFractionsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionArithmetic,
        Area.FractionNotation,
        Area.Addition,
        Area.Equation,
        Scope.CommonDenominator,
        Scope.SingleFrameOfReference,
        Ability.ProcedureUnderstanding,
        Ability.Formalization
    ])
    .applyLabelVariants([[Scope.ProperFractions], [Scope.ImproperFractions, Scope.MixedNumbers]]);

const mixedNumberArithmeticBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionArithmetic,
        Area.FractionNotation,
        Scope.MixedNumbers,
        Scope.CommonDenominator,
        Scope.SingleFrameOfReference,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const fractionArithmeticWordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionArithmetic,
        Area.FractionNotation,
        Area.Equation,
        Scope.FractionNumbers,
        Scope.CommonDenominator,
        Scope.SingleFrameOfReference,
        Ability.TextualReception,
        Ability.ProcedureExecution
    ])
    .applyLabelVariants([[Area.Addition], [Area.Subtraction]]);

const unitFractionMultipleBuilder = new DatasetPermutationBuilder().addLabels([
    Area.FractionArithmetic,
    Area.FractionNotation,
    Area.Multiplication,
    Area.IteratedOperation,
    Scope.UnitFractions,
    Ability.Interpretation
]);

const wholeNumberFractionMultiplicationBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionArithmetic,
        Area.FractionNotation,
        Area.Multiplication,
        Ability.ProcedureUnderstanding
    ])
    .applyLabelVariants([[Scope.ProperFractions], [Scope.ImproperFractions]]);

const fractionMultiplicationWordProblemsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.FractionArithmetic,
        Area.FractionNotation,
        Area.Multiplication,
        Ability.ProcedureUnderstanding,
        Ability.TextualReception
    ])
    .applyLabelVariants([[Scope.ProperFractions], [Scope.ImproperFractions]]);

const tenthsToHundredthsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.FractionEquivalence,
    Area.DecimalEquivalence,
    Area.FractionNotation,
    Ability.Formalization
]);

const addTenthsHundredthsBuilder = new DatasetPermutationBuilder().addLabels([
    Area.FractionArithmetic,
    Area.Addition,
    Area.FractionNotation,
    Ability.ProcedureExecution
]);

const fractionDecimalConversionBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.DecimalNotation,
        Area.DecimalEquivalence,
        Area.FractionNotation,
        Scope.DecimalNumbers
    ])
    .applyLabelVariants([[Ability.Formalization], [Ability.Interpretation]]);

const decimalNumberLineBuilder = new DatasetPermutationBuilder().addLabels([
    Area.NumerationWithDecimals,
    Area.DecimalNotation,
    Scope.DecimalNumbers,
    Scope.Numberline,
    Ability.VisualArticulation
]);

const decimalMeasurementNotationBuilder = new DatasetPermutationBuilder().addLabels([
    Area.DecimalNotation,
    Area.DecimalEquivalence,
    Area.MeasuringWithUnits,
    Scope.DecimalNumbers,
    Ability.Formalization
]);

const compareDecimalsBuilder = new DatasetPermutationBuilder()
    .addLabels([
        Area.NumericComparison,
        Area.NumerationWithDecimals,
        Area.DecimalNotation,
        Area.DecimalPrecission,
        Scope.DecimalNumbers,
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers,
        Ability.ConceptDerivation
    ])
    .applyLabelVariants([[Scope.Greater], [Scope.Equal], [Scope.Less]]);

export const spec: CompetencyTarget[] = [
    ...toTargets('4.OA.A.1-multiplicative-comparison-equation', multiplicativeComparisonEquationBuilder),
    ...toTargets('4.OA.A.2-multiplicative-comparison-word-problems', multiplicativeComparisonWordProblemBuilder),
    ...toTargets('4.OA.A.3-interpret-remainders', interpretedRemainderBuilder),
    ...toTargets('4.OA.A.3-multistep-letter-equations', multistepLetterEquationBuilder),
    ...toTargets('4.OA.A.3-answer-reasonableness', multistepReasonablenessBuilder),
    ...toTargets('4.OA.B.4-factor-pairs', factorPairsBuilder),
    ...toTargets('4.OA.B.4-multiple-test', oneDigitMultipleTestBuilder),
    ...toTargets('4.OA.B.4-prime-classification', primeClassificationBuilder),
    ...toTargets('4.OA.B.4-composite-classification', compositeClassificationBuilder),
    ...toTargets('4.OA.C.5-generate-number-pattern', generateNumberPatternBuilder),
    ...toTargets('4.OA.C.5-identify-number-pattern-feature', identifyGeneratedNumberPatternFeatureBuilder),
    ...toTargets('4.OA.C.5-explain-number-pattern-feature', explainGeneratedNumberPatternFeatureBuilder),
    ...toTargets('4.OA.C.5-generate-shape-pattern', generateShapePatternBuilder),
    ...toTargets('4.OA.C.5-identify-shape-pattern-feature', identifyShapePatternFeatureBuilder),
    ...toTargets('4.OA.C.5-explain-shape-pattern-feature', explainShapePatternFeatureBuilder),
    ...toTargets('4.NBT.A.1-adjacent-place-scaling', adjacentPlaceScalingBuilder),
    ...toTargets('4.NBT.A.2-read-write-base-ten-numerals', readWriteBaseTenNumeralsBuilder),
    ...toTargets('4.NBT.A.2-write-number-names', writeNumberNamesBuilder),
    ...toTargets('4.NBT.A.2-expanded-form', writeExpandedFormBuilder),
    ...toTargets('4.NBT.A.2-compare-multi-digit-numbers', compareMultiDigitNumbersBuilder),
    ...toTargets('4.NBT.A.3-round-to-any-place', grade4IntegerRoundingBuilder),
    ...toTargets('4.NBT.B.4-standard-algorithm-add-subtract', standardAlgorithmAddSubtractBuilder),
    ...toTargets('4.NBT.B.5-multi-digit-multiplication', grade4MultiDigitMultiplicationBuilder),
    ...toTargets('4.NBT.B.6-multi-digit-division', grade4MultiDigitDivisionBuilder),
    ...toTargets('4.MD.A.1-relative-unit-sizes', relativeUnitSizesBuilder),
    ...toTargets('4.MD.A.1-convert-larger-to-smaller', convertLargerToSmallerUnitsBuilder),
    ...toTargets('4.MD.A.1-two-column-tables', twoColumnConversionTableBuilder),
    ...toTargets('4.MD.A.2-measurement-word-problems', grade4MeasurementWordProblemsBuilder),
    ...toTargets('4.MD.A.2-measurement-number-lines', grade4MeasurementNumberLinesBuilder),
    ...toTargets('4.MD.A.3-rectangle-area-formula', rectangleAreaFormulaBuilder),
    ...toTargets('4.MD.A.3-rectangle-perimeter-formula', rectanglePerimeterFormulaBuilder),
    ...toTargets('4.MD.A.3-unknown-rectangle-dimension', unknownRectangleDimensionBuilder),
    ...toTargets('4.MD.B.4-construct-fractional-line-plot', constructFractionalLinePlotBuilder),
    ...toTargets('4.MD.B.4-line-plot-fraction-arithmetic', fractionLinePlotArithmeticBuilder),
    ...toTargets('4.MD.C.5a-angle-from-arc', recognizeAngleArcBuilder),
    ...toTargets('4.MD.C.5a-one-degree-turn', deriveOneDegreeBuilder),
    ...toTargets('4.MD.C.5b-iterate-degrees', interpretDegreeIterationBuilder),
    ...toTargets('4.MD.C.6-measure-angles', measureAnglesBuilder),
    ...toTargets('4.MD.C.6-sketch-angles', sketchAnglesBuilder),
    ...toTargets('4.MD.C.7-additive-angle-measure', additiveAngleMeasureBuilder),
    ...toTargets('4.MD.C.7-unknown-angles', unknownAnglesBuilder),
    ...toTargets('4.G.A.1-draw-geometric-primitives', drawGeometricPrimitivesBuilder),
    ...toTargets('4.G.A.1-identify-geometric-primitives', identifyGeometricPrimitivesBuilder),
    ...toTargets('4.G.A.2-classify-line-relations', classifyByLineRelationsBuilder),
    ...toTargets('4.G.A.2-classify-angle-size', classifyByAngleSizeBuilder),
    ...toTargets('4.G.A.2-right-triangle-category', recognizeRightTrianglesBuilder),
    ...toTargets('4.G.A.3-identify-line-symmetry', identifyLineSymmetryBuilder),
    ...toTargets('4.G.A.3-draw-line-symmetry', drawLineSymmetryBuilder),
    ...toTargets('4.NF.A.1-equivalent-fraction-scaling', equivalentFractionScalingBuilder),
    ...toTargets('4.NF.A.2-unlike-fraction-comparison', unlikeFractionComparisonBuilder),
    ...toTargets('4.NF.B.3a-interpret-fraction-arithmetic', interpretFractionAdditionSubtractionBuilder),
    ...toTargets('4.NF.B.3b-decompose-fractions', decomposeFractionsBuilder),
    ...toTargets('4.NF.B.3c-mixed-number-arithmetic', mixedNumberArithmeticBuilder),
    ...toTargets('4.NF.B.3d-fraction-word-problems', fractionArithmeticWordProblemsBuilder)
];

export const implementationTodos: ImplementationTodo[] = [
    ...toImplementationTodos('4.NF.B.4a-unit-fraction-multiples', unitFractionMultipleBuilder, grade4FractionMultiplicationImplementation, 'Show a equal unit fractions, a × (1/b), and a/b as the same value.'),
    ...toImplementationTodos('4.NF.B.4b-whole-number-fraction-products', wholeNumberFractionMultiplicationBuilder, grade4FractionMultiplicationImplementation, 'Show the whole-number factor, repeated fractional groups, unit-fraction rewrite, product, and result.'),
    ...toImplementationTodos('4.NF.B.4c-fraction-multiplication-word-problems', fractionMultiplicationWordProblemsBuilder, grade4FractionMultiplicationImplementation, 'Keep story groups, visual model, equation, bounds where relevant, and answer consistent.'),
    ...toImplementationTodos('4.NF.C.5-tenths-to-hundredths', tenthsToHundredthsBuilder, tenthsHundredthsArithmeticImplementation, 'Show denominator-ten and denominator-hundred fractions, common scaling, equality, and model or place-value evidence.'),
    ...toImplementationTodos('4.NF.C.5-add-tenths-hundredths', addTenthsHundredthsBuilder, tenthsHundredthsArithmeticImplementation, 'Show the conversion to a common denominator, addition equation, and result.'),
    ...toImplementationTodos('4.NF.C.6-fraction-decimal-conversion', fractionDecimalConversionBuilder, decimalNotationGrade4Implementation, 'Show the fraction, decimal, place-value evidence, equality, and prompted conversion direction.'),
    ...toImplementationTodos('4.NF.C.6-decimal-number-line', decimalNumberLineBuilder, decimalNotationGrade4Implementation, 'Show tenths or hundredths tick spacing, the decimal label, and plotted location.'),
    ...toImplementationTodos('4.NF.C.6-decimal-measurement-notation', decimalMeasurementNotationBuilder, decimalNotationGrade4Implementation, 'Show equivalent fractional and decimal measures with a concrete unit.'),
    ...toImplementationTodos('4.NF.C.7-compare-decimals', compareDecimalsBuilder, decimalComparisonGrade4Implementation, 'Show same-whole decimal models or place values, hundredths precision, the comparison symbol, and justification.')
];

export const ontologyTodos: OntologyTodo[] = [];

export const beyondScope: BeyondScopeEntry[] = [];

export const equivalentTargets: TargetEquivalence[] = [];
