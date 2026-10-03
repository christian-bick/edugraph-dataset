import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    MeasurementConversionNumericExamples,
    MeasurementConversionPair,
    MeasurementConversionPairId,
    StandardUnitEquivalencesProblem
} from '../../../types/problems.ts';
import {
    MeasurementConversionGeneratorConfig,
    MeasurementConversionGeneratorSchema
} from './spec.ts';

const pairSeeds: Record<MeasurementConversionPairId, MeasurementConversionPair> = {
    'kilometer-meter': {
        id: 'kilometer-meter',
        quantityKind: 'length',
        scalingKind: 'magnitude',
        largerUnit: 'kilometer',
        smallerUnit: 'meter',
        factor: 1000
    },
    'meter-centimeter': {
        id: 'meter-centimeter',
        quantityKind: 'length',
        scalingKind: 'magnitude',
        largerUnit: 'meter',
        smallerUnit: 'centimeter',
        factor: 100
    },
    'kilogram-gram': {
        id: 'kilogram-gram',
        quantityKind: 'weight',
        scalingKind: 'magnitude',
        largerUnit: 'kilogram',
        smallerUnit: 'gram',
        factor: 1000
    },
    'pound-ounce': {
        id: 'pound-ounce',
        quantityKind: 'weight',
        scalingKind: 'factor',
        largerUnit: 'pound',
        smallerUnit: 'ounce',
        factor: 16
    },
    'liter-milliliter': {
        id: 'liter-milliliter',
        quantityKind: 'liquid-volume',
        scalingKind: 'magnitude',
        largerUnit: 'liter',
        smallerUnit: 'milliliter',
        factor: 1000
    },
    'hour-minute': {
        id: 'hour-minute',
        quantityKind: 'time',
        scalingKind: 'factor',
        largerUnit: 'hour',
        smallerUnit: 'minute',
        factor: 60
    },
    'minute-second': {
        id: 'minute-second',
        quantityKind: 'time',
        scalingKind: 'factor',
        largerUnit: 'minute',
        smallerUnit: 'second',
        factor: 60
    }
};

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const integerLargerHundredths = Array.from({length: 8}, (_, index) => (index + 2) * 100);
const decimalFractionHundredths = [
    1, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 99
] as const;
const decimalLargerHundredths = Array.from({length: 5}, (_, whole) =>
    decimalFractionHundredths.map(fraction => whole * 100 + fraction)).flat();

const chooseDistinct = (values: readonly number[]): readonly [number, number] => {
    const firstIndex = randomInteger(0, values.length - 1);
    const secondDraw = randomInteger(0, values.length - 2);
    const secondIndex = secondDraw >= firstIndex ? secondDraw + 1 : secondDraw;
    return [values[firstIndex]!, values[secondIndex]!];
};

const buildNumericExamples = (
    pair: MeasurementConversionPair,
    numberKind: MeasurementConversionNumericExamples['numberKind']
): MeasurementConversionNumericExamples => {
    const candidates = numberKind === 'integer'
        ? integerLargerHundredths
        : decimalLargerHundredths;
    const [first, second] = chooseDistinct(candidates);
    const equality = (largerHundredths: number) => ({
        largerHundredths,
        smallerHundredths: largerHundredths * pair.factor
    });
    return {numberKind, equalities: [equality(first), equality(second)]};
};

const buildPair = (id: MeasurementConversionPairId): MeasurementConversionPair =>
    ({...pairSeeds[id]});

const buildUnitEquivalences = (
    pair: MeasurementConversionPair
): StandardUnitEquivalencesProblem => {
    const startValue = randomInteger(2, 9);
    const equivalents = Array.from({length: 5}, (_, index) => {
        const largerValue = startValue + index;
        const smallerValue = largerValue * pair.factor;
        return {
            largerValue,
            smallerValue
        };
    });
    return {
        pair,
        equivalents
    };
};

export class MeasurementConversionGenerator implements ProblemGenerator<
    StandardUnitEquivalencesProblem,
    MeasurementConversionGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementConversionGeneratorSchema;

    generate(
        config: MeasurementConversionGeneratorConfig
    ): ProblemStub<StandardUnitEquivalencesProblem> {
        validateConfigFields('measurement-conversion', config, ['unitPair', 'numericProfile']);

        const pairSeed = pairSeeds[config.unitPair!];
        if (!pairSeed) {
            throw new GeneratorValidationError(
                'measurement-conversion',
                `Unsupported unit pair "${config.unitPair}".`
            );
        }
        const pair = buildPair(pairSeed.id);

        if (config.numericProfile !== 'legacy'
            && config.numericProfile !== 'integer'
            && config.numericProfile !== 'decimal') {
            throw new GeneratorValidationError(
                'measurement-conversion',
                `Unsupported numeric profile "${config.numericProfile}".`
            );
        }

        const legacy = buildUnitEquivalences(pair);
        if (config.numericProfile === 'legacy') return {data: legacy};

        return {data: {
            ...legacy,
            numericExamples: buildNumericExamples(pair, config.numericProfile)
        }};
    }
}
