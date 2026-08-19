import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {AngleConceptProblem} from '../../../types/problems.ts';
import {AngleConceptsGenerator} from './generator.ts';
import {AngleConceptsGeneratorConfig} from './spec.ts';

const generator = new AngleConceptsGenerator();

const recognitionConfig: AngleConceptsGeneratorConfig = {
    task: 'recognize-angle-from-arc',
    taskFeatures: [
        Area.RayConcept,
        Area.Circle,
        Area.FractionInterpretation
    ]
};

const derivationConfig: AngleConceptsGeneratorConfig = {
    task: 'derive-one-degree',
    taskFeatures: [
        Area.Circle,
        Area.FractionInterpretation,
        Scope.DegreeScale,
        Scope.UnitFractions
    ]
};

const iterationConfig: AngleConceptsGeneratorConfig = {
    task: 'interpret-degree-iteration',
    taskFeatures: [Area.AngleCalculation, Scope.DegreeScale]
};

function expectCommonGeometry(data: AngleConceptProblem): void {
    expect(data.geometry).toMatchObject({
        centerLabel: 'O',
        startPointLabel: 'A',
        endPointLabel: 'B',
        fullTurnDegrees: 360,
        startDegrees: 0,
        endDegrees: data.geometry.sweepDegrees,
        direction: 'counterclockwise'
    });
}

describe('AngleConceptsGenerator', () => {
    it('strictly requires a task and non-empty feature set', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate({task: 'derive-one-degree'})).toThrow(GeneratorValidationError);
        expect(() => generator.generate({
            task: 'derive-one-degree',
            taskFeatures: []
        })).toThrow(GeneratorValidationError);
    });

    it('generates exact fractional arcs centered at the shared ray endpoint', () => {
        const observed = new Set<string>();
        for (let seed = 0; seed < 80; seed++) {
            setSeed(`angle-arc-${seed}`);
            const data = generator.generate(recognitionConfig)!.data;
            expect(data.task).toBe('recognize-angle-from-arc');
            if (data.task !== 'recognize-angle-from-arc') throw new Error('Expected arc recognition.');
            expectCommonGeometry(data);
            expect(data.geometry.tickDegrees).toEqual([0, data.geometry.sweepDegrees]);
            expect(data.geometry.sweepDegrees).toBe(
                360 * data.arcFraction.numerator / data.arcFraction.denominator
            );
            expect(data.prompt).toBe('What is the degree measure of the highlighted angle?');
            expect(data.questionRelation).toBe(`${data.arcFraction.display} of a full turn = ?°`);
            expect(data.solutionRelation).toBe(
                `${data.arcFraction.display} of a full turn = ${data.geometry.sweepDegrees}°`
            );
            expect(data.rayStatement).toBe('Rays OA and OB share endpoint O.');
            expect(data.answer).toBe(`${data.geometry.sweepDegrees}°`);
            expect(data.answerStatement).toBe(
                `The highlighted angle measures ${data.geometry.sweepDegrees}° because it sweeps ${data.arcFraction.display} of a full turn.`
            );
            expect(data.explanation).toBe(
                `The highlighted arc covers ${data.arcFraction.display} of the 360° full turn, so its angle measure is ${data.geometry.sweepDegrees}°.`
            );
            observed.add(data.arcFraction.display);
        }
        expect(observed).toEqual(new Set(['1/6', '1/4', '1/3', '1/2']));
    });

    it('derives one degree as one of 360 equal full-circle turns', () => {
        const data = generator.generate(derivationConfig)!.data;
        expect(data.task).toBe('derive-one-degree');
        if (data.task !== 'derive-one-degree') throw new Error('Expected degree derivation.');
        expectCommonGeometry(data);
        expect(data.geometry).toMatchObject({
            sweepDegrees: 1,
            endDegrees: 1,
            tickDegrees: [0, 1]
        });
        expect(data.partitionCount).toBe(360);
        expect(data.selectedParts).toBe(1);
        expect(data.unitFraction).toEqual({numerator: 1, denominator: 360, display: '1/360'});
        expect(data.degreeMeasure).toBe(1);
        expect(data.prompt).toBe(
            'A full circle is partitioned into 360 equal turns. What is the angle measure of one turn?'
        );
        expect(data.questionRelation).toBe('1/360 of a full turn = ?');
        expect(data.solutionRelation).toBe('1/360 of a full turn = 1°');
        expect(data.fractionStatement).toBe('One equal turn is 1/360 of a full circle.');
        expect(data.answer).toBe('1°');
        expect(data.answerStatement).toBe('One equal turn measures 1°.');
        expect(data.explanation).toBe(
            'A full turn has 360°. Splitting it into 360 equal parts makes each part a 1° turn.'
        );
    });

    it('iterates a one-degree unit with an inclusive boundary tick for every turn', () => {
        const observed = new Set<number>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(`angle-iteration-${seed}`);
            const data = generator.generate(iterationConfig)!.data;
            expect(data.task).toBe('interpret-degree-iteration');
            if (data.task !== 'interpret-degree-iteration') throw new Error('Expected degree iteration.');
            expectCommonGeometry(data);
            expect(data.iterationCount).toBe(data.angleMeasure);
            expect(data.geometry.sweepDegrees).toBe(data.angleMeasure);
            expect(data.geometry.tickDegrees).toEqual(
                Array.from({length: data.iterationCount + 1}, (_, degree) => degree)
            );
            expect(data.prompt).toBe(
                `How many degrees are in ${data.iterationCount} one-degree turns?`
            );
            expect(data.questionRelation).toBe(`${data.iterationCount} × 1° = ?`);
            expect(data.solutionRelation).toBe(
                `${data.iterationCount} × 1° = ${data.angleMeasure}°`
            );
            expect(data.answer).toBe(`${data.angleMeasure}°`);
            expect(data.answerStatement).toBe(`The angle measures ${data.angleMeasure}°.`);
            expect(data.unitStatement).toBe('Each marked interval is a 1° turn.');
            expect(data.explanation).toBe(
                `Each interval measures 1°. Iterating it ${data.iterationCount} times gives ${data.iterationCount} × 1° = ${data.angleMeasure}°.`
            );
            observed.add(data.iterationCount);
        }
        expect(observed).toEqual(new Set([5, 8, 10, 12, 15]));
    });

    it.each([
        [{...recognitionConfig, taskFeatures: [Area.RayConcept]}, 'recognition'],
        [{...derivationConfig, taskFeatures: [Area.Circle]}, 'derivation'],
        [{...iterationConfig, taskFeatures: [Area.AngleCalculation]}, 'iteration'],
        [{task: 'unsupported', taskFeatures: [Area.Circle]}, 'unsupported task']
    ] as const)('rejects incomplete or unsupported $1 configuration', (config, _description) => {
        expect(generator.generate(config as unknown as AngleConceptsGeneratorConfig)).toBeNull();
    });

    it('is deterministic for a fixed seed', () => {
        setSeed('angle-concepts-determinism');
        const first = generator.generate(recognitionConfig);
        setSeed('angle-concepts-determinism');
        expect(generator.generate(recognitionConfig)).toEqual(first);
    });
});
