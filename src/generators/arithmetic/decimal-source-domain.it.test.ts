import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {matchTarget, type GeneratorMatchInfo, type ViewMatchInfo} from '../../lib/matching.ts';
import {extractSchemaLabels} from '../../types/schema.ts';
import {spec as gradeOne} from '../../spec/ccss/grade-01.ts';
import {spec as gradeTwo} from '../../spec/ccss/grade-02.ts';
import {spec as gradeThree} from '../../spec/ccss/grade-03.ts';
import {spec as kindergarten} from '../../spec/ccss/kindergarten.ts';
import {spec as gradeFive} from '../../spec/ccss/grade-05.ts';
import {spec as columns, DecimalAdditionSubtractionGeneratorSchema} from './decimal-addition-subtraction/spec.ts';
import {spec as product, DecimalMultiplicationModelGeneratorSchema} from './decimal-multiplication-model/spec.ts';
import {spec as quotient, DecimalDivisionModelGeneratorSchema} from './decimal-division-model/spec.ts';
import {spec as columnView, OperationsDecimalAdditionSubtractionMethodViewSchema} from '../../visuals/views/operations/operations-decimal-addition-subtraction-method/spec.ts';
import {spec as productView, OperationsDecimalMultiplicationMethodViewSchema} from '../../visuals/views/operations/operations-decimal-multiplication-method/spec.ts';
import {spec as quotientView, OperationsDecimalDivisionMethodViewSchema} from '../../visuals/views/operations/operations-decimal-division-method/spec.ts';

const pairs = [
    {spec: columns, schema: DecimalAdditionSubtractionGeneratorSchema, view: columnView, viewSchema: OperationsDecimalAdditionSubtractionMethodViewSchema, problemType: 'DecimalAddSubtractProblem'},
    {spec: product, schema: DecimalMultiplicationModelGeneratorSchema, view: productView, viewSchema: OperationsDecimalMultiplicationMethodViewSchema, problemType: 'DecimalMultiplicationProblem'},
    {spec: quotient, schema: DecimalDivisionModelGeneratorSchema, view: quotientView, viewSchema: OperationsDecimalDivisionMethodViewSchema, problemType: 'DecimalDivisionProblem'}
] as const;
const models = (pair: typeof pairs[number]): [GeneratorMatchInfo, ViewMatchInfo] => [
    {generatorId: pair.spec.generatorId, generalLabels: pair.spec.generalLabels, spec: pair.spec, schema: pair.schema,
        labels: [...pair.spec.generalLabels, ...extractSchemaLabels(pair.schema)], problemType: pair.problemType},
    {viewId: pair.view.viewId, generalLabels: pair.view.generalLabels, spec: pair.view, schema: pair.viewSchema,
        supportedLabels: [...pair.view.generalLabels, ...extractSchemaLabels(pair.viewSchema)], problemType: pair.problemType}
];

describe('source-owned whole-number fluency domain', () => {
    it('states the integer domain throughout the six evidenced source-alias builders', () => {
        const first = gradeOne.filter(target => target.id.startsWith('1.OA.C.6-fluency~'));
        const second = gradeTwo.filter(target => target.id.startsWith('2.OA.B.2-fluency~'));
        expect(first).toHaveLength(6);
        expect(second).toHaveLength(2);
        const aliases = [
            ...first, ...second,
            ...gradeTwo.filter(target => target.id.startsWith('2.NBT.B.5-fluency~') || target.id.startsWith('2.NBT.B.7-written-add-subtract~')),
            ...gradeThree.filter(target => target.id.startsWith('3.NBT.A.2-add-subtract-within-1000~')),
            ...kindergarten.filter(target => target.id.startsWith('K.OA.A.5-fluency~'))
        ];
        expect(aliases).toHaveLength(30);
        expect(new Set(aliases.map(target => [...target.labels].sort().join('|'))).size).toBe(12);
        for (const target of aliases) {
            expect(target.labels).toContain(Scope.IntegerNumbers);
            expect([Area.Addition, Area.Subtraction].filter(label => target.labels.includes(label))).toHaveLength(1);
            for (const pair of pairs) expect(matchTarget(target, ...models(pair))).toEqual({matched: false, reason: 'unsupported-label', label: Scope.IntegerNumbers});
        }
        for (const target of second) expect(first.some(candidate =>
            [...candidate.labels].sort().join('|') === [...target.labels].sort().join('|'))).toBe(true);
        const written = gradeTwo.filter(target => target.id.startsWith('2.NBT.B.7-written-add-subtract~'));
        const within1000 = gradeThree.filter(target => target.id.startsWith('3.NBT.A.2-add-subtract-within-1000~'));
        expect(written).toHaveLength(8);
        expect(new Set(written.map(target => [...target.labels].sort().join('|'))))
            .toEqual(new Set(within1000.map(target => [...target.labels].sort().join('|'))));
    });

    it('rejects corrected real fluency targets through positive capabilities without a decimal target guard', () => {
        const targets = gradeOne.filter(target => target.id.startsWith('1.OA.C.6-fluency~') && target.labels.includes(Scope.NumbersSmaller20));
        expect(targets).toHaveLength(2);
        for (const target of targets) {
            const [generator, view] = models(pairs[0]);
            expect(matchTarget(target, generator, view)).toEqual({matched: false, reason: 'unsupported-label', label: Scope.IntegerNumbers});
            // Reproduce the actual historical mismatch: omission of the source
            // number kind, rather than generator target eligibility, admitted it.
            const underspecified = {...target, labels: target.labels.filter(label => label !== Scope.IntegerNumbers)};
            expect(matchTarget(underspecified, generator, view).matched).toBe(true);
        }
        for (const pair of pairs) expect(pair.spec.compatibility?.some(rule => rule.targetPolicy?.kind === 'require')).not.toBe(true);
    });

    it('retains the real Grade5 model targets for all three decimal producers', () => {
        for (const [pair, prefixes] of [
            [pairs[0], ['5.NBT.B.7-add-decimals-with-models~', '5.NBT.B.7-subtract-decimals-with-models~']],
            [pairs[1], ['5.NBT.B.7-multiply-decimals-with-models~']],
            [pairs[2], ['5.NBT.B.7-divide-decimals-with-models~']]
        ] as const) {
            const targets = gradeFive.filter(target => prefixes.some(prefix => target.id.startsWith(prefix)));
            expect(targets).toHaveLength(prefixes.length);
            for (const target of targets) expect(matchTarget(target, ...models(pair)).matched).toBe(true);
        }
    });
});
