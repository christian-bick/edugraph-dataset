import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../../types/ml-engine.ts";
import {MeasurementStandardProblem} from "../../../types/problems.ts";
import {random} from "../../../lib/random.ts";
import {Scope} from 'edugraph-ts';
import {MeasurementLengthGeneratorConfig, MeasurementLengthGeneratorSchema} from "./spec.ts";
import {GeneratorValidationError, validateConfigFields} from "../../../lib/errors.ts";
import {rulerLengthAt, rulerLengthCaseCount} from './numeric-domain.ts';

export class MeasurementLengthGenerator implements ProblemGenerator<MeasurementStandardProblem, MeasurementLengthGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementLengthGeneratorSchema;

    generate(config: MeasurementLengthGeneratorConfig): ProblemStub<MeasurementStandardProblem> {
        validateConfigFields('measurement-length', config, ['range', 'useDecimals']);
        if (typeof config.useDecimals !== 'boolean') throw new GeneratorValidationError('measurement-length', 'Number kind must resolve to a Boolean.');
        const useDecimals = config.useDecimals;
        const count = rulerLengthCaseCount(useDecimals, config.range!);
        if (count === 0) throw new GeneratorValidationError('measurement-length', 'Unsupported canonical ruler range.');
        const problemLength = rulerLengthAt(useDecimals, config.range!, Math.floor(random() * count));

        // Dynamically pick a clean ruler band length that fits problemLength
        let bandLength: number;
        if (problemLength <= 5) bandLength = 5;
        else if (problemLength <= 10) bandLength = 10;
        else if (problemLength <= 20) bandLength = 20;
        else if (problemLength <= 50) bandLength = 50;
        else bandLength = 100;

        return {
            data: {
                bandLength: bandLength,
                problemLength: problemLength,
                useDecimals: useDecimals,
                ...(config.tool ? {tool: config.tool === Scope.PhysicalRuler ? 'ruler' as const : 'tape' as const} : {})
            }
        };
    }
}
