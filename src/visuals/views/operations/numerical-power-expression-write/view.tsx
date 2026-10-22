import {createRoot} from 'react-dom/client';
import {isNumericalPowerExpressionProblem} from '../../../../generators/arithmetic/numerical-power-helpers.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {NumericalPowerWritingBody} from '../numerical-power-expression-view.tsx';
import {NumericalPowerExpressionWriteViewSchema, type NumericalPowerExpressionWriteViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numerical-power-expression-write';
export const NumericalPowerExpressionWriteCore = ({payload}: {config: NumericalPowerExpressionWriteViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'expression', 'nodeValues', 'powerFacts', 'reductions', 'finalValue']);
    if (!isNumericalPowerExpressionProblem(data)) throw new ViewValidationError(VIEW_ID, 'The exact syntax, power facts or written-order reductions are inconsistent.');
    return <NumericalPowerWritingBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const NumericalPowerExpressionWrite = withConfig(NumericalPowerExpressionWriteViewSchema, NumericalPowerExpressionWriteCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumericalPowerExpressionWrite payload={payload} />);
};
