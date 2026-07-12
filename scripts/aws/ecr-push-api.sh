#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-ap-northeast-1}"
ECR_REPOSITORY="${ECR_REPOSITORY:?Set ECR_REPOSITORY (example: juku-api-dev)}"
IMAGE_TAG="${IMAGE_TAG:-}"
PUSH_LATEST="${PUSH_LATEST:-true}"

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI is required. Install it and configure credentials first." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required. Install Docker and ensure the daemon is running." >&2
  exit 1
fi

if [ -z "$IMAGE_TAG" ]; then
  if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    IMAGE_TAG="$(git rev-parse --short HEAD)"
  else
    IMAGE_TAG="latest"
  fi
fi

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_URI="${ECR_REGISTRY}/${ECR_REPOSITORY}"

aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"

if ! aws ecr describe-repositories \
  --repository-names "$ECR_REPOSITORY" \
  --region "$AWS_REGION" >/dev/null 2>&1; then
  echo "ECR repository not found: $ECR_REPOSITORY" >&2
  echo "Run: npm run docker:ecr:setup" >&2
  exit 1
fi

docker build \
  --tag "${IMAGE_URI}:${IMAGE_TAG}" \
  .

if [ "$PUSH_LATEST" = "true" ] && [ "$IMAGE_TAG" != "latest" ]; then
  docker tag "${IMAGE_URI}:${IMAGE_TAG}" "${IMAGE_URI}:latest"
fi

docker push "${IMAGE_URI}:${IMAGE_TAG}"

if [ "$PUSH_LATEST" = "true" ] && [ "$IMAGE_TAG" != "latest" ]; then
  docker push "${IMAGE_URI}:latest"
fi

echo "Pushed ${IMAGE_URI}:${IMAGE_TAG}"
if [ "$PUSH_LATEST" = "true" ] && [ "$IMAGE_TAG" != "latest" ]; then
  echo "Pushed ${IMAGE_URI}:latest"
fi
