import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {VolumeCompositePrismsGenerator} from './generator.ts';
import {VolumeCompositePrismsGeneratorSchema, spec} from './spec.ts';

const generalLabels = [
    Area.VolumeCalculation,
    Area.RectangularPrism,
    Area.ShapeDecomposition,
    Area.Addition,
    Scope.IntegerNumbers
] as const;

describe('volume-composite-prisms schema integration', () => {
    it('keeps exact additivity and decomposition claims invariant without Ability labels', () => {
        expect(spec.generalLabels).toEqual(generalLabels);
        for (const label of Object.values(Ability)) expect(spec.generalLabels).not.toContain(label);
    });

    it('resolves the additivity target to the partition-only mathematical witness', () => {
        const labels = [...generalLabels, Ability.ProcedureUnderstanding];
        const resolution = extractConfig(VolumeCompositePrismsGeneratorSchema, labels);
        expect(resolution.config.calculationModel).toBe('partition-additivity');
        expect(resolution.resolvedLabels).toEqual([]);
        const result = generateWithLabels(new VolumeCompositePrismsGenerator(), labels)!;
        expect(result.data).not.toHaveProperty('calculationEvidence');
        expect(result.labels).not.toContain(Area.Multiplication);
        expect(result.labels).not.toContain(Area.Equation);
    });

    it.each([false, true])('resolves the calculation target with story=%s to explicit products and sum', story => {
        const labels = [...generalLabels, Area.Multiplication, Area.Equation,
            Ability.ProcedureExecution, ...(story ? [Ability.TextualReception] : [])];
        const resolution = extractConfig(VolumeCompositePrismsGeneratorSchema, labels);
        expect(resolution.config.calculationModel).toBe('component-products-plus-sum');
        expect(new Set(resolution.resolvedLabels)).toEqual(new Set([Area.Multiplication, Area.Equation]));
        const result = generateWithLabels(new VolumeCompositePrismsGenerator(), labels)!;
        expect(result.data.calculationEvidence).toBeDefined();
        expect(result.labels).toContain(Area.Multiplication);
        expect(result.labels).toContain(Area.Equation);
    });

    it('completes either singleton calculation claim with the truthful correlated pair', () => {
        for (const label of [Area.Multiplication, Area.Equation]) {
            const resolution = extractConfig(VolumeCompositePrismsGeneratorSchema, [label]);
            expect(resolution.config.calculationModel).toBe('component-products-plus-sum');
            expect(new Set(resolution.resolvedLabels)).toEqual(new Set([Area.Multiplication, Area.Equation]));
        }
    });
});
