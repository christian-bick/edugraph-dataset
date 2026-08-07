import {describe, expect, it} from 'vitest';
import {Area} from 'edugraph-ts';
import {
    getDefiningAttributeStatements,
    getShapeDefinition,
    shapeNameFromLabel
} from './helpers.ts';

describe('shape attribute helpers', () => {
    it('maps supported ontology labels to plane shapes', () => {
        expect(shapeNameFromLabel(Area.Circle)).toBe('circle');
        expect(shapeNameFromLabel(Area.Triangle)).toBe('triangle');
        expect(shapeNameFromLabel(Area.Square)).toBe('square');
        expect(shapeNameFromLabel(Area.Rectangle)).toBe('rectangle');
        expect(shapeNameFromLabel(Area.Hexagon)).toBe('hexagon');
        expect(shapeNameFromLabel(Area.Cube)).toBeNull();
    });

    it('distinguishes curved and straight boundaries', () => {
        expect(getShapeDefinition('circle')).toMatchObject({
            sideCount: 0,
            vertexCount: 0,
            boundary: 'curved',
            closed: true
        });
        expect(getShapeDefinition('triangle')).toMatchObject({
            sideCount: 3,
            vertexCount: 3,
            boundary: 'straight',
            closed: true
        });
    });

    it('retains the defining distinctions between squares and rectangles', () => {
        expect(getShapeDefinition('square')).toMatchObject({equalSides: true, rightAngleCount: 4});
        expect(getShapeDefinition('rectangle')).toMatchObject({rightAngleCount: 4});
        expect(getShapeDefinition('rectangle').equalSides).toBeUndefined();
    });

    it('describes sides, vertices, closure, and boundary type as defining', () => {
        expect(getDefiningAttributeStatements('circle')).toEqual([
            'is closed',
            'has one curved boundary',
            'has 0 vertices'
        ]);
        expect(getDefiningAttributeStatements('hexagon')).toEqual([
            'is closed',
            'has 6 straight sides',
            'has 6 vertices'
        ]);
    });
});
