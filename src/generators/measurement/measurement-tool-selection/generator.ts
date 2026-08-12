import {Scope} from 'edugraph-ts';
import {random} from '../../../lib/random.ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {MeasurementToolSelectionProblem} from '../../../types/problems.ts';
import {MeasurementToolSelectionGeneratorConfig, MeasurementToolSelectionGeneratorSchema} from './spec.ts';

export class MeasurementToolSelectionGenerator implements ProblemGenerator<MeasurementToolSelectionProblem, MeasurementToolSelectionGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementToolSelectionGeneratorSchema;

    generate(config: MeasurementToolSelectionGeneratorConfig): ProblemStub<MeasurementToolSelectionProblem> | null {
        validateConfigFields('measurement-tool-selection', config, ['tool']);
        const correctTool = config.tool === Scope.PhysicalRuler
            ? 'ruler'
            : config.tool === Scope.Tapemeter
                ? 'tape'
                : null;
        if (!correctTool) return null;
        const objects = correctTool === 'ruler' ? ['pencil', 'book'] as const : ['table', 'door'] as const;

        return {
            data: {
                object: objects[Math.floor(random() * objects.length)],
                correctTool,
                tools: ['ruler', 'tape']
            }
        };
    }
}
