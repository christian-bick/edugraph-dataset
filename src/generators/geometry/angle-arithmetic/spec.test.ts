import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {
    extractSchemaLabels,
    generateWithLabels,
    labelSetHash
} from '../../../lib/utils.ts';
import {AngleArithmeticGenerator} from './generator.ts';
import {AngleArithmeticGeneratorSchema, spec} from './spec.ts';

const cases = [
    {
        expectedHash: '569e9916',
        operation: 'addition',
        labels: [
            Area.AdjacentAngles,
            Area.AngleCalculation,
            Area.Addition,
            Scope.DegreeScale,
            Ability.ProcedureUnderstanding
        ]
    },
    {
        expectedHash: 'addd94b2',
        operation: 'addition',
        labels: [
            Area.AdjacentAngles,
            Area.AngleCalculation,
            Area.Addition,
            Scope.DegreeScale,
            Ability.ProcedureExecution
        ]
    },
    {
        expectedHash: 'daa9d2b3',
        operation: 'subtraction',
        labels: [
            Area.AdjacentAngles,
            Area.AngleCalculation,
            Area.Subtraction,
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
            Scope.DegreeScale
        ]);
    });

    it('does not parameterize any Ability', () => {
        expect(extractSchemaLabels(AngleArithmeticGeneratorSchema)).toEqual([
            Area.Addition,
            Area.Subtraction
        ]);
    });

    it.each(cases)('resolves the generator side of Grade 4 $expectedHash', ({
        expectedHash,
        labels,
        operation
    }) => {
        expect(labelSetHash([...labels])).toBe(expectedHash);
        const stub = generateWithLabels(new AngleArithmeticGenerator(), [...labels]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation);
        expect(stub!.labels).toEqual(expect.arrayContaining([
            operation === 'addition' ? Area.Addition : Area.Subtraction
        ]));
        expect(stub!.labels).not.toEqual(expect.arrayContaining([
            Ability.ProcedureUnderstanding,
            Ability.ProcedureExecution,
            Ability.ProcedureInversion
        ]));
    });
});
