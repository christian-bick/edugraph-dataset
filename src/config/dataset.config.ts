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
    ArithmeticTeenProblem,
    CountingSimpleProblem, 
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
    splits: {
        train: number;
        val: number;
    };
    visualDistribution: VisualBlueprint<CompatibleViewsFor<TProblemData>>[];
}

export interface DatasetConfigType {
    modules: Record<string, ModuleConfig> & {
        arithmetic: ModuleConfig<ArithmeticStandardProblem | ArithmeticRepresentationProblem | ArithmeticDecomposeProblem | ArithmeticTeenProblem>;
        counting: ModuleConfig<CountingSimpleProblem | CountingIncDecProblem | CountingConservationProblem | CountingClassifyProblem>;
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
            splits: { train: 0.8, val: 0.2 },
            visualDistribution: [
                { viewId: 'operations-boxes', visualParams: {}, instancesPerProblem: 1 },
                { viewId: 'operations-vertical', visualParams: {}, instancesPerProblem: 1 },
                { viewId: 'operations-representation', visualParams: {}, instancesPerProblem: 1 },
                { viewId: 'operations-decompose', visualParams: {}, instancesPerProblem: 1 },
                { viewId: 'place-value-blocks', visualParams: {}, instancesPerProblem: 1 }
            ]
        },
        counting: {
            generatorClass: CountingGenerator,
            splits: { train: 0.8, val: 0.2 },
            visualDistribution: [
                { viewId: 'counting-objects', visualParams: {}, instancesPerProblem: 1 },
                { viewId: 'counting-inc-dec', visualParams: {}, instancesPerProblem: 1 },
                { viewId: 'counting-conservation', visualParams: {}, instancesPerProblem: 1 },
                { viewId: 'sorting-classify', visualParams: {}, instancesPerProblem: 1 }
            ]
        },
        measurement: {
            generatorClass: MeasurementGenerator,
            splits: { train: 0.8, val: 0.2 },
            visualDistribution: [
                { viewId: 'measure-length', visualParams: {}, instancesPerProblem: 1 },
                { viewId: 'measure-attributes', visualParams: {}, instancesPerProblem: 1 },
                { viewId: 'measure-compare', visualParams: {}, instancesPerProblem: 1 }
            ]
        },
        comparison: {
            generatorClass: ComparisonGenerator,
            splits: { train: 0.8, val: 0.2 },
            visualDistribution: [
                { viewId: 'numbers-compare', visualParams: {}, instancesPerProblem: 1 },
                { viewId: 'numbers-compare-groups', visualParams: {}, instancesPerProblem: 1 }
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
            splits: { train: 0.8, val: 0.2 },
            visualDistribution: [
                { viewId: 'numbers-write', visualParams: { outline: false }, instancesPerProblem: 1 },
                { viewId: 'numbers-write', visualParams: { outline: true }, instancesPerProblem: 1 }
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
            splits: { train: 0.8, val: 0.2 },
            visualDistribution: [
                { viewId: 'geometry-viewer', visualParams: {}, instancesPerProblem: 1 }
            ]
        }
    }
};
