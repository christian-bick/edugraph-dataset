import {Scope} from 'edugraph-ts';
import {describe, expect, it, vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {extractConfig} from '../../../lib/utils.ts';
import {resolveSchemaChoices,normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {PowersOfTenGenerator} from './generator.ts';
import {PowersOfTenGeneratorSchema as schema} from './spec.ts';
describe('power-ten notation canonical declaration', () => {
    it('keeps precisely the original three mathematical outcomes in explicit profiles', () => {
        const [domain] = normalizeSchemaChoices(schema, [], 'generator');
        expect(domain.alternatives).toHaveLength(3);
        const values = domain.alternatives.map(choice => resolveSchemaChoices(schema, [], {exponent: choice.labels}).config.exponent);
        expect(new Set(values)).toEqual(new Set([0,1,2]));
    });
    it.each([
        [[Scope.NumbersWithZero,Scope.NumbersSmaller10],0],
        [[Scope.NumbersWithoutZero,Scope.NumbersSmaller10],1],
        [[Scope.NumbersWithoutZero,Scope.NumbersSmaller100],2]
    ] as const)('resolves %j to exponent%s through planned and direct paths', (labels, exponent) => {
        const direct = extractConfig(schema,[...labels]),planned=resolveSchemaChoices(schema,[...labels],{exponent:labels});
        expect(direct.config).toEqual({exponent});
        expect(planned.config).toEqual(direct.config);
        expect([...planned.resolvedLabels].sort()).toEqual([...direct.resolvedLabels].sort());
        expect(new PowersOfTenGenerator().generate(direct.config).data.power.value).toBe(10**exponent);
    });
    it('rejects competing zero/range profiles instead of silently substituting them', () => {
        for(const labels of [
            [Scope.NumbersWithZero,Scope.NumbersSmaller100],
            [Scope.NumbersWithZero,Scope.NumbersWithoutZero],
            [Scope.NumbersSmaller10,Scope.NumbersSmaller100]
        ]) expect(()=>extractConfig(schema,labels)).toThrow();
    });
    it('preserves value and repeated-factor projections in Question and Solution', async () => {
        vi.stubGlobal('window', {});
        try {
            const {NumbersPowerTenExponentNotationCore: Core} = await import('../../../visuals/views/numbers/numbers-power-ten-exponent-notation/view.tsx');
            for (const exponent of [0, 1, 2] as const) for (const seed of [0, 1]) for (const isSolutionView of [false, true]) {
                const {data} = new PowersOfTenGenerator().generate({exponent});
                const markup = renderToStaticMarkup(createElement(Core, {payload: {
                    viewId: 'numbers-power-ten-exponent-notation', problem: {type: 'arithmetic', data, labels: []}, seed, isSolutionView
                } as never}));
                if (exponent === 2 && seed === 0) expect(markup).toContain('10 × 10');
                else expect(markup).toContain(`>${10 ** exponent}<`);
                expect(markup.includes('Therefore the exponent')).toBe(isSolutionView && exponent > 0);
            }
        } finally {vi.unstubAllGlobals();}
    });
});
