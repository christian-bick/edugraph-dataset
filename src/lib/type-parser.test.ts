import { describe, it, expect } from 'vitest';
import { getViewToProblemTypeMap, getGeneratorProblemType } from './type-parser.ts';

describe('type-parser', () => {
    it('successfully extracts view to problem type mapping', () => {
        const map = getViewToProblemTypeMap();
        expect(map['operations-vertical']).toBe('ArithmeticProblem');
        expect(map['place-value-compose-teen']).toBe('PlaceValueTeenProblem');
        expect(map['shape-naming']).toBe('ShapeIdentityProblem');
        expect(map['shape-position']).toBe('ShapePositionProblem');
    });

    it('successfully extracts generator problem type', () => {
        const type = getGeneratorProblemType('place-value-teen');
        expect(type).toBe('PlaceValueTeenProblem');
    });

    it('returns null for non-existent generator', () => {
        const type = getGeneratorProblemType('non-existent');
        expect(type).toBeNull();
    });
});
