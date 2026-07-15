import { ArithmeticGenerator } from '../generators/arithmetic/generator.ts';
import { CountingGenerator } from '../generators/counting/generator.ts';
import { MeasurementGenerator } from '../generators/measurement/generator.ts';
import { ComparisonGenerator } from '../generators/comparison/generator.ts';
import { OrderingGenerator } from '../generators/ordering/generator.ts';
import { WritingGenerator } from '../generators/writing/generator.ts';
import { TimeGenerator } from '../generators/time/generator.ts';
import { GeometryGenerator } from '../generators/geometry/generator.ts';

import { ProblemGenerator } from '../types/ml-engine.ts';
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
    compatibleViews: CompatibleViewsFor<TProblemData>[];
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
            compatibleViews: ['operations-vertical', 'operations-boxes', 'operations-representation', 'operations-decompose', 'place-value-blocks']
        },
        counting: {
            generatorClass: CountingGenerator,
            compatibleViews: ['counting-objects', 'counting-inc-dec', 'counting-conservation', 'sorting-classify']
        },
        measurement: {
            generatorClass: MeasurementGenerator,
            compatibleViews: ['measure-length', 'measure-attributes', 'measure-compare']
        },
        comparison: {
            generatorClass: ComparisonGenerator,
            compatibleViews: ['numbers-compare', 'numbers-compare-groups']
        },
        ordering: {
            generatorClass: OrderingGenerator,
            compatibleViews: ['numbers-order']
        },
        writing: {
            generatorClass: WritingGenerator,
            compatibleViews: ['numbers-write']
        },
        time: {
            generatorClass: TimeGenerator,
            compatibleViews: ['time-analog']
        },
        geometry: {
            generatorClass: GeometryGenerator,
            compatibleViews: ['geometry-viewer']
        }
    }
};
