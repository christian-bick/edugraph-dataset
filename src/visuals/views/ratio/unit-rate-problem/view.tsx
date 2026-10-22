import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isUnitRateRelation} from '../ratio-language-presentation.ts';
import {UnitRateProblemBody} from '../ratio-language-view.tsx';
import {UnitRateProblemViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'unit-rate-problem';

export const UnitRateProblemCore = ({payload}: {payload: ViewRenderPayload<'unit-rate-problem'>}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'context', 'antecedent', 'consequent', 'unitRate', 'scaleFactor', 'scaled']);
    if (!isUnitRateRelation(data)) {
        throw new ViewValidationError(VIEW_ID, 'Ordered quantities and exact ratio witnesses must be valid and agree.');
    }
    return <UnitRateProblemBody data={data} isSolutionView={payload.isSolutionView} />;
};

export const UnitRateProblem = withConfig(UnitRateProblemViewSchema, UnitRateProblemCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'unit-rate-problem'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<UnitRateProblem payload={payload} />);
    }
};
