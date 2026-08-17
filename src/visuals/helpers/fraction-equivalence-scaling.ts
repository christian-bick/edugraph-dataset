import {
    FractionScalingNumberLineTick,
    FractionScalingProblem,
    FractionScalingStep,
    FractionValue
} from '../../types/problems.ts';

const EPSILON = 0.001;
const DENOMINATORS = [2, 3, 4, 6, 8] as const;
const PART_SIZE_PHRASES = {
    2: 'one-half',
    3: 'one-third',
    4: 'one-fourth'
} as const;

const fractionIsValid = (fraction: FractionValue): boolean => typeof fraction === 'object'
    && fraction !== null
    && Number.isInteger(fraction.numerator)
    && fraction.numerator > 0
    && Number.isInteger(fraction.denominator)
    && DENOMINATORS.includes(fraction.denominator)
    && fraction.numerator < fraction.denominator
    && fraction.notation === `${fraction.numerator}/${fraction.denominator}`;

const scalingStepIsValid = (
    step: FractionScalingStep,
    from: number,
    factor: 2 | 3 | 4,
    result: number
): boolean => typeof step === 'object'
    && step !== null
    && step.from === from
    && step.factor === factor
    && step.result === result
    && step.equation === `${from} × ${factor} = ${result}`;

const ticksAreValid = (
    ticks: FractionScalingNumberLineTick[],
    denominator: number
): boolean => Array.isArray(ticks)
    && ticks.length === denominator + 1
    && ticks.every((tick, index) => typeof tick === 'object'
        && tick !== null
        && tick.index === index
        && Number.isFinite(tick.xPercent)
        && Math.abs(tick.xPercent - index / denominator * 100) < EPSILON
        && tick.label === (index === 0 ? '0' : index === denominator ? '1' : ''));

export const isValidFractionScalingProblem = (data: FractionScalingProblem): boolean => {
    if (data.task !== 'scale-equivalence'
        || !fractionIsValid(data.first)
        || !fractionIsValid(data.second)
        || ![2, 3, 4].includes(data.scaleFactor)
        || data.sharedWhole !== 1
        || data.second.numerator !== data.first.numerator * data.scaleFactor
        || data.second.denominator !== data.first.denominator * data.scaleFactor
        || data.first.numerator * data.second.denominator
            !== data.second.numerator * data.first.denominator
        || !scalingStepIsValid(
            data.numeratorScale,
            data.first.numerator,
            data.scaleFactor,
            data.second.numerator
        )
        || !scalingStepIsValid(
            data.denominatorScale,
            data.first.denominator,
            data.scaleFactor,
            data.second.denominator
        )
        || data.questionEquation !== `${data.first.notation} = ?/${data.second.denominator}`
        || data.scalingEquation !== `${data.first.notation} = (${data.first.numerator} × ${data.scaleFactor})/(${data.first.denominator} × ${data.scaleFactor}) = ${data.second.notation}`
        || data.firstUnitPart !== `1/${data.first.denominator}`
        || data.secondUnitPart !== `1/${data.second.denominator}`
        || data.relation !== 'equal'
        || data.answer !== String(data.second.numerator)
        || data.answerStatement !== `${data.first.notation} = ${data.second.notation}.`
        || data.explanation !== `Multiplying the numerator and denominator of ${data.first.notation} by ${data.scaleFactor} makes ${data.scaleFactor} times as many equal parts. Each new part is ${PART_SIZE_PHRASES[data.scaleFactor]} as large, so ${data.second.notation} shades the same amount as ${data.first.notation}.`) return false;

    const bars = data.barModel;
    if (typeof bars !== 'object'
        || bars === null
        || typeof bars.first !== 'object'
        || bars.first === null
        || typeof bars.second !== 'object'
        || bars.second === null
        || bars.first.partCount !== data.first.denominator
        || bars.first.shadedCount !== data.first.numerator
        || bars.second.partCount !== data.second.denominator
        || bars.second.shadedCount !== data.second.numerator
        || bars.first.shadedCount * bars.second.partCount
            !== bars.second.shadedCount * bars.first.partCount) return false;

    const line = data.numberLineModel;
    if (typeof line !== 'object'
        || line === null
        || !ticksAreValid(line.firstTicks, data.first.denominator)
        || !ticksAreValid(line.secondTicks, data.second.denominator)
        || typeof line.firstPoint !== 'object'
        || line.firstPoint === null
        || typeof line.secondPoint !== 'object'
        || line.secondPoint === null
        || !Number.isFinite(line.firstPoint.xPercent)
        || !Number.isFinite(line.secondPoint.xPercent)
        || line.firstPoint.tickIndex !== data.first.numerator
        || line.secondPoint.tickIndex !== data.second.numerator
        || line.firstPoint.label !== data.first.notation
        || line.secondPoint.label !== data.second.notation
        || !Number.isFinite(line.coLocatedXPercent)
        || Math.abs(line.firstPoint.xPercent - line.coLocatedXPercent) >= EPSILON
        || Math.abs(line.secondPoint.xPercent - line.coLocatedXPercent) >= EPSILON
        || Math.abs(line.coLocatedXPercent - data.first.numerator / data.first.denominator * 100) >= EPSILON
        || Math.abs(
            line.firstTicks[line.firstPoint.tickIndex].xPercent - line.firstPoint.xPercent
        ) >= EPSILON
        || Math.abs(
            line.secondTicks[line.secondPoint.tickIndex].xPercent - line.secondPoint.xPercent
        ) >= EPSILON) return false;

    return true;
};
