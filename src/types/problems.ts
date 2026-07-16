export type ArithmeticProblem = {
    num1: number;
    num2: number;
    operation: 'addition' | 'subtraction' | 'multiplication' | 'division';
    answer: number;
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

export type CountingProblem = {
    numObjects: number;
    simpleAnswer: number;
    arrangement: string;
    totalCount?: number;
};

export type CountingIncDecProblem = {
    numObjects: number;
    incDecType: 'inc' | 'dec';
    incDecAnswer: number;
    simpleAnswer: number;
    layout: string;
    arrangement: string;
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

export type ComparisonProblem = {
    num1: number;
    num2: number;
    answer: '<' | '>' | '=';
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

// --- Geometry Split Problem Types ---

export type GeometryNamingProblem = {
    shape: string;
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



export type GeometryClassifyDimProblem = {
    shapeType: '2d' | '3d';
    shape: string;
    answer: '2d' | '3d';
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
    | GeometryNamingProblem
    | GeometryPositionProblem
    | GeometryEnvShapesProblem
    | GeometryClassifyDimProblem
    | GeometryCompareAttributesProblem
    | GeometrySameAttributeProblem
    | GeometryBuildShapeProblem
    | GeometryDrawShapeProblem
    | GeometryComposeShapesProblem;

export type CountingClassifyProblem = 
    | CountingClassifyCountProblem
    | CountingClassifySortProblem;

/**
 * ViewTypeMap acts as the compile-time contract mapping visual view identifiers
 * to their expected mathematical problem data schemas.
 */
export interface ViewTypeMap {
    'operations-vertical': ArithmeticProblem;
    'operations-boxes': ArithmeticProblem;
    'operations-representation': ArithmeticProblem;
    'operations-decompose': ArithmeticDecomposeProblem;
    'place-value-compose-teen': PlaceValueComposeTeenProblem;
    'place-value-decompose-teen': PlaceValueDecomposeTeenProblem;
    'place-value-make-ten': PlaceValueMakeTenProblem;

    'counting-objects-simple': CountingProblem;
    'counting-objects-one-to-one': CountingProblem;
    'counting-objects-cardinality': CountingProblem;
    'counting-objects-count-out': CountingProblem;
    'counting-inc-dec': CountingIncDecProblem;
    'counting-conservation': CountingProblem;
    'sorting-classify': CountingClassifyProblem;

    'measure-length': MeasurementStandardProblem;
    'measure-attributes': MeasurementAttributeProblem;
    'measure-compare': MeasurementCompareProblem;

    'numbers-compare': ComparisonProblem;
    'numbers-compare-groups': ComparisonProblem;

    'numbers-order': OrderingProblem;
    'numbers-write': WritingProblem;
    'time-analog': TimeProblem;
    'geometry-viewer': GeometryProblem;
}
