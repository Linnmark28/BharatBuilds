# Nirvasan AWS Setup: Start to Finish

This is the complete AWS order for the Delhi hackathon demo. Use one AWS Region for everything, preferably `ap-south-1` (Mumbai). The frontend can run locally first; AWS is added behind it in stages.

## 0. Before AWS

Install and verify:

```bash
node --version
npm --version
npm install
npm run build
npm run lint
```

Create an AWS account, enable billing alerts, choose `ap-south-1`, and set a hard budget alert below the remaining hackathon credit. Do not use the root account for daily work.

## 1. IAM access

Create one human admin user for the hackathon and enable MFA on that AWS account. For deployment, create a least-privilege CI/deployment role rather than putting long-lived AWS keys in the frontend.

Never commit AWS access keys, Cognito secrets, X API bearer tokens, or `.env`.

The CARTO key is not an AWS credential. Local development uses:

```env
VITE_CARTO_API_KEY=your_carto_key
```

## 2. S3 buckets

Create one private bucket, for example `nirvasan-delhi-demo-<unique-id>`, with:

- `geojson/Delhi_Wards.geojson`
- `seed/assets.json`
- `reports/`
- `proof/`
- `social/exports/`

Required settings:

- Block public access.
- Enable server-side encryption with S3-managed keys.
- Add CORS for the Amplify domain and local development origin.
- Add a 7-day lifecycle expiration for test photos.
- Upload photos using short-lived pre-signed PUT URLs.
- Return CloudFront or signed GET URLs; do not make the entire bucket public.

The report UI currently displays a demo S3 URL. Production replaces it with the URL returned by the upload Lambda.

## 3. DynamoDB tables

Use `PAY_PER_REQUEST` / on-demand capacity for every table. Do not provision throughput.

Create only these tables:

| Table | Partition key | Purpose |
| --- | --- | --- |
| `Wards` | `ward_id` | DataMeet geometry reference and ward metadata |
| `Assets` | `asset_id` | Streetlights, pumps, hydrants, potholes, dividers |
| `AssetPhotos` | `photo_id` | Broken, repair, and working evidence |
| `Reports` | `report_id` | Citizen and social review leads |
| `Users` | `user_id` | Name, email, phone, pincode, locked ward |
| `Ratings` | `rating_id` | One ward-scoped rating per user and representative |
| `SocialReports` | `post_id` | Optional public X/Twitter review leads |
| `ComputedScores` | `scope_id` | Cached leaderboard and narrative results |

Every `Asset`, `AssetPhotos`, `Reports`, `FundAllocation`, and `Ratings` record must include `source`. Asset records also need `data_source_tag` set to `real` or `seeded`.

## 4. Import real public data

Download and store the provided ward dataset:

- `Delhi_Wards.geojson`: `https://github.com/datameet/Municipal_Spatial_Data/blob/master/Delhi/Delhi_Wards.geojson`
- Assembly boundaries: `https://github.com/datameet/maps`
- MPLAD data: `https://www.data.gov.in/catalog/utilisation-mplad-scheme-funds-and-detail-works-inception-scheme`
- MCD officer disclosures: `https://mcdonline.nic.in/`

Upload GeoJSON to `s3://<bucket>/geojson/Delhi_Wards.geojson`. Import ward metadata into `Wards`. Keep the raw URL, import timestamp, and source row on each record.

Keep the current 23-ward asset registry visibly marked as simulated until a real asset feed exists.

## 5. Cognito, without OTP

For this requested hackathon flow, do not build OTP or MFA.

Create a Cognito User Pool with simple email/password sign-in only if backend authentication is needed. Store phone as profile data, not as an OTP challenge. Collect:

- Full name
- Pincode
- Ward
- Email
- Phone number

The app saves the demo identity after client-side validation. Production should replace that demo action with Cognito email/password authentication and a backend pincode/ward validation step.

## 6. Lambda functions

Create these scale-to-zero functions:

1. `geo-lookup`: point-in-polygon lookup against ward GeoJSON; validate pincode and selected ward.
2. `photo-ingest`: generate pre-signed S3 upload URLs, validate file type/size, validate photo coordinates, and write `AssetPhotos` and `Reports`.
3. `rating-gate`: confirm the user belongs to the target ward and enforce one rating per user per representative.
4. `map-data`: return ward boundaries, assets, status, and source metadata.
5. `social-ingest`: optional X/Twitter API worker; normalize posts into `SocialReports`.
6. `recompute-scores`: cache ground-work scores and integrity gaps.
7. `generate-narrative`: call Bedrock only when underlying asset records change.

## 7. API Gateway routes

Create one REST API with authorization on citizen actions:

```text
GET  /wards
GET  /map/assets
GET  /assets/{asset_id}
GET  /reps/leaderboard
GET  /reps/{rep_id}
GET  /officers
GET  /social-reports
POST /users/profile
POST /reports/upload-url
POST /reports
POST /proof
POST /ratings
```

Public read routes expose only approved traceable data. Protect uploads, ratings, profile writes, and civic proof with Cognito when production auth is enabled.

## 8. EventBridge schedules

Create these schedules:

- Every 5 minutes: recompute leaderboard and integrity-gap cache.
- On asset/report/photo change: invoke `generate-narrative` once.
- Every 15 minutes, only if X API access is approved: invoke `social-ingest`.
- Daily: remove expired test records and temporary S3 objects.

Never call Bedrock on a page load or map pan.

## 9. Bedrock and Strands

Add Bedrock last, after map, reports, uploads, ratings, and cached scores work.

Use one grounded prompt per changed asset. Pass only retrieved records. Require:

```text
Only state facts present in the provided records. If a figure is unknown, say "not available". Never guess, estimate, or round convincingly.
```

Cache the narrative with input record IDs and source links.

## 10. Amplify Hosting

Connect the repository to Amplify Hosting.

```text
Build command: npm run build
Output directory: dist
```

Add this Amplify environment variable:

```text
VITE_CARTO_API_KEY=<CARTO key>
```

Add the Amplify domain to S3 CORS and Cognito allowed origins. Do not put AWS secrets or X API tokens in `VITE_*` variables.

## 11. Optional X/Twitter ingestion

Use only if the X API account and terms permit it. The UI's Social Watch page currently shows simulated, clearly labelled records.

Required AWS pieces:

1. X API developer account and bearer token.
2. AWS Secrets Manager secret for the bearer token.
3. EventBridge schedule every 5-15 minutes.
4. `social-ingest` Lambda.
5. `SocialReports` DynamoDB table.
6. Human review UI before any asset status changes.

Social posts are leads, not verified facts. They must never directly change scores, asset status, or public claims.

## 12. Demo checklist

1. Open Map and select a ward.
2. Zoom from Delhi view to street level.
3. Open a type-specific asset marker.
4. Show representative, officer, contacts, sources, and evidence.
5. Submit a demo report image and inspect its generated URL shape.
6. Open Login / Signup and save a demo identity without OTP.
7. Open Officers and show the ward directory.
8. Open Social Watch and explain the review pipeline.
9. State clearly that asset/officer demo records are simulated where marked.

## 13. Cost and teardown

Use only scale-to-zero or request-based services: DynamoDB on-demand, Lambda, S3, API Gateway, Cognito, EventBridge, Amplify Hosting, and Bedrock only on data changes.

Do not provision RDS, Aurora, EC2, ECS, NAT Gateway, SageMaker, or always-on servers.

Before the demo, check Cost Explorer for provisioned DynamoDB tables, NAT gateways, forgotten EC2/ECS resources, large S3 test uploads, and unexpected Bedrock calls.

After the hackathon, delete the test S3 bucket, DynamoDB tables, Lambdas, API Gateway, EventBridge rules, Cognito pool, and Amplify app if they are no longer needed.
