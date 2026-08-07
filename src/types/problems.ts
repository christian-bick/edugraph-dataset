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
    propertyLaw?: 'commutative' | 'associative';
    blankPart?: undefined;
};

/** Shared payload accepted by arithmetic views that render both pairs and triples. */
export type ArithmeticProblem = ArithmeticPairProblem | ArithmeticTripleProblem;

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

export type PlaceValueTeenProblem = {
    ones: number;
    target: number;
};

export type PlaceValueBundlesProblem = {
    tens: number;
    ones: 0;
    target: number;
};

export type PlaceValueMakeTenProblem = {
    givenNumber: number;
    missingNumber: number;
    target: 10;
};

export type CountingProblem = {
    numObjects: number;
    simpleAnswer: number;
};

export type CountingIncDecProblem = {
    numObjects: number;
    incDecType: 'inc' | 'dec';
    incDecAnswer: number;
    simpleAnswer: number;
    stepSize: 1 | 10;
    startPlaceValue: {tens: number; ones: number};
    resultPlaceValue: {tens: number; ones: number};
};

export type CountingSequenceProblem = {
    sequence: number[];
    missingIndex: number;
    answer: number;
    stepSize: 1 | 10;
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
};

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

export type TimeProblem = {
    time: string;
    interval: number;
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

export type PlaneShapeName = 'circle' | 'triangle' | 'square' | 'rectangle' | 'hexagon';

export type ShapeDefinition = {
    sideCount: 0 | 3 | 4 | 6;
    vertexCount: 0 | 3 | 4 | 6;
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

export type ShapeAttributeClassificationProblem = {
    shape: PlaneShapeName;
    definition: ShapeDefinition;
    options: ShapeAttributeOption[];
    answer: ShapeAttributeOption['id'];
};

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

export type ShapeBuildShapeProblem = ShapePartsConstructionProblem | ShapeAttributeSpecificationProblem;

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

export type ShapePartitionProblem = {
    shape: 'circle' | 'rectangle';
    parts: 2 | 4;
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
    'operations-properties': ArithmeticTripleProblem;
    'operations-decompose': ArithmeticDecomposeProblem;
    'operations-equation-judgment': EquationJudgmentProblem;
    'place-value-compose-teen': PlaceValueTeenProblem;
    'place-value-decompose-teen': PlaceValueTeenProblem;
    'place-value-make-ten': PlaceValueMakeTenProblem;
    'place-value-tens-bundles': PlaceValueBundlesProblem;

    'counting-objects-simple': CountingProblem;
    'counting-objects-one-to-one': CountingProblem;
    'counting-objects-cardinality': CountingProblem;
    'counting-objects-count-out': CountingProblem;
    'counting-inc-dec': CountingIncDecProblem;
    'counting-ten-more-less': CountingIncDecProblem;
    'counting-number-sequence': CountingSequenceProblem;
    'counting-conservation': CountingProblem;
    'sorting-classify-count': CountingClassifyCountProblem;
    'sorting-classify-sort': CountingClassifySortProblem;

    'measure-length-integer': MeasurementStandardProblem;
    'measure-length-decimal': MeasurementStandardProblem;
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
    'time-analog': TimeProblem;
    'time-digital': TimeProblem;

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
    'shape-draw-shape': ShapeDrawProblem;
}
