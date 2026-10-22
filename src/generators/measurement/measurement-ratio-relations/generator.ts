import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {MeasurementConversionUnitId, MeasurementRatioRelationProblem, MeasurementRatioUnit} from '../../../types/problems.ts';
import {pick, randomInteger, rational} from '../../ratio/helpers.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import {MeasurementRatioRelationsGeneratorSchema, type MeasurementRatioRelationsGeneratorConfig} from './spec.ts';

type UnitId = MeasurementConversionUnitId | 'inch';
type UnitMetadata = Pick<MeasurementRatioUnit, 'symbol' | 'system' | 'dimension'>;

const unitMetadata = {
    kilometer: {symbol: 'km', system: 'metric', dimension: 'length'},
    meter: {symbol: 'm', system: 'metric', dimension: 'length'},
    centimeter: {symbol: 'cm', system: 'metric', dimension: 'length'},
    kilogram: {symbol: 'kg', system: 'metric', dimension: 'mass'},
    gram: {symbol: 'g', system: 'metric', dimension: 'mass'},
    pound: {symbol: 'lb', system: 'customary', dimension: 'mass'},
    ounce: {symbol: 'oz', system: 'customary', dimension: 'mass'},
    liter: {symbol: 'L', system: 'metric', dimension: 'volume'},
    milliliter: {symbol: 'mL', system: 'metric', dimension: 'volume'},
    hour: {symbol: 'h', system: 'time', dimension: 'time'},
    minute: {symbol: 'min', system: 'time', dimension: 'time'},
    second: {symbol: 's', system: 'time', dimension: 'time'},
    inch: {symbol: 'in', system: 'customary', dimension: 'length'}
} as const satisfies Record<UnitId, UnitMetadata>;

const unitFacts: {first: UnitId; second: UnitId; firstValue: number; secondValue: number}[] = [
    ...Object.values(measurementConversionPairSeeds).map(pair => ({
        first: pair.largerUnit, second: pair.smallerUnit, firstValue: 1, secondValue: pair.factor
    })),
    {first: 'inch', second: 'centimeter', firstValue: 50, secondValue: 127}
];

const namedUnit = (id: UnitId): MeasurementRatioUnit => ({id, name: id, ...unitMetadata[id]});

export class MeasurementRatioRelationsGenerator implements ProblemGenerator<
    MeasurementRatioRelationProblem, MeasurementRatioRelationsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementRatioRelationsGeneratorSchema;

    generate(config: MeasurementRatioRelationsGeneratorConfig): ProblemStub<MeasurementRatioRelationProblem> {
        validateConfigFields('measurement-ratio-relations', config, ['range']);
        const range = config.range!;
        if (typeof range !== 'object' || range === null || range.min !== 0
            || ![10000, 100000, Number.MAX_SAFE_INTEGER].includes(range.max)) {
            throw new GeneratorValidationError('measurement-ratio-relations',
                'Range must start at zero with bound 10000, 100000, or the unbounded resolver sentinel.');
        }
        const ceiling = range.max === Number.MAX_SAFE_INTEGER ? 9999 : range.max - 1;
        const fact = pick(unitFacts);
        const maximumNumerator = Math.floor(ceiling / Math.max(fact.firstValue, fact.secondValue));
        const scaleFactor = rational(randomInteger(1, maximumNumerator), pick([1, 2, 4]));

        return {data: {
            kind: 'measurement-ratio-relation',
            units: {first: namedUnit(fact.first), second: namedUnit(fact.second)},
            unitEquality: {first: rational(fact.firstValue), second: rational(fact.secondValue)},
            quantityEquality: {
                first: rational(fact.firstValue * scaleFactor.numerator, scaleFactor.denominator),
                second: rational(fact.secondValue * scaleFactor.numerator, scaleFactor.denominator)
            },
            scaleFactor,
            forwardFactor: rational(fact.secondValue, fact.firstValue),
            reverseFactor: rational(fact.firstValue, fact.secondValue)
        }};
    }
}
