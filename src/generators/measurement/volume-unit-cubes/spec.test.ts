import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {VolumeUnitCubesGenerator} from './generator.ts';
import {VolumeUnitCubesGeneratorSchema, spec} from './spec.ts';

const unitCases = [
    [[], 'generic'],
    [[Scope.CubicCentimeterScale], 'cm'],
    [[Scope.CubicInchScale], 'in'],
    [[Scope.CubicFootScale], 'ft']
] as const;

describe('volume-unit-cubes schema integration', () => {
    it.each(unitCases)('resolves the cubic unit %s to %s', (unitLabels, unitId) => {
        const resolution = extractConfig(VolumeUnitCubesGeneratorSchema, [...unitLabels]);
        expect(resolution.config.unitId).toBe(unitId);
        expect(resolution.config.countingModel).toBe('unindexed');
        expect(new Set(resolution.resolvedLabels)).toEqual(new Set(unitLabels));
        const result = generateWithLabels(new VolumeUnitCubesGenerator(), [...unitLabels])!;
        expect(result.data.unitId).toBe(unitId);
        expect(result.data).not.toHaveProperty('countingTrace');
        for (const label of unitLabels) expect(result.labels).toContain(label);
        if (unitId === 'generic') {
            for (const cubicLabel of [
                Scope.CubicCentimeterScale, Scope.CubicInchScale, Scope.CubicFootScale
            ]) expect(result.labels).not.toContain(cubicLabel);
        }
    });

    it('resolves the two generic concept paths and four count-unit label combinations', () => {
        const volumeLabels = [Area.Cube, Area.MeasuringVolumes, Scope.CubeScale];
        const countLabels = [...volumeLabels, Area.Numeration, Scope.IntegerNumbers, Ability.ProcedureExecution];
        const labelSets = [
            [...volumeLabels, Ability.ConceptSpecification],
            [...volumeLabels, Ability.Interpretation],
            ...unitCases.map(([unitLabels]) => [...countLabels, ...unitLabels])
        ];
        expect(labelSets).toHaveLength(6);
        for (const labels of labelSets) {
            const requestedUnit = unitCases.find(([unitLabels]) => unitLabels.some(label => labels.includes(label)))?.[1]
                ?? 'generic';
            const result = generateWithLabels(new VolumeUnitCubesGenerator(), labels)!;
            expect(result.data.unitId).toBe(requestedUnit);
            expect(result.data.cubeCount).toBe(result.data.occupiedCells.length);
            if (labels.includes(Ability.ProcedureExecution)) {
                expect(labels).toContain(Area.Numeration);
                expect(labels).toContain(Scope.IntegerNumbers);
                expect(result.labels).toContain(Area.Numeration);
                expect(result.labels).toContain(Scope.IntegerNumbers);
                expect(result.data.countingTrace).toHaveLength(result.data.cubeCount);
            } else {
                expect(result.labels).not.toContain(Area.Numeration);
                expect(result.labels).not.toContain(Scope.IntegerNumbers);
                expect(result.data).not.toHaveProperty('countingTrace');
            }
        }
    });

    it('selects count capabilities together through the mathematical enumeration branch', () => {
        expect(spec.generalLabels).toEqual([Area.Cube, Area.MeasuringVolumes, Scope.CubeScale]);
        expect(spec.generalLabels).not.toContain(Ability.ProcedureExecution);
        const resolution = extractConfig(VolumeUnitCubesGeneratorSchema, [Area.Numeration, Scope.IntegerNumbers]);
        expect(resolution.config.countingModel).toBe('enumerated');
        expect(new Set(resolution.resolvedLabels)).toEqual(new Set([Area.Numeration, Scope.IntegerNumbers]));
    });

    it('rejects competing standard cubic units', () => {
        for (const labels of [
            [Scope.CubicCentimeterScale, Scope.CubicInchScale],
            [Scope.CubicInchScale, Scope.CubicFootScale]
        ]) expect(() => extractConfig(VolumeUnitCubesGeneratorSchema, labels)).toThrow();
    });
});
