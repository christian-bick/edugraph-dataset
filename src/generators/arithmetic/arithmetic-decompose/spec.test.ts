import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {ArithmeticDecomposeGenerator} from './generator.ts';
import {ArithmeticDecomposeGeneratorSchema as schema, spec} from './spec.ts';

describe('decomposition range declarations', () => {
    it.each([[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10]] as const)('resolves %s in both paths', (label, upper) => {
        const direct = extractConfig(schema, [label]);
        expect(direct).toEqual(resolveSchemaChoices(schema, [label], {range: [label]}));
        expect(direct.config.range).toEqual(createCanonicalNumericRange(upper));
        expect(generateWithLabels(new ArithmeticDecomposeGenerator(), [label])!.labels).toEqual([label]);
    });
    it('does not offer false lower or dormant larger-range capabilities', () => {
        const generator = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        const view = {viewId: 'decompose-proof', generalLabels: [Ability.ProcedureUnderstanding], schema: {},
            spec: {viewId: 'decompose-proof', generalLabels: [Ability.ProcedureUnderstanding]}};
        for (const label of [Scope.NumbersLargerZero, Scope.NumbersLarger5, Scope.NumbersSmaller20, Scope.NumbersSmaller100]) {
            expect(planModelCompatibility({id: 'unsupported-decompose', labels: [label, Ability.ProcedureUnderstanding]}, generator, view).supported).toBe(false);
        }
    });
});
