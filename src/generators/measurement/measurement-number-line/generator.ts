import {Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    MeasurementNumberLineKind,
    MeasurementNumberLineProblem,
    MeasurementNumberLineUnitId,
    MeasurementNumberLineValue
} from '../../../types/problems.ts';
import {
    MeasurementNumberLineGeneratorConfig,
    MeasurementNumberLineGeneratorSchema
} from './spec.ts';

type NumberKind = MeasurementNumberLineProblem['numberKind'];

const unitIds: Record<MeasurementNumberLineKind, MeasurementNumberLineUnitId> = {
    length: 'meter',
    time: 'hour',
    'liquid-volume': 'liter',
    weight: 'kilogram',
    money: 'dollar'
};

const unitTags: Record<MeasurementNumberLineKind, Scope | undefined> = {
    length: Scope.MeterScale,
    time: Scope.HourIntervals,
    'liquid-volume': Scope.LiterScale,
    weight: Scope.KilogramScale,
    money: undefined
};

const gcd = (a: number, b: number): number => {
    let first = Math.abs(a);
    let second = Math.abs(b);
    while (second !== 0) {
        [first, second] = [second, first % second];
    }
    return first;
};

const makeValue = (
    numerator: number,
    denominator: number,
    numberKind: NumberKind
): MeasurementNumberLineValue => {
    if (numberKind === 'fraction') {
        const divisor = gcd(numerator, denominator);
        return numerator === 0
            ? {numerator: 0, denominator: 1}
            : {numerator: numerator / divisor, denominator: denominator / divisor};
    }

    return {numerator, denominator};
};

const randomInteger = (min: number, max: number): number =>
    min + Math.floor(random() * (max - min + 1));

export class MeasurementNumberLineGenerator implements ProblemGenerator<
    MeasurementNumberLineProblem,
    MeasurementNumberLineGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = MeasurementNumberLineGeneratorSchema;

    generate(config: MeasurementNumberLineGeneratorConfig): ProblemStub<MeasurementNumberLineProblem> {
        validateConfigFields('measurement-number-line', config, [
            'measurementKind',
            'numberKind'
        ]);

        if (typeof config.measurementKind !== 'string'
            || !['length', 'time', 'liquid-volume', 'weight', 'money'].includes(config.measurementKind)) {
            throw new GeneratorValidationError('measurement-number-line', `Unsupported measurement kind "${config.measurementKind}".`);
        }
        if (config.numberKind !== 'fraction' && config.numberKind !== 'decimal') {
            throw new GeneratorValidationError('measurement-number-line', `Unsupported number kind "${config.numberKind}".`);
        }

        const measurementKind = config.measurementKind as MeasurementNumberLineKind;
        const numberKind = config.numberKind as NumberKind;
        const tickCount: 4 | 8 | 10 = numberKind === 'fraction'
            ? random() >= 0.5 ? 8 : 4
            : 10;
        const denominator = numberKind === 'fraction'
            ? tickCount
            : measurementKind === 'money' ? 100 : 10;
        const increment = numberKind === 'fraction'
            ? 1
            : measurementKind === 'money' ? 10 : 1;
        const tickValues = Array.from(
            {length: tickCount + 1},
            (_, index) => makeValue(index * increment, denominator, numberKind)
        );
        const targetIndex = randomInteger(2, tickCount - 1);
        const data: MeasurementNumberLineProblem = {
            measurementKind,
            numberKind,
            unitId: unitIds[measurementKind],
            tickValues,
            targetIndex
        };
        const unitTag = unitTags[measurementKind];
        return unitTag ? {data, tags: [unitTag]} : {data};
    }
}
