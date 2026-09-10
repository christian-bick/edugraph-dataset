import {Area, Scope} from 'edugraph-ts';
import {hasLabel, selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver} from '../../../types/schema.ts';

const resolveUnitScale = exactResolver((labels: string[]): 'cm' | 'in' => {
    const exactScale = selectExactLabelMap([
        [Scope.CentimeterScale, 'cm'],
        [Scope.InchScale, 'in']
    ] as const)(labels);
    if (exactScale) return exactScale;
    return labels.includes(Scope.FractionNumbers) ? 'in' : 'cm';
});

export const spec: GeneratorSpec = {
    generatorId: 'measurement-data',
    generalLabels: [Area.Statistics]
};

export const MeasurementDataGeneratorSchema = {
    numberKind: [[Scope.IntegerNumbers, Scope.FractionNumbers], selectExactLabelMap([
        [Scope.IntegerNumbers, 'integer'],
        [Scope.FractionNumbers, 'fraction']
    ] as const)],
    unitScale: [
        [Scope.CentimeterScale, Scope.InchScale],
        resolveUnitScale,
        [[Scope.CentimeterScale], [Scope.InchScale]]
    ],
    useSingleFrame: [[Scope.SingleFrameOfReference], hasLabel(Scope.SingleFrameOfReference)]
} as const;
export type MeasurementDataGeneratorConfig = ConfigFromSchema<typeof MeasurementDataGeneratorSchema>;
