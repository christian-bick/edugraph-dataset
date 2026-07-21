import { beforeEach, describe, expect, it } from 'vitest';
import { GeometryPositionGenerator } from './generator.ts';
import { setSeed } from '../../../lib/random.ts';
import { Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('GeometryPositionGenerator Spec Integration', () => {
    let generator: GeometryPositionGenerator;

    beforeEach(() => {
        generator = new GeometryPositionGenerator();
        setSeed(42);
    });

    it('should generate above problem from Scope.Above label', () => {
        const stub = generateWithLabels(generator, [
            Scope.Above
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.relation).toBe('above');
        expect(stub!.data.answer).toBe('above');
    });

    it('should generate below problem from Scope.Below label', () => {
        const stub = generateWithLabels(generator, [
            Scope.Below
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.relation).toBe('below');
        expect(stub!.data.answer).toBe('below');
    });

    it('should generate beside problem from Scope.Beside label', () => {
        const stub = generateWithLabels(generator, [
            Scope.Beside
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.relation).toBe('beside');
        expect(stub!.data.answer).toBe('beside');
    });
});
