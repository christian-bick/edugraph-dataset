import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {IntegerSubtractionCountingBackGenerator} from './generator.ts';
import {IntegerSubtractionCountingBackGeneratorSchema as schema, spec} from './spec.ts';

describe('integer-subtraction-counting-back spec', () => {
    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Area.SubtractionCountingBack]));
        expect(new IntegerSubtractionCountingBackGenerator().schema).not.toHaveProperty('strategy');
    });

    it('keeps the same payload family even when the target omits its family labels', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(new IntegerSubtractionCountingBackGenerator(), [])!.data;
            expect(data.strategy).toBe('subtraction-counting-back');
        }
    });

    it.each([[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20]])(
        'resolves %s consistently before generation through both paths', (label, upper) => {
            const [domain] = normalizeSchemaChoices(schema, [label as string], 'generator');
            expect(domain.alternatives.map(choice => choice.labels)).toEqual([[label]]);
            const planned = resolveSchemaChoices(schema, [label as string], {range: [label as string]});
            const direct = extractConfig(schema, [label as string]);
            expect(planned).toEqual(direct);
            expect(direct.config.range).toEqual(createCanonicalNumericRange(upper as number));
            setSeed(label);
            const stub = generateWithLabels(new IntegerSubtractionCountingBackGenerator(), [label as string], spec)!;
            expect(stub.labels).toEqual([label]);
            expect(hasCanonicalRangeWitness([stub.data.leftOperand, stub.data.rightOperand, stub.data.answer, 1], direct.config.range!)).toBe(true);
        }
    );

    it('admits only reviewed upper bounds and no positive lower claims', () => {
        expect(schema.range[0]).toEqual([Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20]);
        const generator = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        const view = {viewId: 'counting-proof', generalLabels: [Ability.ProcedureExecution], schema: {},
            spec: {viewId: 'counting-proof', generalLabels: [Ability.ProcedureExecution]}};
        for (const label of [Scope.NumbersLargerZero, Scope.NumbersLarger5, Scope.NumbersSmaller1000]) {
            expect(planModelCompatibility({id: 'unsupported-counting', labels: [label, Ability.ProcedureExecution]}, generator, view).supported).toBe(false);
        }
        expect(() => extractConfig(schema, [Scope.NumbersSmaller5, Scope.NumbersSmaller10])).toThrow();
    });
});
