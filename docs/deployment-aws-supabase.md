# Development AWS + Supabase CI/CD Setup

This setup uses GitHub Actions for the **development environment** only.

- `main` push: CI only. Production on ConoHa VPS can remain manual.
- `develop` push: deploys the development environment to AWS.
- Development API: Amazon ECR + AWS App Runner
- Development admin UI: Amazon S3 + CloudFront
- Development public UI: Amazon S3 + CloudFront
- Development database: your development Supabase PostgreSQL project
- Production database: the customer's production Supabase PostgreSQL project

Do not put production ConoHa or production Supabase credentials into the
development AWS deployment workflow.

## Cost target for development AWS

The target monthly development-platform cost is under roughly USD 10 for light
traffic.

| Component | Recommended shape | Rough monthly cost |
| --- | --- | ---: |
| App Runner API | 0.25 vCPU / 0.5 GB, one service | USD 3-6 |
| ECR | lifecycle policy, a few images retained | USD 0.1-1 |
| Admin S3 + CloudFront | static assets | under USD 1 for light traffic |
| Public S3 + CloudFront | static assets | under USD 1 for light traffic |
| Development Supabase | Free plan | USD 0 |

Running API, admin, and public as three App Runner services is not recommended
for the USD 10 target because each service keeps provisioned memory warm.

## Branch policy

| Branch / event | Action |
| --- | --- |
| Pull request to `main` or `develop` | Run CI |
| Push to `main` | Run CI only |
| Push to `develop` | Run CI-like verification, then deploy development AWS |
| Production ConoHa VPS | Manual for now |

This means production can be released manually even when `main` receives
changes. A ConoHa deployment workflow can be added later if you want production
automation.

## Development Supabase

Create a Supabase project for development and copy the connection strings from
the Database settings.

Use a pooled URL for application traffic and a direct/session URL for
migrations:

```text
DEV_SUPABASE_DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DEV_SUPABASE_DIRECT_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
```

`DEV_SUPABASE_DATABASE_URL` is used by the running development API.
`DEV_SUPABASE_DIRECT_URL` is used by `prisma migrate deploy`.

Supabase Free plan is useful for development, but it has limits such as 500 MB
database storage and project pausing after inactivity.

### Supabase Storage bucket for teacher photos

The teacher application form uploads a face photo (顔写真) to Supabase
Storage through the API endpoint
`POST /api/v1/teachers/applications/photo`.

1. In the Supabase dashboard, open **Storage** and create a bucket named
   `teacher-photos` (or any name you prefer).
2. Mark the bucket as **Public** so the stored photo URLs
   (`.../storage/v1/object/public/teacher-photos/...`) can be displayed in
   the admin UI without signed URLs.
3. Set these environment variables for the API:

```text
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...   # Project Settings > API keys (server only)
SUPABASE_STORAGE_BUCKET=teacher-photos
```

The API uploads with the service role key, so no Storage RLS policies are
required for uploads. Keep the service role key server-side only; it must
never be exposed to the frontend apps.

## Development AWS resources

Create these resources before enabling the `develop` deployment workflow.

### Development API

1. Create an ECR private repository.
   - The repository name must match `DEV_ECR_REPOSITORY`.
2. Create an App Runner service from the ECR image.
   - Image tag: `latest`
   - Port: `3000`
   - Health check path: `/health`
   - Instance size: start with `0.25 vCPU / 0.5 GB`
3. Configure App Runner runtime environment variables/secrets.

Required development runtime settings:

```text
NODE_ENV=production
PORT=3000
DATABASE_URL=<development Supabase pooled URL>
DIRECT_URL=<development Supabase direct/session URL>
JWT_SECRET=<development random secret>
MFA_ENCRYPTION_KEY=<development random secret>
ADMIN_EMAIL=<development admin email>
ADMIN_PASSWORD=<development admin password>
ADMIN_NAME=<development admin name>
CORS_ORIGINS=https://dev-admin.example.com,https://dev-public.example.com
LINE_CHANNEL_ID=<optional development value>
LINE_CHANNEL_SECRET=<optional development value>
LINE_REDIRECT_URI=https://dev-api.example.com/api/v1/auth/line/callback
LINE_CHANNEL_ACCESS_TOKEN=<optional development value>
LINE_GROUP_ID=<optional development value>
LINE_OA_BASIC_ID=<official account basic ID, e.g. @xxxx>
LINE_ADD_FRIEND_URL=<optional lin.ee URL; overrides LINE_OA_BASIC_ID>
MAIL_HOST=<optional development value>
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=<optional development value>
MAIL_PASSWORD=<optional development value>
MAIL_FROM=塾応募管理 Dev <noreply@example.com>
TIMEREX_WEBHOOK_SECRET=<optional development value>
```

Do not set `APPLICATION_API_KEY` if the public static site posts directly from
the browser. A browser-visible API key is not a secret. If an application API
key is required, add a server-side proxy instead of exposing it as
`NEXT_PUBLIC_APPLICATION_API_KEY`.

### Development admin UI

1. Create an S3 bucket for the development admin static site.
2. Put CloudFront in front of the bucket.
3. Configure CloudFront to serve `index.html` for SPA fallback responses.
4. Set `VITE_API_BASE_URL` through `DEV_API_BASE_URL`.

### Development public UI

1. Create an S3 bucket for the development public static site.
2. Put CloudFront in front of the bucket.
3. Set `NEXT_PUBLIC_API_BASE_URL` through `DEV_API_BASE_URL`.
4. Optionally set `DEV_NEXT_PUBLIC_PRIVACY_POLICY_URL`.
5. Optionally set `DEV_NEXT_PUBLIC_LINE_ADD_FRIEND_URL` (公式アカウント友だち追加 URL).

The public Next.js app is configured with `output: "export"` so the deployment
artifact is `apps/public/out`.

## GitHub repository variables for development

Set these in GitHub repository settings:

`Settings` -> `Secrets and variables` -> `Actions` -> `Variables`

| Variable | Example |
| --- | --- |
| `DEV_AWS_REGION` | `ap-northeast-1` |
| `DEV_ECR_REPOSITORY` | `juku-api-dev` |
| `DEV_API_BASE_URL` | `https://dev-api.example.com` |
| `DEV_ADMIN_S3_BUCKET` | `example-dev-admin-site` |
| `DEV_ADMIN_CLOUDFRONT_DISTRIBUTION_ID` | `E123...` |
| `DEV_PUBLIC_S3_BUCKET` | `example-dev-public-site` |
| `DEV_PUBLIC_CLOUDFRONT_DISTRIBUTION_ID` | `E456...` |
| `DEV_NEXT_PUBLIC_PRIVACY_POLICY_URL` | `https://dev-public.example.com/privacy` |
| `DEV_NEXT_PUBLIC_LINE_ADD_FRIEND_URL` | `https://lin.ee/xxxx` |

CloudFront distribution IDs are optional. If unset, invalidation is skipped.

## GitHub repository secrets for development

Set these in GitHub repository settings:

`Settings` -> `Secrets and variables` -> `Actions` -> `Secrets`

| Secret | Purpose |
| --- | --- |
| `DEV_AWS_ROLE_TO_ASSUME` | IAM role ARN for GitHub OIDC development deploys |
| `DEV_APP_RUNNER_SERVICE_ARN` | Existing development App Runner service ARN |
| `DEV_SUPABASE_DATABASE_URL` | Development Supabase pooled connection URL |
| `DEV_SUPABASE_DIRECT_URL` | Development Supabase direct/session connection URL |

The GitHub workflow uses OIDC. Do not store long-lived AWS access keys.

## IAM policy outline

The development GitHub OIDC role needs permissions for:

- ECR repository describe/create and image push
- App Runner `StartDeployment`
- S3 sync to the development site buckets
- CloudFront invalidations for development distributions

Scope resources to development-only ECR, App Runner, S3, and CloudFront
resources.

## Development deployment flow

On every push to `develop`:

1. Run verification against a PostgreSQL service container.
2. Apply Prisma migrations to the development Supabase project.
3. Build and push the API Docker image to development ECR with both `latest`
   and commit SHA tags.
4. Start a development App Runner deployment.
5. Build and upload development admin static assets to S3.
6. Build and upload development public static assets to S3.
7. Invalidate development CloudFront caches when distribution IDs are configured.

On every push to `main`, only CI runs. Production ConoHa VPS deployment remains
manual for now.

ESLint is intentionally not a required workflow step yet because the current
repository has pre-existing API lint/prettier violations and admin React hooks
lint violations. Add it back after the baseline source formatting, admin lint,
and unit-test dependency setup are fixed.

## Local commands

```bash
npm ci
npx prisma generate
npm run build:all
```

For local migration checks against a PostgreSQL database:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_test \
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/app_test \
npx prisma migrate deploy
```

## Manual ECR image push

Use this when you want to place the API Docker image in ECR before App Runner
is wired up, or when testing image builds outside the `develop` deploy workflow.

### Prerequisites

1. AWS CLI installed and authenticated (`aws sts get-caller-identity`).
2. Docker installed and running.
3. IAM permissions for ECR push. See
   `scripts/aws/iam/github-actions-ecr-policy.json` for a minimal policy
   template.

### 1. Create the ECR repository

```bash
cp .env.aws.example .env.aws
# edit .env.aws

set -a && source .env.aws && set +a
npm run docker:ecr:setup
```

This creates the repository (if missing) and applies a lifecycle policy that
keeps the last 10 images.

### 2. Build and push the API image

```bash
set -a && source .env.aws && set +a
npm run docker:ecr:push
```

By default the script tags the image with the current git short SHA and also
pushes `latest`.

Environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `AWS_REGION` | `ap-northeast-1` | AWS region |
| `ECR_REPOSITORY` | required | ECR repository name |
| `IMAGE_TAG` | git short SHA | Image tag to push |
| `PUSH_LATEST` | `true` | Also push `:latest` |

### 3. Push from GitHub Actions (manual)

Workflow: `.github/workflows/ecr-push.yml`

1. Configure `DEV_AWS_REGION`, `DEV_ECR_REPOSITORY`, and `DEV_AWS_ROLE_TO_ASSUME`.
2. Open GitHub Actions and run **Push API image to ECR**.
3. Optionally set a custom image tag.

### 4. Verify the image in ECR

```bash
aws ecr describe-images \
  --repository-name "$ECR_REPOSITORY" \
  --region "$AWS_REGION" \
  --query 'imageDetails[*].imageTags' \
  --output table
```

### 5. Local Docker smoke test (optional)

```bash
npm run docker:build
cp .env.example .env
# set DATABASE_URL / DIRECT_URL for a reachable PostgreSQL database
npm run docker:run
curl http://localhost:3000/health
```
