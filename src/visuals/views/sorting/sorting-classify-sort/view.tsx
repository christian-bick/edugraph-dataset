import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {CategoryCountView} from '../category-count-view.tsx';
import {SortingClassifySortViewConfig, SortingClassifySortViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'sorting-classify-sort';
const SortingClassifySortCore = ({payload}: {
    config: SortingClassifySortViewConfig;
    payload: ViewRenderPayload<'sorting-classify-sort'>;
}) => <CategoryCountView payload={payload} viewId={VIEW_ID} task="extremum" />;

export const SortingClassifySort = withConfig(SortingClassifySortViewSchema, SortingClassifySortCore);

let root: ReturnType<typeof createRoot> | null = null;
if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'sorting-classify-sort'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<SortingClassifySort payload={payload} />);
        }
    };
}
