import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {spec, NumbersFractionLineViewSchema} from './spec.ts';

describe('NumbersFractionLineViewSchema', () => {
    it('owns one shared frame and scopes articulation to targets that request it', () => {
        expect(spec.generalLabels).toEqual([
            Scope.Numberline,
            Scope.SingleFrameOfReference
        ]);
        expect(extractConfig(NumbersFractionLineViewSchema, []).config).toEqual({
            visualArticulation: false
        });
        expect(extractConfig(NumbersFractionLineViewSchema, [
            Ability.VisualArticulation
        ]).config).toEqual({
            visualArticulation: true
        });
    });
});
