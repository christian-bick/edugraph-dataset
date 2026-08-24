import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, ResolverFn} from '../../../types/schema.ts';
import {SquareAreaUnitId} from '../../../types/problems.ts';

export type UnitSquareGridKind = 'single-unit' | 'coverage' | 'product';

const resolveGridKind: ResolverFn<UnitSquareGridKind> = labels => {
    if (labels.includes(Area.Multiplication) || labels.includes(Scope.BoxArrangement)) {
        return 'product';
    }
    if (labels.includes(Area.Iteration) || labels.includes(Area.AreaCalculation)) {
        return 'coverage';
    }
    return 'single-unit';
};

const resolveUnitId: ResolverFn<SquareAreaUnitId> = labels => {
    if (labels.includes(Scope.SquareCentimeterScale)) return 'square-centimeter';
    if (labels.includes(Scope.SquareMeterScale)) return 'square-meter';
    if (labels.includes(Scope.SquareInchScale)) return 'square-inch';
    if (labels.includes(Scope.SquareFootScale)) return 'square-foot';
    return 'square-unit';
};

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
    ], resolveGridKind],
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
