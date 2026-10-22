import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {isFullCommonFactorDistribution} from '../../../helpers/common-factor-helpers.ts';
import {FullCommonFactorBody} from '../../../components/common-factor-view.tsx';
import {withConfig} from '../../withConfig.tsx';
import {OperationsFullCommonFactorViewSchema, type OperationsFullCommonFactorViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-full-common-factor';
export const OperationsFullCommonFactorCore = ({payload}: {config: OperationsFullCommonFactorViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ["kind","addends","sum","commonDivisors","gcd","residualAddends","residualSum","residualCommonDivisors","distributedProducts"]);
    if (!isFullCommonFactorDistribution(data)) throw new ViewValidationError(VIEW_ID, 'The complete factor, cofactor, multiple or distributive witnesses are inconsistent.');
    return <FullCommonFactorBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const OperationsFullCommonFactor = withConfig(OperationsFullCommonFactorViewSchema, OperationsFullCommonFactorCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsFullCommonFactor payload={payload} />);
};
