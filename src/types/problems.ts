export type ArithmeticOperation = 'addition' | 'subtraction' | 'multiplication' | 'division';

type ArithmeticProblemBase = {
    operation: ArithmeticOperation;
    answer: number;
};

export type ArithmeticPairProblem = ArithmeticProblemBase & {
    num1: number;
    num2: number;
    num3?: undefined;
    propertyLaw?: undefined;
    blankPart: 'num1' | 'num2' | 'solution';
};

export type ArithmeticTripleProblem = ArithmeticProblemBase & {
    num1: number;
    num2: number;
    num3: number;
    propertyLaw?: 'commutative' | 'associative' | 'distributive';
    combinedFactor?: number;
    partialProducts?: [number, number];
    blankPart?: undefined;
};

export type ArithmeticFourProblem = ArithmeticProblemBase & {
    num1: number;
    num2: number;
    num3: number;
    num4: number;
    propertyLaw?: undefined;
    blankPart?: undefined;
};

/** Shared payload accepted by arithmetic views that render both pairs and triples. */
export type ArithmeticProblem = ArithmeticPairProblem | ArithmeticTripleProblem | ArithmeticFourProblem;

export type MultiplicativeComparisonProblem = {
    referenceQuantity: number;
    scaleFactor: number;
    comparedQuantity: number;
    operation: 'multiplication' | 'division';
    unknownRole: 'reference' | 'scale-factor' | 'compared';
    answer: number;
    referenceEntity: string;
    comparedEntity: string;
    story: string;
    question: string;
    givenEquation: string;
    solutionEquation: string;
    comparisonStatement: string;
};

export type MultiplicationPlaceValuePart = {
    digit: number;
    placeValue: 1 | 10 | 100 | 1000;
    placeName: 'ones' | 'tens' | 'hundreds' | 'thousands';
    value: number;
};

export type MultiplicationOperandDecomposition = {
    operand: number;
    parts: readonly MultiplicationPlaceValuePart[];
    expandedExpression: string;
    equation: string;
};

export type MultiplicationPartialProduct = {
    largestPart: MultiplicationPlaceValuePart;
    smallestPart: MultiplicationPlaceValuePart;
    product: number;
    questionEquation: string;
    solutionEquation: string;
};

export type MultiDigitMultiplicationProblem = {
    task: 'multi-digit-multiplication';
    largestOperand: number;
    smallestOperand: number;
    largestOperandDigits: 1 | 2 | 3 | 4;
    smallestOperandDigits: 1 | 2;
    largestDecomposition: MultiplicationOperandDecomposition;
    smallestDecomposition: MultiplicationOperandDecomposition;
    partialProducts: readonly MultiplicationPartialProduct[];
    product: number;
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    partialProductsSumEquation: string;
    explanation: string;
};

export type DivisionPlaceValuePart = {
    digit: number;
    placeValue: 1 | 10 | 100 | 1000;
    placeName: 'ones' | 'tens' | 'hundreds' | 'thousands';
    value: number;
};

export type DivisionOperandDecomposition = {
    operand: number;
    parts: readonly DivisionPlaceValuePart[];
    expandedExpression: string;
    equation: string;
};

export type DivisionPartialQuotientStep = {
    quotientDigit: number;
    placeValue: 1 | 10 | 100 | 1000;
    placeName: 'ones' | 'tens' | 'hundreds' | 'thousands';
    partialQuotient: number;
    remainingBefore: number;
    partialProduct: number;
    remainingAfter: number;
    questionMultiplicationEquation: string;
    solutionMultiplicationEquation: string;
    questionSubtractionEquation: string;
    solutionSubtractionEquation: string;
};

export type MultiDigitDivisionProblem = {
    task: 'multi-digit-division';
    dividend: number;
    divisor: number;
    quotient: number;
    remainder: number;
    dividendDigits: 1 | 2 | 3 | 4;
    divisorDigits: 1;
    dividendDecomposition: DivisionOperandDecomposition;
    divisorDecomposition: DivisionOperandDecomposition;
    partialQuotients: readonly DivisionPartialQuotientStep[];
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    partialQuotientsSumEquation: string;
    multiplicationCheckEquation: string;
    remainderStatement: string;
    explanation: string;
};

export type PositiveFactorPair = {
    lowerFactor: number;
    upperFactor: number;
    equation: string;
};

export type PositiveFactorEvidence = {
    number: number;
    /** Complete ascending list of the number's positive factors. */
    factors: readonly number[];
    factorCount: number;
    /** Unique factor pairs, ordered from the smallest lower factor upward. */
    factorPairs: readonly PositiveFactorPair[];
};

export type FactorPairsProblem = PositiveFactorEvidence & {
    kind: 'factor-pairs';
    prompt: string;
    conclusion: string;
};

export type OneDigitMultipleTestProblem = {
    kind: 'one-digit-multiple-test';
    candidate: number;
    divisor: number;
    quotient: number;
    remainder: 0;
    isMultiple: true;
    prompt: string;
    multiplicationEquation: string;
    divisionEquation: string;
    conclusion: string;
};

export type PrimeClassificationProblem = PositiveFactorEvidence & {
    kind: 'prime-classification';
    classification: 'prime';
    prompt: string;
    explanation: string;
    conclusion: string;
};

export type CompositeClassificationProblem = PositiveFactorEvidence & {
    kind: 'composite-classification';
    classification: 'composite';
    prompt: string;
    explanation: string;
    conclusion: string;
};

export type FactorClassificationProblem =
    | PrimeClassificationProblem
    | CompositeClassificationProblem;

export type FactorMultipleRelationsProblem =
    | FactorPairsProblem
    | OneDigitMultipleTestProblem
    | FactorClassificationProblem;

export type ArithmeticWordProblemTwoStep = {
    kind: 'two-step';
    num1: number;
    num2: number;
    num3: number;
    operations: readonly [ArithmeticOperation, ArithmeticOperation];
    intermediate: number;
    answer: number;
    blankPart: 'solution';
};

export type RemainderInterpretation = 'use-quotient' | 'round-up' | 'use-remainder';

export type ArithmeticWordProblemInterpretedRemainder = {
    kind: 'interpreted-remainder';
    dividend: number;
    divisor: number;
    quotient: number;
    remainder: number;
    interpretation: RemainderInterpretation;
    answer: number;
    story: string;
    question: string;
    divisionEquation: string;
    contextDecision: string;
    interpretationExplanation: string;
    answerStatement: string;
};

export type ArithmeticWordProblemLetterEquation = {
    kind: 'letter-equation';
    operands: readonly [number, number, number];
    operations: readonly [ArithmeticOperation, ArithmeticOperation];
    intermediate: number;
    answer: number;
    unknownSymbol: 'n';
    story: string;
    question: string;
    stepEquations: readonly [string, string];
    combinedEquation: string;
    solutionEquation: string;
    answerStatement: string;
};

export type ArithmeticWordProblemReasonableness = {
    kind: 'reasonableness';
    operands: readonly [number, number, number];
    operations: readonly [ArithmeticOperation, ArithmeticOperation];
    intermediate: number;
    exactAnswer: number;
    proposedAnswer: number;
    roundingPlace: 10;
    roundedExactAnswer: number;
    roundedProposedAnswer: number;
    isReasonable: boolean;
    story: string;
    question: string;
    exactEquations: readonly [string, string];
    roundingCheck: string;
    reasonablenessExplanation: string;
    answerStatement: string;
};

export type ArithmeticWordProblemGrade4 =
    | ArithmeticWordProblemInterpretedRemainder
    | ArithmeticWordProblemLetterEquation
    | ArithmeticWordProblemReasonableness;

/** Generator contract shared by legacy and Grade 4 multi-step word problems. */
export type ArithmeticWordProblemMultistep = ArithmeticWordProblemTwoStep | ArithmeticWordProblemGrade4;

/** Shared payload accepted by the reusable one-step and multi-step word-problem view. */
export type ArithmeticWordProblemWithin100 = ArithmeticPairProblem | ArithmeticWordProblemMultistep;

export type ArithmeticDecomposeProblem = {
    targetNumber: number;
    pair1: [number, number];
    pair2: [number, number];
};

export type EquationJudgmentProblem = {
    num1: number;
    num2: number;
    operation: 'addition' | 'subtraction';
    claimedAnswer: number;
    isTrue: boolean;
};

export type ArithmeticEstimationProblem = {
    num1: number;
    num2: number;
    operation: ArithmeticOperation;
    roundedNum1: number;
    roundedNum2: number;
    roundingPlace: 10;
    exactAnswer: number;
    estimatedAnswer: number;
    proposedAnswer: number;
    estimateDifference: number;
    tolerance: number;
    isReasonable: boolean;
};

export type ArithmeticPatternProperty = 'commutative' | 'associative' | 'distributive';

export type ArithmeticPatternTableBase = {
    operation: 'addition' | 'multiplication';
    headers: number[];
    table: number[][];
    focusRow: number;
    sequence: number[];
    patternStep: number;
    patternOptions: string[];
    patternAnswer: string;
    propertyLaw?: ArithmeticPatternProperty;
    leftExpression?: string;
    rightExpression?: string;
    propertyResult?: number;
    explanation?: string;
    highlightedCells?: Array<[number, number]>;
};

export type ArithmeticPatternRuleOperation = 'add' | 'multiply' | 'multiply-position';

export type ArithmeticPatternLegacyProblem = ArithmeticPatternTableBase & {
    /** Absent on retained lower-grade/legacy table payloads. */
    task?: undefined;
};

type ArithmeticPatternGrade4Base = ArithmeticPatternTableBase & {
    startValue: number;
    ruleOperation: ArithmeticPatternRuleOperation;
    ruleValue: number;
    ruleText: string;
    terms: readonly number[];
    prompt: string;
};

export type ArithmeticPatternGenerateProblem = ArithmeticPatternGrade4Base & {
    task: 'generate';
    missingTermIndex: number;
    response: number;
};

export type ArithmeticPatternIdentifyFeatureProblem = ArithmeticPatternGrade4Base & {
    task: 'identify-feature';
    featureOptions: readonly string[];
    inferredFeature: string;
    featureEvidence: string;
    response: string;
};

export type ArithmeticPatternExplainFeatureProblem = ArithmeticPatternGrade4Base & {
    task: 'explain-feature';
    inferredFeature: string;
    featureEvidence: string;
    response: string;
    propertyLaw: ArithmeticPatternProperty;
    leftExpression: string;
    rightExpression: string;
    propertyResult: number;
    explanation: string;
    highlightedCells: Array<[number, number]>;
};

export type ArithmeticPatternProblem =
    | ArithmeticPatternLegacyProblem
    | ArithmeticPatternGenerateProblem
    | ArithmeticPatternIdentifyFeatureProblem
    | ArithmeticPatternExplainFeatureProblem;

export type LegacyIntegerRoundingProblem = {
    number: number;
    roundingPlace: 10 | 100;
    lowerMultiple: number;
    midpoint: number;
    upperMultiple: number;
    roundedValue: number;
    direction: 'down' | 'up';
    distanceLower: number;
    distanceUpper: number;
    isMidpointTie: boolean;
};

export type MultiDigitIntegerRoundingProblem = {
    task: 'multi-digit-integer-rounding';
    number: number;
    roundingPlace: 10 | 100 | 1000 | 10000 | 100000;
    roundingPlaceName: 'ten' | 'hundred' | 'thousand' | 'ten-thousand' | 'hundred-thousand';
    lowerMultiple: number;
    midpoint: number;
    upperMultiple: number;
    roundedValue: number;
    direction: 'down' | 'up';
    distanceLower: number;
    distanceUpper: number;
    isMidpointTie: boolean;
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    roundingStatement: string;
    decisionExplanation: string;
};

export type IntegerRoundingProblem =
    | LegacyIntegerRoundingProblem
    | MultiDigitIntegerRoundingProblem;

export type EqualGroupsOperation =
    | 'addition'
    | 'multiplication'
    | 'partitive-division'
    | 'quotative-division';

export type EqualGroupsProblem = {
    operation: EqualGroupsOperation;
    groupCount: number;
    groupSize: number;
    total: number;
    answer: number;
};

export type NumberArrayProblem = EqualGroupsProblem & {
    rows: number;
    columns: number;
    addends: number[];
};

export type EqualGroupsCollectionProblem = EqualGroupsProblem;

export type PlaceValueTeenProblem = {
    ones: number;
    target: number;
};

export type PlaceValueBundlesProblem = {
    tens: number;
    ones: 0;
    target: number;
    hundreds?: number;
};

export type PlaceValueMakeTenProblem = {
    givenNumber: number;
    missingNumber: number;
    target: 10;
};

export type WholeNumberPlaceName =
    | 'ones'
    | 'tens'
    | 'hundreds'
    | 'thousands'
    | 'ten-thousands'
    | 'hundred-thousands'
    | 'millions';

export type WholeNumberPlaceValue = {
    name: WholeNumberPlaceName;
    exponent: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    digit: number;
    value: number;
};

export type LegacyPlaceValueExpandedProblem = {
    number: number;
    terms: number[];
};

export type MultiDigitPlaceValueExpandedProblem = {
    task: 'multi-digit-expanded-form';
    number: number;
    terms: number[];
    placeValues: WholeNumberPlaceValue[];
    prompt: string;
    expandedEquation: string;
};

export type PlaceValueExpandedProblem =
    | LegacyPlaceValueExpandedProblem
    | MultiDigitPlaceValueExpandedProblem;

export type PlaceValueDigits = {hundreds: number; tens: number; ones: number};

export type PlaceValueArithmeticProblem = {
    num1: number;
    num2: number;
    answer: number;
    operation: 'addition' | 'subtraction';
    operands: [PlaceValueDigits, PlaceValueDigits];
    result: PlaceValueDigits;
    regrouping: string;
    equation: string;
    strategySteps: string[];
};

export type PlaceValueName =
    | 'ones'
    | 'tens'
    | 'hundreds'
    | 'thousands'
    | 'ten-thousands'
    | 'hundred-thousands';

export type PlaceValueScalingPlace = {
    name: PlaceValueName;
    exponent: 0 | 1 | 2 | 3 | 4 | 5;
    /** Zero-based index in the left-to-right `digits` array. */
    digitIndex: number;
    value: number;
};

export type PlaceValueScalingProblem = {
    task: 'adjacent-place-scaling';
    number: number;
    /** Six base-ten digits ordered from hundred-thousands through ones. */
    digits: readonly [number, number, number, number, number, number];
    repeatedDigit: number;
    leftPlace: PlaceValueScalingPlace;
    rightPlace: PlaceValueScalingPlace;
    scaleFactor: 10;
    prompt: string;
    questionMultiplicationEquation: string;
    questionDivisionEquation: string;
    multiplicationEquation: string;
    divisionEquation: string;
    comparisonStatement: string;
    /** The value represented by the repeated digit in `leftPlace`. */
    answer: number;
};

export type CountingProblem = {
    numObjects: number;
    simpleAnswer: number;
    parity?: 'even' | 'odd';
};

export type CountingIncDecProblem = {
    numObjects: number;
    incDecType: 'inc' | 'dec';
    incDecAnswer: number;
    simpleAnswer: number;
    stepSize: 1 | 10 | 100;
    startPlaceValue: {hundreds?: number; tens: number; ones: number};
    resultPlaceValue: {hundreds?: number; tens: number; ones: number};
};

export type CountingSequenceProblem = {
    sequence: number[];
    missingIndex: number;
    answer: number;
    stepSize: 1 | 5 | 10 | 100;
};



export type CountingClassifyCountProblem = {
    items: string[];
    categories: Record<string, number>;
    numObjects: number;
};

export type CountingClassifySortProblem = {
    items: string[];
    categories: Record<string, number>;
    numObjects: number;
    relation: 'most' | 'least';
    answer: string;
};

export type MeasurementStandardProblem = {
    bandLength: number;
    problemLength: number;
    useDecimals?: boolean;
    tool?: 'ruler' | 'tape';
};

export type MeasurementEstimateProblem = {
    referenceSize: 'small' | 'large';
    estimateVariant: 0 | 1 | 2;
    referenceVariant: 0 | 1 | 2 | 3;
};

export type MeasurementToolSelectionProblem = {
    object: 'pencil' | 'book' | 'table' | 'door';
    correctTool: 'ruler' | 'tape';
    tools: ['ruler', 'tape'];
};

export type MeasurementUnitScaleProblem = {
    largeUnitCount: number;
    smallUnitCount: number;
    unitsPerLarge: number;
};

export type MeasurementConversionPairId =
    | 'kilometer-meter'
    | 'meter-centimeter'
    | 'kilogram-gram'
    | 'pound-ounce'
    | 'liter-milliliter'
    | 'hour-minute'
    | 'minute-second';

export type MeasurementConversionUnitId =
    | 'kilometer'
    | 'meter'
    | 'centimeter'
    | 'kilogram'
    | 'gram'
    | 'pound'
    | 'ounce'
    | 'liter'
    | 'milliliter'
    | 'hour'
    | 'minute'
    | 'second';

export type MeasurementConversionUnit = {
    id: MeasurementConversionUnitId;
    singular: string;
    plural: string;
    symbol: string;
};

export type MeasurementConversionPair = {
    id: MeasurementConversionPairId;
    quantityKind: 'length' | 'weight' | 'liquid-volume' | 'time';
    scalingKind: 'magnitude' | 'factor';
    largerUnit: MeasurementConversionUnit;
    smallerUnit: MeasurementConversionUnit;
    factor: 16 | 60 | 100 | 1000;
    equivalenceEquation: string;
    factorStatement: string;
    relativeSizeStatement: string;
};

type MeasurementConversionProblemBase = {
    pair: MeasurementConversionPair;
    prompt: string;
};

export type GenericUnitScaleRelationProblem = {
    task: 'generic-unit-scale';
    largeUnitCount: number;
    smallUnitCount: number;
    unitsPerLarge: number;
    prompt: string;
    equivalentLengthStatement: string;
    questionEquation: string;
    solutionEquation: string;
    answerStatement: string;
    explanation: string;
};

export type RelativeUnitSizeProblem = MeasurementConversionProblemBase & {
    task: 'relative-unit-size';
    exampleLargerValue: number;
    exampleSmallerValue: number;
    exampleEquation: string;
    answer: number;
    questionEquation: string;
    solutionEquation: string;
    comparisonStatement: string;
    explanation: string;
};

export type LargerToSmallerConversionProblem = MeasurementConversionProblemBase & {
    task: 'convert-larger-to-smaller';
    sourceValue: number;
    convertedValue: number;
    answer: number;
    questionEquation: string;
    solutionEquation: string;
    measurementEquation: string;
    answerStatement: string;
    explanation: string;
};

export type MeasurementConversionTableRow = {
    largerValue: number;
    smallerValue: number;
    measurementEquation: string;
};

export type MeasurementConversionTableProblem = MeasurementConversionProblemBase & {
    task: 'conversion-table';
    rows: readonly MeasurementConversionTableRow[];
    hiddenRowIndices: readonly number[];
    columnHeaders: readonly [string, string];
    constantFactorStatement: string;
    explanation: string;
};

export type MeasurementConversionProblem =
    | GenericUnitScaleRelationProblem
    | RelativeUnitSizeProblem
    | LargerToSmallerConversionProblem
    | MeasurementConversionTableProblem;

export type MeasurementWordProblemKind =
    | 'length'
    | 'time'
    | 'liquid-volume'
    | 'weight'
    | 'money';

export type MeasurementWordProblemNumberKind = 'integer' | 'fraction' | 'decimal';

export type MeasurementWordProblemUnitId =
    | 'meter'
    | 'hour'
    | 'liter'
    | 'kilogram'
    | 'dollar';

export type MeasurementWordProblemUnit = {
    id: MeasurementWordProblemUnitId;
    singular: string;
    plural: string;
    symbol: string;
    symbolPlacement: 'prefix' | 'suffix';
};

/** Exact measured value. Its numeric value is numerator / denominator; display text is generator-authored. */
export type MeasurementWordProblemValue = {
    numerator: number;
    denominator: number;
    display: string;
    quantityText: string;
    equationTerm: string;
};

export type MeasurementWordProblemMeasuredOperand = {
    role: 'measured';
    label: string;
    value: MeasurementWordProblemValue;
};

export type MeasurementWordProblemGroupOperand = {
    role: 'group-count';
    label: string;
    count: number;
    display: string;
};

type MeasurementWordProblemBase = {
    task: 'grade4-measurement-word-problem';
    measurementKind: MeasurementWordProblemKind;
    numberKind: MeasurementWordProblemNumberKind;
    unit: MeasurementWordProblemUnit;
    story: string;
    question: string;
    questionEquation: string;
    solutionEquation: string;
    answer: MeasurementWordProblemValue;
    answerStatement: string;
    explanation: string;
};

export type MeasurementWordProblemAdditive = MeasurementWordProblemBase & {
    operation: 'addition' | 'subtraction';
    operands: readonly [MeasurementWordProblemMeasuredOperand, MeasurementWordProblemMeasuredOperand];
};

export type MeasurementWordProblemMultiplication = MeasurementWordProblemBase & {
    operation: 'multiplication';
    operands: readonly [MeasurementWordProblemGroupOperand, MeasurementWordProblemMeasuredOperand];
};

export type MeasurementWordProblemDivision = MeasurementWordProblemBase & {
    operation: 'division';
    operands: readonly [MeasurementWordProblemMeasuredOperand, MeasurementWordProblemGroupOperand];
};

export type MeasurementWordProblemGrade4 =
    | MeasurementWordProblemAdditive
    | MeasurementWordProblemMultiplication
    | MeasurementWordProblemDivision;

export type MeasurementNumberLineKind = MeasurementWordProblemKind;
export type MeasurementNumberLineUnit = MeasurementWordProblemUnit;

/** Exact number-line value. Its numeric value is numerator / denominator. */
export type MeasurementNumberLineValue = {
    numerator: number;
    denominator: number;
    display: string;
    quantityText: string;
};

export type MeasurementNumberLineTick = {
    index: number;
    value: MeasurementNumberLineValue;
};

export type MeasurementNumberLineProblem = {
    task: 'grade4-measurement-number-line';
    measurementKind: MeasurementNumberLineKind;
    numberKind: 'fraction' | 'decimal';
    unit: MeasurementNumberLineUnit;
    tickCount: 4 | 8 | 10;
    ticks: readonly MeasurementNumberLineTick[];
    labeledTickIndices: readonly [number, number, number];
    start: MeasurementNumberLineValue;
    end: MeasurementNumberLineValue;
    interval: MeasurementNumberLineValue;
    target: MeasurementNumberLineTick;
    prompt: string;
    scaleStatement: string;
    answerStatement: string;
    explanation: string;
};

export type MeasurementLengthDifferenceProblem = {lengthA: number; lengthB: number; difference: number; unit: 'cm'};

export type MeasurementAttributeProblem = {
    attribute: 'length' | 'height' | 'weight';
};

export type MeasurementCompareProblem = {
    attribute: 'length' | 'weight';
    relation: string;
    val1: number;
    val2: number;
    answer: 'A' | 'B';
    maxVal?: number;
};

export type MeasurementOrderProblem = {
    objects: Array<{id: string; length: number}>;
    direction: 'ascending' | 'descending';
    order: string[];
};

export type LengthComparisonRelation = 'longer' | 'shorter';

export type MediatedLengthComparisonProblem = {
    objects: [{id: 'A'}, {id: 'B'}, {id: 'C'}];
    intermediary: 'B';
    premises: [
        {subject: 'A'; relation: LengthComparisonRelation; reference: 'B'},
        {subject: 'B'; relation: LengthComparisonRelation; reference: 'C'}
    ];
    askedRelation: LengthComparisonRelation;
    answer: 'A' | 'C';
};

export type LegacyComparisonProblem = {
    num1: number;
    num2: number;
    relation: 'less' | 'greater' | 'equal';
};

export type MultiDigitComparisonEvidence =
    | {
        kind: 'first-difference';
        placeName: WholeNumberPlaceName;
        exponent: 0 | 1 | 2 | 3 | 4 | 5 | 6;
        leftDigit: number;
        rightDigit: number;
        leftPlaceValue: number;
        rightPlaceValue: number;
        explanation: string;
    }
    | {
        kind: 'all-equal';
        explanation: string;
    };

export type MultiDigitComparisonProblem = {
    task: 'multi-digit-place-value-comparison';
    num1: number;
    num2: number;
    relation: 'less' | 'greater' | 'equal';
    leftNumeral: string;
    rightNumeral: string;
    symbol: '<' | '>' | '=';
    prompt: string;
    comparisonEquation: string;
    conclusion: string;
    evidence: MultiDigitComparisonEvidence;
};

export type ComparisonProblem = LegacyComparisonProblem | MultiDigitComparisonProblem;

export type OrderingProblem = {
    numbers: number[];
};

export type LegacyWritingProblem = {
    number: number;
};

export type MultiDigitBaseTenNumeralProblem = {
    task: 'multi-digit-base-ten-numeral';
    number: number;
    standardNumeral: string;
    numberName: string;
    placeValues: WholeNumberPlaceValue[];
    readPrompt: string;
    writePrompt: string;
};

export type MultiDigitNumberNameProblem = {
    task: 'multi-digit-number-name';
    number: number;
    standardNumeral: string;
    numberName: string;
    placeValues: WholeNumberPlaceValue[];
    prompt: string;
};

export type WritingProblem =
    | LegacyWritingProblem
    | MultiDigitBaseTenNumeralProblem
    | MultiDigitNumberNameProblem;

/** Shared payload accepted by the number-line view for representation and pair arithmetic. */
export type NumberLineProblem = WritingProblem | ArithmeticPairProblem;

export type TimeProblem = {
    time: string;
    interval: number;
    period?: 'a.m.' | 'p.m.';
};

export type ElapsedTimeProblem = {
    startTime: string;
    endTime: string;
    elapsedMinutes: number;
    minutesToNextHour: number;
    minutesAfterHour: number;
    crossesHour: true;
};

export type TimeIntervalWordProblem = {
    operation: 'addition' | 'subtraction';
    story: string;
    startTime: string;
    endTime: string;
    elapsedMinutes: number;
    referenceHour: number;
    startOffsetMinutes: number;
    endOffsetMinutes: number;
    unknown: 'end-time' | 'elapsed-minutes';
};

export type LiquidVolumeMeasurementProblem = {
    measurementKind: 'liquid-volume';
    object: 'measuring-jug';
    unit: 'L';
    value: number;
    capacity: number;
    tickStep: 1;
};

export type MassMeasurementProblem = {
    measurementKind: 'mass';
    object: 'apple' | 'book' | 'toy-car' | 'watermelon' | 'backpack' | 'suitcase';
    unit: 'g' | 'kg';
    value: number;
    instrument: 'digital-scale';
};

export type MassVolumeMeasurementProblem = LiquidVolumeMeasurementProblem | MassMeasurementProblem;

export type LiquidVolumeEstimateProblem = {
    measurementKind: 'liquid-volume';
    container: 'water-bottle' | 'juice-carton' | 'watering-can' | 'bucket';
    unit: 'L';
    estimateLiters: 1 | 2 | 5 | 10;
    referenceLiters: 1;
};

export type MassEstimateProblem = {
    measurementKind: 'mass';
    object: 'crayon' | 'apple' | 'book' | 'backpack' | 'chair' | 'bicycle';
    unit: 'g' | 'kg';
    estimate: number;
    referenceCount: number;
    referenceObject: 'paperclip' | 'one-kilogram-bag';
    referenceValue: 1;
};

export type MassVolumeEstimateProblem = LiquidVolumeEstimateProblem | MassEstimateProblem;

export type CurrencyItem = {
    kind: 'coin' | 'banknote';
    denominationCents: number;
    count: number;
};

export type CurrencyAmount = {
    items: CurrencyItem[];
    totalCents: number;
};

export type CurrencyArithmeticProblem = {
    operation: 'addition' | 'subtraction';
    amounts: [CurrencyAmount, CurrencyAmount];
    answerCents: number;
};

export type MeasurementObservation = {
    object: 'pencil' | 'crayon' | 'ribbon' | 'key' | 'brush' | 'block';
    length: number;
};

export type LegacyMeasurementDataProblem = {
    unit: 'cm' | 'in';
    subdivisions: 1 | 4;
    observations: MeasurementObservation[];
};

export type FractionLinePlotValue = {
    eighths: number;
    numerator: number;
    denominator: 1 | 2 | 4 | 8;
    display: string;
    quantityText: string;
};

export type FractionLinePlotObservation = {
    object: MeasurementObservation['object'];
    value: FractionLinePlotValue;
};

export type FractionLinePlotTick = {
    index: number;
    value: FractionLinePlotValue;
};

export type FractionLinePlotFrequency = {
    value: FractionLinePlotValue;
    count: number;
};

type Grade4FractionLinePlotBase = {
    unit: 'in';
    subdivisions: 8;
    observations: MeasurementObservation[];
    fractionObservations: FractionLinePlotObservation[];
    axisStart: FractionLinePlotValue;
    axisEnd: FractionLinePlotValue;
    interval: FractionLinePlotValue;
    axisTicks: FractionLinePlotTick[];
    frequencies: FractionLinePlotFrequency[];
    scaleStatement: string;
};

export type ConstructFractionLinePlotProblem = Grade4FractionLinePlotBase & {
    task: 'construct-fraction-line-plot';
    prompt: string;
    answerStatement: string;
    explanation: string;
};

export type FractionLinePlotArithmeticProblem = Grade4FractionLinePlotBase & {
    task: 'fraction-line-plot-arithmetic';
    operation: 'addition' | 'subtraction';
    shortest: FractionLinePlotValue;
    longest: FractionLinePlotValue;
    leftOperand: FractionLinePlotValue;
    rightOperand: FractionLinePlotValue;
    answer: FractionLinePlotValue;
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    answerStatement: string;
    explanation: string;
};

export type Grade4FractionLinePlotProblem =
    | ConstructFractionLinePlotProblem
    | FractionLinePlotArithmeticProblem;

export type MeasurementDataProblem =
    | LegacyMeasurementDataProblem
    | Grade4FractionLinePlotProblem;

export type StatisticalCategory = {
    label: 'Apples' | 'Books' | 'Kites';
    count: number;
};

export type StatisticalGraphProblem = {
    categories: StatisticalCategory[];
    scale: 1 | 2 | 5 | 10;
    operation?: 'addition' | 'subtraction';
    operandIndices?: [number, number] | [number, number, number];
    intermediate?: number;
    answer?: number;
};

// --- Shape Split Problem Types ---

export type ShapeNamingProblem = {
    shape: string;
    answer: string;
    attributes?: string[];
};

export type ShapePositionProblem = {
    relation: 'above' | 'below' | 'beside' | 'nextTo' | 'behind' | 'ahead';
    answer: string;
};

export type ShapeEnvShapesProblem = {
    target: string;
    answer: string;
};

export type ShapeClassifyDimProblem = {
    shapeType: '2d' | '3d';
    shape: string;
    answer: '2d' | '3d';
};

export type ShapeCompareAttributesProblem = {
    attribute: 'sides' | 'corners';
    shape1: string;
    shape2: string;
    val1: number;
    val2: number;
    answer: string;
};

export type ShapeSameAttributeProblem = {
    attribute: 'rollable' | 'stackable' | 'foldable';
    answer: string;
};

export type PlaneShapeName =
    | 'circle'
    | 'triangle'
    | 'rhombus'
    | 'square'
    | 'rectangle'
    | 'quadrilateral'
    | 'pentagon'
    | 'hexagon';

export type ShapeDefinition = {
    sideCount: 0 | 3 | 4 | 5 | 6;
    vertexCount: 0 | 3 | 4 | 5 | 6;
    closed: true;
    boundary: 'curved' | 'straight';
    equalSides?: boolean;
    rightAngleCount?: 0 | 4;
};

export type ShapeAttributeOption = {
    id: 'A' | 'B' | 'C' | 'D';
    text: string;
    kind: 'defining' | 'non-defining';
};

export type ShapeDefiningAttributeClassificationProblem = {
    shape: PlaneShapeName;
    definition: ShapeDefinition;
    options: ShapeAttributeOption[];
    answer: ShapeAttributeOption['id'];
    task?: undefined;
};

export type ShapeCountAttribute = 'vertices' | 'equal-faces';

export type ShapeCountOptionName =
    | PlaneShapeName
    | 'cube'
    | 'rectangular-prism'
    | 'triangular-prism'
    | 'square-pyramid';

export type ShapeCountOption = {
    id: ShapeAttributeOption['id'];
    shape: ShapeCountOptionName;
    count: number;
    satisfies: boolean;
};

export type ShapeCountClassificationProblem = {
    task: 'classify-count';
    attribute: ShapeCountAttribute;
    requiredCount: number;
    options: ShapeCountOption[];
    answer: ShapeCountOption['id'];
};

export type QuadrilateralSubtypeName = 'rhombus' | 'rectangle' | 'square';

export type ShapeCategoryOption = {
    id: ShapeAttributeOption['id'];
    category: 'triangle' | 'quadrilateral' | 'pentagon' | 'hexagon';
    satisfies: boolean;
};

export type ShapeSubsumptionProblem = {
    task: 'classify-quadrilateral-subcategory';
    shape: QuadrilateralSubtypeName;
    attributes: string[];
    category: 'quadrilateral';
    options: ShapeCategoryOption[];
    answer: ShapeCategoryOption['id'];
};

export type ShapeClassificationCoordinate = {
    x: number;
    y: number;
};

export type ShapeClassificationStroke = {
    start: ShapeClassificationCoordinate;
    end: ShapeClassificationCoordinate;
};

export type ShapeClassificationMarker =
    | {
        kind: 'angle-arc';
        center: ShapeClassificationCoordinate;
        radius: number;
        startDegrees: number;
        endDegrees: number;
    }
    | {
        kind: 'right-angle';
        points: [
            ShapeClassificationCoordinate,
            ShapeClassificationCoordinate,
            ShapeClassificationCoordinate
        ];
    }
    | {
        kind: 'parallel';
        strokes: [
            ShapeClassificationStroke,
            ShapeClassificationStroke
        ];
    };

export type ShapeClassificationFigure = {
    vertices: ShapeClassificationCoordinate[];
    sides: ShapeClassificationStroke[];
};

export type ShapeLineRelationOption = {
    id: ShapeAttributeOption['id'];
    figureName: string;
    figure: ShapeClassificationFigure;
    relations: Array<'parallel' | 'perpendicular'>;
    evidenceStrokes: [ShapeClassificationStroke, ShapeClassificationStroke];
    marker: ShapeClassificationMarker | null;
    satisfies: boolean;
};

export type ShapeLineRelationClassificationProblem = {
    task: 'classify-line-relation';
    criterion: 'parallel' | 'perpendicular';
    prompt: string;
    positiveLabel: string;
    negativeLabel: string;
    options: [
        ShapeLineRelationOption,
        ShapeLineRelationOption,
        ShapeLineRelationOption,
        ShapeLineRelationOption
    ];
    answerIds: [ShapeAttributeOption['id'], ShapeAttributeOption['id']];
    answerStatement: string;
    explanation: string;
};

export type ShapeAngleClassOption = {
    id: ShapeAttributeOption['id'];
    figureName: string;
    figure: ShapeClassificationFigure;
    angleClasses: Array<'right' | 'acute' | 'obtuse'>;
    angleClass: 'right' | 'acute' | 'obtuse';
    evidenceRays: [ShapeClassificationStroke, ShapeClassificationStroke];
    marker: ShapeClassificationMarker;
    satisfies: boolean;
};

export type ShapeAngleClassificationProblem = {
    task: 'classify-angle-size';
    criterion: 'right' | 'acute' | 'obtuse';
    prompt: string;
    positiveLabel: string;
    negativeLabel: string;
    options: [
        ShapeAngleClassOption,
        ShapeAngleClassOption,
        ShapeAngleClassOption,
        ShapeAngleClassOption
    ];
    answerIds: [ShapeAttributeOption['id'], ShapeAttributeOption['id']];
    answerStatement: string;
    explanation: string;
};

export type ShapeRightTriangleOption = {
    id: ShapeAttributeOption['id'];
    figureName: string;
    figure: ShapeClassificationFigure;
    angleClasses: Array<'right' | 'acute' | 'obtuse'>;
    angleClass: 'right' | 'acute' | 'obtuse';
    evidenceRays: [ShapeClassificationStroke, ShapeClassificationStroke];
    marker: ShapeClassificationMarker;
    satisfies: boolean;
};

export type RightTriangleCategoryProblem = {
    task: 'classify-right-triangle-category';
    prompt: 'Which figures are right triangles?';
    positiveLabel: 'right triangle';
    negativeLabel: 'not a right triangle';
    options: [
        ShapeRightTriangleOption,
        ShapeRightTriangleOption,
        ShapeRightTriangleOption,
        ShapeRightTriangleOption
    ];
    answerIds: [ShapeAttributeOption['id'], ShapeAttributeOption['id']];
    attributes: ['3 straight sides', '1 right angle'];
    category: 'triangle';
    categoryStatement: 'Every right triangle is a triangle.';
    answerStatement: string;
    explanation: string;
};

export type ShapeAttributeClassificationProblem =
    | ShapeDefiningAttributeClassificationProblem
    | ShapeCountClassificationProblem
    | ShapeSubsumptionProblem
    | ShapeLineRelationClassificationProblem
    | ShapeAngleClassificationProblem
    | RightTriangleCategoryProblem;

export type LineSymmetryCoordinate = {
    x: number;
    y: number;
};

export type LineSymmetryCorrespondence = {
    first: LineSymmetryCoordinate;
    second: LineSymmetryCoordinate;
    foldPoint: LineSymmetryCoordinate;
    distanceToAxis: number;
};

export type LineSymmetryAxis = {
    id: 'vertical' | 'horizontal' | 'diagonal-rise' | 'diagonal-fall';
    start: LineSymmetryCoordinate;
    end: LineSymmetryCoordinate;
    equation: {
        a: number;
        b: number;
        c: number;
    };
    correspondences: LineSymmetryCorrespondence[];
};

export type LineSymmetryFigure = {
    figureKind: 'isosceles-triangle' | 'rectangle' | 'square' | 'scalene-triangle' | 'parallelogram';
    vertices: LineSymmetryCoordinate[];
    validAxes: LineSymmetryAxis[];
    axisCount: 0 | 1 | 2 | 4;
};

export type LineSymmetryIdentificationOption = {
    id: ShapeAttributeOption['id'];
    figure: LineSymmetryFigure;
    hasLineSymmetry: boolean;
};

export type IdentifyLineSymmetryProblem = {
    task: 'identify-line-symmetry';
    prompt: 'Classify each figure by whether it can be folded along a line into exactly matching halves.';
    positiveLabel: 'has line symmetry';
    negativeLabel: 'does not have line symmetry';
    options: [
        LineSymmetryIdentificationOption,
        LineSymmetryIdentificationOption,
        LineSymmetryIdentificationOption,
        LineSymmetryIdentificationOption
    ];
    answerIds: [ShapeAttributeOption['id'], ShapeAttributeOption['id']];
    answerStatement: string;
    explanation: 'Each selected figure can be folded along a valid line so its matching parts coincide.';
};

export type DrawLineSymmetryProblem = {
    task: 'draw-line-symmetry';
    prompt: 'Draw every line where folding the figure makes exactly matching halves.';
    figure: LineSymmetryFigure;
    completedAxes: LineSymmetryAxis[];
    answer: string;
    answerStatement: string;
    explanation: string;
};

export type ShapeLineSymmetryProblem = IdentifyLineSymmetryProblem | DrawLineSymmetryProblem;

export type ShapePartsConstructionProblem = {
    target: PlaneShapeName;
    sides: number;
    corners: number;
    task?: undefined;
    definition?: undefined;
};

export type ShapeRotationConstructionProblem = {
    target: PlaneShapeName;
    sides: number;
    corners: number;
    task: 'rotation-conservation';
};

export type ShapeExcludedQuadrilateralProblem = {
    target: 'quadrilateral';
    sides: 4;
    corners: 4;
    task: 'exclude-quadrilateral-subcategories';
    definition: ShapeDefinition;
    excludedCategories: ['rhombus', 'rectangle', 'square'];
};

export type ShapeAttributeSpecificationProblem = {
    target: PlaneShapeName;
    sides: number;
    corners: number;
    task: 'specify-attributes';
    definition: ShapeDefinition;
};

export type ShapeAttributeCountSpecificationProblem = {
    target: PlaneShapeName | 'cube';
    sides: number;
    corners: number;
    task: 'specify-count';
    attribute: ShapeCountAttribute;
    requiredCount: number;
};

export type ShapeBuildShapeProblem =
    | ShapePartsConstructionProblem
    | ShapeRotationConstructionProblem
    | ShapeExcludedQuadrilateralProblem
    | ShapeAttributeSpecificationProblem
    | ShapeAttributeCountSpecificationProblem;

export type ShapeCompositionLeaf = {
    kind: 'primitive';
    shape: string;
};

export type ShapeCompositionComposite = {
    kind: 'composite';
    shape: string;
    inputs: ShapeCompositionNode[];
};

export type ShapeCompositionNode = ShapeCompositionLeaf | ShapeCompositionComposite;

export type ShapeComposeShapesProblem = {
    target: string;
    /** Compatibility projection of the authoritative tree's direct inputs. */
    components: string[];
    options: string[];
    answer: string;
    compositionTree: ShapeCompositionComposite;
    /** Primitive leaves have depth 0; a composite adds one to its deepest input. */
    compositionDepth: 1 | 2;
};

export type FractionShape = 'circle' | 'rectangle';
export type FractionParts = 2 | 3 | 4 | 6 | 8;
export type FractionShareName = 'half' | 'fourth' | 'quarter';

export type FractionNumberLineStep = {
    /** Step endpoints measured in denominator-sized units from zero. */
    fromNumerator: number;
    toNumerator: number;
};

export type FractionNumberLineProblem = {
    task: 'locate-fraction';
    numerator: number;
    denominator: FractionParts;
    unitFraction: string;
    targetFraction: string;
    wholeCount: 1 | 2;
    steps: FractionNumberLineStep[];
    answer: string;
};

export type FractionValue = {
    numerator: number;
    denominator: FractionParts;
    notation: string;
};

export type ProperFractionEquivalenceProblem = {
    task: 'recognize-equivalence' | 'generate-equivalence';
    first: FractionValue;
    second: FractionValue;
    scaleFactor: 2 | 3 | 4;
    relation: 'equal';
    equation: string;
    explanation: string;
    answer: string;
};

export type WholeNumberFractionEquivalenceProblem = {
    task: 'represent-whole-as-fraction';
    wholeNumber: 1 | 2 | 3;
    fraction: FractionValue;
    relation: 'equal';
    equation: string;
    explanation: string;
    answer: string;
};

export type FractionScalingStep = {
    from: number;
    factor: 2 | 3 | 4;
    result: number;
    equation: string;
};

export type FractionScalingBar = {
    partCount: FractionParts;
    shadedCount: number;
};

export type FractionScalingNumberLineTick = {
    index: number;
    xPercent: number;
    label: string;
};

export type FractionScalingNumberLinePoint = {
    tickIndex: number;
    xPercent: number;
    label: string;
};

export type FractionScalingProblem = {
    task: 'scale-equivalence';
    first: FractionValue;
    second: FractionValue;
    scaleFactor: 2 | 3 | 4;
    sharedWhole: 1;
    numeratorScale: FractionScalingStep;
    denominatorScale: FractionScalingStep;
    questionEquation: string;
    scalingEquation: string;
    firstUnitPart: string;
    secondUnitPart: string;
    barModel: {
        first: FractionScalingBar;
        second: FractionScalingBar;
    };
    numberLineModel: {
        firstTicks: FractionScalingNumberLineTick[];
        secondTicks: FractionScalingNumberLineTick[];
        firstPoint: FractionScalingNumberLinePoint;
        secondPoint: FractionScalingNumberLinePoint;
        coLocatedXPercent: number;
    };
    relation: 'equal';
    answer: string;
    answerStatement: string;
    explanation: string;
};

export type DecimalFractionValue = {
    numerator: number;
    denominator: 10 | 100;
    notation: string;
};

export type TenthsHundredthsGridCell = {
    index: number;
    row: number;
    column: number;
    tenthGroupIndex: number;
    xPercent: number;
    yPercent: number;
    widthPercent: 10;
    heightPercent: 10 | 100;
    shaded: boolean;
    source: 'first-addend' | 'second-addend' | null;
};

export type TenthsHundredthsGridGroup = {
    source: 'first-addend' | 'second-addend';
    label: string;
    startCell: number;
    cellCount: number;
};

export type TenthsHundredthsGridModel = {
    display: string;
    rows: 1 | 10;
    columns: 10;
    partCount: 10 | 100;
    shadedCount: number;
    groups: TenthsHundredthsGridGroup[];
    cells: TenthsHundredthsGridCell[];
};

export type TenthsToHundredthsProblem = {
    task: 'tenths-to-hundredths';
    tenths: DecimalFractionValue & {denominator: 10};
    hundredths: DecimalFractionValue & {denominator: 100};
    scaleFactor: 10;
    sharedWhole: 1;
    numeratorScale: {
        from: number;
        factor: 10;
        result: number;
        equation: string;
    };
    denominatorScale: {
        from: 10;
        factor: 10;
        result: 100;
        equation: string;
    };
    questionPrompt: string;
    questionEquation: string;
    solutionEquation: string;
    models: {
        tenths: TenthsHundredthsGridModel;
        hundredths: TenthsHundredthsGridModel;
    };
    relation: 'equal';
    answer: string;
    answerStatement: string;
    explanation: string;
};

export type FractionEquivalenceProblem =
    | ProperFractionEquivalenceProblem
    | WholeNumberFractionEquivalenceProblem
    | FractionScalingProblem
    | TenthsToHundredthsProblem;

export type FractionLineProblem = FractionNumberLineProblem | FractionEquivalenceProblem;

export type LegacyFractionComparisonProblem = {
    task: 'compare-fractions';
    first: FractionValue;
    second: FractionValue;
    family: 'common-denominator' | 'common-numerator';
    sharedComponent: number;
    relation: 'greater' | 'less';
    symbol: '>' | '<';
    sharedWhole: 1;
    answer: string;
    rationale: string;
};

export type FractionComparisonBarModel = {
    partCount: FractionParts;
    shadedCount: number;
    filledPercent: number;
    benchmarkXPercent: 50;
};

export type UnlikeFractionComparisonProblem = {
    task: 'compare-unlike-fractions';
    first: FractionValue;
    second: FractionValue;
    comparisonKind: 'inequality' | 'equality';
    relation: 'greater' | 'equal' | 'less';
    symbol: '>' | '=' | '<';
    strategy: 'benchmark-half';
    sharedWhole: 1;
    benchmark: {
        numerator: 1;
        denominator: 2;
        notation: '1/2';
        xPercent: 50;
    };
    firstModel: FractionComparisonBarModel;
    secondModel: FractionComparisonBarModel;
    firstBenchmarkRelation: 'greater' | 'equal' | 'less';
    secondBenchmarkRelation: 'greater' | 'equal' | 'less';
    firstBenchmarkStatement: string;
    secondBenchmarkStatement: string;
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    answer: string;
    answerStatement: string;
    rationale: string;
};

export type FractionComparisonProblem =
    | LegacyFractionComparisonProblem
    | UnlikeFractionComparisonProblem;

export type FractionArithmeticOperation = 'addition' | 'subtraction';

export type LikeDenominatorFractionValue = {
    numerator: number;
    denominator: FractionParts;
    notation: string;
};

export type MixedFractionValue = {
    whole: number;
    numerator: number;
    denominator: FractionParts;
    notation: string;
    improperNumerator: number;
    improperNotation: string;
};

export type FractionArithmeticModelGroupRole =
    | 'first-addend'
    | 'second-addend'
    | 'remaining'
    | 'removed'
    | 'decomposition-part'
    | 'unit-part'
    | 'fraction-group'
    | 'result';

export type FractionArithmeticModelGroup = {
    id: string;
    role: FractionArithmeticModelGroupRole;
    label: string;
    startPart: number;
    partCount: number;
};

export type FractionArithmeticModelCell = {
    partIndex: number;
    groupId: string | null;
};

export type FractionArithmeticModelFrame = {
    frameIndex: number;
    cells: FractionArithmeticModelCell[];
};

export type FractionArithmeticModel = {
    denominator: FractionParts;
    display: string;
    totalNumerator: number;
    frameCount: 1 | 2 | 3 | 4;
    groups: FractionArithmeticModelGroup[];
    frames: FractionArithmeticModelFrame[];
};

export type FractionArithmeticStory = {
    storyKind:
        | 'poster-join'
        | 'poster-separate'
        | 'mosaic-decomposition'
        | 'route-combination'
        | 'route-difference'
        | 'ribbon-unit-multiple'
        | 'equal-fraction-groups'
        | 'hundred-grid-addition';
    context: string;
    question: string;
    wholeLabel: string;
    unitLabel: string;
    givenDisplays: [string] | [string, string];
    unknownRole: 'operation' | 'decompositions' | 'result' | 'product' | 'multiplier';
};

export type FractionArithmeticCommon = {
    operation: FractionArithmeticOperation;
    denominator: FractionParts;
    sharedWhole: 1;
    referenceId: 'same-whole';
    story: FractionArithmeticStory;
    prompt: string;
    questionEquation: string;
    answer: string;
    answerStatement: string;
    explanation: string;
};

export type FractionBinaryOperationProblem = FractionArithmeticCommon & {
    task: 'interpret-operation' | 'fraction-operation';
    symbol: '+' | '−';
    action: 'join' | 'separate';
    first: LikeDenominatorFractionValue;
    second: LikeDenominatorFractionValue;
    result: LikeDenominatorFractionValue;
    questionModels: [FractionArithmeticModel, FractionArithmeticModel];
    solutionEquation: string;
    solutionModel: FractionArithmeticModel;
};

export type FractionDecomposition = {
    terms: LikeDenominatorFractionValue[];
    equation: string;
    model: FractionArithmeticModel;
};

export type FractionDecompositionProblem = Omit<FractionArithmeticCommon, 'operation'> & {
    task: 'decompose';
    operation: 'addition';
    sourceKind: 'proper' | 'mixed';
    sourceFraction: LikeDenominatorFractionValue;
    sourceMixed: MixedFractionValue | null;
    sourceDisplay: string;
    sourceModel: FractionArithmeticModel;
    decompositions: [FractionDecomposition, FractionDecomposition];
    solutionEquations: [string, string];
};

export type MixedFractionOperationStrategy =
    | 'addition-with-carry'
    | 'addition-without-carry'
    | 'subtraction-with-borrow'
    | 'subtraction-without-borrow';

export type MixedFractionOperationProblem = FractionArithmeticCommon & {
    task: 'mixed-operation';
    symbol: '+' | '−';
    strategy: MixedFractionOperationStrategy;
    requiresRegrouping: boolean;
    first: MixedFractionValue;
    second: MixedFractionValue;
    result: MixedFractionValue;
    questionModels: [FractionArithmeticModel, FractionArithmeticModel];
    operandConversionEquations: [string, string];
    regroupingEquation: string | null;
    improperOperationEquation: string;
    normalizationEquation: string;
    transformationSteps: string[];
    solutionEquation: string;
    solutionModel: FractionArithmeticModel;
};

export type FractionMultiplicationCommon = {
    operation: 'multiplication';
    denominator: FractionParts;
    sharedWhole: 1;
    referenceId: 'same-whole';
    story: FractionArithmeticStory;
    productKind: 'proper' | 'improper';
    wholeFactor: number;
    wholeFactorDisplay: string;
    unitFraction: LikeDenominatorFractionValue;
    product: LikeDenominatorFractionValue;
    groupCount: number;
    partsPerGroup: number;
    totalUnitParts: number;
    solutionModel: FractionArithmeticModel;
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    equationChain: string;
    answer: string;
    answerStatement: string;
    explanation: string;
};

export type UnitFractionMultipleProblem = FractionMultiplicationCommon & {
    task: 'unit-fraction-multiple';
    productKind: 'proper' | 'improper';
    partsPerGroup: 1;
    questionModel: FractionArithmeticModel;
    unitSizeStatement: string;
    unitMultipleEquation: string;
};

export type WholeNumberFractionProductCommon = FractionMultiplicationCommon & {
    fractionFactor: LikeDenominatorFractionValue;
    questionGroupModels: FractionArithmeticModel[];
    fractionAsUnitMultipleEquation: string;
    iteratedUnitEquation: string;
};

export type WholeNumberFractionProductProblem = WholeNumberFractionProductCommon & {
    task: 'whole-number-fraction-product';
};

export type FractionMultiplicationWordProblem = WholeNumberFractionProductCommon & {
    task: 'fraction-multiplication-problem';
    lowerWhole: number;
    upperWhole: number;
    boundsStatement: string;
};

export type TenthsHundredthsAdditionProblem = {
    task: 'tenths-hundredths-addition';
    operation: 'addition';
    denominator: 100;
    sharedWhole: 1;
    referenceId: 'same-whole';
    story: FractionArithmeticStory & {
        storyKind: 'hundred-grid-addition';
        givenDisplays: [string, string];
        unknownRole: 'result';
    };
    firstTenths: DecimalFractionValue & {denominator: 10};
    secondHundredths: DecimalFractionValue & {denominator: 100};
    convertedFirst: DecimalFractionValue & {denominator: 100};
    result: DecimalFractionValue & {denominator: 100};
    conversion: {
        factor: 10;
        numeratorEquation: string;
        denominatorEquation: string;
        equation: string;
    };
    prompt: string;
    questionEquation: string;
    conversionEquation: string;
    solutionEquation: string;
    equationChain: string;
    questionModels: {
        firstTenths: TenthsHundredthsGridModel;
        secondHundredths: TenthsHundredthsGridModel;
    };
    solutionModels: {
        convertedFirst: TenthsHundredthsGridModel;
        result: TenthsHundredthsGridModel;
    };
    answer: string;
    answerStatement: string;
    explanation: string;
};

export type FractionArithmeticProblem =
    | FractionBinaryOperationProblem
    | FractionDecompositionProblem
    | MixedFractionOperationProblem
    | UnitFractionMultipleProblem
    | WholeNumberFractionProductProblem
    | FractionMultiplicationWordProblem
    | TenthsHundredthsAdditionProblem;

export type ShapePartitionProblem =
    | {
        task: 'partition';
        shape: FractionShape;
        parts: 2 | 4;
    }
    | {
        task: 'name-share';
        shape: FractionShape;
        parts: 2 | 4;
        shareName: FractionShareName;
        /** Zero-based index of the share being named. */
        selectedShare: number;
        answer: FractionShareName;
    }
    | {
        task: 'compose-whole';
        shape: FractionShape;
        parts: 2 | 4;
        shareName: 'half' | 'fourth';
        answer: 'one whole';
    }
    | {
        task: 'compare-share-size';
        shape: FractionShape;
        shares: [
            {parts: 2; shareName: 'half'},
            {parts: 4; shareName: 'fourth'}
        ];
        relation: 'less';
        answer: 'fourth';
    }
    | {
        task: 'partition-and-label-unit-fraction';
        shape: FractionShape;
        parts: FractionParts;
        selectedShare: number;
        unitFraction: string;
        answer: string;
    }
    | {
        task: 'interpret-fraction';
        shape: FractionShape;
        parts: FractionParts;
        numerator: number;
        highlightedShares: number[];
        unitFraction: string;
        fraction: string;
        answer: string;
    };

export type ShapePatternToken = {
    shape: 'square' | 'triangle';
    orientation: 0 | 90 | 180 | 270;
};

export type ShapePatternTerm = {
    position: number;
    tokens: ShapePatternToken[];
    caption: string;
};

export type ShapePatternEvidence = {
    positions: number[];
    observation: string;
};

type ShapePatternProblemBase = {
    patternKind: 'growth-parity' | 'rotation-axis';
    rule: string;
    sequence: ShapePatternTerm[];
    givenTermCount: number;
    feature: string;
    evidence: ShapePatternEvidence[];
    explanation: string;
};

export type ShapePatternProblem = ShapePatternProblemBase & (
    | {
        task: 'generate';
        prompt: string;
        responsePositions: [number, number];
    }
    | {
        task: 'identify';
        prompt: string;
        featureOptions: [string, string, string];
    }
    | {
        task: 'explain';
        prompt: string;
    }
);

export type LegacyShapeSquareArrayProblem = {
    task: 'interpret-unit' | 'interpret-coverage' | 'partition' | 'count' | 'count-area' | 'explain-product' | 'calculate-area';
    rows: 1 | 2 | 3 | 4 | 5;
    columns: 1 | 2 | 3 | 4 | 5;
    squareCount: number;
    areaUnit?: 'square units' | 'square centimeters' | 'square meters' | 'square inches' | 'square feet';
};

type RectangleAreaFormulaBase = {
    rows: 2 | 3 | 4 | 5;
    columns: 2 | 3 | 4 | 5;
    squareCount: number;
    length: number;
    width: number;
    area: number;
    areaUnit: 'square units';
    formula: 'A = length × width';
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    answerStatement: string;
    explanation: string;
};

export type RectangleAreaFormulaProblem = RectangleAreaFormulaBase & {
    task: 'rectangle-area-formula';
};

export type FindMissingRectangleAreaDimensionProblem = RectangleAreaFormulaBase & {
    task: 'find-missing-area-dimension';
    unknownDimension: 'length' | 'width';
    knownDimension: 'length' | 'width';
    knownValue: number;
    missingValue: number;
    inverseEquation: string;
};

export type ShapeSquareArrayProblem =
    | LegacyShapeSquareArrayProblem
    | RectangleAreaFormulaProblem
    | FindMissingRectangleAreaDimensionProblem;

export type DistributiveAreaDecompositionProblem = {
    kind: 'distributive';
    height: number;
    leftWidth: number;
    rightWidth: number;
    totalWidth: number;
    leftArea: number;
    rightArea: number;
    totalArea: number;
};

export type RectilinearAreaDecompositionProblem = {
    kind: 'rectilinear';
    leftWidth: number;
    rightWidth: number;
    totalHeight: number;
    bottomHeight: number;
    leftArea: number;
    rightArea: number;
    totalArea: number;
};

export type AreaDecompositionProblem =
    | DistributiveAreaDecompositionProblem
    | RectilinearAreaDecompositionProblem;

export type PolygonVertex = {
    x: number;
    y: number;
};

type GeometryPerimeterProblemBase = {
    shape: 'triangle' | 'quadrilateral' | 'pentagon' | 'hexagon';
    vertices: PolygonVertex[];
    sideLengths: number[];
    perimeter: number;
    unit: 'units';
};

export type FindPolygonPerimeterProblem = GeometryPerimeterProblemBase & {
    task: 'find-perimeter';
};

export type FindMissingPolygonSideProblem = GeometryPerimeterProblemBase & {
    task: 'find-missing-side';
    unknownSideIndex: number;
    knownSideTotal: number;
};

type RectanglePerimeterFormulaBase = {
    shape: 'rectangle';
    vertices: PolygonVertex[];
    sideLengths: [number, number, number, number];
    length: number;
    width: number;
    perimeter: number;
    unit: 'units';
    formula: 'P = length + width + length + width';
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    answerStatement: string;
    explanation: string;
};

export type RectanglePerimeterFormulaProblem = RectanglePerimeterFormulaBase & {
    task: 'rectangle-perimeter-formula';
};

export type FindMissingRectanglePerimeterDimensionProblem = RectanglePerimeterFormulaBase & {
    task: 'find-missing-perimeter-dimension';
    unknownDimension: 'length' | 'width';
    knownDimension: 'length' | 'width';
    knownValue: number;
    missingValue: number;
    knownSideTotal: number;
    inverseEquation: string;
};

export type GeometryPerimeterProblem =
    | FindPolygonPerimeterProblem
    | FindMissingPolygonSideProblem
    | RectanglePerimeterFormulaProblem
    | FindMissingRectanglePerimeterDimensionProblem;

export type RectangleMeasures = {
    width: number;
    height: number;
    area: number;
    perimeter: number;
};

type AreaPerimeterRelationBase = {
    first: RectangleMeasures;
    second: RectangleMeasures;
    unit: 'units';
    areaUnit: 'square units';
};

export type AreaPerimeterRelationProblem = AreaPerimeterRelationBase & (
    | {
        task: 'same-perimeter';
        equalMeasure: 'perimeter';
    }
    | {
        task: 'same-area';
        equalMeasure: 'area';
    }
);

export type ShapePartitionEquivalenceProblem = {
    shape: FractionShape;
    parts: 2;
    firstPartition: 'straight';
    secondPartition: 'diagonal' | 'curved';
    conclusion: 'equal shares can have different shapes';
};

export type AngleConceptFraction =
    | {numerator: 1; denominator: 6; display: '1/6'}
    | {numerator: 1; denominator: 4; display: '1/4'}
    | {numerator: 1; denominator: 3; display: '1/3'}
    | {numerator: 1; denominator: 2; display: '1/2'};

export type AngleConceptGeometry = {
    centerLabel: 'O';
    startPointLabel: 'A';
    endPointLabel: 'B';
    fullTurnDegrees: 360;
    startDegrees: 0;
    endDegrees: number;
    sweepDegrees: number;
    direction: 'counterclockwise';
    tickDegrees: number[];
};

type AngleConceptProblemBase = {
    prompt: string;
    geometry: AngleConceptGeometry;
    answer: string;
    answerStatement: string;
    explanation: string;
};

export type RecognizeAngleFromArcProblem = AngleConceptProblemBase & {
    task: 'recognize-angle-from-arc';
    arcFraction: AngleConceptFraction;
    questionRelation: string;
    solutionRelation: string;
    rayStatement: string;
};

export type DeriveOneDegreeProblem = AngleConceptProblemBase & {
    task: 'derive-one-degree';
    partitionCount: 360;
    selectedParts: 1;
    unitFraction: {numerator: 1; denominator: 360; display: '1/360'};
    degreeMeasure: 1;
    questionRelation: '1/360 of a full turn = ?';
    solutionRelation: '1/360 of a full turn = 1°';
    fractionStatement: 'One equal turn is 1/360 of a full circle.';
};

export type InterpretDegreeIterationProblem = AngleConceptProblemBase & {
    task: 'interpret-degree-iteration';
    unitDegree: 1;
    iterationCount: number;
    angleMeasure: number;
    questionRelation: string;
    solutionRelation: string;
    unitStatement: 'Each marked interval is a 1° turn.';
};

export type AngleConceptProblem =
    | RecognizeAngleFromArcProblem
    | DeriveOneDegreeProblem
    | InterpretDegreeIterationProblem;

export type ProtractorAngleMeasure = 23 | 37 | 52 | 68 | 90 | 112 | 127 | 143 | 158;
export type SketchAngleMeasure = 30 | 45 | 60 | 75 | 90 | 105 | 120 | 135 | 150;

export type AngleMeasurementGeometry = {
    vertexLabel: 'O';
    baselinePointLabel: 'A';
    terminalPointLabel: 'B';
    baselineSide: 'right' | 'left';
    baselineDegrees: 0 | 180;
    terminalDegrees: number;
    sweepDegrees: number;
    direction: 'counterclockwise' | 'clockwise';
};

export type ProtractorReading = {
    minimumDegrees: 0;
    maximumDegrees: 180;
    tickStepDegrees: 1;
    labelStepDegrees: 10;
    centerLabel: 'O';
    baselinePointLabel: 'A';
    zeroSide: 'right' | 'left';
    readingScale: 'inner' | 'outer';
};

export type MeasureAngleProblem = {
    task: 'measure-angle';
    prompt: 'Use the protractor to measure angle AOB.';
    geometry: AngleMeasurementGeometry;
    protractor: ProtractorReading;
    angleMeasure: ProtractorAngleMeasure;
    questionRelation: 'm∠AOB = ?°';
    solutionRelation: string;
    answer: string;
    answerStatement: string;
    explanation: string;
};

export type SketchAngleProblem = {
    task: 'sketch-angle';
    prompt: string;
    geometry: AngleMeasurementGeometry;
    requestedMeasure: SketchAngleMeasure;
    completedMeasure: SketchAngleMeasure;
    questionRelation: string;
    solutionRelation: string;
    answer: string;
    answerStatement: string;
    explanation: string;
};

export type AngleMeasurementProblem = MeasureAngleProblem | SketchAngleProblem;

export type AngleArithmeticGeometry = {
    vertexLabel: 'O';
    startPointLabel: 'A';
    dividerPointLabel: 'B';
    endPointLabel: 'C';
    leftAngleName: 'AOB';
    rightAngleName: 'BOC';
    wholeAngleName: 'AOC';
    startDegrees: 0;
    dividerDegrees: number;
    endDegrees: number;
    leftSweepDegrees: number;
    rightSweepDegrees: number;
    wholeSweepDegrees: number;
    direction: 'counterclockwise';
};

type AngleArithmeticProblemBase = {
    prompt: string;
    geometry: AngleArithmeticGeometry;
    leftMeasure: number;
    rightMeasure: number;
    wholeMeasure: number;
    relationStatement: 'm∠AOB + m∠BOC = m∠AOC';
    questionEquation: string;
    solutionEquation: string;
    answer: string;
    answerStatement: string;
    explanation: string;
};

export type ExplainAngleAdditionProblem = AngleArithmeticProblemBase & {
    task: 'explain-angle-addition';
    operation: 'addition';
    unknownRole: 'none';
};

export type SolveUnknownWholeAngleProblem = AngleArithmeticProblemBase & {
    task: 'solve-unknown-angle';
    operation: 'addition';
    unknownRole: 'whole';
    wholePartEquation: string;
};

export type SolveUnknownComponentAngleProblem = AngleArithmeticProblemBase & {
    task: 'solve-unknown-angle';
    operation: 'subtraction';
    unknownRole: 'left-component' | 'right-component';
    wholePartEquation: string;
};

export type AngleArithmeticProblem =
    | ExplainAngleAdditionProblem
    | SolveUnknownWholeAngleProblem
    | SolveUnknownComponentAngleProblem;

export type GeometryPrimitiveKind =
    | 'point'
    | 'line'
    | 'line-segment'
    | 'ray'
    | 'right-angle'
    | 'acute-angle'
    | 'obtuse-angle'
    | 'perpendicular-lines'
    | 'parallel-lines';

export type GeometryPrimitiveCoordinate = {
    x: number;
    y: number;
};

export type GeometryPrimitivePoint = GeometryPrimitiveCoordinate & {
    id: string;
    label: string;
    labelPosition: GeometryPrimitiveCoordinate;
};

export type GeometryPrimitiveStroke = {
    id: string;
    start: GeometryPrimitiveCoordinate;
    end: GeometryPrimitiveCoordinate;
    arrowStart: boolean;
    arrowEnd: boolean;
};

export type GeometryPrimitiveMarker =
    | {
        kind: 'angle-arc';
        center: GeometryPrimitiveCoordinate;
        radius: number;
        startDegrees: number;
        endDegrees: number;
    }
    | {
        kind: 'right-angle';
        points: [
            GeometryPrimitiveCoordinate,
            GeometryPrimitiveCoordinate,
            GeometryPrimitiveCoordinate
        ];
    }
    | {
        kind: 'parallel';
        strokes: [
            [GeometryPrimitiveCoordinate, GeometryPrimitiveCoordinate],
            [GeometryPrimitiveCoordinate, GeometryPrimitiveCoordinate]
        ];
    };

export type GeometryPrimitiveScene = {
    points: GeometryPrimitivePoint[];
    strokes: GeometryPrimitiveStroke[];
    markers: GeometryPrimitiveMarker[];
};

export type GeometryPrimitiveCandidateId = 'A' | 'B' | 'C' | 'D';

export type GeometryPrimitiveCandidate = {
    id: GeometryPrimitiveCandidateId;
    kind: GeometryPrimitiveKind;
    scene: GeometryPrimitiveScene;
};

export type GeometryPrimitivesProblem = {
    primitiveKind: GeometryPrimitiveKind;
    displayName: string;
    definition: string;
    drawing: {
        prompt: string;
        guideScene: GeometryPrimitiveScene;
        solutionScene: GeometryPrimitiveScene;
        answer: string;
        answerStatement: string;
        explanation: string;
    };
    identification: {
        prompt: string;
        candidates: [
            GeometryPrimitiveCandidate,
            GeometryPrimitiveCandidate,
            GeometryPrimitiveCandidate,
            GeometryPrimitiveCandidate
        ];
        correctCandidateId: GeometryPrimitiveCandidateId;
        answer: string;
        answerStatement: string;
        explanation: string;
    };
};


/**
 * ViewTypeMap acts as the compile-time contract mapping visual view identifiers
 * to their expected mathematical problem data schemas.
 */
export interface ViewTypeMap {
    'operations-vertical': ArithmeticProblem;
    'operations-multiplicative-comparison': MultiplicativeComparisonProblem;
    'operations-multiplicative-comparison-word-problem': MultiplicativeComparisonProblem;
    'operations-multiplication-area-model': MultiDigitMultiplicationProblem;
    'operations-division-area-model': MultiDigitDivisionProblem;
    'numbers-factors-multiples': FactorMultipleRelationsProblem;
    'operations-boxes': ArithmeticProblem;
    'operations-representation': ArithmeticPairProblem;
    'operations-word-problem': ArithmeticProblem;
    'operations-word-problem-within-100': ArithmeticWordProblemWithin100;
    'operations-properties': ArithmeticTripleProblem;
    'operations-decompose': ArithmeticDecomposeProblem;
    'operations-equation-judgment': EquationJudgmentProblem;
    'operations-answer-reasonableness': ArithmeticEstimationProblem;
    'operations-pattern-table': ArithmeticPatternProblem;
    'operations-pattern-explanation': ArithmeticPatternProblem;
    'numbers-rounding-line': IntegerRoundingProblem;
    'numbers-fraction-line': FractionLineProblem;
    'operations-number-array': NumberArrayProblem;
    'operations-equal-groups': EqualGroupsCollectionProblem;
    'operations-number-line': NumberLineProblem;
    'place-value-compose-teen': PlaceValueTeenProblem;
    'place-value-decompose-teen': PlaceValueTeenProblem;
    'place-value-make-ten': PlaceValueMakeTenProblem;
    'place-value-tens-bundles': PlaceValueBundlesProblem;
    'place-value-hundreds-bundles': PlaceValueBundlesProblem;
    'place-value-expanded-form': PlaceValueExpandedProblem;
    'place-value-arithmetic-model': PlaceValueArithmeticProblem;
    'place-value-arithmetic-explanation': PlaceValueArithmeticProblem;
    'place-value-scaling': PlaceValueScalingProblem;

    'counting-objects-simple': CountingProblem;
    'counting-objects-one-to-one': CountingProblem;
    'counting-objects-cardinality': CountingProblem;
    'counting-objects-count-out': CountingProblem;
    'counting-objects-parity': CountingProblem;
    'counting-inc-dec': CountingIncDecProblem;
    'counting-ten-more-less': CountingIncDecProblem;
    'counting-number-sequence': CountingSequenceProblem;
    'counting-conservation': CountingProblem;
    'sorting-classify-count': CountingClassifyCountProblem;
    'sorting-classify-sort': CountingClassifySortProblem;

    'measure-length-integer': MeasurementStandardProblem;
    'measure-length-decimal': MeasurementStandardProblem;
    'measure-select-tool': MeasurementToolSelectionProblem;
    'measure-unit-scale-relation': MeasurementUnitScaleProblem;
    'measure-conversion': MeasurementConversionProblem;
    'measure-conversion-table': MeasurementConversionProblem;
    'measure-length-estimate': MeasurementEstimateProblem;
    'measure-length-difference': MeasurementLengthDifferenceProblem;
    'measure-attributes': MeasurementAttributeProblem;
    'measure-compare': MeasurementCompareProblem;
    'measure-mediated-comparison': MediatedLengthComparisonProblem;
    'measure-order': MeasurementOrderProblem;

    'numbers-compare': ComparisonProblem;
    'numbers-compare-matching': ComparisonProblem;
    'numbers-compare-counting': ComparisonProblem;

    'numbers-order': OrderingProblem;
    'numbers-write-stroke': WritingProblem;
    'numbers-write-standard': WritingProblem;
    'numbers-write-count': WritingProblem;
    'numbers-read-standard': WritingProblem;
    'numbers-write-name': WritingProblem;
    'time-analog': TimeProblem;
    'time-digital': TimeProblem;
    'time-elapsed': ElapsedTimeProblem;
    'time-interval-word-problem': TimeIntervalWordProblem;
    'measure-liquid-volume': MassVolumeMeasurementProblem;
    'measure-mass': MassVolumeMeasurementProblem;
    'measure-liquid-volume-estimate': MassVolumeEstimateProblem;
    'measure-mass-estimate': MassVolumeEstimateProblem;
    'measurement-word-problem': ArithmeticPairProblem;
    'currency-word-problem': CurrencyArithmeticProblem;
    'measurement-data-table': MeasurementDataProblem;
    'measurement-line-plot': MeasurementDataProblem;
    'measurement-word-problem-grade4': MeasurementWordProblemGrade4;
    'measurement-number-line': MeasurementNumberLineProblem;
    'data-picture-graph': StatisticalGraphProblem;
    'data-bar-graph': StatisticalGraphProblem;

    'shape-naming': ShapeNamingProblem;
    'shape-position': ShapePositionProblem;
    'shape-env-shapes': ShapeEnvShapesProblem;
    'shape-classify-dim': ShapeClassifyDimProblem;
    'shape-compare-attributes': ShapeCompareAttributesProblem;
    'shape-classify-attributes': ShapeAttributeClassificationProblem;
    'shape-line-symmetry': ShapeLineSymmetryProblem;
    'shape-same-attribute': ShapeSameAttributeProblem;
    'shape-build-shape': ShapeBuildShapeProblem;
    'shape-compose-shapes': ShapeComposeShapesProblem;
    'shape-partition-equal': ShapePartitionProblem;
    'shape-patterns': ShapePatternProblem;
    'shape-square-array': ShapeSquareArrayProblem;
    'area-distributive-model': AreaDecompositionProblem;
    'area-rectilinear-decomposition': AreaDecompositionProblem;
    'geometry-perimeter': GeometryPerimeterProblem;
    'area-perimeter-comparison': AreaPerimeterRelationProblem;
    'shape-partition-equivalence': ShapePartitionEquivalenceProblem;
    'geometry-angle-concepts': AngleConceptProblem;
    'geometry-protractor': AngleMeasurementProblem;
    'geometry-angle-drawing': AngleMeasurementProblem;
    'geometry-angle-arithmetic': AngleArithmeticProblem;
    'geometry-primitives-drawing': GeometryPrimitivesProblem;
    'geometry-primitives-identification': GeometryPrimitivesProblem;
    'fractions-equivalence-model': FractionEquivalenceProblem;
    'fractions-whole-equivalence': FractionEquivalenceProblem;
    'fractions-compare-models': FractionComparisonProblem;
    'fractions-operation-model': FractionArithmeticProblem;
    'fractions-word-problem': FractionArithmeticProblem;
    'shape-draw-shape': ShapeBuildShapeProblem;
}
