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

- the repository `GITHUB_TOKEN`, so release pull requests and commits are owned by `github-actions[bot]` instead of a maintainer account;
- a protected `publish` GitHub environment; and
- one npm trusted publisher per package for `zeldrisho/pi-zeldrova`, workflow `release.yml`, environment `publish`, with the `npm publish` action allowed.

GitHub does not start new workflow runs for pull requests created with `GITHUB_TOKEN`. The release workflow therefore validates each pushed commit before Release Please runs. It also serializes release runs, grants `id-token: write` only to the publish job, and publishes only package paths reported as released by Release Please. Keep workflow actions pinned to full commit SHAs.

## Bootstrap a new npm package

npm trusted publishing is configured from an existing package's settings, so it cannot publish a package's first registry version. This is a [known npm limitation](https://github.com/npm/cli/issues/8544). Bootstrap each new package before relying on the release workflow:

1. Add the package to `release-please-config.json` with `"initial-version": "0.1.0"`, set its tracked `package.json` version to `0.1.0`, leave its path absent from `.release-please-manifest.json`, and initialize its allowlisted `CHANGELOG.md` as an empty file. Without an explicit initial version, Release Please proposes `1.0.0`; pre-populating the changelog with its heading also causes a duplicate heading in the generated file.
2. Complete the repository checks and inspect the package tarball.
3. From an isolated copy of that inspected tarball, change only the temporary package version to `0.0.0` and publish it manually with `vp pm publish -- --access public --tag bootstrap`. Do not commit the bootstrap version or add it to the release manifest.
4. In the new package's npm settings, configure the trusted publisher for repository `zeldrisho/pi-zeldrova`, workflow `release.yml`, environment `publish`, and the `npm publish` action.
5. Verify `0.0.0` and the `bootstrap` dist-tag on npm. The normal release procedure can then publish `0.1.0` through OIDC; npm will move `latest` to that release.

Publishing the bootstrap version is irreversible. If any name, version, access level, tarball content, or publisher setting is unexpected, stop before merging the Release Please pull request.

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
