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
            observed.add(`${data.arcFraction.numerator}/${data.arcFraction.denominator}`);
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
        expect(data.unitFraction).toEqual({numerator: 1, denominator: 360});
        expect(data.degreeMeasure).toBe(1);
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
