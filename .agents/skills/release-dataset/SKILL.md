---
name: release-dataset
description: "/release-dataset [releaseTag] - Prepare, validate, publish, monitor, and verify an EduGraph dataset release, or safely retry a failed release. Use for version-tag releases to Hugging Face, GitHub Releases, and the production coverage explorer."
---

# Release Dataset

Orchestrate an EduGraph dataset release without bypassing canonical generation, the
committed VQA cache, or the repository's publication workflows. Default to the `ccss`
release spec because `.github/workflows/release.yml` currently owns that scope.

## 1. Read the Current Release Contract

Read these files before acting; treat them as the source of truth when they differ from
this skill:

- `README.md`, especially VQA audit and coverage-explorer behavior.
- `DOCS.md`, especially release automation and dataset validation.
- `.github/workflows/release.yml` for gates, tag syntax, publication order, and outputs.
- `.github/workflows/deploy.yaml` for the production explorer handoff.
- `package.json` for the ontology dependency and available commands.

Never reproduce Hugging Face uploads, GitHub Release assets, or Firebase deployment by
hand when the workflows can perform them.

## 2. Inspect Without Mutating

Before proposing a release:

1. Run `gh auth status` and verify Docker is available.
2. Inspect `git status --short --branch`, the current branch, `HEAD`, `origin/main`, and
   recent version tags.
3. Require a clean worktree on `main`, with `HEAD == origin/main`. Preserve and report any
   user changes; do not stash, discard, or include them automatically.
4. Verify that the `Validate Main` workflow succeeded for the exact `HEAD` SHA. If it has
   not, wait for it or diagnose it before continuing.
5. Derive a candidate tag from the ontology version in `package.json` and existing dataset
   revisions. Tags must match `vMAJOR.MINOR.PATCH` or `vMAJOR.MINOR.PATCH-NN`. Show the
   candidate and evidence; let the user resolve any ambiguity.
6. Check whether the candidate already exists locally, on `origin`, as a GitHub Release,
   or in a prior release workflow run. Existing state selects the retry path below.

All inspection and local validation before tag publication must remain reversible.

## 3. Run the Local Release Preflight

Prevent a release tag from becoming the first full canonical test:

1. Ensure no development server is holding `out/dataset-ccss` open. On Windows, identify
   listeners before stopping anything and ask before terminating a user-owned process.
2. Generate the complete canonical dataset:

   ```bash
   npm run generate:dataset:container -- --spec=ccss
   ```

3. Run the strict, offline cache audit:

   ```bash
   npm run audit:dataset -- --spec=ccss
   ```

4. Run the release-relevant dataset checks:

   ```bash
   npm run report:churn -- --spec=ccss
   npm run report:splits -- --spec=ccss
   npm run merge:dataset
   ```

5. Confirm that the worktree remains clean. Generated files in `out/` are build output and
   must not be committed.

Do not create or push the release tag unless canonical generation, strict audit, split
audit, and the exact-HEAD `Validate Main` workflow all pass.

### Repairing VQA Cache Findings

Treat `audit:dataset` as read-only evidence. Distinguish missing entries, stale entries,
actual VQA failures, and structural or renderer failures before proposing a remedy.

Live validation sends uncached images to Gemini and mutates committed cache files. State
the number and nature of affected samples and obtain explicit user consent immediately
before running:

```bash
npm run validate:dataset -- --spec=ccss
```

Use `--force` only when evaluator mechanics require a full reevaluation and the user has
explicitly approved that larger external operation. After validation:

1. Rerun `audit:dataset` and require exact passing coverage.
2. Run `report:churn` and explain additions, removals, and changed images.
3. Inspect the diff. Commit only intended files under `cache/vqa-validation/dataset-ccss/`.
4. Push `main` and wait for `Validate Main` to pass on the new exact SHA.
5. Repeat canonical generation if a source change, rather than cache-only repair, changed
   release inputs.

Never weaken, skip, or convert the strict audit to report-only for a release.

## 4. Publish the Tag

Immediately before publication, present a compact release checkpoint containing:

- proposed tag and target SHA;
- ontology dependency version;
- clean/synchronized worktree state;
- exact-HEAD `Validate Main` result;
- canonical sample and VQA audit totals;
- split/churn findings;
- expected destinations: Hugging Face, GitHub Release, and Firebase explorer.

Ask for explicit confirmation to create and push the tag. A remote tag starts an external,
partly irreversible publication workflow; earlier approval to prepare a release is not
sufficient for this step.

After confirmation, create an annotated tag on the verified SHA and push that exact ref:

```bash
git tag -a <releaseTag> -m "Dataset release <releaseTag>"
git push origin refs/tags/<releaseTag>
```

Do not push unrelated branches or tags.

## 5. Monitor and Verify the Release

Monitor the tag-triggered `Release Dataset to HuggingFace` run through every stage. Report
meaningful checkpoints without flooding the user:

1. quality gates;
2. canonical generation;
3. committed VQA cache audit;
4. merge, asset-index, and coverage validation;
5. Hugging Face publication;
6. GitHub Release publication;
7. explorer deployment dispatch.

If the workflow fails, inspect `gh run view <runId> --log-failed`, identify the failing
stage, and stop publication work until the cause is understood.

After success, verify:

- the GitHub Release is public, non-draft, and non-prerelease;
- `asset-index.json`, `ccss-coverage.json`, `ccss-tree.json`, and
  `coverage-manifest.json` are attached;
- the local and remote annotated tag dereference to the intended SHA;
- the triggered `Deploy Coverage Explorer to Firebase Hosting` workflow succeeds;
- `main` is still clean and synchronized.

Return links to both workflow runs and the GitHub Release, plus the published tag and SHA.

## 6. Retry a Failed Release Safely

Classify existing release state before changing a tag:

- **Transient workflow failure, unchanged source:** keep the tag and use the
  `workflow_dispatch` input `release_tag` to retry the existing tag. Do not rebuild release
  artifacts manually:

  ```bash
  gh workflow run release.yml --ref main -f release_tag=<releaseTag>
  ```
- **Source or cache fix required, nothing published:** fix and validate `main` first. Only
  after showing that no Hugging Face tag or GitHub Release was published, ask explicit
  permission to delete and recreate the local and remote failed tag at the corrected SHA.
- **Any destination was published:** do not rewrite or delete the tag automatically. Report
  the exact state of GitHub, Hugging Face, and Firebase and agree on a recovery plan with
  the user; normally publish a new dataset revision.

For retry decisions, inspect the Hugging Face dataset's tag state through its API or CLI in
addition to GitHub. Absence of a GitHub Release alone does not prove that publication never
started because Hugging Face precedes GitHub Release creation in the workflow.

Before deleting a failed tag, resolve and display its exact local and remote targets. Delete
only the named tag. Never use a wildcard or remove any release artifact merely because the
workflow failed.

## Completion Report

Summarize:

- release tag and commit SHA;
- local preflight and CI audit totals;
- publication and deployment status with links;
- any cache repair and its churn;
- final worktree state;
- any intentionally stopped local development service that the user may restart.
