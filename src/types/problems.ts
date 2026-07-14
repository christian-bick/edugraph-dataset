export type ArithmeticStandardProblem = {
    mode: 'standard';
    num1: number;
    num2: number;
    operator: 'add' | 'subtract' | 'multiply' | 'divide';
    answer: number;
};

export type ArithmeticRepresentationProblem = {
    mode: 'representation' | 'word-problem';
    operation: 'addition' | 'subtraction';
    num1: number;
    num2: number;
    answer: number;
    textScenario: string;
};

export type ArithmeticDecomposeProblem = {
    mode: 'decompose';
    targetNumber: number;
    pair1: [number, number];
    pair2: [number, number];
};

export type ArithmeticTeenProblem = {
    mode: 'compose-teen' | 'decompose-teen' | 'make-ten';
    ones?: number;
    givenNumber?: number;
    missingNumber?: number;
    target: number;
};

export type CountingSimpleProblem = {
    mode: 'simple' | 'how-many' | 'one-to-one' | 'count-out';
    numObjects: number;
    simpleAnswer: number;
    layout: string;
    arrangement: string;
    totalCount?: number;
};

export type CountingIncDecProblem = {
    mode: 'simple';
    numObjects: number;
    incDecType: 'inc' | 'dec';
    incDecAnswer: number;
    simpleAnswer: number;
    layout: string;
    arrangement: string;
};

export type CountingConservationProblem = {
    mode: 'conservation';
    numObjects: number;
};

export type CountingClassifyProblem = {
    mode: 'classify-count' | 'classify-sort';
    classifyType: 'shape' | 'color';
    items: Array<{ shape: string; color: string }>;
    categories: Record<string, number>;
    numObjects: number;
    relation?: 'most' | 'least';
    answer?: string;
};

export type MeasurementStandardProblem = {
    mode: 'standard';
    bandLength: number;
    problemLength: number;
};

export type MeasurementAttributeProblem = {
    mode: 'attribute-type';
    attribute: 'length' | 'height' | 'weight';
};

export type MeasurementCompareProblem = {
    mode: 'direct-compare';
    attribute: 'length' | 'weight';
    relation: string;
    val1: number;
    val2: number;
    answer: 'A' | 'B';
};

export type ComparisonNumericProblem = {
    mode: 'numeric';
    num1: number;
    num2: number;
    answer: '<' | '>';
};

export type ComparisonMatchingProblem = {
    mode: 'matching' | 'count-compare';
    num1: number;
    num2: number;
    comparisonType: 'greater' | 'less' | 'equal';
    answer: 'A' | 'B' | 'equal';
};

export type OrderingProblem = {
    numbers: number[];
};

export type WritingProblem = {
    number: number;
    mode: 'stroke' | 'standard';
};

export type TimeProblem = {
    time: string;
    interval: number;
};

export type GeometryProblem = {
    mode: 'position' | 'env-shapes' | 'name-2d' | 'name-3d' | 'classify-dim' | 'compare-attributes' | 'same-attribute' | 'build-shape' | 'draw-shape' | 'compose-shapes';
    relation?: 'above' | 'below' | 'beside' | 'nextTo';
    target?: string;
    shape?: string;
    rotation?: number;
    scale?: number;
    shapeType?: '2d' | '3d';
    attribute?: string;
    shape1?: string;
    shape2?: string;
    val1?: number;
    val2?: number;
    sides?: number;
    corners?: number;
    components?: string[];
    answer: string;
};

export interface ViewTypeMap {
    'operations-vertical': ArithmeticStandardProblem;
    'operations-boxes': ArithmeticStandardProblem;
    'operations-representation': ArithmeticRepresentationProblem;
    'operations-decompose': ArithmeticDecomposeProblem;
    'place-value-blocks': ArithmeticTeenProblem;

    'counting-objects': CountingSimpleProblem;
    'counting-inc-dec': CountingIncDecProblem;
    'counting-conservation': CountingConservationProblem;
    'sorting-classify': CountingClassifyProblem;

    'measure-length': MeasurementStandardProblem;
    'measure-attributes': MeasurementAttributeProblem;
    'measure-compare': MeasurementCompareProblem;

    'numbers-compare': ComparisonNumericProblem;
    'numbers-compare-groups': ComparisonMatchingProblem;

    'numbers-order': OrderingProblem;
    'numbers-write': WritingProblem;
    'time-analog': TimeProblem;
    'geometry-viewer': GeometryProblem;
}
