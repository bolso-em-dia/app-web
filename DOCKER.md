# Docker Publishing

This repository publishes one Docker Hub image:

- `bolso-em-dia-ui`

The GitHub Actions workflow is defined in `.github/workflows/docker.yml`.

## Published image name

The workflow publishes:

- `<dockerhub-namespace>/bolso-em-dia-ui`

The namespace comes from:

1. repository variable `DOCKERHUB_NAMESPACE`, if present
2. otherwise `DOCKERHUB_USERNAME`

## Workflow triggers

The Docker workflow runs in two modes:

- only after the frontend validation job in the same workflow succeeds

- automatically on pushed Git tags that match `v*`
- manually through `workflow_dispatch`

## Tagging model

Release tags must use semantic versioning in this format:

- `vMAJOR.MINOR.PATCH`

Examples:

- `v1.0.0`
- `v1.4.2`

For a release tag such as `v1.4.2`, the image receives:

- `latest`
- `1.4.2`
- `1.4`
- `1`
- `sha-<commit>`

For manual `workflow_dispatch`, the workflow publishes only the `sha-<commit>`
variant.

## Required GitHub secrets

The workflow requires these repository secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

`DOCKERHUB_TOKEN` should be a Docker Hub access token. The same token is used
for image push and repository description sync — no additional scopes needed.

## Recommended GitHub repository variables

Optional but recommended:

- `DOCKERHUB_NAMESPACE`

## Docker Hub description sync

The workflow automatically updates the Docker Hub repository description page
from `DOCKER.md` after a successful image publish. This keeps the public
documentation in sync with the repository-maintained source.

The sync step uses `peter-evans/dockerhub-description@v4` and fails the
workflow if the description update is rejected — out-of-sync descriptions are
treated as a publish failure.

## Runtime API configuration

The `bolso-em-dia-ui` image no longer embeds a production API URL during the CI
build.

Instead, the container reads the API base URL at runtime from:

- `API_BASE_URL`

Example:

- `https://api.example.com`

If `API_BASE_URL` is not provided, the container falls back to:

- `http://localhost:8080`

This makes the same image reusable across different environments without a
rebuild.

## Using the published image from Docker Hub

Pull the published UI image with:

```bash
docker pull <dockerhub-namespace>/bolso-em-dia-ui:latest
```

Run it directly with:

```bash
docker run --rm -p 4173:80 \
  -e API_BASE_URL=https://api.example.com \
  <dockerhub-namespace>/bolso-em-dia-ui:latest
```

The published container always listens on port `80` internally. The host-side
published port is configurable.

The image publishes its own Docker health check against:

- `http://localhost:80/`

Example with a custom published port:

```bash
docker run --rm -p 14173:80 \
  -e API_BASE_URL=http://localhost:18081 \
  <dockerhub-namespace>/bolso-em-dia-ui:latest
```

## Release tagging process

Use this process for an official Docker release:

1. make sure the target commit is already in the branch you want to release
2. make sure validation is green for that commit
3. create the release tag locally
4. push the tag to GitHub
5. wait for the Docker workflow to publish the image
6. verify the generated tags on Docker Hub

Example:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Manual publish process

Use `workflow_dispatch` when you want to publish a commit-addressable image
without creating a formal release tag.

Expected result:

- `sha-<commit>` tags are published
- semver tags and `latest` are not published

## Multi-architecture output

The image is published for:

- `linux/amd64`
- `linux/arm64`
