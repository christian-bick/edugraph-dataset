import {Area, Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {FractionQuotientBody} from '../../../visuals/views/fractions/fraction-quotient-view.tsx';
import {FractionQuotientModelGenerator} from './generator.ts';
import {quotientRangeMappings, quotientRangeRole, quotientUpperBounds} from './range-profile.ts';
import {FractionQuotientModelGeneratorSchema as schema, spec} from './spec.ts';

const notation = [Scope.FractionNumbers, Scope.NumbersWithoutNegatives];
const whole = [Area.Equation, Scope.IntegerDividend, Scope.IntegerDivisor, Scope.FractionQuotient, Scope.NumbersWithoutNegatives];
const unit = [Scope.IntegerDividend, Scope.FractionDivisor, Scope.UnitFractions, Scope.NumbersWithoutNegatives];
const roles = [notation, whole, unit, [Area.Multiplication, ...unit], [Area.Equation, ...unit]];

describe('fraction quotient range integration', () => {
    it('supports all23 settled role/numeric/range combinations in direct/planned paths with replay and all projections', () => {
        let bindings = 0;
        for (const request of roles) for (const numeric of request === notation ? [Scope.ProperFractions, Scope.ImproperFractions]
            : [Scope.NumbersWithZero, Scope.NumbersWithoutZero]) for (const [label, upper] of quotientRangeMappings) {
            const labels = [...request, numeric, ...(request === notation ? [Scope.NumbersWithoutZero] : []), label];
            const result = planModelCompatibility({id: 'quotient-range', labels},
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: 'quotient-proof', generalLabels: [], schema: {}, spec: {viewId: 'quotient-proof', generalLabels: []}});
            const supported = quotientUpperBounds(quotientRangeRole(request), numeric === Scope.NumbersWithZero).includes(upper);
            if (!supported) {
                expect(result.supported).toBe(false);
                expect(() => extractConfig(schema, labels)).toThrow();
                continue;
            }
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            bindings++;
            const selection = enumerateDependencyAuditSelections(result.plan).selections[0]!;
            const choices = Object.fromEntries(selection.choices.map(choice => [choice.field, result.plan.domains
                .find(domain => domain.owner === choice.owner && domain.field === choice.field)!.alternatives
                .find(alternative => alternative.id === choice.alternativeId)!.labels]));
            const direct = extractConfig(schema, labels), planned = resolveSchemaChoices(schema, labels, choices);
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
            const generator = new FractionQuotientModelGenerator();
            setSeed(`quotient-range:${bindings}`);
            const first = generator.generate(direct.config), state = getRandomState();
            setSeed(`quotient-range:${bindings}`);
            expect(generator.generate(planned.config)).toEqual(first);
            expect(getRandomState()).toBe(state);
            for (const task of ['quotient-interpretation', 'division-interpretation', 'division-execution',
                'division-story-creation', 'division-inverse-explanation', 'division-word-problem'] as const)
                for (const isSolutionView of [false, true]) expect(() => renderToStaticMarkup(<FractionQuotientBody
                    data={first.data} task={task} isSolutionView={isSolutionView} />)).not.toThrow();
        }
        expect(bindings).toBe(23);
    });

    it('leaves unit-dividend competencies to their separate mathematical producers', () => {
        const labels = [Scope.FractionDividend, Scope.IntegerDivisor, Scope.UnitFractions, Scope.NumbersWithoutNegatives];
        const result = planModelCompatibility({id: 'moved-unit-dividend', labels},
            {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
            {viewId: 'proof', generalLabels: [], schema: {}, spec: {viewId: 'proof', generalLabels: []}});
        expect(result.supported).toBe(false);
        expect(schema.relationProfile[0]).not.toContain(Scope.FractionDividend);
    });
});
