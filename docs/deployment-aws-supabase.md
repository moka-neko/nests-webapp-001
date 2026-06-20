# AWS + Supabase CI/CD Setup

This project deploys with GitHub Actions on `main` pushes.

- API: Amazon ECR + AWS App Runner
- Admin UI: Amazon S3 + CloudFront
- Public UI: Amazon S3 + CloudFront
- Database: Supabase PostgreSQL

## Cost target

The target monthly platform cost is under roughly USD 10 for light traffic.

| Component | Recommended shape | Rough monthly cost |
| --- | --- | ---: |
| App Runner API | 0.25 vCPU / 0.5 GB, one service | USD 3-6 |
| ECR | lifecycle policy, a few images retained | USD 0.1-1 |
| Admin S3 + CloudFront | static assets | under USD 1 for light traffic |
| Public S3 + CloudFront | static assets | under USD 1 for light traffic |
| Supabase | Free plan | USD 0 |

Running API, admin, and public as three App Runner services is not recommended
for the USD 10 target because each service keeps provisioned memory warm.

## Supabase

Create a Supabase project and copy the connection strings from the Database
settings.

Use a pooled URL for application traffic and a direct/session URL for
migrations:

```text
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
```

`DATABASE_URL` is used by the running API. `DIRECT_URL` is used by
`prisma migrate deploy`.

Supabase Free plan is useful for keeping costs low, but it has limits such as
500 MB database storage and project pausing after inactivity. Upgrade planning
is required if 24/7 production uptime becomes mandatory.

## AWS resources

Create these resources before enabling the GitHub Actions deployment workflow.

### API

1. Create an ECR private repository.
   - The repository name must match the GitHub variable `ECR_REPOSITORY`.
2. Create an App Runner service from the ECR image.
   - Image tag: `latest`
   - Port: `3000`
   - Health check path: `/health`
   - Instance size: start with `0.25 vCPU / 0.5 GB`
3. Configure App Runner runtime environment variables/secrets.

Required runtime settings:

```text
NODE_ENV=production
PORT=3000
DATABASE_URL=<Supabase pooled URL>
DIRECT_URL=<Supabase direct/session URL>
JWT_SECRET=<strong random secret>
MFA_ENCRYPTION_KEY=<strong random secret>
ADMIN_EMAIL=<initial admin email>
ADMIN_PASSWORD=<initial admin password>
ADMIN_NAME=<initial admin name>
CORS_ORIGINS=https://admin.example.com,https://example.com
LINE_CHANNEL_ID=<optional>
LINE_CHANNEL_SECRET=<optional>
LINE_REDIRECT_URI=https://api.example.com/api/v1/auth/line/callback
LINE_CHANNEL_ACCESS_TOKEN=<optional>
LINE_GROUP_ID=<optional>
MAIL_HOST=<optional>
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=<optional>
MAIL_PASSWORD=<optional>
MAIL_FROM=塾応募管理 <noreply@example.com>
TIMEREX_WEBHOOK_SECRET=<optional>
```

Do not set `APPLICATION_API_KEY` if the public static site posts directly from
the browser. A browser-visible API key is not a secret. If an application API
key is required, add a server-side proxy instead of exposing it as
`NEXT_PUBLIC_APPLICATION_API_KEY`.

### Admin UI

1. Create an S3 bucket for the admin static site.
2. Put CloudFront in front of the bucket.
3. Configure CloudFront to serve `index.html` for SPA fallback responses.
4. Set `VITE_API_BASE_URL` through the GitHub variable `API_BASE_URL`.

### Public UI

1. Create an S3 bucket for the public static site.
2. Put CloudFront in front of the bucket.
3. Set `NEXT_PUBLIC_API_BASE_URL` through the GitHub variable `API_BASE_URL`.
4. Optionally set `NEXT_PUBLIC_PRIVACY_POLICY_URL`.

The public Next.js app is configured with `output: "export"` so the deployment
artifact is `apps/public/out`.

## GitHub repository variables

Set these in GitHub repository settings.

| Variable | Example |
| --- | --- |
| `AWS_REGION` | `ap-northeast-1` |
| `ECR_REPOSITORY` | `juku-api` |
| `API_BASE_URL` | `https://api.example.com` |
| `ADMIN_S3_BUCKET` | `example-admin-site` |
| `ADMIN_CLOUDFRONT_DISTRIBUTION_ID` | `E123...` |
| `PUBLIC_S3_BUCKET` | `example-public-site` |
| `PUBLIC_CLOUDFRONT_DISTRIBUTION_ID` | `E456...` |
| `NEXT_PUBLIC_PRIVACY_POLICY_URL` | `https://example.com/privacy` |

CloudFront distribution IDs are optional. If unset, invalidation is skipped.

## GitHub repository secrets

Set these in GitHub repository settings.

| Secret | Purpose |
| --- | --- |
| `AWS_ROLE_TO_ASSUME` | IAM role ARN for GitHub OIDC |
| `APP_RUNNER_SERVICE_ARN` | Existing App Runner service ARN |
| `SUPABASE_DATABASE_URL` | Supabase pooled connection URL |
| `SUPABASE_DIRECT_URL` | Supabase direct/session connection URL |

The GitHub workflow uses OIDC. Do not store long-lived AWS access keys.

## IAM policy outline

The GitHub OIDC role needs permissions for:

- ECR repository describe/create and image push
- App Runner `StartDeployment`
- S3 sync to the two site buckets
- CloudFront invalidations

Scope resources to the repository, App Runner service, S3 buckets, and
CloudFront distributions used by this project.

## Deployment flow

On every push to `main`:

1. Run CI against a PostgreSQL service container.
2. Apply Prisma migrations to Supabase.
3. Build and push the API Docker image to ECR with both `latest` and commit SHA tags.
4. Start an App Runner deployment.
5. Build and upload admin static assets to S3.
6. Build and upload public static assets to S3.
7. Invalidate CloudFront caches when distribution IDs are configured.

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
