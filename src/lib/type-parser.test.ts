import { describe, it, expect } from 'vitest';
import {
    clearTypeParserCaches,
    getGeneratorProblemType,
    getViewToProblemTypeMap,
    isProblemTypeCompatible
} from './type-parser.ts';
import {createWorkCounters} from './work-counters.ts';

describe('type-parser', () => {
    it('successfully extracts view to problem type mapping', () => {
        const map = getViewToProblemTypeMap();
        expect(map['operations-vertical']).toBe('ArithmeticProblem');
        expect(map['place-value-compose-teen']).toBe('PlaceValueTeenProblem');
        expect(map['shape-naming']).toBe('ShapeNamingProblem');
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

    it('accepts a precise generator payload through a named view union', () => {
        expect(isProblemTypeCompatible('ArithmeticProblem', 'ArithmeticProblem')).toBe(true);
        expect(isProblemTypeCompatible('ArithmeticPairProblem', 'ArithmeticProblem')).toBe(true);
        expect(isProblemTypeCompatible('ArithmeticTripleProblem', 'ArithmeticProblem')).toBe(true);
        expect(isProblemTypeCompatible('ArithmeticTripleProblem', 'ArithmeticPairProblem')).toBe(false);
    });

    it('accepts a required-label-guarded leaf from a discriminated generator union', () => {
        expect(isProblemTypeCompatible(
            'WritingProblem',
            'LegacyWritingProblem'
        )).toBe(true);
        expect(isProblemTypeCompatible(
            'WritingProblem',
            'MultiDigitWritingProblem'
        )).toBe(true);
        expect(isProblemTypeCompatible(
            'WritingProblem',
            'ArithmeticPairProblem'
        )).toBe(false);
    });

    it('reads each type source once across repeated lookups', () => {
        clearTypeParserCaches();
        const counters = createWorkCounters();

        getViewToProblemTypeMap(counters);
        isProblemTypeCompatible('ArithmeticPairProblem', 'ArithmeticProblem', counters);
        getGeneratorProblemType('place-value-teen', counters);
        getGeneratorProblemType('counting-basic', counters);

        expect(counters.get('type.problems_file_reads')).toBe(1);
        expect(counters.get('type.generator_discoveries')).toBe(1);
        expect(counters.get('type.generator_file_reads')).toBeGreaterThan(1);
        expect(counters.get('type.compatibility_checks')).toBe(1);
    });
});
