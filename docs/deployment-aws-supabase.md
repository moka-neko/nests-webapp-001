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
MAIL_HOST=<optional development value>
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=<optional development value>
MAIL_PASSWORD=<optional development value>
MAIL_FROM=友達先生日本語会話教室 Dev <noreply@example.com>
TIMEREX_WEBHOOK_SECRET=<optional development value>
CRON_SECRET=<random secret for the Monday interview reminder>
ADMIN_APP_BASE_URL=https://dev-admin.example.com
OPERATOR_NOTIFICATION_EMAILS=<optional, comma separated; defaults to admin users>
GOOGLE_CLIENT_ID=<optional, see docs/google-meet-setup.md>
GOOGLE_CLIENT_SECRET=<optional, see docs/google-meet-setup.md>
GOOGLE_REFRESH_TOKEN=<optional, see docs/google-meet-setup.md>
GOOGLE_CALENDAR_ID=primary
GOOGLE_SEND_CALENDAR_INVITES=false
INTERVIEW_DURATION_MINUTES=30
```

Store `CRON_SECRET`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_REFRESH_TOKEN` as
App Runner secrets (Secrets Manager / SSM references) rather than plain
environment variables where possible.

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

## Monday interview reminder

The API does not run a weekly job by itself. App Runner can restart or scale,
so an in-process cron is not a reliable scheduler.

The work is exposed as `POST /api/v1/jobs/weekly-interview-reminder`. The
header `x-cron-secret` must match `CRON_SECRET`.

### What the call does

If at least one teacher application with status `PENDING` or `INTERVIEW` has
an interview candidate date in the current Japan week (Monday-Sunday), it
sends the following text to the operations LINE group and by email
(`OPERATOR_NOTIFICATION_EMAILS`, or every admin user's email when unset):

```text
今週の面接日程を日曜日までに編集をお願いいたします。
面接日程調整URL
https://dev-admin.example.com/interviews?week=YYYY-MM-DD
```

The URL opens the admin "面接日程調整" page, where the operator picks the
applicant and moves to that applicant's edit screen. A week with no targets
sends nothing. A second call in the same week does not send again unless
`?force=true`, so retries are safe.

### Trigger on the development AWS account

EventBridge Scheduler cannot target an EventBridge API destination directly,
so the stack in `infra/dev/weekly-interview-reminder.yml` chains:

```text
EventBridge Scheduler  cron(0 9 ? * MON *)  Asia/Tokyo
  -> custom event bus  <prefix>-jobs   (PutEvents)
  -> rule              <prefix>-weekly-interview-reminder
  -> API destination   POST {ApiBaseUrl}/api/v1/jobs/weekly-interview-reminder
                       connection adds  x-cron-secret: <CronSecret>
```

There is no Lambda to deploy. The connection keeps the secret in AWS Secrets
Manager (about USD 0.40/month); Scheduler, the rule and API destination
invocations are negligible at one call per week.

Deploy once from a shell with credentials for the development account
(`CRON_SECRET` must be the same value as on App Runner):

```bash
aws cloudformation deploy \
  --region ap-northeast-1 \
  --stack-name juku-dev-weekly-interview-reminder \
  --template-file infra/dev/weekly-interview-reminder.yml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    ApiBaseUrl=https://dev-api.example.com \
    CronSecret="$CRON_SECRET"
```

Run the same command again after changing the template, the API URL or the
secret. To pause the reminder, add `ScheduleState=DISABLED` to the parameter
overrides.

To check it end to end without waiting for Monday, call the API directly:

```bash
curl -X POST "https://dev-api.example.com/api/v1/jobs/weekly-interview-reminder?force=true" \
  -H "x-cron-secret: $CRON_SECRET"
```

The stack is deployed by hand on purpose: it changes rarely, and deploying it
from GitHub Actions would need CloudFormation and IAM role creation rights on
the OIDC deploy role.

A long-running host such as the production ConoHa VPS can use system cron and
`curl` against the same endpoint instead.
