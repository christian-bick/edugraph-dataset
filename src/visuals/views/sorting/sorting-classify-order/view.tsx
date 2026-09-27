import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {CategoryCountView} from '../category-count-view.tsx';
import {SortingClassifyOrderViewConfig, SortingClassifyOrderViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'sorting-classify-order';
const SortingClassifyOrderCore = ({payload}: {
    config: SortingClassifyOrderViewConfig;
    payload: ViewRenderPayload<'sorting-classify-order'>;
}) => <CategoryCountView payload={payload} viewId={VIEW_ID} task="order" />;

export const SortingClassifyOrder = withConfig(SortingClassifyOrderViewSchema, SortingClassifyOrderCore);

let root: ReturnType<typeof createRoot> | null = null;
if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'sorting-classify-order'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<SortingClassifyOrder payload={payload} />);
        }
    };
}
