import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    AngleMeasurementGeometry,
    AngleMeasurementProblem,
    ProtractorAngleMeasure,
    SketchAngleMeasure
} from '../../../types/problems.ts';
import {AngleMeasurementGeneratorConfig, AngleMeasurementGeneratorSchema} from './spec.ts';

const PROTRACTOR_MEASURES: readonly ProtractorAngleMeasure[] = [
    23, 37, 52, 68, 90, 112, 127, 143, 158
];

const SKETCH_MEASURES: readonly SketchAngleMeasure[] = [
    30, 45, 60, 75, 90, 105, 120, 135, 150
];

function randomItem<T>(items: readonly T[]): T {
    return items[Math.floor(random() * items.length)];
}

function measureGeometry(
    measure: ProtractorAngleMeasure,
    baselineSide: 'right' | 'left'
): AngleMeasurementGeometry {
    const startsRight = baselineSide === 'right';
    return {
        vertexLabel: 'O',
        baselinePointLabel: 'A',
        terminalPointLabel: 'B',
        baselineSide,
        baselineDegrees: startsRight ? 0 : 180,
        terminalDegrees: startsRight ? measure : 180 - measure,
        sweepDegrees: measure,
        direction: startsRight ? 'counterclockwise' : 'clockwise'
    };
}

function sketchGeometry(measure: SketchAngleMeasure): AngleMeasurementGeometry {
    return {
        vertexLabel: 'O',
        baselinePointLabel: 'A',
        terminalPointLabel: 'B',
        baselineSide: 'right',
        baselineDegrees: 0,
        terminalDegrees: measure,
        sweepDegrees: measure,
        direction: 'counterclockwise'
    };
}

export class AngleMeasurementGenerator implements ProblemGenerator<
    AngleMeasurementProblem,
    AngleMeasurementGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = AngleMeasurementGeneratorSchema;

    generate(config: AngleMeasurementGeneratorConfig): ProblemStub<AngleMeasurementProblem> | null {
        validateConfigFields('angle-measurement', config, ['useProtractorMeasurement']);

        if (config.useProtractorMeasurement) {
            const angleMeasure = randomItem(PROTRACTOR_MEASURES);
            const baselineSide = random() < 0.5 ? 'right' : 'left';
            const readingScale = baselineSide === 'right' ? 'inner' : 'outer';
            return {
                data: {
                    task: 'measure-angle',
                    prompt: 'Use the protractor to measure angle AOB.',
                    geometry: measureGeometry(angleMeasure, baselineSide),
                    protractor: {
                        minimumDegrees: 0,
                        maximumDegrees: 180,
                        tickStepDegrees: 1,
                        labelStepDegrees: 10,
                        centerLabel: 'O',
                        baselinePointLabel: 'A',
                        zeroSide: baselineSide,
                        readingScale
                    },
                    angleMeasure,
                    questionRelation: 'm∠AOB = ?°',
                    solutionRelation: `m∠AOB = ${angleMeasure}°`,
                    answer: `${angleMeasure}°`,
                    answerStatement: `Angle AOB measures ${angleMeasure}°.`,
                    explanation: `Ray OA starts at the ${baselineSide} 0° mark. Following the ${readingScale} scale to ray OB gives ${angleMeasure}°.`
                }
            };
        }

        const requestedMeasure = randomItem(SKETCH_MEASURES);
        return {
            data: {
                task: 'sketch-angle',
                prompt: `Sketch a ${requestedMeasure}° angle with vertex O and starting ray OA.`,
                geometry: sketchGeometry(requestedMeasure),
                requestedMeasure,
                completedMeasure: requestedMeasure,
                questionRelation: `m∠AOB = ${requestedMeasure}° (requested)`,
                solutionRelation: `m∠AOB = ${requestedMeasure}°`,
                answer: `${requestedMeasure}°`,
                answerStatement: `The completed angle measures ${requestedMeasure}°.`,
                explanation: `Ray OB is placed ${requestedMeasure}° counterclockwise from ray OA, so angle AOB has the specified measure.`
            }
        };
    }
}
