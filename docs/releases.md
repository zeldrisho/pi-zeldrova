# Release guide

This guide describes the release process for maintainers and contributors.

Packages are versioned independently with Release Please. Conventional commits that affect packages are collected into one release pull request. The repository owner reviews and rebase-merges that pull request; the resulting component tags and GitHub releases publish only the released packages to npm.

## Release invariants

- Release Please manages package versions. Keep the release manifest, package manifests, npm registry, and component tags synchronized.
- Release Please branches and generated artifacts must not be hand-edited to bypass checks. Rebase work branches onto their target; never merge the target branch into them.
- Only the repository owner merges pull requests. Publication, tags, GitHub releases, and protected-environment deployment require explicit approval for the specific package and expected version.
- Verify npm trusted publication end to end after every release.

## Configuration

Release automation requires:

- a `RELEASE_PLEASE_TOKEN` repository secret whose fine-grained token can write repository contents, issues, and pull requests, so generated pull requests trigger required checks;
- a protected `publish` GitHub environment; and
- one npm trusted publisher per package for `zeldrisho/pi-zeldrova`, workflow `release.yml`, environment `publish`, with the `npm publish` action allowed.

The workflow grants `id-token: write` only to the publish job and publishes only package paths reported as released by Release Please. Keep workflow actions pinned to full commit SHAs.

## Release procedure

1. Confirm the package and expected version with the repository owner.
2. Prepare one coherent change and pull request, then run the checks in [`development.md`](development.md).
3. The repository owner reviews and rebase-merges the change pull request.
4. Confirm that Release Please proposes exactly the expected package and version and that generated files pass checks without manual bot-branch edits.
5. The repository owner reviews and rebase-merges the release pull request.
6. Confirm CI, the component tag, GitHub release, OIDC publication, provenance, npm metadata, and tarball contents.
7. Complete any follow-up release only after all results match expectations.

## Escalation conditions

Pause the release and notify the repository owner if:

- npm or GitHub state differs from the release manifest or repository configuration;
- any version, tag, package path, or release count is unexpected;
- a generated release pull request fails checks or formatting;
- updating a branch would require merging its target branch into it;
- authentication, OIDC, provenance, publication, or protected-environment deployment fails;
- an operation would bypass branch protection or rewrite a merged, tagged, released, or published commit; or
- publication, tagging, release creation, deployment approval, or a pull-request merge lacks explicit package-specific approval.
