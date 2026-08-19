import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {BarGraphView} from '../bar-graph-view.tsx';
import {DataBarGraphArithmeticViewConfig, DataBarGraphArithmeticViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'data-bar-graph-arithmetic';
interface CoreProps {config: DataBarGraphArithmeticViewConfig; payload: ViewRenderPayload<'data-bar-graph-arithmetic'>}
const Core = ({payload}: CoreProps) => <BarGraphView mode="arithmetic" payload={payload} viewId={VIEW_ID} />;
export const DataBarGraphArithmetic = withConfig(DataBarGraphArithmeticViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'data-bar-graph-arithmetic'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<DataBarGraphArithmetic payload={payload} />);
};
