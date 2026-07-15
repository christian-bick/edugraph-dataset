import { ArithmeticGenerator } from '../generators/arithmetic/generator.ts';
import { CountingGenerator } from '../generators/counting/generator.ts';
import { MeasurementGenerator } from '../generators/measurement/generator.ts';
import { ComparisonGenerator } from '../generators/comparison/generator.ts';
import { OrderingGenerator } from '../generators/ordering/generator.ts';
import { WritingGenerator } from '../generators/writing/generator.ts';
import { TimeGenerator } from '../generators/time/generator.ts';
import { GeometryGenerator } from '../generators/geometry/generator.ts';

import { ProblemGenerator, VisualBlueprint } from '../types/ml-engine.ts';
import { 
    ViewTypeMap,
    ArithmeticStandardProblem, 
    ArithmeticDecomposeProblem, 
    ArithmeticRepresentationProblem, 
    PlaceValueComposeTeenProblem,
    PlaceValueDecomposeTeenProblem,
    PlaceValueMakeTenProblem,
    CountingSimpleProblem, 
    CountingOneToOneProblem,
    CountingCardinalityProblem,
    CountingCountOutProblem,
    CountingIncDecProblem, 
    CountingConservationProblem, 
    CountingClassifyProblem,
    MeasurementStandardProblem, 
    MeasurementAttributeProblem, 
    MeasurementCompareProblem,
    ComparisonNumericProblem, 
    ComparisonMatchingProblem,
    OrderingProblem,
    WritingProblem,
    TimeProblem,
    GeometryProblem
} from '../types/problems.ts';

type CompatibleViewsFor<TProblemData> = {
    [K in keyof ViewTypeMap]: ViewTypeMap[K] extends TProblemData ? K : never;
}[keyof ViewTypeMap];

export interface ModuleConfig<TProblemData = any> {
    generatorClass: new () => ProblemGenerator<TProblemData>;
    supportedLabels?: string[];
    splits: {
        train: number;
        val: number;
    };
    visualDistribution?: VisualBlueprint<CompatibleViewsFor<TProblemData>>[];
    views?: string[];
}

export interface DatasetConfigType {
    modules: Record<string, ModuleConfig> & {
        arithmetic: ModuleConfig<ArithmeticStandardProblem | ArithmeticRepresentationProblem | ArithmeticDecomposeProblem | PlaceValueComposeTeenProblem | PlaceValueDecomposeTeenProblem | PlaceValueMakeTenProblem>;
        counting: ModuleConfig<CountingSimpleProblem | CountingOneToOneProblem | CountingCardinalityProblem | CountingCountOutProblem | CountingIncDecProblem | CountingConservationProblem | CountingClassifyProblem>;
        measurement: ModuleConfig<MeasurementStandardProblem | MeasurementAttributeProblem | MeasurementCompareProblem>;
        comparison: ModuleConfig<ComparisonNumericProblem | ComparisonMatchingProblem>;
        ordering: ModuleConfig<OrderingProblem>;
        writing: ModuleConfig<WritingProblem>;
        time: ModuleConfig<TimeProblem>;
        geometry: ModuleConfig<GeometryProblem>;
    };
}

export const DatasetConfig: DatasetConfigType = {
    modules: {
        arithmetic: {
            generatorClass: ArithmeticGenerator,
            supportedLabels: [
                'http://edugraph.io/edu/BaseOperations',
                'http://edugraph.io/edu/PhysicalNumbers',
                'http://edugraph.io/edu/ArabicNumerals',
                'http://edugraph.io/edu/NumericRange'
            ],
            splits: { train: 0.8, val: 0.2 },
            views: [
                'operations-boxes',
                'operations-vertical',
                'operations-representation',
                'operations-decompose',
                'place-value-compose-teen',
                'place-value-decompose-teen',
                'place-value-make-ten'
            ]
        },
        counting: {
            generatorClass: CountingGenerator,
            supportedLabels: [
                'http://edugraph.io/edu/Numeration',
                'http://edugraph.io/edu/PhysicalNumbers',
                'http://edugraph.io/edu/AdditiveCount',
                'http://edugraph.io/edu/NumericIdentity',
                'http://edugraph.io/edu/ObjectSorting',
                'http://edugraph.io/edu/CollectionSense',
                'http://edugraph.io/edu/NumericOrder',
                'http://edugraph.io/edu/NumericRange'
            ],
            splits: { train: 0.8, val: 0.2 },
            views: [
                'counting-objects-simple',
                'counting-objects-one-to-one',
                'counting-objects-cardinality',
                'counting-objects-count-out',
                'counting-conservation',
                'sorting-classify'
            ]
        },
        measurement: {
            generatorClass: MeasurementGenerator,
            supportedLabels: [
                'http://edugraph.io/edu/Measurement',
                'http://edugraph.io/edu/NumericRange'
            ],
            splits: { train: 0.8, val: 0.2 },
            views: [
                'measure-length',
                'measure-attributes',
                'measure-compare'
            ]
        },
        comparison: {
            generatorClass: ComparisonGenerator,
            supportedLabels: [
                'http://edugraph.io/edu/Numeration',
                'http://edugraph.io/edu/Comparison',
                'http://edugraph.io/edu/PhysicalNumbers',
                'http://edugraph.io/edu/ArabicNumerals',
                'http://edugraph.io/edu/NumericRange'
            ],
            splits: { train: 0.8, val: 0.2 },
            views: [
                'numbers-compare',
                'numbers-compare-groups'
            ]
        },
        ordering: {
            generatorClass: OrderingGenerator,
            splits: { train: 0.8, val: 0.2 },
            visualDistribution: [
                { viewId: 'numbers-order', visualParams: { desc: false }, instancesPerProblem: 1 },
                { viewId: 'numbers-order', visualParams: { desc: true }, instancesPerProblem: 1 }
            ]
        },
        writing: {
            generatorClass: WritingGenerator,
            supportedLabels: [
                'http://edugraph.io/edu/DigitNotation',
                'http://edugraph.io/edu/Numeration',
                'http://edugraph.io/edu/ArabicNumerals',
                'http://edugraph.io/edu/PhysicalNumbers',
                'http://edugraph.io/edu/NumbersWithZero',
                'http://edugraph.io/edu/NumericRange'
            ],
            splits: { train: 0.8, val: 0.2 },
            views: [
                'numbers-write'
            ]
        },
        time: {
            generatorClass: TimeGenerator,
            splits: { train: 0.8, val: 0.2 },
            visualDistribution: [
                { viewId: 'time-analog', visualParams: { reverse: false }, instancesPerProblem: 1 },
                { viewId: 'time-analog', visualParams: { reverse: true }, instancesPerProblem: 1 }
            ]
        },
        geometry: {
            generatorClass: GeometryGenerator,
            supportedLabels: [
                'http://edugraph.io/edu/Geometry'
            ],
            splits: { train: 0.8, val: 0.2 },
            views: [
                'geometry-viewer'
            ]
        }
    }
};
