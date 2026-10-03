import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    MeasurementConversionPair,
    MeasurementConversionStoryProblem
} from '../../../types/problems.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import {
    MeasurementConversionProblemsGeneratorConfig,
    MeasurementConversionProblemsGeneratorSchema
} from './spec.ts';

const decimalFractions = [
    1, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 99
] as const;
const addendFractions = [25, 50, 75] as const;

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const pick = <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)]!;

const sampleLargerHundredths = (numberKind: MeasurementConversionStoryProblem['numberKind']): number =>
    numberKind === 'integer'
        ? randomInteger(2, 9) * 100
        : randomInteger(0, 4) * 100 + pick(decimalFractions);

const sampleAdditionalHundredths = (
    pair: MeasurementConversionPair,
    sourceSide: MeasurementConversionStoryProblem['sourceSide'],
    numberKind: MeasurementConversionStoryProblem['numberKind']
): number => {
    const scale = sourceSide === 'larger' ? Math.max(1, Math.floor(pair.factor / 10)) : 1;
    const whole = randomInteger(1, 5) * scale;
    return whole * 100 + (numberKind === 'decimal' ? pick(addendFractions) : 0);
};

const buildStory = (
    pair: MeasurementConversionPair,
    numberKind: MeasurementConversionStoryProblem['numberKind']
): MeasurementConversionStoryProblem => {
    const sourceSide = random() < 0.5 ? 'larger' : 'smaller';
    const largerHundredths = sampleLargerHundredths(numberKind);
    const smallerHundredths = largerHundredths * pair.factor;
    const additionalTargetHundredths = sampleAdditionalHundredths(pair, sourceSide, numberKind);
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

        return {data: buildStory(pair, config.numberKind)};
    }
}
