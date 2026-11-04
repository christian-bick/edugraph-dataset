import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {DecimalWritingGeneratorSchema as schema} from './spec.ts';

describe('decimal notation families without digit-based zero profiles', () => {
    it('keeps both notation choices without an unrelated zero-label dependency', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        expect(schema.notationFamily).toEqual([Area.DecimalNotation, Area.NumberNameNotation]);
        expect(normalizeSchemaChoices(schema, [], 'generator').find(field => field.field === 'notationFamily')!
            .alternatives.map(choice => choice.labels)).toEqual([[Area.DecimalNotation], [Area.NumberNameNotation]]);
    });

    it.each([Area.DecimalNotation, Area.NumberNameNotation])('keeps the explicit%s mathematical context', notation => {
        expect(extractConfig(schema, [notation, Scope.NumbersSmaller5]).config.notationFamily).toBe(notation);
    });

    it('uses the ordinary seeded two-family fallback identically with or without the zero-absence invariant', () => {
        const families = new Set<string>();
        for (let seed = 0; seed < 64; seed++) {
            setSeed(seed);
            const ordinary = extractConfig(schema, [Scope.NumbersSmaller5]), continuation = getRandomState();
            setSeed(seed);
            const positive = extractConfig(schema, [Scope.NumbersSmaller5, Scope.NumbersWithoutZero]);
            expect(positive).toEqual(ordinary);
            expect(getRandomState()).toBe(continuation);
            families.add(positive.config.notationFamily!);
        }
        expect(families).toEqual(new Set([Area.DecimalNotation, Area.NumberNameNotation]));
    });
});
