import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {FractionRectangleAreaGenerator} from './generator.ts';
import {FractionRectangleAreaGeneratorSchema, spec} from './spec.ts';

const common = [Area.AreaCalculation, Area.Multiplication];
const generic = [Area.Rectangle, Scope.FractionNumbers, Scope.TwoOperands];
const tiling = [Area.Rectangle, Area.Square, Scope.FractionNumbers,
    Scope.UnitFractions, Scope.BoxArrangement];

const cases = [
    ['5.NF.B.4b-calculate-fractional-area', [...common, ...generic,
        Ability.ProcedureExecution], generic, 'fraction-side-product'],
    ['5.NF.B.4b-represent-fraction-product', [...common, ...generic,
        Ability.VisualArticulation], generic, 'fraction-side-product'],
    ['5.NF.B.4b-tile-fractional-rectangle', [...common, ...tiling,
        Ability.ProcedureUnderstanding], [Area.Square, Scope.UnitFractions], 'square-tile-proof']
] as const;

describe('fraction-rectangle-area schema integration', () => {
    it('keeps invariant math general and leaves grid presentation and Abilities to views', () => {
        expect(spec.generalLabels).toEqual(common);
        expect(spec.generalLabels).not.toContain(Area.Rectangle);
        expect(spec.generalLabels).not.toContain(Scope.FractionNumbers);
        expect(spec.generalLabels).not.toContain(Scope.BoxArrangement);
        for (const ability of Object.values(Ability)) expect(spec.generalLabels).not.toContain(ability);
    });

    it.each(cases)('resolves %s to its exact mathematical proof profile',
        (_target, requested, selected, areaJustification) => {
            const resolved = extractConfig(FractionRectangleAreaGeneratorSchema, [...requested]);
            expect(resolved.config).toEqual({areaJustification});
            expect(new Set(resolved.resolvedLabels)).toEqual(new Set<string>(selected));

            const generated = generateWithLabels(new FractionRectangleAreaGenerator(), [...requested])!;
            expect(new Set(generated.labels)).toEqual(new Set<string>(selected));
            expect(generated.data.tileProof !== undefined)
                .toBe(areaJustification === 'square-tile-proof');
        });

    it('normalizes redundant requested ancestor labels only for the square-tile proof', () => {
        const resolved = extractConfig(FractionRectangleAreaGeneratorSchema,
            [...common, ...tiling, Ability.ProcedureUnderstanding]);
        expect(resolved.config.areaJustification).toBe('square-tile-proof');
        expect(resolved.resolvedLabels).not.toContain(Area.Rectangle);
        expect(resolved.resolvedLabels).not.toContain(Scope.FractionNumbers);
    });
});
