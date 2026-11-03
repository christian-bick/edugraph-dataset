import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {spec as writingView, NumericalPowerExpressionWriteViewSchema} from '../../../visuals/views/operations/numerical-power-expression-write/spec.ts';
import {NumericalPowerExpressionSyntaxGenerator} from './generator.ts';
import {NumericalPowerExpressionSyntaxGeneratorSchema, spec} from './spec.ts';

describe('literal-power syntax source integration', () => {
    it('executes both original writing targets with the unchanged view and target claims', () => {
        const targets = [...activeTargets, ...implementationTodos].filter(target => target.id.startsWith('6.EE.A.1-write-power-expressions~'));
        expect(targets).toHaveLength(2);
        for (const target of targets) {
            const result = planCompatibility({identity: {targetId: target.id, generatorId: spec.generatorId, viewId: writingView.viewId},
                targetLabels: target.labels, generatorLabels: spec.generalLabels, viewLabels: writingView.generalLabels,
                generatorRules: spec.compatibility, viewRules: writingView.compatibility,
                fields: [...normalizeSchemaChoices(NumericalPowerExpressionSyntaxGeneratorSchema, target.labels, 'generator'),
                    ...normalizeSchemaChoices(NumericalPowerExpressionWriteViewSchema, target.labels, 'view')]});
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            for (let seed = 0; seed < 16; seed++) {
                const draw = generatePlannedDraw({generator: new NumericalPowerExpressionSyntaxGenerator(), viewSchema: NumericalPowerExpressionWriteViewSchema,
                    plan: result.plan, sampleKey: `${target.id}#${spec.generatorId}#${writingView.viewId}#train#question#inst:0`, seed, attempt: 1});
                expect(draw.labels).toContain(Scope.NumbersSmaller5);
                expect(draw.labels).toContain(Ability.Formalization);
                expect(draw.labels).toContain(Ability.TextualReception);
                if (target.labels.includes(Scope.PositiveExponent)) expect(draw.stub!.data.expression.exponent).toBeGreaterThan(0);
            }
        }
    });
});
