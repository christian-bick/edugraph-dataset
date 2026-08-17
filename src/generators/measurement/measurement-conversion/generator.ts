import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {formatStandardNumeral} from '../../../lib/whole-number-notation.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    LargerToSmallerConversionProblem,
    GenericUnitScaleRelationProblem,
    MeasurementConversionPair,
    MeasurementConversionPairId,
    MeasurementConversionProblem,
    MeasurementConversionTableProblem,
    RelativeUnitSizeProblem
} from '../../../types/problems.ts';
import {
    MeasurementConversionGeneratorConfig,
    MeasurementConversionGeneratorSchema,
    MeasurementConversionUnitPairConfig
} from './spec.ts';

type PairSeed = Omit<MeasurementConversionPair,
    'equivalenceEquation' | 'factorStatement'>;

const unit = (
    id: MeasurementConversionPair['largerUnit']['id'],
    singular: string,
    plural: string,
    symbol: string
): MeasurementConversionPair['largerUnit'] => ({id, singular, plural, symbol});

const pairSeeds: Record<MeasurementConversionPairId, PairSeed> = {
    'kilometer-meter': {
        id: 'kilometer-meter',
        quantityKind: 'length',
        scalingKind: 'magnitude',
        largerUnit: unit('kilometer', 'kilometer', 'kilometers', 'km'),
        smallerUnit: unit('meter', 'meter', 'meters', 'm'),
        factor: 1000,
        relativeSizeStatement: 'One kilometer is 1,000 times as long as one meter.'
    },
    'meter-centimeter': {
        id: 'meter-centimeter',
        quantityKind: 'length',
        scalingKind: 'magnitude',
        largerUnit: unit('meter', 'meter', 'meters', 'm'),
        smallerUnit: unit('centimeter', 'centimeter', 'centimeters', 'cm'),
        factor: 100,
        relativeSizeStatement: 'One meter is 100 times as long as one centimeter.'
    },
    'kilogram-gram': {
        id: 'kilogram-gram',
        quantityKind: 'weight',
        scalingKind: 'magnitude',
        largerUnit: unit('kilogram', 'kilogram', 'kilograms', 'kg'),
        smallerUnit: unit('gram', 'gram', 'grams', 'g'),
        factor: 1000,
        relativeSizeStatement: 'One kilogram is 1,000 times as heavy as one gram.'
    },
    'pound-ounce': {
        id: 'pound-ounce',
        quantityKind: 'weight',
        scalingKind: 'factor',
        largerUnit: unit('pound', 'pound', 'pounds', 'lb'),
        smallerUnit: unit('ounce', 'ounce', 'ounces', 'oz'),
        factor: 16,
        relativeSizeStatement: 'One pound is 16 times as heavy as one ounce.'
    },
    'liter-milliliter': {
        id: 'liter-milliliter',
        quantityKind: 'liquid-volume',
        scalingKind: 'magnitude',
        largerUnit: unit('liter', 'liter', 'liters', 'L'),
        smallerUnit: unit('milliliter', 'milliliter', 'milliliters', 'mL'),
        factor: 1000,
        relativeSizeStatement: 'One liter holds 1,000 times as much liquid volume as one milliliter.'
    },
    'hour-minute': {
        id: 'hour-minute',
        quantityKind: 'time',
        scalingKind: 'factor',
        largerUnit: unit('hour', 'hour', 'hours', 'hr'),
        smallerUnit: unit('minute', 'minute', 'minutes', 'min'),
        factor: 60,
        relativeSizeStatement: 'One hour lasts 60 times as long as one minute.'
    },
    'minute-second': {
        id: 'minute-second',
        quantityKind: 'time',
        scalingKind: 'factor',
        largerUnit: unit('minute', 'minute', 'minutes', 'min'),
        smallerUnit: unit('second', 'second', 'seconds', 'sec'),
        factor: 60,
        relativeSizeStatement: 'One minute lasts 60 times as long as one second.'
    }
};

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const formatMeasure = (
    value: number,
    measurementUnit: MeasurementConversionPair['largerUnit']
): string => `${formatStandardNumeral(value)} ${value === 1
    ? measurementUnit.singular
    : measurementUnit.plural}`;

const buildPair = (id: MeasurementConversionPairId): MeasurementConversionPair => {
    const seed = pairSeeds[id];
    const factorText = formatStandardNumeral(seed.factor);
    return {
        ...seed,
        equivalenceEquation: `1 ${seed.largerUnit.singular} = ${factorText} ${seed.smallerUnit.plural}`,
        factorStatement: `Multiply a number of ${seed.largerUnit.plural} by ${factorText} to find the equivalent number of ${seed.smallerUnit.plural}.`
    };
};

const buildGenericUnitScaleRelation = (): GenericUnitScaleRelationProblem => {
    const largeUnitCount = randomInteger(3, 6);
    const unitsPerLarge = randomInteger(2, 3);
    const smallUnitCount = largeUnitCount * unitsPerLarge;
    const questionEquation = `${formatStandardNumeral(largeUnitCount)} × ${formatStandardNumeral(unitsPerLarge)} = ?`;
    const solutionEquation = `${formatStandardNumeral(largeUnitCount)} × ${formatStandardNumeral(unitsPerLarge)} = ${formatStandardNumeral(smallUnitCount)}`;
    return {
        task: 'generic-unit-scale',
        largeUnitCount,
        smallUnitCount,
        unitsPerLarge,
        prompt: 'The same length is measured with large units and small units. Which unit size needs more units?',
        equivalentLengthStatement: `The same length is ${formatStandardNumeral(largeUnitCount)} large units or ${formatStandardNumeral(smallUnitCount)} small units.`,
        questionEquation,
        solutionEquation,
        answerStatement: `Smaller units need a larger count: ${formatStandardNumeral(smallUnitCount)} > ${formatStandardNumeral(largeUnitCount)}.`,
        explanation: `Each large unit covers the same length as ${formatStandardNumeral(unitsPerLarge)} small units, so ${solutionEquation}.`
    };
};

const buildRelativeUnitSize = (
    pair: MeasurementConversionPair
): RelativeUnitSizeProblem => {
    const exampleLargerValue = randomInteger(2, 9);
    const exampleSmallerValue = exampleLargerValue * pair.factor;
    const exampleEquation = `${formatMeasure(exampleLargerValue, pair.largerUnit)} = ${formatMeasure(exampleSmallerValue, pair.smallerUnit)}`;
    const quantity = pair.quantityKind === 'liquid-volume'
        ? 'liquid volume'
        : pair.quantityKind;
    return {
        task: 'relative-unit-size',
        pair,
        exampleLargerValue,
        exampleSmallerValue,
        exampleEquation,
        answer: pair.factor,
        prompt: `Use the equivalent ${quantity} to determine how many ${pair.smallerUnit.plural} equal 1 ${pair.largerUnit.singular}.`,
        questionEquation: `1 ${pair.largerUnit.singular} = ? ${pair.smallerUnit.plural}`,
        solutionEquation: pair.equivalenceEquation,
        comparisonStatement: `${exampleEquation} names the same ${quantity} with a smaller count of ${pair.largerUnit.plural} and a larger count of ${pair.smallerUnit.plural}.`,
        explanation: `${exampleEquation} represents the same ${quantity}. Dividing both counts by ${formatStandardNumeral(exampleLargerValue)} gives ${pair.equivalenceEquation}. ${pair.relativeSizeStatement}`
    };
};

const buildLargerToSmallerConversion = (
    pair: MeasurementConversionPair
): LargerToSmallerConversionProblem => {
    const sourceValue = randomInteger(2, 9);
    const convertedValue = sourceValue * pair.factor;
    const source = formatMeasure(sourceValue, pair.largerUnit);
    const converted = formatMeasure(convertedValue, pair.smallerUnit);
    const sourceText = formatStandardNumeral(sourceValue);
    const factorText = formatStandardNumeral(pair.factor);
    const convertedText = formatStandardNumeral(convertedValue);
    const solutionEquation = `${sourceText} × ${factorText} = ${convertedText}`;
    const measurementEquation = `${source} = ${converted}`;
    return {
        task: 'convert-larger-to-smaller',
        pair,
        sourceValue,
        convertedValue,
        answer: convertedValue,
        prompt: `Convert ${source} to ${pair.smallerUnit.plural}.`,
        questionEquation: `${sourceText} × ${factorText} = ?`,
        solutionEquation,
        measurementEquation,
        answerStatement: `${source} is equivalent to ${converted}.`,
        explanation: `Since ${pair.equivalenceEquation}, multiply ${sourceText} by ${factorText}. ${solutionEquation}, so ${measurementEquation}.`
    };
};

const capitalize = (value: string): string =>
    value.charAt(0).toUpperCase() + value.slice(1);

const buildConversionTable = (
    pair: MeasurementConversionPair
): MeasurementConversionTableProblem => {
    const startValue = randomInteger(1, 5);
    const rows = Array.from({length: 5}, (_, index) => {
        const largerValue = startValue + index;
        const smallerValue = largerValue * pair.factor;
        return {
            largerValue,
            smallerValue,
            measurementEquation: `${formatMeasure(largerValue, pair.largerUnit)} = ${formatMeasure(smallerValue, pair.smallerUnit)}`
        };
    });
    const finalRow = rows.at(-1)!;
    return {
        task: 'conversion-table',
        pair,
        prompt: `Complete the two-column conversion table from ${pair.largerUnit.plural} to ${pair.smallerUnit.plural}.`,
        rows,
        hiddenRowIndices: [3, 4],
        columnHeaders: [
            `${capitalize(pair.largerUnit.plural)} (${pair.largerUnit.symbol})`,
            `${capitalize(pair.smallerUnit.plural)} (${pair.smallerUnit.symbol})`
        ],
        constantFactorStatement: pair.factorStatement,
        explanation: `Each ${pair.smallerUnit.singular} value equals its ${pair.largerUnit.singular} value multiplied by ${formatStandardNumeral(pair.factor)}. For example, ${finalRow.measurementEquation}.`
    };
};

export class MeasurementConversionGenerator implements ProblemGenerator<
    MeasurementConversionProblem,
    MeasurementConversionGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementConversionGeneratorSchema;

    generate(
        config: MeasurementConversionGeneratorConfig
    ): ProblemStub<MeasurementConversionProblem> {
        validateConfigFields('measurement-conversion', config, ['task', 'unitPair']);

        if ((config.unitPair as MeasurementConversionUnitPairConfig) === 'generic-unit-scale') {
            if (config.task !== 'relative-unit-size') {
                throw new GeneratorValidationError(
                    'measurement-conversion',
                    `Generic unit scaling does not support task "${config.task}".`
                );
            }
            return {data: buildGenericUnitScaleRelation()};
        }

        const pairSeed = pairSeeds[config.unitPair as MeasurementConversionPairId];
        if (!pairSeed) {
            throw new GeneratorValidationError(
                'measurement-conversion',
                `Unsupported unit pair "${config.unitPair}".`
            );
        }
        const pair = buildPair(pairSeed.id);

        if (config.task === 'relative-unit-size') {
            return {data: buildRelativeUnitSize(pair)};
        }
        if (config.task === 'convert-larger-to-smaller') {
            return {data: buildLargerToSmallerConversion(pair)};
        }
        if (config.task === 'conversion-table') {
            return {data: buildConversionTable(pair)};
        }
        throw new GeneratorValidationError(
            'measurement-conversion',
            `Unsupported task "${config.task}".`
        );
    }
}
