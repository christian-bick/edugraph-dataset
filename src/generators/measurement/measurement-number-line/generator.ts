import {Scope} from 'edugraph-ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    MeasurementNumberLineKind,
    MeasurementNumberLineProblem,
    MeasurementNumberLineUnit,
    MeasurementNumberLineValue
} from '../../../types/problems.ts';
import {
    MeasurementNumberLineGeneratorConfig,
    MeasurementNumberLineGeneratorSchema
} from './spec.ts';

type NumberKind = MeasurementNumberLineProblem['numberKind'];

const units: Record<MeasurementNumberLineKind, MeasurementNumberLineUnit> = {
    length: {id: 'meter', singular: 'meter', plural: 'meters', symbol: 'm', symbolPlacement: 'suffix'},
    time: {id: 'hour', singular: 'hour', plural: 'hours', symbol: 'h', symbolPlacement: 'suffix'},
    'liquid-volume': {id: 'liter', singular: 'liter', plural: 'liters', symbol: 'L', symbolPlacement: 'suffix'},
    weight: {id: 'kilogram', singular: 'kilogram', plural: 'kilograms', symbol: 'kg', symbolPlacement: 'suffix'},
    money: {id: 'dollar', singular: 'dollar', plural: 'dollars', symbol: '$', symbolPlacement: 'prefix'}
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

const formatFraction = (numerator: number, denominator: number): string => {
    if (numerator === 0) return '0';
    if (numerator === denominator) return '1';
    const divisor = gcd(numerator, denominator);
    return `${numerator / divisor}/${denominator / divisor}`;
};

const formatDecimal = (numerator: number, denominator: 10 | 100): string => {
    const digits = denominator === 10 ? 1 : 2;
    const whole = Math.floor(numerator / denominator);
    return `${whole}.${String(numerator % denominator).padStart(digits, '0')}`;
};

const makeValue = (
    numerator: number,
    denominator: number,
    numberKind: NumberKind,
    measurementKind: MeasurementNumberLineKind
): MeasurementNumberLineValue => {
    const unit = units[measurementKind];
    if (numberKind === 'fraction') {
        const divisor = gcd(numerator, denominator);
        const exact = numerator === 0
            ? {numerator: 0, denominator: 1}
            : {numerator: numerator / divisor, denominator: denominator / divisor};
        const display = formatFraction(numerator, denominator);
        if (measurementKind === 'money') {
            const quantityText = exact.numerator === 0
                ? '0 dollars'
                : exact.numerator === exact.denominator ? '1 dollar' : `${display} of a dollar`;
            return {...exact, display, quantityText};
        }
        const quantityText = exact.numerator === 0
            ? `0 ${unit.plural}`
            : exact.numerator === exact.denominator
                ? `1 ${unit.singular}`
                : `${display} of ${measurementKind === 'time' ? 'an' : 'a'} ${unit.singular}`;
        return {...exact, display, quantityText};
    }

    const decimalDenominator = denominator as 10 | 100;
    const display = formatDecimal(numerator, decimalDenominator);
    const exact = {numerator, denominator: decimalDenominator};
    if (measurementKind === 'money') return {...exact, display, quantityText: `$${display}`};
    const unitName = numerator === decimalDenominator ? unit.singular : unit.plural;
    return {...exact, display, quantityText: `${display} ${unitName}`};
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
            'physicalMeasurement',
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
        if (config.physicalMeasurement !== (measurementKind !== 'money')) {
            throw new GeneratorValidationError(
                'measurement-number-line',
                'Physical measurement semantics are required for length, time, liquid-volume, and weight, and forbidden for money.'
            );
        }

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
        const ticks = Array.from({length: tickCount + 1}, (_, index) => ({
            index,
            value: makeValue(index * increment, denominator, numberKind, measurementKind)
        }));
        const targetIndex = randomInteger(2, tickCount - 1);
        const start = ticks[0]!.value;
        const end = ticks[tickCount]!.value;
        const interval = ticks[1]!.value;
        const target = ticks[targetIndex]!;
        const prompt = `Plot ${target.value.quantityText} on the number line.`;
        const scaleStatement = `Each equal interval represents ${interval.quantityText}.`;
        const answerStatement = `${target.value.quantityText} belongs at tick ${target.index} after zero.`;
        const explanation = `Starting at zero, count ${target.index} equal intervals of ${interval.quantityText}. The point lands at ${target.value.quantityText}.`;
        const data: MeasurementNumberLineProblem = {
            task: 'grade4-measurement-number-line',
            measurementKind,
            numberKind,
            unit: units[measurementKind],
            tickCount,
            ticks,
            labeledTickIndices: [0, 1, tickCount],
            start,
            end,
            interval,
            target,
            prompt,
            scaleStatement,
            answerStatement,
            explanation
        };
        const unitTag = unitTags[measurementKind];
        return unitTag ? {data, tags: [unitTag]} : {data};
    }
}
