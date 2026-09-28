import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../../../lib/model-compatibility.ts';
import {spec as generatorSpec, ShapeComposeShapesGeneratorSchema} from '../../../../generators/shape/shape-compose-shapes/spec.ts';
import {spec as selectionSpec} from '../shape-compose-shapes/spec.ts';
import {spec} from './spec.ts';

const producer = {generatorId: generatorSpec.generatorId, generalLabels: generatorSpec.generalLabels,
    schema: ShapeComposeShapesGeneratorSchema, spec: generatorSpec};
const consumer = (view: typeof spec) => ({viewId: view.viewId, generalLabels: view.generalLabels, schema: {}, spec: view});

describe('spatial composition task contracts', () => {
    it.each([Scope.SingleLevelComposition, Scope.MultiLevelComposition])('separates construction from prediction for %s', structure => {
        const base = [Area.ShapeSynthesis, Area.Hexagon, structure];
        const target = (ability: string) => ({id: 'composition', labels: [...base, ability]});
        expect(planModelCompatibility(target(Ability.SpatialGeneration), producer, consumer(spec)).supported).toBe(true);
        expect(planModelCompatibility(target(Ability.SpatialGeneration), producer, consumer(selectionSpec)).supported).toBe(false);
        expect(planModelCompatibility(target(Ability.SpatialImagination), producer, consumer(selectionSpec)).supported).toBe(true);
        expect(planModelCompatibility(target(Ability.ConceptComposition), producer, consumer(spec)).supported).toBe(false);
        expect(planModelCompatibility(target(Ability.ConceptComposition), producer, consumer(selectionSpec)).supported).toBe(false);
    });
});
