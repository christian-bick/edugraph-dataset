import { resolve } from 'path';

/**
 * Dataset folder resolution — the single definition of where a spec's samples
 * and VQA cache live.
 *
 * Every spec module generates into its own folder (`out/dataset-<spec>/`, cache
 * `cache/vqa-validation/dataset-<spec>/`). The **union dataset** (`out/dataset/`)
 * is a derived artifact that `merge-dataset.ts` builds from every non-isolated
 * spec, so one standard can be regenerated without disturbing the others.
 *
 * Every script selects its dataset the same way: `--spec=<module>`, plus the
 * reserved `--spec=union` for the merged set. Before this existed, four scripts
 * derived the folder from a spec name while two derived it from a raw folder
 * name, and the two rules only agreed for the `test` spec.
 */

export const UNION_DATASET_DIR = 'dataset';
export const DATASET_DIR_PREFIX = 'dataset-';

/**
 * Reserved spec name addressing the merged union dataset. Every script takes
 * `--spec`; this is the one value that is not a spec module.
 */
export const UNION_SPEC = 'union';

export function isUnionSpec(specName: string): boolean {
    return specName === UNION_SPEC;
}

/** The dataset folder owned by a spec module, e.g. `ccss` -> `dataset-ccss`. */
export function datasetDirForSpec(specName: string): string {
    if (!specName) {
        throw new Error('datasetDirForSpec requires a spec name.');
    }
    if (isUnionSpec(specName)) {
        throw new Error(`"${UNION_SPEC}" is the merged dataset, not a spec module.`);
    }
    if (specName.startsWith(DATASET_DIR_PREFIX)) {
        throw new Error(`Expected a spec name but received a dataset folder name: "${specName}".`);
    }
    return `${DATASET_DIR_PREFIX}${specName}`;
}

/** The spec a dataset folder belongs to, or null for the union folder. */
export function specFromDatasetDir(dirName: string): string | null {
    return dirName.startsWith(DATASET_DIR_PREFIX)
        ? dirName.slice(DATASET_DIR_PREFIX.length)
        : null;
}

/**
 * Resolves the dataset folder a `--spec` value addresses: a spec module's own
 * folder, or the merged union for the reserved `union` name.
 */
export function resolveDatasetDir(specName: string): string {
    if (!specName) {
        throw new Error(`resolveDatasetDir requires a spec name, or "${UNION_SPEC}" for the merged dataset.`);
    }
    return isUnionSpec(specName) ? UNION_DATASET_DIR : datasetDirForSpec(specName);
}

/** Absolute path of a dataset's rendered output. */
export function datasetOutDir(projectRoot: string, dirName: string): string {
    return resolve(projectRoot, 'out', dirName);
}

/** Absolute path of a dataset's VQA validation cache. */
export function vqaCacheDir(projectRoot: string, dirName: string): string {
    return resolve(projectRoot, 'cache', 'vqa-validation', dirName);
}

/** Repo-relative path of a dataset's VQA validation cache, for git-based tooling. */
export function vqaCacheRelDir(dirName: string): string {
    return `cache/vqa-validation/${dirName}`;
}
