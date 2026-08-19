import {describe, expect, it} from 'vitest';
import {
    angleConstructionMatchesRenderedPolygon,
    countClassificationMatchesRenderedPolygons,
    getShapeAppearance,
    shapeConstructionCountsMatch
} from './helpers.ts';
import {
    ShapeAttributeCountSpecificationProblem,
    ShapeCountClassificationProblem,
    ShapeCountOptionName
} from '../../../types/problems.ts';

describe('shape appearance helpers', () => {
    it('is deterministic for a seed and example index', () => {
        expect(getShapeAppearance(42, 1)).toEqual(getShapeAppearance(42, 1));
    });

    it('varies color, orientation, and size independently across examples', () => {
        const appearances = Array.from({length: 8}, (_, index) => getShapeAppearance(42, index));
        expect(new Set(appearances.map(value => value.color)).size).toBeGreaterThan(1);
        expect(new Set(appearances.map(value => value.rotation)).size).toBeGreaterThan(1);
        expect(new Set(appearances.map(value => value.scale)).size).toBeGreaterThan(1);
    });
});

describe('shape count payload validation', () => {
    const classification: ShapeCountClassificationProblem = {
        task: 'classify-count',
        attribute: 'angles',
        requiredCount: 4,
        options: [
            {id: 'A', shape: 'triangle', count: 3, satisfies: false},
            {id: 'B', shape: 'quadrilateral', count: 4, satisfies: true},
            {id: 'C', shape: 'pentagon', count: 5, satisfies: false},
            {id: 'D', shape: 'hexagon', count: 6, satisfies: false}
        ],
        answer: 'B'
    };
    const renderedCounts: Partial<Record<ShapeCountOptionName, number>> = {
        triangle: 3,
        quadrilateral: 4,
        pentagon: 5,
        hexagon: 6
    };
    const renderedCount = (shape: ShapeCountOptionName) => renderedCounts[shape] ?? null;

    it('requires every option count and membership to match the rendered polygon', () => {
        expect(countClassificationMatchesRenderedPolygons(classification, renderedCount)).toBe(true);

        expect(countClassificationMatchesRenderedPolygons({
            ...classification,
            options: classification.options.map(option => option.id === 'B'
                ? {...option, count: 5}
                : option)
        }, renderedCount)).toBe(false);

        expect(countClassificationMatchesRenderedPolygons({
            ...classification,
            options: classification.options.map(option => option.id === 'A'
                ? {...option, satisfies: true}
                : option)
        }, renderedCount)).toBe(false);
    });

    it('requires the requested construction count to match the rendered polygon', () => {
        const construction: ShapeAttributeCountSpecificationProblem = {
            target: 'pentagon',
            sides: 5,
            corners: 5,
            task: 'specify-count',
            attribute: 'angles',
            requiredCount: 5
        };
        expect(angleConstructionMatchesRenderedPolygon(construction, 5)).toBe(true);
        expect(angleConstructionMatchesRenderedPolygon({...construction, requiredCount: 4}, 5)).toBe(false);
        expect(angleConstructionMatchesRenderedPolygon({...construction, sides: 4}, 5)).toBe(false);
    });

    it('requires construction materials to match the named shape exactly', () => {
        expect(shapeConstructionCountsMatch('triangle', 3, 3)).toBe(true);
        expect(shapeConstructionCountsMatch('rectangle', 4, 4)).toBe(true);
        expect(shapeConstructionCountsMatch('hexagon', 6, 6)).toBe(true);
        expect(shapeConstructionCountsMatch('hexagon', 4, 4)).toBe(false);
        expect(shapeConstructionCountsMatch('unknown', 4, 4)).toBe(false);
    });
});
