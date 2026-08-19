import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {GeometryPerimeterViewSchema} from './spec.ts';

describe('GeometryPerimeterViewSchema', () => {
    it.each([
        Ability.ProcedureExecution,
        Ability.ProcedureInversion
    ])('resolves %s as a view-owned response direction', ability => {
        expect(extractConfig(GeometryPerimeterViewSchema, [ability]).config.responseMode)
            .toBe(ability);
    });
});
