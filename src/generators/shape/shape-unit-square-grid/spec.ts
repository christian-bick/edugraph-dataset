import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export type UnitSquareGridKind = 'single-unit' | 'coverage' | 'product';

const gridKindLabelSets = [
    [Scope.TileScale],
    [Area.AreaCalculation, Area.Iteration, Scope.IntegerNumbers, Scope.TileScale],
    [Area.AreaCalculation, Area.Multiplication, Scope.BoxArrangement, Scope.TwoOperands]
] as const;

const resolveGridKind = selectExactLabelSetMap([
    [gridKindLabelSets[0], 'single-unit'],
    [gridKindLabelSets[1], 'coverage'],
    [gridKindLabelSets[2], 'product']
] as const);

const resolveUnitId = selectExactLabelSetMap([
    [[], 'square-unit'],
    [[Scope.SquareCentimeterScale], 'square-centimeter'],
    [[Scope.SquareMeterScale], 'square-meter'],
    [[Scope.SquareInchScale], 'square-inch'],
    [[Scope.SquareFootScale], 'square-foot']
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'shape-unit-square-grid',
    generalLabels: [Area.Square]
};

export const ShapeUnitSquareGridGeneratorSchema = {
    gridKind: [[
        Area.AreaCalculation,
        Area.Iteration,
        Area.Multiplication,
        Scope.BoxArrangement,
        Scope.IntegerNumbers,
        Scope.TileScale,
        Scope.TwoOperands
    ], resolveGridKind, gridKindLabelSets],
    unitId: [[
        Scope.SquareCentimeterScale,
        Scope.SquareMeterScale,
        Scope.SquareInchScale,
        Scope.SquareFootScale
    ], resolveUnitId]
} as const;

export type ShapeUnitSquareGridGeneratorConfig = ConfigFromSchema<
    typeof ShapeUnitSquareGridGeneratorSchema
>;
