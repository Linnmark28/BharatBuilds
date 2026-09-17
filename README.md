# Nirvasan

Nirvasan is a Delhi civic accountability demo that reconciles public infrastructure records with citizen-reported ground reality. It maps ward boundaries, public assets, representatives, responsible officers, fund claims, evidence, and review leads in one interface.


## Local Development

### Requirements

- Node.js 20+
- npm 10+
- A CARTO Basemaps API key for the Voyager map tiles

### Install

```bash
npm install
```

Create a local `.env` file in the project root:

```env
VITE_CARTO_API_KEY=your_carto_api_key
```

The `.env` file is ignored by Git. Use `.env.example` as the template.

### Start the development server

```bash
npm run dev
```

Open the URL printed by Vite, normally:

```text
http://localhost:5173/
```

### Verify before sharing

```bash
npm run lint
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Main Demo Routes

- **Map:** Delhi ward layer, ward selection, street-level zoom, type-specific asset markers, accountability drawer
- **Leaderboard:** Ground-work score and fund-versus-reality integrity gap
- **Rep Profile:** Promise-versus-delivery timeline, sources, officers, contacts, and ratings
- **Officers:** Ward-by-ward Executive Engineer and Assistant Engineer directory
- **Social Watch:** Simulated X/Twitter review leads and the AWS ingestion pipeline
- **Report Asset:** Image selection and demo S3 URL shape for a new report
- **Civic Proof:** Evidence timeline against an existing asset
- **Login / Signup:** Demo identity form with name, pincode, ward, email, and phone; no OTP flow

## Data Sources

- [Delhi ward boundaries](https://github.com/datameet/Municipal_Spatial_Data/tree/master/Delhi)
- [Delhi wards GeoJSON](https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Delhi/Delhi_Wards.geojson)
- [Delhi assembly maps](https://github.com/datameet/maps)
- [MPLAD public dataset](https://www.data.gov.in/catalog/utilisation-mplad-scheme-funds-and-detail-works-inception-scheme)
- [MCD public portal](https://mcdonline.nic.in/)
- [X API documentation](https://developer.x.com/en/docs/x-api)

## AWS Handoff

The complete AWS provisioning order, data model, API routes, S3 upload flow, optional X/Twitter ingestion, cost controls, and teardown checklist are in [AWS_SETUP.md](AWS_SETUP.md).

The intended production architecture uses Amplify Hosting, private S3, DynamoDB on-demand, Lambda, API Gateway, EventBridge, Cognito email/password authentication, Secrets Manager for optional X API access, and Bedrock only for cached data-change narratives.

## Project Structure

```text
src/App.jsx                 Main React app and demo data
src/App.css                 Core visual system
src/overrides.css           Map marker and responsive overrides
src/clean-layout.css        Spacious dashboard layout
src/final-ui-overrides.css  Map-first layout, auth, report, and Social Watch styles
src/main.jsx                React entry point and Leaflet CSS import
AWS_SETUP.md                AWS setup and teardown guide
.env.example                Local environment variable template
```
