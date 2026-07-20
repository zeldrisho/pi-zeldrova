# Release guide

Packages are versioned independently with Release Please. Conventional commits that affect packages are collected into one release pull request. The repository owner reviews and rebase-merges that pull request; the resulting component tags and GitHub releases publish only the released packages to npm.

## Configuration

Release automation requires:

- a `RELEASE_PLEASE_TOKEN` repository secret whose fine-grained token can write repository contents, issues, and pull requests, so generated pull requests trigger required checks;
- a protected `publish` GitHub environment; and
- one npm trusted publisher per package for `zeldrisho/pi-zeldrova`, workflow `release.yml`, environment `publish`, with the `npm publish` action allowed.

The release manifest must match versions already published to npm. The initial `0.2.0` component tags point to the exact manually published source commit.

## Release procedure

1. Obtain explicit approval for the package and expected version.
2. Prepare one coherent change and pull request.
3. Let the repository owner rebase-merge it.
4. Verify that Release Please proposes exactly the expected package and version.
5. Let the repository owner rebase-merge the release pull request.
6. Verify CI, the component tag, GitHub release, OIDC publication, provenance, npm metadata, and tarball contents.
7. Stop before another release if any result differs from expectations.

Never merge a pull request or publish a package on the owner's behalf.
