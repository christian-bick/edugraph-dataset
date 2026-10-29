import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {WritingProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {createWholeNumberPlaceValues} from '../../lib/whole-number-notation.ts';
import {WritingGeneratorConfig, WritingGeneratorSchema, spec} from "./spec.ts";
import {GeneratorValidationError, validateConfigFields} from "../../lib/errors.ts";
import {writingProfileCount, writingProfileValue} from './zero-profile.ts';

export class WritingGenerator implements ProblemGenerator<WritingProblem, WritingGeneratorConfig> {
    type: AbstractProblem['type'] = 'writing';
    schema = WritingGeneratorSchema;
    readonly spec = spec;

    generate(config: WritingGeneratorConfig): ProblemStub<WritingProblem> | null {
        validateConfigFields('writing', config, ['notationFamily', 'range', 'requireZero']);
        const resolvedRange = config.range!;
        if (typeof config.requireZero !== 'boolean' && config.requireZero !== 'coefficient-zero'
            && config.requireZero !== 'coefficient-nonzero') {
            throw new GeneratorValidationError('writing', 'Expected a scalar-zero or coefficient-zero profile.');
        }

        if (typeof config.requireZero === 'string') {
            if (!Number.isFinite(resolvedRange.min) || !Number.isFinite(resolvedRange.max)
                || resolvedRange.max > 1_000_000) {
                throw new GeneratorValidationError('writing', 'Coefficient profiles require the supported finite whole-number domain.');
            }
            const zero = config.requireZero === 'coefficient-zero';
            const count = writingProfileCount(resolvedRange.min, resolvedRange.max, zero);
            if (!count) return null;
            const currentNum = writingProfileValue(resolvedRange.min, resolvedRange.max, zero,
                Math.floor(random() * count))!;
            return {data: currentNum <= 1000 ? {number: currentNum}
                : {number: currentNum, placeValues: createWholeNumberPlaceValues(currentNum)}};
        }

        if (config.requireZero) {
            if (resolvedRange.min > 0 || resolvedRange.max < 0) return null;
            return {data: {number: 0}};
        }

        const minNum = Math.max(1, Math.ceil(resolvedRange.min));
        const maxNum = Math.floor(resolvedRange.max);
        
        if (maxNum - minNum < 0) return null;

        const currentNum = Math.floor(random() * (maxNum - minNum + 1)) + minNum;
        
        if (currentNum <= 1000) return {data: {number: currentNum}};

        return {
            data: {
                number: currentNum,
                placeValues: createWholeNumberPlaceValues(currentNum)
            }
        };
    }
}
