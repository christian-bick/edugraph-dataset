import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {AngleConceptsGenerator} from './generator.ts';
import {spec} from './spec.ts';

const cases = [
    {
        expectedHash: '186a2e31',
        task: 'recognize-angle-from-arc',
        labels: [
            Area.AngleConcept,
            Area.RayConcept,
            Area.ArchConcept,
            Area.Circle,
            Area.FractionInterpretation,
            Scope.AngleMeasurement,
            Ability.Interpretation
        ]
    },
    {
        expectedHash: '1286efa9',
        task: 'derive-one-degree',
        labels: [
            Area.AngleConcept,
            Area.Circle,
            Area.FractionInterpretation,
            Scope.AngleMeasurement,
            Scope.DegreeScale,
            Scope.UnitFractions,
            Ability.ConceptDerivation
        ]
    },
    {
        expectedHash: 'ea4ab73a',
        task: 'interpret-degree-iteration',
        labels: [
            Area.AngleConcept,
            Area.AngleCalculation,
            Area.Iteration,
            Scope.AngleMeasurement,
            Scope.DegreeScale,
            Ability.Interpretation
        ]
    }
] as const;

describe('AngleConceptsGenerator spec integration', () => {
    it('declares only the invariant abstract angle claims as general labels', () => {
        expect(spec.generalLabels).toEqual([Area.AngleConcept, Scope.AngleMeasurement]);
    });

    it.each(cases)('resolves the corrected Grade 4 $task target', ({expectedHash, labels, task}) => {
        expect(labelSetHash([...labels])).toBe(expectedHash);
        const stub = generateWithLabels(new AngleConceptsGenerator(), [...labels]);
        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe(task);
        expect(stub!.tags).toEqual(expect.arrayContaining(
            labels.filter(label => !spec.generalLabels.includes(label))
        ));
        expect([...new Set(stub!.tags)]).toHaveLength(stub!.tags!.length);
    });
});
