import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {FractionUnitScalingBody, isValidUnitScalingProblem} from '../fraction-unit-scaling-view.tsx';
import {
    FractionsEquivalenceUnitScalingViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-equivalence-unit-scaling';

export const FractionsEquivalenceUnitScalingCore = ({payload}: {
    payload: ViewRenderPayload<'fractions-equivalence-unit-scaling'>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, [
        'task', 'first', 'second', 'scaleFactor', 'unitMultiplier', 'relation'
    ]);
    if (!isValidUnitScalingProblem(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected exact proper-fraction scaling by n/n = 1.');
    }
    return <FractionUnitScalingBody data={data} isSolutionView={payload.isSolutionView} />;
};

export const FractionsEquivalenceUnitScaling = withConfig(
    FractionsEquivalenceUnitScalingViewSchema,
    FractionsEquivalenceUnitScalingCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'fractions-equivalence-unit-scaling'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsEquivalenceUnitScaling payload={payload} />);
    }
};
