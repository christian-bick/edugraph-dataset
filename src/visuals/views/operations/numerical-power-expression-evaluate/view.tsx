import {createRoot} from 'react-dom/client';
import {isNumericalPowerExpressionProblem} from '../../../../generators/arithmetic/numerical-power-helpers.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {NumericalPowerEvaluationBody} from '../numerical-power-expression-view.tsx';
import {NumericalPowerExpressionEvaluateViewSchema, type NumericalPowerExpressionEvaluateViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numerical-power-expression-evaluate';
export const NumericalPowerExpressionEvaluateCore = ({payload}: {config: NumericalPowerExpressionEvaluateViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'expression', 'nodeValues', 'powerFacts', 'reductions', 'finalValue']);
    if (!isNumericalPowerExpressionProblem(data)) throw new ViewValidationError(VIEW_ID, 'The exact syntax, power facts or written-order reductions are inconsistent.');
    return <NumericalPowerEvaluationBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const NumericalPowerExpressionEvaluate = withConfig(NumericalPowerExpressionEvaluateViewSchema, NumericalPowerExpressionEvaluateCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumericalPowerExpressionEvaluate payload={payload} />);
};
