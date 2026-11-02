import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {setSeed} from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {operationTableQuantities} from './domain.ts';
import {ArithmeticOperationTableGenerator} from './generator.ts';
import {ArithmeticOperationTableGeneratorSchema as schema} from './spec.ts';

describe('ArithmeticOperationTableGenerator schema', () => {
    it.each([[Area.Addition, 'addition'], [Area.Multiplication, 'multiplication']] as const)(
        'resolves %s into a complete %s table', (label, operation) => {
            const problem = generateWithLabels(new ArithmeticOperationTableGenerator(), [label])!;
            expect(problem.data.operation).toBe(operation);
            expect(problem.labels).toContain(label);
            expect(problem.labels.filter(value => value !== label)).toHaveLength(1);
        }
    );

    it('proves all four exact operation/range cells agree in direct and planned resolution', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        let cells = 0;
        for (const operation of [Area.Addition, Area.Multiplication]) {
            for (const labels of schema.range[2]) {
                const target = [operation, ...labels];
                if ((operation === Area.Addition && labels.includes(Scope.NumbersSmaller100))
                    || (operation === Area.Multiplication && labels.includes(Scope.NumbersSmaller10))) {
                    expect(() => extractConfig(schema, target)).toThrow();
                    continue;
                }
                const direct = extractConfig(schema, target);
                const bindings = Object.fromEntries(normalizeSchemaChoices(schema, target, 'generator')
                    .map(field => [field.field, field.alternatives[0]!.labels]));
                bindings.range = [...labels];
                const planned = resolveSchemaChoices(schema, target, bindings);
                expect(planned).toEqual(direct);
                const data = new ArithmeticOperationTableGenerator().generate(direct.config)!.data;
                expect(hasCanonicalRangeWitness(operationTableQuantities(data), direct.config.range!)).toBe(true);
                cells++;
            }
        }
        expect(cells).toBe(4);
    });

    it('selects only feasible operations for broad direct range requests', () => {
        for (const label of [Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersSmaller100]) {
            for (let seed = 0; seed < 24; seed++) {
                setSeed(`operation-table-${label}-${seed}`);
                const {config} = extractConfig(schema, [label]);
                const data = new ArithmeticOperationTableGenerator().generate(config)!.data;
                expect(hasCanonicalRangeWitness(operationTableQuantities(data), config.range!)).toBe(true);
                if (label === Scope.NumbersSmaller10) expect(config.operation).toBe('addition');
                if (label === Scope.NumbersSmaller100) expect(config.operation).toBe('multiplication');
            }
        }
    });
});
