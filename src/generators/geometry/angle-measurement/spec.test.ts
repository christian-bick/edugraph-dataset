import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {AngleMeasurementGenerator} from './generator.ts';
import {spec} from './spec.ts';

const cases = [
    {
        expectedHash: '33195220',
        task: 'measure-angle',
        labels: [
            Area.AngleCalculation,
            Scope.DegreeScale,
            Scope.Protractor,
            Ability.ProcedureExecution
        ],
        generatorLabels: [Area.AngleCalculation]
    },
    {
        expectedHash: 'f158f327',
        task: 'sketch-angle',
        labels: [
            Area.AngleConcept,
            Scope.AngleMeasurement,
            Scope.DegreeScale,
            Ability.ConceptSpecification,
            Ability.VisualArticulation
        ],
        generatorLabels: [Ability.ConceptSpecification]
    }
] as const;

describe('AngleMeasurementGenerator spec integration', () => {
    it('declares only invariant angle mathematics as general labels', () => {
        expect(spec.generalLabels).toEqual([
            Area.AngleConcept,
            Scope.DegreeScale
        ]);
    });

    it.each(cases)('resolves generator-owned labels for the corrected $task target', ({
        expectedHash,
        generatorLabels,
        labels,
        task
    }) => {
        expect(labelSetHash([...labels])).toBe(expectedHash);
        const stub = generateWithLabels(new AngleMeasurementGenerator(), [...labels]);
        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe(task);
        expect(stub!.tags).toEqual(expect.arrayContaining([...generatorLabels]));
        expect([...new Set(stub!.tags)]).toHaveLength(stub!.tags!.length);
    });
});
