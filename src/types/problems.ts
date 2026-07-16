export type ArithmeticStandardProblem = {
    num1: number;
    num2: number;
    operation: 'addition' | 'subtraction' | 'multiplication' | 'division';
    answer: number;
};

export type ArithmeticRepresentationProblem = {
    operation: 'addition' | 'subtraction';
    num1: number;
    num2: number;
    answer: number;
};

export type ArithmeticWordProblem = {
    operation: 'addition' | 'subtraction';
    num1: number;
    num2: number;
    answer: number;
    textScenario: string;
};

export type ArithmeticDecomposeProblem = {
    targetNumber: number;
    pair1: [number, number];
    pair2: [number, number];
};

export type PlaceValueComposeTeenProblem = {
    ones: number;
    target: number;
};

export type PlaceValueDecomposeTeenProblem = {
    ones: number;
    target: number;
};

export type PlaceValueMakeTenProblem = {
    givenNumber: number;
    missingNumber: number;
    target: 10;
};

export type CountingSimpleProblem = {
    numObjects: number;
    simpleAnswer: number;
    arrangement: string;
};

export type CountingOneToOneProblem = {
    numObjects: number;
    simpleAnswer: number;
    arrangement: string;
};

export type CountingCardinalityProblem = {
    numObjects: number;
    simpleAnswer: number;
    arrangement: string;
};

export type CountingCountOutProblem = {
    numObjects: number;
    simpleAnswer: number;
    arrangement: string;
    totalCount: number;
};

export type CountingIncDecProblem = {
    numObjects: number;
    incDecType: 'inc' | 'dec';
    incDecAnswer: number;
    simpleAnswer: number;
    layout: string;
    arrangement: string;
};

export type CountingConservationProblem = {
    numObjects: number;
};

export type CountingClassifyCountProblem = {
    classifyType: 'shape' | 'color';
    items: Array<{ shape: string; color: string }>;
    categories: Record<string, number>;
    numObjects: number;
};

export type CountingClassifySortProblem = {
    classifyType: 'shape' | 'color';
    items: Array<{ shape: string; color: string }>;
    categories: Record<string, number>;
    numObjects: number;
    relation: 'most' | 'least';
    answer: string;
};

export type MeasurementStandardProblem = {
    bandLength: number;
    problemLength: number;
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
};

export type ComparisonNumericProblem = {
    num1: number;
    num2: number;
    answer: '<' | '>';
};

export type ComparisonMatchingProblem = {
    num1: number;
    num2: number;
    comparisonType: 'greater' | 'less' | 'equal';
    answer: 'A' | 'B' | 'equal';
};

export type ComparisonCountCompareProblem = {
    num1: number;
    num2: number;
    comparisonType: 'greater' | 'less' | 'equal';
    answer: 'A' | 'B' | 'equal';
};

export type OrderingProblem = {
    numbers: number[];
};

export type WritingStrokeProblem = {
    number: number;
};

export type WritingStandardProblem = {
    number: number;
};

export type WritingCountObjectsProblem = {
    number: number;
};

export type TimeProblem = {
    time: string;
    interval: number;
};

// --- Geometry Split Problem Types ---

export type GeometryName2dProblem = {
    shape: string;
    rotation: number;
    scale: number;
    answer: string;
};

export type GeometryPositionProblem = {
    relation: 'above' | 'below' | 'beside' | 'nextTo';
    answer: string;
};

export type GeometryEnvShapesProblem = {
    target: string;
    answer: string;
};

export type GeometryName3dProblem = {
    shape: string;
    rotation: number;
    scale: number;
    answer: string;
};

export type GeometryClassifyDimProblem = {
    shapeType: '2d' | '3d';
    shape: string;
    answer: string;
};

export type GeometryCompareAttributesProblem = {
    attribute: 'sides' | 'corners';
    shape1: string;
    shape2: string;
    val1: number;
    val2: number;
    answer: string;
};

export type GeometrySameAttributeProblem = {
    attribute: 'can-roll' | 'can-stack' | 'flat-faces';
    answer: string;
};

export type GeometryBuildShapeProblem = {
    target: string;
    sides: number;
    corners: number;
    answer: string;
};

export type GeometryDrawShapeProblem = {
    target: string;
    answer: string;
};

export type GeometryComposeShapesProblem = {
    target: string;
    components: string[];
    answer: string;
};

export type GeometryProblem = 
    | GeometryName2dProblem
    | GeometryPositionProblem
    | GeometryEnvShapesProblem
    | GeometryName3dProblem
    | GeometryClassifyDimProblem
    | GeometryCompareAttributesProblem
    | GeometrySameAttributeProblem
    | GeometryBuildShapeProblem
    | GeometryDrawShapeProblem
    | GeometryComposeShapesProblem;

export type WritingProblem = 
    | WritingStrokeProblem
    | WritingStandardProblem
    | WritingCountObjectsProblem;

export type CountingClassifyProblem = 
    | CountingClassifyCountProblem
    | CountingClassifySortProblem;

/**
 * ViewTypeMap acts as the compile-time contract mapping visual view identifiers
 * to their expected mathematical problem data schemas.
 */
export interface ViewTypeMap {
    'operations-vertical': ArithmeticStandardProblem;
    'operations-boxes': ArithmeticStandardProblem;
    'operations-representation': ArithmeticRepresentationProblem | ArithmeticWordProblem;
    'operations-decompose': ArithmeticDecomposeProblem;
    'place-value-compose-teen': PlaceValueComposeTeenProblem;
    'place-value-decompose-teen': PlaceValueDecomposeTeenProblem;
    'place-value-make-ten': PlaceValueMakeTenProblem;

    'counting-objects-simple': CountingSimpleProblem;
    'counting-objects-one-to-one': CountingOneToOneProblem;
    'counting-objects-cardinality': CountingCardinalityProblem;
    'counting-objects-count-out': CountingCountOutProblem;
    'counting-inc-dec': CountingIncDecProblem;
    'counting-conservation': CountingConservationProblem;
    'sorting-classify': CountingClassifyProblem;

    'measure-length': MeasurementStandardProblem;
    'measure-attributes': MeasurementAttributeProblem;
    'measure-compare': MeasurementCompareProblem;

    'numbers-compare': ComparisonNumericProblem;
    'numbers-compare-groups': ComparisonMatchingProblem | ComparisonCountCompareProblem;

    'numbers-order': OrderingProblem;
    'numbers-write': WritingProblem;
    'time-analog': TimeProblem;
    'geometry-viewer': GeometryProblem;
}
