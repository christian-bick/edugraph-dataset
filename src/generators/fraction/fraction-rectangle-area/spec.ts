import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const areaJustifications = [
    [[Area.Rectangle, Scope.FractionNumbers, Scope.TwoOperands], 'fraction-side-product'],
    [[Area.Square, Scope.UnitFractions], 'square-tile-proof']
] as const;

const exactJustification = selectExactLabelSetMap(areaJustifications);

// The tiling target explicitly names both descendants and their redundant
// ancestors. Resolve using the most specific mathematical capabilities only.
const resolveAreaJustification = withLabelChoices(exactResolver((labels: string[],
    supportedLabels?: readonly string[]) => {
    const normalized = labels.filter(label => !(
        label === Area.Rectangle && labels.includes(Area.Square)
        || label === Scope.FractionNumbers && labels.includes(Scope.UnitFractions)
    ));
    return exactJustification(normalized, supportedLabels);
}), {kind: 'alternatives', alternatives: areaJustifications.map(([labels]) => [...labels])});

export const spec: GeneratorSpec = {
    generatorId: 'fraction-rectangle-area',
    generalLabels: [Area.AreaCalculation, Area.Multiplication]
};

export const FractionRectangleAreaGeneratorSchema = {
    areaJustification: [[
        Area.Rectangle,
        Area.Square,
        Scope.FractionNumbers,
        Scope.UnitFractions,
        Scope.TwoOperands
    ], resolveAreaJustification, areaJustifications.map(([labels]) => labels)]
} as const;

export type FractionRectangleAreaGeneratorConfig = ConfigFromSchema<
    typeof FractionRectangleAreaGeneratorSchema
>;
