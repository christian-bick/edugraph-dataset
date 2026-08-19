import {describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import {extractSchemaLabels} from '../../../../lib/utils.ts';
import {ShapeBuildShapeViewSchema, spec} from './spec.ts';

describe('shape-build-shape view spec', () => {
    it('owns the geometry-stick representation as a configurable view capability', () => {
        expect(extractSchemaLabels(ShapeBuildShapeViewSchema)).toContain(Scope.GeometrySticks);
        expect(spec.generalLabels).not.toContain(Scope.GeometrySticks);
    });
});
