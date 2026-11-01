import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    MeasurementConversionPair,
    MeasurementConversionStoryProblem
} from '../../../types/problems.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {conversionStoryTuples} from './numeric-domain.ts';
import {
    MeasurementConversionProblemsGeneratorConfig,
    MeasurementConversionProblemsGeneratorSchema
} from './spec.ts';

const buildStory = (
    pair: MeasurementConversionPair,
    numberKind: MeasurementConversionStoryProblem['numberKind'],
    range: CanonicalNumericRange
): MeasurementConversionStoryProblem => {
    const tuples = conversionStoryTuples(pair.id, numberKind, range);
    if (!tuples.length) throw new GeneratorValidationError('measurement-conversion-problems', 'Unsupported canonical range.');
    const {sourceSide, largerHundredths, additionalTargetHundredths} = tuples[Math.floor(random() * tuples.length)]!;
    const smallerHundredths = largerHundredths * pair.factor;
    const convertedTargetHundredths = sourceSide === 'larger'
        ? smallerHundredths
        : largerHundredths;

    return {
        kind: 'measurement-conversion-story',
        pair: {...pair},
        numberKind,
        sourceSide,
        conversion: {largerHundredths, smallerHundredths},
        additionalTargetHundredths,
        totalTargetHundredths: convertedTargetHundredths + additionalTargetHundredths
    };
};

export class MeasurementConversionProblemsGenerator implements ProblemGenerator<
    MeasurementConversionStoryProblem,
    MeasurementConversionProblemsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementConversionProblemsGeneratorSchema;

    generate(
        config: MeasurementConversionProblemsGeneratorConfig
    ): ProblemStub<MeasurementConversionStoryProblem> {
        validateConfigFields('measurement-conversion-problems', config, [
            'unitPair', 'numberKind'
        ]);
        const pair = measurementConversionPairSeeds[config.unitPair!];
        if (!pair) {
            throw new GeneratorValidationError(
                'measurement-conversion-problems',
                `Unsupported unit pair "${config.unitPair}".`
            );
        }
        if (config.numberKind !== 'integer' && config.numberKind !== 'decimal') {
            throw new GeneratorValidationError(
                'measurement-conversion-problems',
                `Unsupported number kind "${config.numberKind}".`
            );
        }

        validateConfigFields('measurement-conversion-problems', config, ['range']);
        return {data: buildStory(pair, config.numberKind, config.range!)};
    }
}
