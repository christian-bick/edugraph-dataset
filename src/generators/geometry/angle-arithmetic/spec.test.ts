import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {AngleArithmeticGenerator} from './generator.ts';
import {spec} from './spec.ts';

const cases = [
    {
        expectedHash: 'c66ef9e7',
        task: 'explain-angle-addition',
        labels: [
            Area.AdjacentAngles,
            Area.AngleCalculation,
            Area.Addition,
            Scope.AngleMeasurement,
            Scope.DegreeScale,
            Ability.ProcedureUnderstanding
        ]
    },
    {
        expectedHash: 'fb75a29f',
        task: 'solve-unknown-angle',
        labels: [
            Area.AdjacentAngles,
            Area.AngleCalculation,
            Area.Addition,
            Scope.AngleMeasurement,
            Scope.DegreeScale,
            Ability.ProcedureExecution
        ]
    },
    {
        expectedHash: 'cddd5940',
        task: 'solve-unknown-angle',
        labels: [
            Area.AdjacentAngles,
            Area.AngleCalculation,
            Area.Subtraction,
            Scope.AngleMeasurement,
            Scope.DegreeScale,
            Ability.ProcedureInversion
        ]
    }
] as const;

describe('AngleArithmeticGenerator spec integration', () => {
    it('declares only invariant adjacent-angle mathematics as general labels', () => {
        expect(spec.generalLabels).toEqual([
            Area.AdjacentAngles,
            Area.AngleCalculation,
            Scope.AngleMeasurement,
            Scope.DegreeScale
        ]);
    });

    it.each(cases)('resolves the corrected Grade 4 $expectedHash target', ({
        expectedHash,
        labels,
        task
    }) => {
        expect(labelSetHash([...labels])).toBe(expectedHash);
        const stub = generateWithLabels(new AngleArithmeticGenerator(), [...labels]);
        expect(stub).not.toBeNull();
        expect(stub!.data.task).toBe(task);
        expect(stub!.tags).toEqual(expect.arrayContaining(
            labels.filter(label => !spec.generalLabels.includes(label))
        ));
        expect([...new Set(stub!.tags)]).toHaveLength(stub!.tags!.length);
    });
});
