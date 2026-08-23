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
    blankPart?: undefined;
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

export type StandardAlgorithmOperation = 'addition' | 'subtraction';

export type StandardAlgorithmColumnStep = {
    placeValue: 1 | 10 | 100 | 1000 | 10000 | 100000;
    topDigit: number;
    bottomDigit: number;
    regroupIn: 0 | 1;
    regroupOut: 0 | 1;
    workingValue: number;
    resultDigit: number;
};

export type StandardAlgorithmProblem = {
    task: 'standard-algorithm';
    operation: StandardAlgorithmOperation;
    topValue: number;
    bottomValue: number;
    result: number;
    columns: readonly StandardAlgorithmColumnStep[];
};

export type KnownFactDerivationStrategy =
    | 'commutative'
    | 'associative'
    | 'inverse-division'
    | 'place-value-scaling';

export type KnownMultiplicationFact = {
    firstFactor: number;
    secondFactor: number;
    product: number;
};

export type KnownFactDerivationProblem = {
    strategy: KnownFactDerivationStrategy;
    operation: 'multiplication' | 'division';
    knownFact: KnownMultiplicationFact;
    derivedOperands: readonly [number, number] | readonly [number, number, number];
    answer: number;
};

export type IntegerAddSubtractStrategy =
    | 'addition-counting-on'
    | 'subtraction-counting-back'
    | 'addition-make-ten'
    | 'addition-near-doubles'
    | 'addition-compensation'
    | 'subtraction-compensation'
    | 'subtraction-make-ten'
    | 'subtraction-think-addition';

export type IntegerAddSubtractStrategyStep = {
    kind: 'decomposition';
    whole: number;
    parts: readonly [number, number];
} | {
    kind: 'operation';
    operation: 'addition' | 'subtraction';
    leftOperand: number;
    rightOperand: number;
    result: number;
};

export type IntegerAddSubtractStrategyProblem = {
    task: 'integer-add-subtract-strategy';
    strategy: IntegerAddSubtractStrategy;
    operation: 'addition' | 'subtraction';
    leftOperand: number;
    rightOperand: number;
    answer: number;
    adjustment: number;
    steps: readonly IntegerAddSubtractStrategyStep[];
};

export type MultiplicativeComparisonProblem = {
    referenceQuantity: number;
    scaleFactor: number;
    comparedQuantity: number;
    operation: 'multiplication' | 'division';
};

export type MultiplicationPlaceValuePart = {
    digit: number;
    placeValue: 1 | 10 | 100 | 1000;
    value: number;
};

export type MultiplicationOperandDecomposition = {
    operand: number;
    parts: readonly MultiplicationPlaceValuePart[];
};

export type MultiplicationPartialProduct = {
    largestPart: MultiplicationPlaceValuePart;
    smallestPart: MultiplicationPlaceValuePart;
    product: number;
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
};

export type DivisionPlaceValuePart = {
    digit: number;
    placeValue: 1 | 10 | 100 | 1000;
    value: number;
};

export type DivisionOperandDecomposition = {
    operand: number;
    parts: readonly DivisionPlaceValuePart[];
};

export type DivisionPartialQuotientStep = {
    quotientDigit: number;
    placeValue: 1 | 10 | 100 | 1000;
    partialQuotient: number;
    remainingBefore: number;
    partialProduct: number;
    remainingAfter: number;
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
};

export type OneDigitMultipleTestProblem = {
    kind: 'one-digit-multiple-test';
    candidate: number;
    divisor: number;
    quotient: number;
    remainder: 0;
    isMultiple: true;
};

export type PrimeClassificationProblem = PositiveFactorEvidence & {
    kind: 'prime-classification';
    classification: 'prime';
};

export type CompositeClassificationProblem = PositiveFactorEvidence & {
    kind: 'composite-classification';
    classification: 'composite';
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
};

export type RemainderInterpretation = 'use-quotient' | 'round-up' | 'use-remainder';

export type ArithmeticWordProblemInterpretedRemainder = {
    kind: 'interpreted-remainder';
    dividend: number;
    divisor: number;
    quotient: number;
    remainder: number;
};

export type ArithmeticWordProblemLetterEquation = {
    kind: 'letter-equation';
    operands: readonly [number, number, number];
    operations: readonly [ArithmeticOperation, ArithmeticOperation];
    intermediate: number;
    answer: number;
};

export type ArithmeticWordProblemReasonableness = {
    kind: 'reasonableness';
    operands: readonly [number, number, number];
    operations: readonly [ArithmeticOperation, ArithmeticOperation];
    intermediate: number;
    exactAnswer: number;
    proposedAnswer: number;
    roundingPlace: 10 | 100 | 1000 | 10000 | 100000;
    roundedExactAnswer: number;
    roundedProposedAnswer: number;
    isReasonable: boolean;
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

export type ArithmeticPatternProblem = {
    operation: 'addition' | 'multiplication';
    headers: number[];
    table: number[][];
    focusRow: number;
    sequence: number[];
    patternStep: number;
    startValue: number;
    ruleOperation: 'add' | 'multiply' | 'multiply-position';
    ruleValue: number;
    ruleText: string;
    terms: readonly number[];
    inferredFeature: string;
    featureEvidence: string;
    explanation: string;
    propertyLaw?: ArithmeticPatternProperty;
    leftExpression?: string;
    rightExpression?: string;
    propertyResult?: number;
    highlightedCells?: Array<[number, number]>;
};

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
    lowerMultiple: number;
    midpoint: number;
    upperMultiple: number;
    roundedValue: number;
    direction: 'down' | 'up';
    distanceLower: number;
    distanceUpper: number;
    isMidpointTie: boolean;
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
};

export type PlaceValueExpandedProblem =
    | LegacyPlaceValueExpandedProblem
    | MultiDigitPlaceValueExpandedProblem;

export type PlaceValueDigits = {hundreds: number; tens: number; ones: number};

export type PlaceValueArithmeticOperandProfile =
    | 'general'
    | 'two-digit-single-digit'
    | 'two-digit-multiple-of-ten'
    | 'multiples-of-ten';

export type PlaceValueRegroupingEvidence = {
    kind: 'none' | 'compose-ten' | 'decompose-ten';
    onesBefore: number;
    onesAfter: number;
    tensExchanged: 0 | 1;
};

export type PlaceValueArithmeticStep = {
    kind: 'combine-ones' | 'compose-ten' | 'decompose-ten' | 'combine-tens' | 'subtract-ones' | 'subtract-tens' | 'result';
    place: 'ones' | 'tens' | 'hundreds' | 'result';
};

export type PlaceValueArithmeticProblem = {
    num1: number;
    num2: number;
    answer: number;
    operation: 'addition' | 'subtraction';
    operandProfile: PlaceValueArithmeticOperandProfile;
    operands: [PlaceValueDigits, PlaceValueDigits];
    result: PlaceValueDigits;
    regrouping: PlaceValueRegroupingEvidence;
    strategySteps: readonly [PlaceValueArithmeticStep, PlaceValueArithmeticStep, PlaceValueArithmeticStep];
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

export type MeasurementConversionPair = {
    id: MeasurementConversionPairId;
    quantityKind: 'length' | 'weight' | 'liquid-volume' | 'time';
    scalingKind: 'magnitude' | 'factor';
    largerUnit: MeasurementConversionUnitId;
    smallerUnit: MeasurementConversionUnitId;
    factor: 16 | 60 | 100 | 1000;
};

type MeasurementConversionProblemBase = {
    pair: MeasurementConversionPair;
};

export type GenericUnitScaleRelationProblem = {
    task: 'generic-unit-scale';
    largeUnitCount: number;
    smallUnitCount: number;
    unitsPerLarge: number;
};

export type RelativeUnitSizeProblem = MeasurementConversionProblemBase & {
    task: 'relative-unit-size';
    exampleLargerValue: number;
    exampleSmallerValue: number;
};

export type LargerToSmallerConversionProblem = MeasurementConversionProblemBase & {
    task: 'convert-larger-to-smaller';
    sourceValue: number;
    convertedValue: number;
};

export type MeasurementConversionTableRow = {
    largerValue: number;
    smallerValue: number;
};

export type MeasurementConversionTableProblem = MeasurementConversionProblemBase & {
    task: 'conversion-table';
    rows: readonly MeasurementConversionTableRow[];
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

/** Exact measured value. Its numeric value is numerator / denominator. */
export type MeasurementWordProblemValue = {
    numerator: number;
    denominator: number;
};

export type MeasurementWordProblemMeasuredOperand = {
    role: 'measured';
    value: MeasurementWordProblemValue;
};

export type MeasurementWordProblemGroupOperand = {
    role: 'group-count';
    count: number;
};

type MeasurementWordProblemBase = {
    measurementKind: MeasurementWordProblemKind;
    numberKind: MeasurementWordProblemNumberKind;
    unitId: MeasurementWordProblemUnitId;
    answer: MeasurementWordProblemValue;
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
    }
    | {
        kind: 'all-equal';
    };

export type MultiDigitComparisonProblem = {
    task: 'multi-digit-place-value-comparison';
    num1: number;
    num2: number;
    relation: 'less' | 'greater' | 'equal';
    evidence: MultiDigitComparisonEvidence;
};

export type ComparisonProblem = LegacyComparisonProblem | MultiDigitComparisonProblem;

export type OrderingProblem = {
    numbers: number[];
};

export type LegacyWritingProblem = {
    number: number;
};

export type MultiDigitWritingProblem = {
    number: number;
    placeValues: WholeNumberPlaceValue[];
};

export type WritingProblem =
    | LegacyWritingProblem
    | MultiDigitWritingProblem;

/** Shared payload accepted by the number-line view for representation and pair arithmetic. */
export type NumberLineProblem = WritingProblem | ArithmeticPairProblem;

export type TimeIntervalSeconds = 1 | 60 | 1800 | 3600;

export type TimeProblem = {
    secondsSinceMidnight: number;
    intervalSeconds: TimeIntervalSeconds;
    period?: 'ante-meridiem' | 'post-meridiem';
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
    startTime: string;
    endTime: string;
    elapsedMinutes: number;
    referenceHour: number;
    startOffsetMinutes: number;
    endOffsetMinutes: number;
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
    value: number;
};

export type MeasurementExtremaRelation = {
    operation: 'addition' | 'subtraction';
    shortest: number;
    longest: number;
    leftOperand: number;
    rightOperand: number;
    answer: number;
};

export type MeasurementDataProblem = {
    unit: 'cm' | 'in';
    subdivisions: 1 | 4 | 8;
    observations: MeasurementObservation[];
    extremaRelation?: MeasurementExtremaRelation;
};

export type StatisticalCategory = {
    label: 'Apples' | 'Books' | 'Kites';
    count: number;
};

export type StatisticalGraphProblem = {
    categories: readonly [StatisticalCategory, StatisticalCategory, StatisticalCategory];
    scale: 1 | 2 | 5 | 10;
    operation?: 'addition' | 'subtraction';
    operandIndices?: [number, number] | [number, number, number];
    intermediate?: number;
    answer?: number;
    rawObservations?: readonly StatisticalCategory['label'][];
};

// --- Shape Split Problem Types ---

export type ShapeNamingProblem = {
    shape: string;
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

export type ShapeComparisonName =
    | 'triangle'
    | 'square'
    | 'rectangle'
    | 'hexagon'
    | 'circle'
    | 'cube'
    | 'cone'
    | 'cylinder'
    | 'sphere';

export type ShapeComparisonAttribute = 'sides' | 'vertices' | 'faces' | 'edges';

export type ShapeComparisonItem = {
    shape: ShapeComparisonName;
    count: number;
};

export type ShapeCompareAttributesProblem = {
    dimension: '2d' | '3d';
    attribute: ShapeComparisonAttribute;
    shapes: readonly [ShapeComparisonItem, ShapeComparisonItem];
    relation: 'more';
    answer: ShapeComparisonName;
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

export type ShapeDefiningAttribute =
    | {kind: 'closed'}
    | {kind: 'boundary'; value: 'curved' | 'straight'}
    | {kind: 'side-count'; value: ShapeDefinition['sideCount']}
    | {kind: 'vertex-count'; value: ShapeDefinition['vertexCount']}
    | {kind: 'equal-sides'; value: true}
    | {kind: 'right-angle-count'; value: 4};

export type ShapeDefiningAttributeClassificationProblem = {
    shape: PlaneShapeName;
    definition: ShapeDefinition;
    definingAttribute: ShapeDefiningAttribute;
    task?: undefined;
};

export type ShapeCountAttribute = 'vertices' | 'angles' | 'equal-faces';

export type ShapeCountOptionName =
    | PlaneShapeName
    | 'cube'
    | 'rectangular-prism'
    | 'triangular-prism'
    | 'square-pyramid';

export type ShapeCountOption = {
    shape: ShapeCountOptionName;
    count: number;
    satisfies: boolean;
};

export type ShapeCountClassificationProblem = {
    task: 'classify-count';
    attribute: ShapeCountAttribute;
    requiredCount: number;
    options: ShapeCountOption[];
};

export type QuadrilateralSubtypeName = 'rhombus' | 'rectangle' | 'square';

export type ShapeCategoryOption = {
    category: 'triangle' | 'quadrilateral' | 'pentagon' | 'hexagon';
    satisfies: boolean;
};

export type ShapeSubsumptionProblem = {
    task: 'classify-quadrilateral-subcategory';
    shape: QuadrilateralSubtypeName;
    definition: ShapeDefinition;
    category: 'quadrilateral';
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
    figure: ShapeClassificationFigure;
    relations: Array<'parallel' | 'perpendicular'>;
    evidenceStrokes: [ShapeClassificationStroke, ShapeClassificationStroke];
    marker: ShapeClassificationMarker | null;
    satisfies: boolean;
};

export type ShapeLineRelationClassificationProblem = {
    task: 'classify-line-relation';
    criterion: 'parallel' | 'perpendicular';
    options: [
        ShapeLineRelationOption,
        ShapeLineRelationOption,
        ShapeLineRelationOption,
        ShapeLineRelationOption
    ];
};

export type ShapeAngleClassOption = {
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
    options: [
        ShapeAngleClassOption,
        ShapeAngleClassOption,
        ShapeAngleClassOption,
        ShapeAngleClassOption
    ];
};

export type ShapeRightTriangleOption = {
    figure: ShapeClassificationFigure;
    angleClasses: Array<'right' | 'acute' | 'obtuse'>;
    angleClass: 'right' | 'acute' | 'obtuse';
    evidenceRays: [ShapeClassificationStroke, ShapeClassificationStroke];
    marker: ShapeClassificationMarker;
    satisfies: boolean;
};

export type RightTriangleCategoryProblem = {
    task: 'classify-right-triangle-category';
    options: [
        ShapeRightTriangleOption,
        ShapeRightTriangleOption,
        ShapeRightTriangleOption,
        ShapeRightTriangleOption
    ];
    category: 'triangle';
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
    options: [
        LineSymmetryIdentificationOption,
        LineSymmetryIdentificationOption,
        LineSymmetryIdentificationOption,
        LineSymmetryIdentificationOption
    ];
    answerIds: [ShapeAttributeOption['id'], ShapeAttributeOption['id']];
};

export type DrawLineSymmetryProblem = {
    figure: LineSymmetryFigure;
    completedAxes: LineSymmetryAxis[];
};

export type ShapeLineSymmetryProblem = {
    identification: IdentifyLineSymmetryProblem;
    drawing: DrawLineSymmetryProblem;
};

export type ShapePartsConstructionProblem = {
    target: PlaneShapeName;
    sides: number;
    corners: number;
    task?: undefined;
    definition?: undefined;
};

export type ShapeLoosePartsConstructionProblem = {
    target: 'triangle' | 'square' | 'rectangle' | 'hexagon';
    sides: 3 | 4 | 6;
    corners: 3 | 4 | 6;
    task: 'assemble-from-parts';
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
    | ShapeLoosePartsConstructionProblem
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
    task: 'relate-equivalent-fractions';
    first: FractionValue;
    second: FractionValue;
    scaleFactor: 2 | 3 | 4;
    relation: 'equal';
    equation: string;
};

export type WholeNumberFractionEquivalenceProblem = {
    task: 'represent-whole-as-fraction';
    wholeNumber: 1 | 2 | 3;
    fraction: FractionValue;
    relation: 'equal';
    equation: string;
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
    models: {
        tenths: TenthsHundredthsGridModel;
        hundredths: TenthsHundredthsGridModel;
    };
    relation: 'equal';
    equation: string;
};

export type FractionEquivalenceProblem =
    | ProperFractionEquivalenceProblem
    | WholeNumberFractionEquivalenceProblem
    | TenthsToHundredthsProblem;

export type FractionLineProblem = FractionNumberLineProblem | FractionEquivalenceProblem;

export type LegacyFractionComparisonProblem = {
    task: 'compare-fractions';
    first: FractionValue;
    second: FractionValue;
    family: 'common-denominator' | 'common-numerator';
    sharedComponent: number;
    relation: 'greater' | 'less';
    sharedWhole: 1;
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
    lowerWhole: number;
    upperWhole: number;
    boundsStatement: string;
};

export type WholeNumberFractionProductProblem = WholeNumberFractionProductCommon & {
    task: 'whole-number-fraction-product';
};

export type FractionMultiplicationWordProblem = WholeNumberFractionProductCommon & {
    task: 'fraction-multiplication-problem';
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

export type DecimalNotationValue = {
    numerator: number;
    denominator: 10 | 100;
    wholeDigit: 0;
    tenthsDigit: number;
    hundredthsDigit: number | null;
    hundredthsNumerator: number;
};

export type DecimalNotationProblem = {
    task: 'decimal-notation';
    sharedWhole: 1;
    relation: 'equal';
    value: DecimalNotationValue;
};

export type DecimalComparisonOperand = {
    role: 'left' | 'right';
    decimalNotation: string;
    normalizedHundredthsNotation: string;
    precision: 'tenths' | 'hundredths';
    wholeDigit: 0;
    tenthsDigit: number;
    hundredthsDigit: number | null;
    normalizedHundredths: number;
    placeValueRow: {
        ones: '0';
        tenths: string;
        hundredths: string;
    };
    model: TenthsHundredthsGridModel;
};

export type DecimalComparisonProblem = {
    task: 'compare-decimals';
    sharedWhole: 1;
    relation: 'greater' | 'equal' | 'less';
    symbol: '>' | '=' | '<';
    left: DecimalComparisonOperand & {role: 'left'};
    right: DecimalComparisonOperand & {role: 'right'};
    firstDecidingPlace: 'tenths' | 'hundredths' | 'equal';
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
        model: 'equal-share-partition';
        shape: FractionShape;
        parts: FractionParts;
        wholeCount: 1;
        unitFraction: string | null;
    }
    | {
        model: 'unit-share-comparison';
        shape: FractionShape;
        unitFractions: [
            {numerator: 1; denominator: 2; display: '1/2'},
            {numerator: 1; denominator: 4; display: '1/4'}
        ];
        relation: 'less';
        lesserFraction: '1/4';
    }
    | {
        model: 'fraction-region';
        shape: FractionShape;
        parts: FractionParts;
        numerator: number;
        unitFraction: string;
        fraction: string;
    };

export type ShapePatternToken = {
    shape: 'square' | 'triangle';
    orientation: 0 | 90 | 180 | 270;
};

export type ShapePatternTerm = {
    position: number;
    tokens: ShapePatternToken[];
};

type ShapePatternProblemBase = {
    sequence: ShapePatternTerm[];
};

export type ShapePatternProblem = ShapePatternProblemBase & (
    | {
        patternKind: 'growth-parity';
        recurrence: {
            kind: 'add-square';
            initialSquareCount: 1;
            squareCountIncrease: 1;
        };
        emergentFeature: {
            kind: 'position-count-parity';
        };
    }
    | {
        patternKind: 'rotation-axis';
        recurrence: {
            kind: 'quarter-turn-clockwise';
            initialOrientation: 0;
            quarterTurnsPerTerm: 1;
        };
        emergentFeature: {
            kind: 'position-axis-parity';
        };
    }
);

export type SquareAreaUnit =
    | 'square units'
    | 'square centimeters'
    | 'square meters'
    | 'square inches'
    | 'square feet';

export type UnitSquareModel = {
    model: 'unit-square';
    rows: 1;
    columns: 1;
    squareCount: 1;
    areaUnit: 'square units';
};

export type SquareArrayModel = {
    model:
        | 'equal-square-array'
        | 'unit-square-coverage'
        | 'tiled-area-product'
        | 'rectangle-area-product';
    rows: 2 | 3 | 4 | 5;
    columns: 2 | 3 | 4 | 5;
    squareCount: number;
    areaUnit: SquareAreaUnit;
};

export type RectangleAreaFormulaModel = {
    model: 'rectangle-area-formula';
    rows: 2 | 3 | 4 | 5;
    columns: 2 | 3 | 4 | 5;
    squareCount: number;
    length: number;
    width: number;
    area: number;
    areaUnit: 'square units';
    formula: 'A = length × width';
};

export type ShapeSquareArrayProblem =
    | UnitSquareModel
    | SquareArrayModel
    | RectangleAreaFormulaModel;

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
    unknownSideIndex: number;
    knownSideTotal: number;
};

export type PolygonPerimeterProblem = GeometryPerimeterProblemBase;

type RectanglePerimeterFormulaBase = {
    shape: 'rectangle';
    vertices: PolygonVertex[];
    sideLengths: [number, number, number, number];
    length: number;
    width: number;
    perimeter: number;
    unit: 'units';
    formula: 'P = length + width + length + width';
    unknownDimension: 'length' | 'width';
    knownDimension: 'length' | 'width';
    knownValue: number;
    missingValue: number;
    knownSideTotal: number;
};

export type RectanglePerimeterProblem = RectanglePerimeterFormulaBase;

export type GeometryPerimeterProblem =
    | PolygonPerimeterProblem
    | RectanglePerimeterProblem;

export type RectangleMeasures = {
    width: number;
    height: number;
    area: number;
    perimeter: number;
};

type AreaPerimeterRelationBase = {
    first: RectangleMeasures;
    second: RectangleMeasures;
};

export type AreaPerimeterRelationProblem = AreaPerimeterRelationBase & (
    | {
        relation: 'equal-perimeter';
    }
    | {
        relation: 'equal-area';
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
    | {numerator: 1; denominator: 6}
    | {numerator: 1; denominator: 4}
    | {numerator: 1; denominator: 3}
    | {numerator: 1; denominator: 2};

export type AngleConceptGeometry = {
    fullTurnDegrees: 360;
    startDegrees: 0;
    endDegrees: number;
    sweepDegrees: number;
    direction: 'counterclockwise';
    tickDegrees: number[];
};

type AngleConceptProblemBase = {
    geometry: AngleConceptGeometry;
};

export type RecognizeAngleFromArcProblem = AngleConceptProblemBase & {
    task: 'recognize-angle-from-arc';
    arcFraction: AngleConceptFraction;
};

export type DeriveOneDegreeProblem = AngleConceptProblemBase & {
    task: 'derive-one-degree';
    partitionCount: 360;
    selectedParts: 1;
    unitFraction: {numerator: 1; denominator: 360};
    degreeMeasure: 1;
};

export type InterpretDegreeIterationProblem = AngleConceptProblemBase & {
    task: 'interpret-degree-iteration';
    unitDegree: 1;
    iterationCount: number;
    angleMeasure: number;
};

export type AngleConceptProblem =
    | RecognizeAngleFromArcProblem
    | DeriveOneDegreeProblem
    | InterpretDegreeIterationProblem;

export type ProtractorAngleMeasure = 23 | 37 | 52 | 68 | 90 | 112 | 127 | 143 | 158;
export type SketchAngleMeasure = 30 | 45 | 60 | 75 | 90 | 105 | 120 | 135 | 150;

export type AngleMeasure = ProtractorAngleMeasure | SketchAngleMeasure;

export type AngleMeasurementProblem = {
    angleMeasure: AngleMeasure;
};

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

export type AngleArithmeticProblem = {
    operation: 'addition' | 'subtraction';
    geometry: AngleArithmeticGeometry;
    leftMeasure: number;
    rightMeasure: number;
    wholeMeasure: number;
    relationStatement: 'm∠AOB + m∠BOC = m∠AOC';
};

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
};


/**
 * ViewTypeMap acts as the compile-time contract mapping visual view identifiers
 * to their expected mathematical problem data schemas.
 */
export interface ViewTypeMap {
    'operations-vertical': ArithmeticProblem;
    'operations-vertical-inversion': ArithmeticProblem;
    'operations-standard-algorithm': StandardAlgorithmProblem;
    'operations-known-fact-derivation': KnownFactDerivationProblem;
    'operations-known-fact-inversion': KnownFactDerivationProblem;
    'operations-add-subtract-strategy-understanding': IntegerAddSubtractStrategyProblem;
    'operations-counting-on-operation-derivation': IntegerAddSubtractStrategyProblem;
    'operations-counting-back-operation-derivation': IntegerAddSubtractStrategyProblem;
    'operations-multiplicative-comparison': MultiplicativeComparisonProblem;
    'operations-multiplicative-comparison-word-problem': MultiplicativeComparisonProblem;
    'operations-multiplication-area-model': MultiDigitMultiplicationProblem;
    'operations-division-area-model': MultiDigitDivisionProblem;
    'numbers-factors-multiples': FactorMultipleRelationsProblem;
    'numbers-prime-classification': FactorMultipleRelationsProblem;
    'numbers-composite-classification': FactorMultipleRelationsProblem;
    'operations-boxes': ArithmeticProblem;
    'operations-boxes-inversion': ArithmeticProblem;
    'operations-representation': ArithmeticPairProblem;
    'operations-word-problem': ArithmeticProblem;
    'operations-word-problem-inversion': ArithmeticProblem;
    'operations-word-problem-within-100': ArithmeticWordProblemWithin100;
    'operations-word-problem-within-100-inversion': ArithmeticPairProblem;
    'operations-word-problem-remainder-interpretation': ArithmeticWordProblemMultistep;
    'operations-word-problem-equation-formalization': ArithmeticWordProblemMultistep;
    'operations-word-problem-reasoning': ArithmeticWordProblemMultistep;
    'operations-properties': ArithmeticTripleProblem;
    'operations-decompose': ArithmeticDecomposeProblem;
    'operations-equation-judgment': EquationJudgmentProblem;
    'operations-answer-reasonableness': ArithmeticEstimationProblem;
    'operations-pattern-table': ArithmeticPatternProblem;
    'operations-pattern-explanation': ArithmeticPatternProblem;
    'operations-pattern-feature-explanation': ArithmeticPatternProblem;
    'operations-pattern-feature-table': ArithmeticPatternProblem;
    'operations-pattern-generation-practice': ArithmeticPatternProblem;
    'operations-pattern-generation-table': ArithmeticPatternProblem;
    'numbers-rounding-line': IntegerRoundingProblem;
    'numbers-fraction-line': FractionLineProblem;
    'numbers-fraction-line-classification': FractionLineProblem;
    'numbers-fraction-line-formalization': FractionLineProblem;
    'numbers-fraction-line-explanation': FractionLineProblem;
    'operations-number-array-total': NumberArrayProblem;
    'operations-number-array-equation-formalization': NumberArrayProblem;
    'operations-number-array-interpretation': NumberArrayProblem;
    'operations-equal-groups': EqualGroupsCollectionProblem;
    'operations-number-line-representation': WritingProblem;
    'operations-number-line-arithmetic': ArithmeticPairProblem;
    'place-value-compose-teen': PlaceValueTeenProblem;
    'place-value-decompose-teen': PlaceValueTeenProblem;
    'place-value-make-ten': PlaceValueMakeTenProblem;
    'place-value-tens-bundles': PlaceValueBundlesProblem;
    'place-value-hundreds-bundles': PlaceValueBundlesProblem;
    'place-value-expanded-form': PlaceValueExpandedProblem;
    'place-value-arithmetic-model': PlaceValueArithmeticProblem;
    'place-value-arithmetic-written-method': PlaceValueArithmeticProblem;
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
    'measure-conversion-derivation': MeasurementConversionProblem;
    'measure-conversion-execution': MeasurementConversionProblem;
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
    'numbers-place-value-comparison': ComparisonProblem;

    'numbers-order': OrderingProblem;
    'numbers-write-stroke': WritingProblem;
    'numbers-write-standard': WritingProblem;
    'numbers-write-count': WritingProblem;
    'numbers-read-standard': WritingProblem;
    'numbers-write-name': WritingProblem;
    'time-analog': TimeProblem;
    'time-analog-construction': TimeProblem;
    'time-digital': TimeProblem;
    'time-digital-construction': TimeProblem;
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
    'measurement-line-plot-arithmetic': MeasurementDataProblem;
    'measurement-word-problem-grade4': MeasurementWordProblemGrade4;
    'measurement-number-line': MeasurementNumberLineProblem;
    'data-picture-graph': StatisticalGraphProblem;
    'data-bar-graph': StatisticalGraphProblem;
    'data-bar-graph-arithmetic': StatisticalGraphProblem;
    'data-bar-graph-classification': StatisticalGraphProblem;
    'data-bar-graph-interpretation': StatisticalGraphProblem;
    'data-picture-graph-arithmetic': StatisticalGraphProblem;
    'data-picture-graph-classification': StatisticalGraphProblem;
    'data-picture-graph-interpretation': StatisticalGraphProblem;

    'shape-naming': ShapeNamingProblem;
    'shape-position': ShapePositionProblem;
    'shape-env-shapes': ShapeEnvShapesProblem;
    'shape-classify-dim': ShapeClassifyDimProblem;
    'shape-compare-attributes': ShapeCompareAttributesProblem;
    'shape-classify-attributes': ShapeAttributeClassificationProblem;
    'shape-line-symmetry-drawing': ShapeLineSymmetryProblem;
    'shape-line-symmetry-identification': ShapeLineSymmetryProblem;
    'shape-same-attribute': ShapeSameAttributeProblem;
    'shape-build-shape': ShapeBuildShapeProblem;
    'shape-compose-shapes': ShapeComposeShapesProblem;
    'shape-partition-equal': ShapePartitionProblem;
    'shape-partition-fraction-interpretation': ShapePartitionProblem;
    'shape-partition-share-comparison': ShapePartitionProblem;
    'shape-partition-share-name': ShapePartitionProblem;
    'shape-partition-unit-fraction': ShapePartitionProblem;
    'shape-partition-whole-composition': ShapePartitionProblem;
    'shape-patterns': ShapePatternProblem;
    'shape-patterns-explanation': ShapePatternProblem;
    'shape-patterns-identification': ShapePatternProblem;
    'shape-square-array': ShapeSquareArrayProblem;
    'shape-square-array-interpretation': ShapeSquareArrayProblem;
    'shape-square-array-inversion': ShapeSquareArrayProblem;
    'shape-square-array-partition': ShapeSquareArrayProblem;
    'shape-square-array-story': ShapeSquareArrayProblem;
    'shape-square-array-understanding': ShapeSquareArrayProblem;
    'area-distributive-model': AreaDecompositionProblem;
    'area-rectilinear-decomposition': AreaDecompositionProblem;
    'geometry-perimeter': GeometryPerimeterProblem;
    'geometry-perimeter-inversion': GeometryPerimeterProblem;
    'area-perimeter-comparison': AreaPerimeterRelationProblem;
    'area-perimeter-construction': AreaPerimeterRelationProblem;
    'shape-partition-equivalence': ShapePartitionEquivalenceProblem;
    'geometry-angle-concepts': AngleConceptProblem;
    'geometry-angle-one-degree-derivation': AngleConceptProblem;
    'geometry-protractor': AngleMeasurementProblem;
    'geometry-angle-drawing': AngleMeasurementProblem;
    'geometry-angle-arithmetic': AngleArithmeticProblem;
    'geometry-angle-arithmetic-execution': AngleArithmeticProblem;
    'geometry-angle-arithmetic-inversion': AngleArithmeticProblem;
    'geometry-primitives-drawing': GeometryPrimitivesProblem;
    'geometry-primitives-identification': GeometryPrimitivesProblem;
    'fractions-equivalence-model': FractionEquivalenceProblem;
    'fractions-equivalence-completion-model': FractionEquivalenceProblem;
    'fractions-equivalence-explanation-model': FractionEquivalenceProblem;
    'fractions-whole-equivalence': FractionEquivalenceProblem;
    'fractions-compare-benchmark-models': FractionComparisonProblem;
    'fractions-compare-models': FractionComparisonProblem;
    'fractions-interpretation-model': FractionArithmeticProblem;
    'fractions-operation-model': FractionArithmeticProblem;
    'fractions-understanding-model': FractionArithmeticProblem;
    'fractions-word-problem': FractionArithmeticProblem;
    'numbers-fraction-to-decimal': DecimalNotationProblem;
    'numbers-decimal-to-fraction': DecimalNotationProblem;
    'numbers-decimal-line': DecimalNotationProblem;
    'numbers-decimal-measurement': DecimalNotationProblem;
    'numbers-decimal-comparison': DecimalComparisonProblem;
    'shape-draw-shape': ShapeBuildShapeProblem;
}
