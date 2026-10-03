import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {CoordinateContextGenerator} from './generator.ts';
import {CoordinateContextGeneratorSchema, spec} from './spec.ts';

describe('coordinate-context schema integration', () => {
    it('owns only the invariant nonnegative domain', () => {
        expect(spec.generalLabels).toEqual([Scope.NumbersWithoutNegatives]);
        expect(spec.generalLabels).not.toContain(Area.PointPlotting);
        expect(spec.generalLabels).not.toContain(Area.OrderedCoordinatePair);
        expect(CoordinateContextGeneratorSchema).toEqual({});
    });

    it('resolves both 5.G.A.2 requests from the same Ability-neutral situation', () => {
        const generator = new CoordinateContextGenerator();
        const common = [Scope.CartesianCoordinateSystem, Scope.NumbersWithoutNegatives,
            Ability.TextualReception];
        const plotting = [...common, Area.PointPlotting, Ability.VisualArticulation];
        const interpretation = [...common, Area.OrderedCoordinatePair, Ability.Interpretation];

        setSeed('coordinate-context-two-projections');
        const first = generateWithLabels(generator, plotting)!;
        setSeed('coordinate-context-two-projections');
        const second = generateWithLabels(generator, interpretation)!;
        expect(first.data).toEqual(second.data);
        expect(first.data.kind).toBe('contextual-coordinate-locations');
        expect(first.labels).toEqual([]);
        expect(second.labels).toEqual([]);
    });
});
