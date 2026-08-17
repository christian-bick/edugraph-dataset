import {Ability, Area, Scope} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    AngleConceptFraction,
    AngleConceptGeometry,
    AngleConceptProblem
} from '../../../types/problems.ts';
import {AngleConceptsGeneratorConfig, AngleConceptsGeneratorSchema} from './spec.ts';

type ArcTurn = {
    fraction: AngleConceptFraction;
    degrees: 60 | 90 | 120 | 180;
};

const ARC_TURNS: readonly ArcTurn[] = [
    {fraction: {numerator: 1, denominator: 6, display: '1/6'}, degrees: 60},
    {fraction: {numerator: 1, denominator: 4, display: '1/4'}, degrees: 90},
    {fraction: {numerator: 1, denominator: 3, display: '1/3'}, degrees: 120},
    {fraction: {numerator: 1, denominator: 2, display: '1/2'}, degrees: 180}
];

const ITERATION_COUNTS = [5, 8, 10, 12, 15] as const;

function randomItem<T>(items: readonly T[]): T {
    return items[Math.floor(random() * items.length)];
}

function hasAllFeatures(features: readonly string[], required: readonly string[]): boolean {
    return required.every(feature => features.includes(feature));
}

function geometry(sweepDegrees: number, tickDegrees: number[]): AngleConceptGeometry {
    return {
        centerLabel: 'O',
        startPointLabel: 'A',
        endPointLabel: 'B',
        fullTurnDegrees: 360,
        startDegrees: 0,
        endDegrees: sweepDegrees,
        sweepDegrees,
        direction: 'counterclockwise',
        tickDegrees
    };
}

export class AngleConceptsGenerator implements ProblemGenerator<
    AngleConceptProblem,
    AngleConceptsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = AngleConceptsGeneratorSchema;

    generate(config: AngleConceptsGeneratorConfig): ProblemStub<AngleConceptProblem> | null {
        validateConfigFields('angle-concepts', config, ['task', 'taskFeatures']);
        const features = config.taskFeatures!;

        if (config.task === 'recognize-angle-from-arc') {
            if (!hasAllFeatures(features, [
                Area.RayConcept,
                Area.Circle,
                Area.FractionInterpretation,
                Ability.Interpretation
            ])) return null;

            const {fraction, degrees} = randomItem(ARC_TURNS);
            return {
                data: {
                    task: 'recognize-angle-from-arc',
                    prompt: 'What is the degree measure of the highlighted angle?',
                    geometry: geometry(degrees, [0, degrees]),
                    arcFraction: fraction,
                    questionRelation: `${fraction.display} of a full turn = ?°`,
                    solutionRelation: `${fraction.display} of a full turn = ${degrees}°`,
                    rayStatement: 'Rays OA and OB share endpoint O.',
                    answer: `${degrees}°`,
                    answerStatement: `The highlighted angle measures ${degrees}° because it sweeps ${fraction.display} of a full turn.`,
                    explanation: `The highlighted arc covers ${fraction.display} of the 360° full turn, so its angle measure is ${degrees}°.`
                }
            };
        }

        if (config.task === 'derive-one-degree') {
            if (!hasAllFeatures(features, [
                Area.Circle,
                Area.FractionInterpretation,
                Scope.DegreeScale,
                Scope.UnitFractions
            ])) return null;

            return {
                data: {
                    task: 'derive-one-degree',
                    prompt: 'A full circle is partitioned into 360 equal turns. What is the angle measure of one turn?',
                    geometry: geometry(1, [0, 1]),
                    partitionCount: 360,
                    selectedParts: 1,
                    unitFraction: {numerator: 1, denominator: 360, display: '1/360'},
                    degreeMeasure: 1,
                    questionRelation: '1/360 of a full turn = ?',
                    solutionRelation: '1/360 of a full turn = 1°',
                    fractionStatement: 'One equal turn is 1/360 of a full circle.',
                    answer: '1°',
                    answerStatement: 'One equal turn measures 1°.',
                    explanation: 'A full turn has 360°. Splitting it into 360 equal parts makes each part a 1° turn.'
                }
            };
        }

        if (config.task === 'interpret-degree-iteration') {
            if (!hasAllFeatures(features, [
                Area.AngleCalculation,
                Scope.DegreeScale,
                Ability.Interpretation
            ])) return null;

            const iterationCount = randomItem(ITERATION_COUNTS);
            return {
                data: {
                    task: 'interpret-degree-iteration',
                    prompt: `How many degrees are in ${iterationCount} one-degree turns?`,
                    geometry: geometry(
                        iterationCount,
                        Array.from({length: iterationCount + 1}, (_, degree) => degree)
                    ),
                    unitDegree: 1,
                    iterationCount,
                    angleMeasure: iterationCount,
                    questionRelation: `${iterationCount} × 1° = ?`,
                    solutionRelation: `${iterationCount} × 1° = ${iterationCount}°`,
                    unitStatement: 'Each marked interval is a 1° turn.',
                    answer: `${iterationCount}°`,
                    answerStatement: `The angle measures ${iterationCount}°.`,
                    explanation: `Each interval measures 1°. Iterating it ${iterationCount} times gives ${iterationCount} × 1° = ${iterationCount}°.`
                }
            };
        }

        return null;
    }
}
