import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {AngleConceptsGenerator} from './generator.ts';
import {spec} from './spec.ts';

const cases = [
    {
        expectedHash: 'c9f2ee74',
        task: 'recognize-angle-from-arc',
        labels: [
            Area.AngleConcept,
            Area.RayConcept,
            Area.ArchConcept,
            Area.Circle,
            Area.FractionInterpretation,
            Ability.Interpretation
        ]
    },
    {
        expectedHash: 'f0d8fba4',
        task: 'derive-one-degree',
        labels: [
            Area.AngleConcept,
            Area.Circle,
            Area.FractionInterpretation,
            Scope.DegreeScale,
            Scope.UnitFractions,
            Ability.ConceptDerivation
        ]
    },
    {
        expectedHash: '28165605',
        task: 'interpret-degree-iteration',
        labels: [
            Area.AngleConcept,
            Area.AngleCalculation,
            Area.Iteration,
            Scope.DegreeScale,
            Ability.Interpretation
        ]
    }
] as const;

describe('AngleConceptsGenerator spec integration', () => {
    it('declares only the invariant abstract angle claims as general labels', () => {
        expect(spec.generalLabels).toEqual([Area.AngleConcept]);
    });

    it.each(cases)('resolves the corrected Grade 4 $task target', ({expectedHash, labels, task}) => {
        expect(labelSetHash([...labels])).toBe(expectedHash);
        const stub = generateWithLabels(new AngleConceptsGenerator(), [...labels]);
        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe(task);
        expect(stub!.labels).toEqual(expect.arrayContaining(
            labels.filter(label =>
                !spec.generalLabels.includes(label)
                && label !== Ability.Interpretation
                && label !== Ability.ConceptDerivation
            )
        ));
        expect(stub!.labels).not.toContain(Ability.Interpretation);
        expect(stub!.labels).not.toContain(Ability.ConceptDerivation);
        expect([...new Set(stub!.labels)]).toHaveLength(stub!.labels!.length);
    });
});
