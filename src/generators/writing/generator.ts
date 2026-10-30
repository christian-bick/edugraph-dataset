import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {WritingProblem} from "../../types/problems.ts";
import {samplePositiveWholeNumber} from '../number/whole-number-values.ts';
import {createWholeNumberPlaceValues} from '../../lib/whole-number-notation.ts';
import {WritingGeneratorConfig, WritingGeneratorSchema, spec} from "./spec.ts";
import {GeneratorValidationError, validateConfigFields} from "../../lib/errors.ts";

export class WritingGenerator implements ProblemGenerator<WritingProblem, WritingGeneratorConfig> {
    type: AbstractProblem['type'] = 'writing';
    schema = WritingGeneratorSchema;
    readonly spec = spec;

    generate(config: WritingGeneratorConfig): ProblemStub<WritingProblem> | null {
        validateConfigFields('writing', config, ['notationFamily', 'range', 'requireZero']);
        const resolvedRange = config.range!;
        if (typeof config.requireZero !== 'boolean') {
            throw new GeneratorValidationError('writing', 'Expected a boolean scalar-zero selector.');
        }

        if (config.requireZero) {
            if (resolvedRange.min > 0 || resolvedRange.max < 0) return null;
            return {data: {number: 0}};
        }

        const currentNum = samplePositiveWholeNumber(resolvedRange);
        if (currentNum === null) return null;
        
        if (currentNum <= 1000) return {data: {number: currentNum}};

        return {
            data: {
                number: currentNum,
                placeValues: createWholeNumberPlaceValues(currentNum)
            }
        };
    }
}
