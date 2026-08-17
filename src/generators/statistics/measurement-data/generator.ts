import {Area, Scope} from 'edugraph-ts';
import {random} from '../../../lib/random.ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    FractionLinePlotValue,
    Grade4FractionLinePlotProblem,
    MeasurementDataProblem,
    MeasurementObservation
} from '../../../types/problems.ts';
import {MeasurementDataGeneratorConfig, MeasurementDataGeneratorSchema} from './spec.ts';

const objects: MeasurementObservation['object'][] = ['pencil', 'crayon', 'ribbon', 'key', 'brush', 'block'];

const gcd = (first: number, second: number): number => second === 0
    ? Math.abs(first)
    : gcd(second, first % second);

const makeFractionValue = (eighths: number): FractionLinePlotValue => {
    const divisor = gcd(eighths, 8);
    const numerator = eighths / divisor;
    const denominator = (8 / divisor) as FractionLinePlotValue['denominator'];
    const whole = Math.floor(eighths / 8);
    const remainder = eighths % 8;
    const display = remainder === 0
        ? String(whole)
        : whole === 0
            ? `${numerator}/${denominator}`
            : `${whole} ${(remainder / gcd(remainder, 8))}/${8 / gcd(remainder, 8)}`;
    const quantityDisplay = whole > 0 && remainder !== 0
        ? display.replace(' ', ' and ')
        : display;
    return {
        eighths,
        numerator,
        denominator,
        display,
        quantityText: `${quantityDisplay} ${eighths === 8 ? 'inch' : 'inches'}`
    };
};

const shuffle = <T>(values: T[]): T[] => {
    for (let index = values.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [values[index], values[swapIndex]] = [values[swapIndex]!, values[index]!];
    }
    return values;
};

const generateGrade4FractionLinePlot = (
    operation: Area.Addition | Area.Subtraction | undefined
): Grade4FractionLinePlotProblem => {
    const subdivisions = 8 as const;
    const intervalEighths = 1;
    const intervalCount = 16;
    const axisStartEighths = (1 + Math.floor(random() * 2)) * 8;
    const interiorOffset = 5 + Math.floor(random() * 10);
    const measurementTickOffsets = [1, 2, 4, 4, interiorOffset, intervalCount];
    const measurementEighths = shuffle(measurementTickOffsets)
        .map(offset => axisStartEighths + offset * intervalEighths);
    const fractionObservations = objects.map((object, index) => ({
        object,
        value: makeFractionValue(measurementEighths[index]!)
    }));
    const observations = fractionObservations.map(({object, value}) => ({
        object,
        length: value.eighths / 8
    }));
    const axisTicks = Array.from({length: intervalCount + 1}, (_, index) => ({
        index,
        value: makeFractionValue(axisStartEighths + index * intervalEighths)
    }));
    const frequencies = axisTicks.map(({value}) => ({
        value,
        count: measurementEighths.filter(eighths => eighths === value.eighths).length
    }));
    const common = {
        unit: 'in' as const,
        subdivisions,
        observations,
        fractionObservations,
        axisStart: axisTicks[0]!.value,
        axisEnd: axisTicks[intervalCount]!.value,
        interval: makeFractionValue(intervalEighths),
        axisTicks,
        frequencies,
        scaleStatement: `Each tick mark represents ${makeFractionValue(intervalEighths).display} inch.`
    };

    if (!operation) {
        return {
            ...common,
            task: 'construct-fraction-line-plot',
            prompt: 'Construct a line plot for these six object lengths.',
            answerStatement: 'The completed line plot contains 6 X marks.',
            explanation: 'Place one X above the matching tick for each object length. A repeated measurement receives one X for each object.'
        };
    }

    const shortest = makeFractionValue(axisStartEighths + intervalEighths);
    const longest = makeFractionValue(axisStartEighths + intervalCount * intervalEighths);
    const isAddition = operation === Area.Addition;
    const leftOperand = isAddition ? shortest : longest;
    const rightOperand = isAddition ? longest : shortest;
    const answer = makeFractionValue(isAddition
        ? leftOperand.eighths + rightOperand.eighths
        : leftOperand.eighths - rightOperand.eighths);
    return {
        ...common,
        task: 'fraction-line-plot-arithmetic',
        operation: isAddition ? 'addition' : 'subtraction',
        shortest,
        longest,
        leftOperand,
        rightOperand,
        answer,
        prompt: isAddition
            ? 'What is the combined length of the shortest and longest measurements?'
            : 'How much longer is the longest measurement than the shortest measurement?',
        questionEquation: isAddition
            ? 'shortest + longest = ?'
            : 'longest − shortest = ?',
        solutionEquation: `${leftOperand.display} ${isAddition ? '+' : '−'} ${rightOperand.display} = ${answer.display}`,
        answerStatement: `${isAddition ? 'The combined length' : 'The difference'} is ${answer.quantityText}.`,
        explanation: isAddition
            ? `The shortest measurement is ${shortest.quantityText}, and the longest is ${longest.quantityText}. Add them to get ${answer.quantityText}.`
            : `The longest measurement is ${longest.quantityText}, and the shortest is ${shortest.quantityText}. Subtract to get ${answer.quantityText}.`
    };
};

export class MeasurementDataGenerator implements ProblemGenerator<MeasurementDataProblem, MeasurementDataGeneratorConfig> {
    type: AbstractProblem['type'] = 'statistics';
    schema = MeasurementDataGeneratorSchema;

    generate(config: MeasurementDataGeneratorConfig): ProblemStub<MeasurementDataProblem> {
        validateConfigFields('measurement-data', config, ['numberKind']);

        const usesSingleFrame = config.linePlotFeatures?.includes(Scope.SingleFrameOfReference) ?? false;
        const usesFractionArithmetic = config.linePlotFeatures?.includes(Area.FractionArithmetic) ?? false;
        if (usesSingleFrame) {
            if (config.numberKind !== Scope.FractionNumbers) {
                throw new GeneratorValidationError('measurement-data', 'Grade 4 line plots require fractional measurements.');
            }
            if (config.operation !== Area.Addition && config.operation !== Area.Subtraction) {
                if (usesFractionArithmetic) {
                    throw new GeneratorValidationError('measurement-data', 'Fraction arithmetic requires addition or subtraction.');
                }
                return {data: generateGrade4FractionLinePlot(undefined)};
            }
            if (!usesFractionArithmetic) {
                throw new GeneratorValidationError('measurement-data', 'Line-plot arithmetic requires FractionArithmetic.');
            }
            return {data: generateGrade4FractionLinePlot(config.operation)};
        }

        if ((config.operation && config.operation !== 'none') || usesFractionArithmetic) {
            throw new GeneratorValidationError('measurement-data', 'Line-plot arithmetic requires SingleFrameOfReference.');
        }

        if (config.numberKind === Scope.FractionNumbers) {
            const quarterUnits = [
                (2 + Math.floor(random() * 6)) * 4 + 1,
                (2 + Math.floor(random() * 6)) * 4 + 2,
                ...Array.from({length: objects.length - 2}, () => 8 + Math.floor(random() * 25))
            ];
            const observations = objects.map((object, index) => ({
                object,
                length: quarterUnits[index] / 4
            }));
            return {data: {unit: 'in', subdivisions: 4, observations}};
        }
        const observations = objects.map(object => ({
            object,
            length: 2 + Math.floor(random() * 9)
        }));

        return {data: {unit: 'cm', subdivisions: 1, observations}};
    }
}
