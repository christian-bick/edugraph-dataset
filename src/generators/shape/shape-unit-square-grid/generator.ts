import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {SquareAreaUnitId, UnitSquareGridProblem} from '../../../types/problems.ts';
import {selectArrayDimensions} from '../shape-square-array-helpers.ts';
import {
    ShapeUnitSquareGridGeneratorConfig,
    ShapeUnitSquareGridGeneratorSchema
} from './spec.ts';

const UNIT_IDS = new Set<SquareAreaUnitId>([
    'square-unit',
    'square-centimeter',
    'square-meter',
    'square-inch',
    'square-foot'
]);

export class ShapeUnitSquareGridGenerator implements ProblemGenerator<
    UnitSquareGridProblem,
    ShapeUnitSquareGridGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = ShapeUnitSquareGridGeneratorSchema;

    generate(
        config: ShapeUnitSquareGridGeneratorConfig
    ): ProblemStub<UnitSquareGridProblem> {
        validateConfigFields('shape-unit-square-grid', config, ['gridKind']);
        if (!['single-unit', 'coverage', 'product'].includes(config.gridKind!)) {
            throw new GeneratorValidationError(
                'shape-unit-square-grid',
                'The gridKind must be single-unit, coverage, or product.'
            );
        }

        const unitId = config.unitId ?? 'square-unit';
        if (!UNIT_IDS.has(unitId)) {
            throw new GeneratorValidationError(
                'shape-unit-square-grid',
                'The unitId must be a supported square-area unit.'
            );
        }

        const [rows, columns] = config.gridKind === 'single-unit'
            ? [1, 1] as const
            : selectArrayDimensions(random());
        return {
            data: {
                kind: 'unit-square-grid',
                rows,
                columns,
                tileCount: rows * columns,
                unitId
            }
        };
    }
}
