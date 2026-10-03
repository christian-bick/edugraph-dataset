import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {CoordinateSystemGenerator} from './generator.ts';
import {CoordinateSystemGeneratorSchema, spec} from './spec.ts';

describe('coordinate-system schema integration', () => {
    it('owns only the invariant axes and origin claims', () => {
        expect(spec.generalLabels).toEqual([Area.CoordinateAxes, Area.Origin]);
        expect(spec.generalLabels).not.toContain(Area.OrderedCoordinatePair);
        expect(CoordinateSystemGeneratorSchema).toEqual({});
    });

    it('resolves both authored 5.G.A.1 targets from one Ability-neutral mathematical payload', () => {
        const generator = new CoordinateSystemGenerator();
        const common = [Area.CoordinateAxes, Area.Origin,
            Scope.CartesianCoordinateSystem, Scope.TwoDimensional];
        const definition = [...common, Ability.ConceptSpecification];
        const interpretation = [...common, Area.OrderedCoordinatePair, Ability.Interpretation];

        setSeed('coordinate-system-two-projections');
        const first = generateWithLabels(generator, definition)!;
        setSeed('coordinate-system-two-projections');
        const second = generateWithLabels(generator, interpretation)!;
        expect(first.data).toEqual(second.data);
        expect(first.data.kind).toBe('coordinate-system-foundations');
        expect(first.labels).toEqual([]);
        expect(second.labels).toEqual([]);
        expect(second.labels).not.toContain(Area.OrderedCoordinatePair);
    });
});
