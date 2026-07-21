import { describe, it, expect } from 'vitest';
import { extractConfig, generateWithLabels } from './utils.ts';
import { Area, Scope } from 'edugraph-ts';
import { selectExactMatch } from './resolvers.ts';
import { ProblemGenerator } from '../types/ml-engine.ts';

describe('extractConfig & generateWithLabels', () => {
    const testSchema = {
        classify: [
            [
                Area.Circle,
                Area.Square,
                Area.Triangle
            ],
            selectExactMatch
        ],
        simpleList: [
            Area.Circle,
            Area.Square
        ]
    } as const;

    it('should successfully match config when matching labels are provided', () => {
        const competencyLabels = [Area.Triangle, Scope.ShapeProperties];
        const { config, consumedLabels } = extractConfig(testSchema, competencyLabels);

        expect(config.classify).toBe(Area.Triangle);
        // Since simpleList has no matching label in competencyLabels, it falls back
        expect([Area.Circle, Area.Square]).toContain(config.simpleList);
        expect(consumedLabels).toContain(Area.Triangle);
    });

    it('should trigger fallback when no matching labels are provided', () => {
        const competencyLabels = [Scope.ThreeDimensional];
        const { config, consumedLabels } = extractConfig(testSchema, competencyLabels);

        // Fallback should pick a valid shape for both fields
        expect([Area.Circle, Area.Square, Area.Triangle]).toContain(config.classify);
        expect([Area.Circle, Area.Square]).toContain(config.simpleList);

        // Fallback shapes should be in consumedLabels
        expect(consumedLabels).toContain(config.classify);
        expect(consumedLabels).toContain(config.simpleList);
    });

    it('should correctly tag the generated ProblemStub via generateWithLabels', () => {
        const mockGenerator: ProblemGenerator = {
            type: 'geometry',
            schema: testSchema,
            generate: (config: any) => ({
                id: `mock-id-${config.classify}`,
                data: { shape: config.classify }
            })
        };

        const result = generateWithLabels(mockGenerator, [Scope.ThreeDimensional]);
        expect(result).not.toBeNull();
        expect(result!.id).toContain('mock-id-');
        expect(result!.tags).toContain(result!.data.shape);
    });
});
