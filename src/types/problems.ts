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

/** Shared payload for within-100 one-step and connected two-step word problems. */
export type ArithmeticWordProblemWithin100 = ArithmeticPairProblem | ArithmeticWordProblemTwoStep;

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

export type PlaceValueExpandedProblem = {
    number: number;
    terms: number[];
};

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

export type ComparisonProblem = {
    num1: number;
    num2: number;
    relation: 'less' | 'greater' | 'equal';
};

export type OrderingProblem = {
    numbers: number[];
};

export type WritingProblem = {
    number: number;
};

/** Shared payload accepted by the number-line view for representation and pair arithmetic. */
export type NumberLineProblem = WritingProblem | ArithmeticPairProblem;

export type TimeProblem = {
    time: string;
    interval: number;
    period?: 'a.m.' | 'p.m.';
};

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
    unit: 'cm';
    observations: MeasurementObservation[];
};

export type StatisticalCategory = {
    label: 'Apples' | 'Books' | 'Kites';
    count: number;
};

export type StatisticalGraphProblem = {
    categories: StatisticalCategory[];
    operation?: 'addition' | 'subtraction';
    operandIndices?: [number, number];
    answer?: number;
};

// --- Shape Split Problem Types ---

export type ShapeIdentityProblem = {
    shape: string;
    answer: string;
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
    equalSides?: true;
    rightAngleCount?: 4;
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

export type ShapeAttributeClassificationProblem =
    | ShapeDefiningAttributeClassificationProblem
    | ShapeCountClassificationProblem;

export type ShapePartsConstructionProblem = {
    target: PlaneShapeName;
    sides: number;
    corners: number;
    task?: undefined;
    definition?: undefined;
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
    | ShapeAttributeSpecificationProblem
    | ShapeAttributeCountSpecificationProblem;

/** Shared payload accepted by the legacy tracing and defining-attribute drawing modes. */
export type ShapeDrawProblem = ShapeIdentityProblem | ShapeBuildShapeProblem;

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
export type FractionParts = 2 | 4;
export type FractionShareName = 'half' | 'fourth' | 'quarter';

export type ShapePartitionProblem =
    | {
        task: 'partition';
        shape: FractionShape;
        parts: FractionParts;
    }
    | {
        task: 'name-share';
        shape: FractionShape;
        parts: FractionParts;
        shareName: FractionShareName;
        /** Zero-based index of the share being named. */
        selectedShare: number;
        answer: FractionShareName;
    }
    | {
        task: 'compose-whole';
        shape: FractionShape;
        parts: FractionParts;
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
    };

export type ShapeSquareArrayProblem = {
    task: 'partition' | 'count';
    rows: 2 | 3 | 4 | 5;
    columns: 2 | 3 | 4 | 5;
    squareCount: number;
};

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
    'operations-boxes': ArithmeticProblem;
    'operations-representation': ArithmeticPairProblem;
    'operations-word-problem': ArithmeticProblem;
    'operations-word-problem-within-100': ArithmeticWordProblemWithin100;
    'operations-properties': ArithmeticTripleProblem;
    'operations-decompose': ArithmeticDecomposeProblem;
    'operations-equation-judgment': EquationJudgmentProblem;
    'operations-answer-reasonableness': ArithmeticEstimationProblem;
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
    'currency-word-problem': CurrencyArithmeticProblem;
    'measurement-data-table': MeasurementDataProblem;
    'measurement-line-plot': MeasurementDataProblem;
    'data-picture-graph': StatisticalGraphProblem;
    'data-bar-graph': StatisticalGraphProblem;

    'shape-naming': ShapeIdentityProblem;
    'shape-position': ShapePositionProblem;
    'shape-env-shapes': ShapeEnvShapesProblem;
    'shape-classify-dim': ShapeClassifyDimProblem;
    'shape-compare-attributes': ShapeCompareAttributesProblem;
    'shape-classify-attributes': ShapeAttributeClassificationProblem;
    'shape-same-attribute': ShapeSameAttributeProblem;
    'shape-build-shape': ShapeBuildShapeProblem;
    'shape-compose-shapes': ShapeComposeShapesProblem;
    'shape-partition-equal': ShapePartitionProblem;
    'shape-square-array': ShapeSquareArrayProblem;
    'shape-partition-equivalence': ShapePartitionEquivalenceProblem;
    'shape-draw-shape': ShapeDrawProblem;
}
