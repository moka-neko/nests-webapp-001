#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-ap-northeast-1}"
ECR_REPOSITORY="${ECR_REPOSITORY:?Set ECR_REPOSITORY (example: juku-api-dev)}"
IMAGE_RETENTION_COUNT="${IMAGE_RETENTION_COUNT:-10}"

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI is required. Install it and configure credentials first." >&2
  exit 1
fi

if aws ecr describe-repositories \
  --repository-names "$ECR_REPOSITORY" \
  --region "$AWS_REGION" >/dev/null 2>&1; then
  echo "ECR repository already exists: $ECR_REPOSITORY ($AWS_REGION)"
else
  aws ecr create-repository \
    --repository-name "$ECR_REPOSITORY" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    --region "$AWS_REGION" \
    >/dev/null
  echo "Created ECR repository: $ECR_REPOSITORY ($AWS_REGION)"
fi

LIFECYCLE_POLICY="$(cat <<EOF
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last ${IMAGE_RETENTION_COUNT} images",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": ${IMAGE_RETENTION_COUNT}
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
EOF
)"

aws ecr put-lifecycle-policy \
  --repository-name "$ECR_REPOSITORY" \
  --lifecycle-policy-text "$LIFECYCLE_POLICY" \
  --region "$AWS_REGION" \
  >/dev/null

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
echo "Repository URI: ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}"
