import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {PictureGraphView} from '../picture-graph-view.tsx';
import {DataPictureGraphArithmeticViewConfig, DataPictureGraphArithmeticViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'data-picture-graph-arithmetic';
interface CoreProps {config: DataPictureGraphArithmeticViewConfig; payload: ViewRenderPayload<'data-picture-graph-arithmetic'>}
const Core = ({payload}: CoreProps) => <PictureGraphView mode="arithmetic" payload={payload} viewId={VIEW_ID} />;
export const DataPictureGraphArithmetic = withConfig(DataPictureGraphArithmeticViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'data-picture-graph-arithmetic'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<DataPictureGraphArithmetic payload={payload} />);
};
