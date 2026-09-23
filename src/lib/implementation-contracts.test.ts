import {describe, expect, it} from 'vitest';
import {inspectGeneratorEntryValidation, inspectImplementationSource} from './implementation-contracts.ts';

describe('implementation source contracts', () => {
    it('finds aliased, destructured, and bracketed raw label reads', () => {
        const source = `
            const p = payload.problem;
            const {labels: assigned} = p;
            const {payload: input} = props;
            const requested = input['targetLabels'];
            const raw = p.labels;
        `;
        expect(inspectImplementationSource(source, 'view.tsx', 'view').map(issue => issue.rule))
            .toEqual(['IMPL-V1', 'IMPL-V1', 'IMPL-V1']);
    });

    it('permits resolved configuration and type-only imports', () => {
        const source = `
            import type {ViewSpec} from './spec.ts';
            const area = config.area;
            const exact = Scope.Rectangle;
            const answer = payload.problem.data.answer;
        `;
        expect(inspectImplementationSource(source, 'view.tsx', 'view')).toEqual([]);
    });

    it('finds direct spec decisions, generated labels, and unseeded entropy', () => {
        const source = `
            import {spec as taskSpec} from './spec.ts';
            const option = taskSpec.generalLabels;
            const draw = Math.random();
            function generate() {return {data: {}, labels: ['x']};}
        `;
        expect(inspectImplementationSource(source, 'generator.ts', 'generator').map(issue => issue.rule))
            .toEqual(['IMPL-V9', 'IMPL-4', 'IMPL-G3']);
    });

    it('requires an executed first-statement validation for nonempty generator schemas', () => {
        const valid = 'class Demo { generate(config: object) { validateConfigFields("demo", config, ["x"]); return {data: {}}; } }';
        const late = 'class Demo { generate(config: object) { const x = config; validateConfigFields("demo", config, ["x"]); return {data: x}; } }';
        expect(inspectGeneratorEntryValidation(valid, 'generator.ts', true)).toEqual([]);
        expect(inspectGeneratorEntryValidation(late, 'generator.ts', true).map(issue => issue.rule))
            .toEqual(['IMPL-G2']);
        expect(inspectGeneratorEntryValidation(late, 'generator.ts', false)).toEqual([]);
    });
});
