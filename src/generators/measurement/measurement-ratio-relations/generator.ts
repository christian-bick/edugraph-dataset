import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {MeasurementConversionUnitId, MeasurementRatioRelationProblem, MeasurementRatioUnit} from '../../../types/problems.ts';
import {rational} from '../../ratio/helpers.ts';
import {random} from '../../../lib/random.ts';
import {conversionRatioCaseCount, conversionRatioFrameAt} from './numeric-domain.ts';
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

const namedUnit = (id: UnitId): MeasurementRatioUnit => ({id, name: id, ...unitMetadata[id]});

export class MeasurementRatioRelationsGenerator implements ProblemGenerator<
    MeasurementRatioRelationProblem, MeasurementRatioRelationsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementRatioRelationsGeneratorSchema;

    generate(config: MeasurementRatioRelationsGeneratorConfig): ProblemStub<MeasurementRatioRelationProblem> {
        validateConfigFields('measurement-ratio-relations', config, ['range']);
        const count = conversionRatioCaseCount(config.range!);
        if (count === 0) throw new GeneratorValidationError('measurement-ratio-relations', 'Unsupported canonical range.');
        const {fact, scaleFactor} = conversionRatioFrameAt(config.range!, Math.floor(random() * count));

        return {data: {
            kind: 'measurement-ratio-relation',
            units: {first: namedUnit(fact.first), second: namedUnit(fact.second)},
            unitEquality: {first: rational(fact.firstValue), second: rational(fact.secondValue)},
            quantityEquality: {
                first: rational(fact.firstValue * scaleFactor.numerator, scaleFactor.denominator),
                second: rational(fact.secondValue * scaleFactor.numerator, scaleFactor.denominator)
            },
            scaleFactor: {...scaleFactor},
            forwardFactor: rational(fact.secondValue, fact.firstValue),
            reverseFactor: rational(fact.firstValue, fact.secondValue)
        }};
    }
}
