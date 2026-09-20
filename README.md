# Nirvasan

Nirvasan is a civic accountability app for Delhi. Public records will often say a streetlight was repaired or a hydrant is working, and whether that's true on the street is much harder to find out. This project puts the two side by side, ward by ward, and lets residents settle it with photos.

We built it for the AWS track of a student hackathon. The frontend is a React app on Amplify, and the backend is a small serverless API on AWS with DynamoDB, S3, Cognito and Bedrock behind it.

**Live site:** https://main.d1dpb1jw4r1tmw.amplifyapp.com

You can browse everything without an account. Rating a representative, uploading photos and reviewing other people's photos need a login, and you pick your ward when you sign up. The ward is fixed after that, so you can only add evidence for your own area.

## What's in it

- **Map.** Delhi's wards with public assets on them (streetlights, water pumps, hydrants, potholes, dividers, and a few buildings flagged for re-inspection). Clicking an asset shows what was sanctioned, under which scheme, and who is responsible: the elected councillor and the MCD officer.
- **Leaderboard and Ward Compare.** Every ward has a ground-work score and an integrity gap, which is the difference between what the paper records claim and what has been verified on the ground. You can rank wards or put two side by side.
- **Alerts.** Wards with large gaps.
- **Rep Profile.** A ward's representative, a one-time star rating from residents, and a short written summary of the ward.
- **Civic Proof.** The place where residents add photo evidence against an existing asset and confirm each other's photos.
- **Social Watch.** Real news headlines about building collapses and civic hazards, read by an AI model and matched to wards. Residents of that ward can link a report to an asset or dismiss it.
- **Officers and Civic Data.** MCD engineer directory and real candidate data from the 2022 municipal election.

## How verification works

The whole idea rests on not trusting any single person, so a few rules are enforced in the API, not just in the interface:

- Your ward comes from your login token. Nothing in a request can change it.
- You can only add evidence for assets in your own ward, up to 3 photos per asset. Photos must be JPEG, PNG or WebP, at most 5 MB, and S3 enforces that on the upload itself.
- We store how far you were from the asset, never your coordinates. A photo taken more than 50 m away is kept but labelled as location not verified.
- A new photo starts as unverified. A different resident of the same ward has to confirm or dispute it, once. Nobody can review their own photo.
- Only a confirmed photo changes anything. It sets the asset's status (a broken report marks it dead, a fixed report marks it working) and feeds the ward's score. Flagged buildings are the exception: a photo never changes their status.
- The score is 40% ground evidence, 35% paper utilisation and 25% resident rating. Wards with no verified photos keep their seeded numbers, and the live evidence blends in gradually until three assets in a ward have been verified.

One limit we know about: a person with two accounts in the same ward can confirm their own photo. That is acceptable for a demo, but a real deployment would need something stronger than an email address.

## Where the AI is used, and where it isn't

Amazon Nova Lite, through Bedrock, does two jobs.

It writes the short summary on each ward's profile. The model is given a fixed set of numbers and told to describe them, and then a check rejects the text if it contains any number that wasn't in that set. If the check fails, or Bedrock is unavailable, the page shows a plain template instead. Summaries are cached on the ward and only rewritten when the underlying numbers change, so cost follows real activity rather than traffic.

It also reads news headlines for Social Watch and returns a fixed structure: what kind of asset, what kind of problem, which places. Anything outside that structure is thrown away and simple keyword rules take over. Headlines are passed as data, not as instructions.

The model never decides which ward a story belongs to (that is plain name matching), never touches an asset's status or a score, and never writes anything about named people. A resident makes the final call on every news link.

## How it's built

```
Browser
   |
Amplify Hosting (React + Vite)
   |
API Gateway (HTTP API, CORS, throttling)  <-- Cognito (login, JWT authorizer)
   |
Lambda (Python 3.12, one function)
   |-- DynamoDB: wards, assets, evidence, ratings, politicians, officers, signals
   |-- S3: photos, uploaded with short-lived signed POST links
   '-- Bedrock: Nova Lite, ward summaries and headline reading
```

- **Frontend:** React 19, Vite, Leaflet for the map, and `amazon-cognito-identity-js` for login. Almost everything is in `src/App.jsx`.
- **API:** one Lambda routes everything, with a Cognito JWT authorizer in front of the routes that need a login. The IAM policy allows reads on the tables, writes only where they are needed, and a single Bedrock model.
- **Infrastructure:** `backend/template.yaml` is an AWS SAM template covering the API, function, login pool, signals table and permissions. The main tables and the photo bucket were created by hand first, and the template refers to them by name.
- **Region:** everything is in ap-south-1 (Mumbai).

Public routes: `/health`, `/wards`, `/wards/{id}`, `/wards/{id}/narrative`, `/leaderboard`, `/assets`, `/assets/{id}`, `/assets/{id}/evidence`, `/politicians`, `/officers`, `/signals`.
Routes that need a login: `/me`, `/ratings`, `/ratings/mine`, `/evidence/upload-url`, `/evidence`, `/evidence/review`, `/evidence/mine`, `/signals/{id}/review`.

`AWS_SETUP.md` is the original plan we worked from. We changed a few things along the way: an HTTP API instead of a REST API, six tables instead of eight at first, and no X integration. We first planned to pull posts from X, but its API is paid now, so Social Watch reads news headlines from Google News RSS instead.

## About the data

Some of it is real and some of it is made up, and the app says which is which.

Real: ward boundaries from DataMeet, candidate affidavit data from MyNeta (2022 MCD election), the MCD's public lists of empanelled engineers and supervisors, and the news headlines.

Simulated: the fund amounts, asset records, ward scores and the demo wards' representatives. There is no public source that ties individual assets to fund records the way this app needs, so we generated 35 wards and 31 assets to demonstrate the idea. The engineers on the MCD lists aren't tied to wards in the source, so the Officers page marks them as pending ward assignment.

Social Watch currently shows a snapshot of four real headlines stored in DynamoDB. It is not a live feed. A scheduled fetcher is the obvious next step and isn't built yet.

## Running it locally

You need Node 20.19 or newer (Vite 8 requires it), and a CARTO Basemaps key for the map tiles (a short `cb1_...` key from carto.com/basemaps/apikey; the longer keys from the CARTO workspace don't work for raster tiles).

```bash
npm install
cp .env.example .env     # then fill it in
npm run dev              # http://localhost:5173
```

The `.env` file:

```env
VITE_CARTO_API_KEY=your_carto_key
VITE_API_BASE_URL=                 # API URL from `sam deploy`; leave empty for bundled demo data
VITE_COGNITO_USER_POOL_ID=         # from the same deploy; leave empty to keep the demo login form
VITE_COGNITO_CLIENT_ID=
```

With the last three empty the app runs entirely on the demo data in the browser. Ratings, uploads and login then do nothing permanent, which is handy for working on the interface without touching AWS.

Other commands:

```bash
npm run lint
npm run build
npm run preview
```

## Deploying

**Backend.** You need the AWS CLI and SAM CLI, logged in to the right account.

```bash
cd backend
sam build
sam deploy
```

Before the first deploy, create the S3 bucket and the six original DynamoDB tables (named `nirvasan-wards`, `nirvasan-assets`, `nirvasan-evidence`, `nirvasan-ratings`, `nirvasan-politicians`, `nirvasan-officers`), as described in `AWS_SETUP.md`. Set the bucket's CORS rules with:

```bash
aws s3api put-bucket-cors --bucket anv-nirvasan --cors-configuration file://s3-cors.json
```

The allowed browser origins for the API are written directly in `HttpApi.CorsConfiguration` in `template.yaml`. Add your own site's address there if you host it somewhere else. SAM reuses a stack's old parameter values, so changing a parameter's default value won't take effect on a redeploy.

**Seeding data.**

```bash
python scripts/build_seed_data.py                    # regenerates data/seed/*.json
python scripts/seed_dynamodb.py                      # dry run
python scripts/seed_dynamodb.py --only signals --apply
```

`--apply` refuses to run without `--only <tables>` or `--all`, because a full re-seed would reset live ratings, verified counts and asset statuses.

**Frontend.**

```bash
npm run build
python scripts/zip_dist.py
```

Then drag `nirvasan-dist.zip` into the app in the Amplify console. Use the script rather than PowerShell's `Compress-Archive`: that writes backslashes into the file paths, and on Amplify every asset then returns a 404 and the page comes up blank. Amplify doesn't watch the repo, so each change needs a rebuild and re-upload unless you connect GitHub.

## Tests

The backend tests use small hand-written fakes for DynamoDB, S3 and Bedrock, so they need no AWS access:

```bash
python -m unittest discover -s backend/tests
```

The frontend has no test framework. Instead there are small check scripts for the logic that matters, and each prints "ok" lines:

```bash
node scripts/check_api_adapter.mjs
node scripts/check_auth_helpers.mjs
node scripts/check_rating_helpers.mjs
node scripts/check_evidence_helpers.mjs
node scripts/check_signal_helpers.mjs
node scripts/check_route_helpers.mjs
node scripts/check_civic_helpers.mjs
```

## Refreshing the scraped data

These scripts are only needed if you want to rebuild the data files. Use public pages only, respect each site's terms and robots policy, and keep request rates low.

```bash
npm run scrape:officers                       # MCD engineer and supervisor lists -> public/data/officers.json
python -m pip install -r requirements.txt
python scripts/scrape_myneta.py --url https://www.myneta.info/delhi2022/ --year 2022
python scripts/merge_civic_data.py            # candidates + municipal duties -> data/*.json
python scripts/build_signals_seed.py          # refresh the news snapshot (needs internet)
```

The officer scraper doesn't bypass any login or CAPTCHA. Its records are marked "Scraped; pending ward assignment verification".

## Project layout

```
src/App.jsx                 the app: every page and the demo data
src/api.js                  calls to the API
src/auth.js                 Cognito login
src/route.js                page addresses (#/leaderboard, #/civic-proof?asset=...)
src/evidence.js, rating.js, signals.js, civic.js   display rules for each area
src/*.css                   layered stylesheets; polish.css is the last one
backend/template.yaml       SAM template
backend/src/api/app.py      the Lambda
backend/tests/              API tests
data/seed/                  files loaded into DynamoDB
scripts/                    seeding, scraping, zip and check scripts
public/data/                ward boundaries and officer list served with the site
```

## Not done yet

- The scheduled news fetch. Social Watch runs on a fixed snapshot for now.
- Reporting a brand-new asset. The form on that page is a demo and stores nothing. Evidence goes against assets that already exist.
- Stronger identity checks than an email address.
- Real fund records. The numbers are simulated until an open dataset can be tied to individual assets.

## Sources

- [DataMeet Delhi wards](https://github.com/datameet/Municipal_Spatial_Data/tree/master/Delhi)
- [MyNeta, Delhi MCD 2022](https://www.myneta.info/delhi2022/)
- [MCD empanelled engineers](https://eodb.mcd.gov.in/engineer_list) and [supervisors](https://eodb.mcd.gov.in/supervisor_list)
- [MPLAD scheme dataset, data.gov.in](https://www.data.gov.in/catalog/utilisation-mplad-scheme-funds-and-detail-works-inception-scheme)
- Google News RSS, for the headlines
- CARTO Basemaps and OpenStreetMap, for the map tiles
