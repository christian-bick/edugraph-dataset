import {Area, Scope} from 'edugraph-ts';
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
    {fraction: {numerator: 1, denominator: 6}, degrees: 60},
    {fraction: {numerator: 1, denominator: 4}, degrees: 90},
    {fraction: {numerator: 1, denominator: 3}, degrees: 120},
    {fraction: {numerator: 1, denominator: 2}, degrees: 180}
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
                Area.FractionInterpretation
            ])) return null;

            const {fraction, degrees} = randomItem(ARC_TURNS);
            return {
                data: {
                    task: 'recognize-angle-from-arc',
                    geometry: geometry(degrees, [0, degrees]),
                    arcFraction: fraction
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
                    geometry: geometry(1, [0, 1]),
                    partitionCount: 360,
                    selectedParts: 1,
                    unitFraction: {numerator: 1, denominator: 360},
                    degreeMeasure: 1
                }
            };
        }

        if (config.task === 'interpret-degree-iteration') {
            if (!hasAllFeatures(features, [
                Area.AngleCalculation,
                Scope.DegreeScale
            ])) return null;

            const iterationCount = randomItem(ITERATION_COUNTS);
            return {
                data: {
                    task: 'interpret-degree-iteration',
                    geometry: geometry(
                        iterationCount,
                        Array.from({length: iterationCount + 1}, (_, degree) => degree)
                    ),
                    unitDegree: 1,
                    iterationCount,
                    angleMeasure: iterationCount
                }
            };
        }

        return null;
    }
}
