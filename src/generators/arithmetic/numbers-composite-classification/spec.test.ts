import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {NumbersCompositeClassificationGenerator} from './generator.ts';
import {spec} from './spec.ts';
import {NumbersCompositeClassificationGeneratorSchema as schema} from './spec.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

describe('numbers-composite-classification spec', () => {
    it.each([[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100]] as const)(
        'resolves %s through both configuration paths', (label, upper) => {
            const direct = extractConfig(schema, [label]);
            expect(direct.config.range).toEqual(createCanonicalNumericRange(upper));
            expect(resolveSchemaChoices(schema, [label], {range: [label]})).toEqual(direct);
        }
    );
    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Area.CompositeNumbers]));
        expect(new NumbersCompositeClassificationGenerator().schema).not.toHaveProperty('task');
    });

    it('keeps the same payload family even when the target omits its family labels', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(new NumbersCompositeClassificationGenerator(), [])!.data;
            expect(data.classification).toBe('composite');
        }
    });
});

