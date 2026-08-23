import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
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

const buildPair = (id: MeasurementConversionPairId): MeasurementConversionPair =>
    ({...pairSeeds[id]});

const buildGenericUnitScaleRelation = (): GenericUnitScaleRelationProblem => {
    const largeUnitCount = randomInteger(3, 6);
    const unitsPerLarge = randomInteger(2, 3);
    const smallUnitCount = largeUnitCount * unitsPerLarge;
    return {
        task: 'generic-unit-scale',
        largeUnitCount,
        smallUnitCount,
        unitsPerLarge
    };
};

const buildRelativeUnitSize = (
    pair: MeasurementConversionPair
): RelativeUnitSizeProblem => {
    const exampleLargerValue = randomInteger(2, 9);
    const exampleSmallerValue = exampleLargerValue * pair.factor;
    return {
        task: 'relative-unit-size',
        pair,
        exampleLargerValue,
        exampleSmallerValue
    };
};

const buildLargerToSmallerConversion = (
    pair: MeasurementConversionPair
): LargerToSmallerConversionProblem => {
    const sourceValue = randomInteger(2, 9);
    const convertedValue = sourceValue * pair.factor;
    return {
        task: 'convert-larger-to-smaller',
        pair,
        sourceValue,
        convertedValue
    };
};

const buildConversionTable = (
    pair: MeasurementConversionPair
): MeasurementConversionTableProblem => {
    const startValue = randomInteger(1, 5);
    const rows = Array.from({length: 5}, (_, index) => {
        const largerValue = startValue + index;
        const smallerValue = largerValue * pair.factor;
        return {
            largerValue,
            smallerValue
        };
    });
    return {
        task: 'conversion-table',
        pair,
        rows
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
