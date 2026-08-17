import {AbstractProblem, ProblemGenerator, ProblemStub} from "../../types/ml-engine.ts";
import {WritingProblem} from "../../types/problems.ts";
import {random} from "../../lib/random.ts";
import {
    createWholeNumberPlaceValues,
    formatStandardNumeral,
    wholeNumberToEnglishName
} from '../../lib/whole-number-notation.ts';
import {WritingGeneratorConfig, WritingGeneratorSchema} from "./spec.ts";
import {validateConfigFields} from "../../lib/errors.ts";
import {Area} from 'edugraph-ts';

export class WritingGenerator implements ProblemGenerator<WritingProblem, WritingGeneratorConfig> {
    type: AbstractProblem['type'] = 'writing';
    schema = WritingGeneratorSchema;

    generate(config: WritingGeneratorConfig): ProblemStub<WritingProblem> | null {
        validateConfigFields('writing', config, ['notationFamily', 'range', 'requireZero']);
        const resolvedRange = config.range!;

        if (config.requireZero) {
            if (resolvedRange.min > 0 || resolvedRange.max < 0) return null;
            return {data: {number: 0}};
        }

        const minNum = Math.max(1, Math.ceil(resolvedRange.min));
        const maxNum = Math.floor(resolvedRange.max);
        
        if (maxNum - minNum < 0) return null;

        const currentNum = Math.floor(random() * (maxNum - minNum + 1)) + minNum;
        
        if (resolvedRange.max <= 1000) return {data: {number: currentNum}};

        const standardNumeral = formatStandardNumeral(currentNum);
        const numberName = wholeNumberToEnglishName(currentNum);
        const placeValues = createWholeNumberPlaceValues(currentNum);

        if (config.notationFamily === Area.DigitNotation) {
            return {
                data: {
                    task: 'multi-digit-base-ten-numeral',
                    number: currentNum,
                    standardNumeral,
                    numberName,
                    placeValues,
                    readPrompt: 'Read the base-ten numeral and give its number name.',
                    writePrompt: 'Write the number name as a base-ten numeral.'
                }
            };
        }

        if (config.notationFamily === Area.NumberNotation) {
            return {
                data: {
                    task: 'multi-digit-number-name',
                    number: currentNum,
                    standardNumeral,
                    numberName,
                    placeValues,
                    prompt: 'Write the numeral in words.'
                }
            };
        }

        return {data: {number: currentNum}};
    }
}
