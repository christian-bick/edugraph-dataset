import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapeCircleDefinitionGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('circle capability', () => {
    it('supplies the invariant circle independently of the view task', () => {
        expect(spec.generalLabels).toEqual([Area.Circle]);
        expect(generateWithLabels(new ShapeCircleDefinitionGenerator(), [Area.Circle])!.data.target).toBe('circle');
    });
});
