import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {DecimalPowerTenScalingGenerator} from './generator.ts';
import {DecimalPowerTenScalingGeneratorSchema, spec} from './spec.ts';

describe('DecimalPowerTenScalingGenerator spec', () => {
    it('declares the invariant power-ten and decimal mathematics', () => {
        expect(spec.generalLabels).toEqual([
        Area.PatternRecognition,
        Area.PlaceValue,
        Area.ProportionalScaling,
        Area.Exponentiation,
        Scope.PowersOf10,
        Scope.IntegerExponent,
        Scope.NumbersWithoutNegatives,
        Scope.Base10,
        Scope.DecimalNumbers,
        Scope.NumbersWithZero,
        Scope.NumbersSmaller100
    ]);
        expect(Object.keys(DecimalPowerTenScalingGeneratorSchema)).toEqual(['operation']);
    });

    it.each([
        [Area.Multiplication, 'multiplication'],
        [Area.Division, 'division']
    ] as const)('resolves %s into the selected pattern', (label, operation) => {
        setSeed(5);
        const result = generateWithLabels(new DecimalPowerTenScalingGenerator(), [
            ...spec.generalLabels!, label
        ], spec);
        expect(result).not.toBeNull();
        expect(result!.labels).toContain(label);
        expect(result!.data.operation).toBe(operation);
        const generator = {generatorId: spec.generatorId, generalLabels: spec.generalLabels,
            schema: DecimalPowerTenScalingGeneratorSchema, spec};
        const view = {viewId: 'power-ten-range-proof', generalLabels: [Ability.ProcedureUnderstanding], schema: {},
            spec: {viewId: 'power-ten-range-proof', generalLabels: [Ability.ProcedureUnderstanding]}};
        expect(planModelCompatibility({id: 'power-ten-proof',
            labels: [label, Scope.NumbersSmaller100, Ability.ProcedureUnderstanding]}, generator, view).supported).toBe(true);
    });
});
