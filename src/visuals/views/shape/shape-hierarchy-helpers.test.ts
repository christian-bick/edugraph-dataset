import {describe, expect, it} from 'vitest';
import {ShapeCategoryHierarchyGenerator} from '../../../generators/shape/shape-category-hierarchy/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import type {ShapeCategoryHierarchyProblem} from '../../../types/problems.ts';
import {
    figureMembers,
    figurePoints,
    isValidShapeHierarchy
} from './shape-hierarchy-helpers.ts';

const fixture = (classificationModel: 'inheritance' | 'classification', seed = 7): ShapeCategoryHierarchyProblem => {
    setSeed(`shape-hierarchy-view-helper-${classificationModel}-${seed}`);
    return new ShapeCategoryHierarchyGenerator().generate({classificationModel}).data;
};

describe('shape hierarchy view contract', () => {
    it('accepts both exact inheritance and classification profiles across generator variation', () => {
        for (const classificationModel of ['inheritance', 'classification'] as const) {
            for (let seed = 0; seed < 40; seed++) {
                expect(isValidShapeHierarchy(fixture(classificationModel, seed))).toBe(true);
            }
        }
    });

    it('validates dual square membership and keeps every gallery polygon within its tile', () => {
        const data = fixture('classification');
        const cases = data.classificationCases!;
        expect(figureMembers(cases, 'quadrilateral')).toBe('A, B, C, D');
        expect(figureMembers(cases, 'rectangle')).toBe('B, D');
        expect(figureMembers(cases, 'rhombus')).toBe('C, D');
        expect(figureMembers(cases, 'square')).toBe('D');
        cases.forEach(figure => {
            const coords = figurePoints(figure.vertices).split(/[ ,]/).map(Number);
            expect(coords).toHaveLength(8);
            expect(coords.every(coord => coord >= 0 && coord <= 96)).toBe(true);
        });
    });

    it('rejects a false inclusion, attribute, figure shape, or membership', () => {
        const data = fixture('classification');
        const cases = data.classificationCases!;
        const falseEdge = {...data, directInclusions: [
            data.directInclusions[0], data.directInclusions[1], data.directInclusions[2],
            {narrower: 'square', broader: 'quadrilateral'}
        ] as unknown as ShapeCategoryHierarchyProblem['directInclusions']};
        const falseSquareAttributes = ['four-straight-sides', 'four-right-angles'] as unknown as
            ShapeCategoryHierarchyProblem['categoryAttributes']['square'];
        const falseProperty = {...data, categoryAttributes: {
            ...data.categoryAttributes, square: falseSquareAttributes
        }};
        const falseGeometry = {...data, classificationCases: [
            cases[0], cases[1], {...cases[2], vertices: cases[1].vertices}, cases[3]
        ] as ShapeCategoryHierarchyProblem['classificationCases']};
        const falseMembership = {...data, classificationCases: [
            cases[0], cases[1], cases[2], {...cases[3], memberships: ['square', 'rectangle', 'quadrilateral']}
        ] as unknown as ShapeCategoryHierarchyProblem['classificationCases']};
        [falseEdge, falseProperty, falseGeometry, falseMembership].forEach(candidate =>
            expect(isValidShapeHierarchy(candidate)).toBe(false));
    });
});
