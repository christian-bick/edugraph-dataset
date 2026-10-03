import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {UnitCubeCell, UnitCubeVolumeProblem} from '../../../types/problems.ts';
import {VolumeUnitCubesGeneratorConfig, VolumeUnitCubesGeneratorSchema} from './spec.ts';

export class VolumeUnitCubesGenerator implements ProblemGenerator<UnitCubeVolumeProblem, VolumeUnitCubesGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = VolumeUnitCubesGeneratorSchema;

    generate(config: VolumeUnitCubesGeneratorConfig): ProblemStub<UnitCubeVolumeProblem> {
        validateConfigFields('volume-unit-cubes', config, ['unitId', 'countingModel']);
        if (config.unitId !== 'generic' && config.unitId !== 'cm'
            && config.unitId !== 'in' && config.unitId !== 'ft') {
            throw new GeneratorValidationError('volume-unit-cubes', 'Expected a generic, centimeter, inch, or foot cubic unit.');
        }
        if (config.countingModel !== 'unindexed' && config.countingModel !== 'enumerated') {
            throw new GeneratorValidationError('volume-unit-cubes', 'Expected an unindexed or enumerated cube packing.');
        }

        const columns = (2 + Math.floor(random() * 3)) as 2 | 3 | 4;
        const rows = (2 + Math.floor(random() * 2)) as 2 | 3;
        const layers = (1 + Math.floor(random() * 2)) as 1 | 2;
        const occupiedCells: UnitCubeCell[] = [];
        for (let layer = 0; layer < layers; layer++) {
            for (let row = 0; row < rows; row++) {
                for (let column = 0; column < columns; column++) {
                    occupiedCells.push({column, row, layer});
                }
            }
        }

        return {data: {
            kind: 'unit-cube-packing',
            unitId: config.unitId,
            unitCubeEdgeLength: 1,
            bounds: {columns, rows, layers},
            occupiedCells,
            ...(config.countingModel === 'enumerated'
                ? {countingTrace: occupiedCells.map((cell, index) => ({cell, ordinal: index + 1}))}
                : {}),
            cubeCount: columns * rows * layers
        }};
    }
}
