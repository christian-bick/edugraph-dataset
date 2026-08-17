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

export type IntegerRoundingProblem = {
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

export type MeasurementDataProblem = {
    unit: 'cm' | 'in';
    subdivisions: 1 | 4;
    observations: MeasurementObservation[];
};

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

export type ShapeAttributeClassificationProblem =
    | ShapeDefiningAttributeClassificationProblem
    | ShapeCountClassificationProblem
    | ShapeSubsumptionProblem;

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

export type FractionEquivalenceProblem =
    | ProperFractionEquivalenceProblem
    | WholeNumberFractionEquivalenceProblem;

export type FractionLineProblem = FractionNumberLineProblem | FractionEquivalenceProblem;

export type FractionComparisonProblem = {
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

export type ShapeSquareArrayProblem = {
    task: 'interpret-unit' | 'interpret-coverage' | 'partition' | 'count' | 'count-area' | 'explain-product' | 'calculate-area';
    rows: 1 | 2 | 3 | 4 | 5;
    columns: 1 | 2 | 3 | 4 | 5;
    squareCount: number;
    areaUnit?: 'square units' | 'square centimeters' | 'square meters' | 'square inches' | 'square feet';
};

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

export type GeometryPerimeterProblem =
    | FindPolygonPerimeterProblem
    | FindMissingPolygonSideProblem;

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


/**
 * ViewTypeMap acts as the compile-time contract mapping visual view identifiers
 * to their expected mathematical problem data schemas.
 */
export interface ViewTypeMap {
    'operations-vertical': ArithmeticProblem;
    'operations-multiplicative-comparison': MultiplicativeComparisonProblem;
    'operations-multiplicative-comparison-word-problem': MultiplicativeComparisonProblem;
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
    'data-picture-graph': StatisticalGraphProblem;
    'data-bar-graph': StatisticalGraphProblem;

    'shape-naming': ShapeNamingProblem;
    'shape-position': ShapePositionProblem;
    'shape-env-shapes': ShapeEnvShapesProblem;
    'shape-classify-dim': ShapeClassifyDimProblem;
    'shape-compare-attributes': ShapeCompareAttributesProblem;
    'shape-classify-attributes': ShapeAttributeClassificationProblem;
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
    'fractions-equivalence-model': FractionEquivalenceProblem;
    'fractions-whole-equivalence': FractionEquivalenceProblem;
    'fractions-compare-models': FractionComparisonProblem;
    'shape-draw-shape': ShapeBuildShapeProblem;
}
