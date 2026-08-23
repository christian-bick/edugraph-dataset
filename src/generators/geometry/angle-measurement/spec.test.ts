import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {AngleMeasurementGenerator} from './generator.ts';
import {spec} from './spec.ts';

const cases = [
    {
        expectedHash: '33195220',
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
        labels: [
            Area.AngleConcept,
            Scope.AngleMeasurement,
            Scope.DegreeScale,
            Ability.ConceptSpecification,
            Ability.VisualArticulation
        ],
        generatorLabels: []
    }
] as const;

describe('AngleMeasurementGenerator spec integration', () => {
    it('declares only invariant angle mathematics as general labels', () => {
        expect(spec.generalLabels).toEqual([
            Area.AngleConcept,
            Scope.DegreeScale
        ]);
    });

    it.each(cases)('resolves generator-owned labels for each corrected angle target', ({
        expectedHash,
        generatorLabels,
        labels
    }) => {
        expect(labelSetHash([...labels])).toBe(expectedHash);
        const stub = generateWithLabels(new AngleMeasurementGenerator(), [...labels]);
        expect(stub).not.toBeNull();
        expect(stub!.data).toEqual({angleMeasure: stub!.data.angleMeasure});
        expect(stub!.tags).toEqual(expect.arrayContaining([...generatorLabels]));
        expect(stub!.tags).not.toContain(Ability.ConceptSpecification);
        expect([...new Set(stub!.tags)]).toHaveLength(stub!.tags!.length);
    });
});
