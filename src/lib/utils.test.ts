import { describe, it, expect } from 'vitest';
import {
    extractConfig,
    findSchemaFallbackContractIssues,
    findSchemaResolutionContractIssues,
    generateWithLabels,
    shortenLabel,
    formatLabelsKey
} from './utils.ts';
import { Area, Scope } from 'edugraph-ts';
import { ontologyNeutral, selectExactMatch } from './resolvers.ts';
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
        const { config, resolvedLabels } = extractConfig(testSchema, competencyLabels);

        expect(config.classify).toBe(Area.Triangle);
        // Since simpleList has no matching label in competencyLabels, it falls back
        expect([Area.Circle, Area.Square]).toContain(config.simpleList);
        expect(resolvedLabels).toContain(Area.Triangle);
    });

    it('should trigger fallback when no matching labels are provided', () => {
        const competencyLabels = [Scope.ThreeDimensional];
        const { config, resolvedLabels } = extractConfig(testSchema, competencyLabels);

        // Fallback should pick a valid shape for both fields
        expect([Area.Circle, Area.Square, Area.Triangle]).toContain(config.classify);
        expect([Area.Circle, Area.Square]).toContain(config.simpleList);

        // Fallback shapes should be in resolvedLabels
        expect(resolvedLabels).toContain(config.classify);
        expect(resolvedLabels).toContain(config.simpleList);
    });

    it('should attach the schema-resolved labels via generateWithLabels', () => {
        const mockGenerator: ProblemGenerator = {
            type: 'shape',
            schema: testSchema,
            generate: (config: any) => ({
                data: { shape: config.classify }
            })
        };

        const result = generateWithLabels(mockGenerator, [Scope.ThreeDimensional]);
        expect(result).not.toBeNull();
        expect(result!.labels).toContain(result!.data.shape);
    });

    it('keeps explicitly ontology-neutral seeded choices unlabeled', () => {
        const schema = {
            selectedIndex: ontologyNeutral(() => 2)
        } as const;

        expect(extractConfig(schema, [Area.Circle])).toEqual({
            config: {selectedIndex: 2},
            resolvedLabels: []
        });
        expect(findSchemaResolutionContractIssues(schema)).toEqual([]);
    });

    it('rejects label-aware fields without declared capability labels', () => {
        const schema = {
            hiddenChoice: [[], selectExactMatch]
        } as const;

        expect(findSchemaResolutionContractIssues(schema as any)).toEqual([
            {field: 'hiddenChoice', kind: 'empty-supported-labels'}
        ]);
        expect(() => extractConfig(schema as any, [Area.Circle])).toThrow(
            'Schema field "hiddenChoice" has no supported capability labels.'
        );
    });

    it('rejects unmarked function-only resolvers', () => {
        const schema = {
            hiddenChoice: () => 2
        };

        expect(findSchemaResolutionContractIssues(schema as any)).toEqual([
            {field: 'hiddenChoice', kind: 'unmarked-function-only-resolver'}
        ]);
        expect(() => extractConfig(schema as any, [])).toThrow('not marked ontologyNeutral()');
    });

    it('probes every label that may be selected as a tuple fallback', () => {
        const schema = {
            choice: [[Area.Circle, Area.Square], (labels: string[]) =>
                labels.includes(Area.Circle) ? 'circle' : undefined]
        } as const;

        expect(findSchemaFallbackContractIssues(schema)).toEqual([
            {field: 'choice', label: Area.Square, reason: 'unresolved'}
        ]);
    });

    it('resolves and records an explicit conjunction fallback', () => {
        const schema = {
            choice: [
                [Area.Circle, Area.Square],
                (labels: string[]) => labels.includes(Area.Circle) && labels.includes(Area.Square)
                    ? 'both'
                    : undefined,
                [[Area.Circle, Area.Square]]
            ]
        } as const;

        expect(extractConfig(schema, [])).toEqual({
            config: {choice: 'both'},
            resolvedLabels: [Area.Circle, Area.Square]
        });
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
    });

    it('should strip http://edugraph.io/edu/ prefix via shortenLabel and formatLabelsKey', () => {
        expect(shortenLabel('http://edugraph.io/edu/Numeration')).toBe('Numeration');
        expect(shortenLabel('CustomTag')).toBe('CustomTag');

        const labels = ['http://edugraph.io/edu/Numeration', 'http://edugraph.io/edu/ArabicNumerals'];
        expect(formatLabelsKey(labels)).toBe('ArabicNumerals|Numeration');
    });
});
