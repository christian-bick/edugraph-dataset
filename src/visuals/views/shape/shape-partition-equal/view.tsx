import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ShapePartitionView} from '../shape-partition-view.tsx';
import {ShapePartitionEqualViewConfig, ShapePartitionEqualViewSchema} from './spec.ts';
import '../../../../tailwind.css';
const VIEW_ID = 'shape-partition-equal';
interface CoreProps {config: ShapePartitionEqualViewConfig; payload: ViewRenderPayload<'shape-partition-equal'>}
const Core = ({payload}: CoreProps) => <ShapePartitionView payload={payload} task="partition" viewId={VIEW_ID} />;
export const ShapePartitionEqual = withConfig(ShapePartitionEqualViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'shape-partition-equal'>) => {
    const container = document.getElementById('view'); if (!container) return;
    if (!root) root = createRoot(container); root.render(<ShapePartitionEqual payload={payload} />);
};
