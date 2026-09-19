Act as a Principal Software Engineer and Data Architect. I am extending my existing civic accountability web platform (which currently tracks resource utilization in Delhi) without disrupting any existing code or breaking current UI components.

Please build an additive data-ingestion pipeline and local database expansion that connects scraped political candidate data with municipal officer duties.

---

### 1. Web Scraper for Candidate & Politician Data (`scripts/scrape_myneta.py`)
Create an independent Python scraping script (using requests + BeautifulSoup4 or Playwright) that runs locally and populates `data/candidates.json`:

- Target Source: MyNeta (myneta.info) election pages (e.g., state elections, Lok Sabha, MCD).
- Extracted Fields per Candidate:
  - id (slug or unique hash)
  - full_name
  - party
  - constituency_or_ward
  - election_year
  - criminal_cases_count
  - education_qualification
  - total_assets_inr
  - total_liabilities_inr
  - affidavit_url
- Robustness Features: Custom User-Agent headers, random request delays (1.5s-3s) to prevent blocking, exponential backoff, and graceful error handling for missing table cells.

---

### 2. Department & Officer Responsibility Matrix (`data/departments_and_officers.json`)
Design a structured, non-breaking local JSON file defining municipal departments, their dedicated officers, and their exact operational duties:

Structure Example:
[
  {
    "department_id": "DEPT_DISCOM_01",
    "department_name": "Power Distribution & Street Lighting (BSES / TPDDL / MCD Electrical)",
    "category": "Street Lights & Infrastructure",
    "officer_roles": [
      {
        "role_id": "OFFICER_EE_ELEC",
        "designation": "Executive Engineer (Electrical)",
        "jurisdiction": "Ward / Sub-Division Level",
        "responsibilities": [
          "Maintenance and repair of street lights and high-mast lights",
          "Transformer safety and pole grounding",
          "Response to dark-spot complaints"
        ],
        "linked_political_oversight": "Local Ward Corporator / MLA"
      }
    ]
  },
  {
    "department_id": "DEPT_WATER_01",
    "department_name": "Delhi Jal Board / Municipal Water Works",
    "category": "Water & Sanitation",
    "officer_roles": [
      {
        "role_id": "OFFICER_JE_WATER",
        "designation": "Junior Engineer (Water Lines & Borewells)",
        "jurisdiction": "Ward Level",
        "responsibilities": [
          "Approval and maintenance of public handpumps/hydra pumps",
          "Pipe leakage detection and supply schedule management",
          "Water contamination testing and tanker dispatch"
        ],
        "linked_political_oversight": "Local Ward Corporator"
      }
    ]
  }
]

Provide complete definitions for 4 core urban sectors:
1. Street Lighting & Power
2. Water Supply & Hydra/Handpumps
3. Road Maintenance & Potholes (PWD/MCD)
4. Waste Management & Sanitation

---

### 3. Non-Disruptive Local Data Aggregator (`scripts/merge_civic_data.py`)
Write a local utility script that reads `candidates.json` and `departments_and_officers.json`, joins them on ward/constituency or category keys, and emits a unified schema into `data/civic_master_data.json` or a local SQLite database (`data/civic_platform.db`).

Unified Output Contract:
{
  "ward_or_constituency": "Ward 42",
  "politician": { ... candidate object ... },
  "responsible_departments": [
    {
      "department_name": "Power Distribution",
      "officer_title": "Executive Engineer (Electrical)",
      "duties": [ ... ]
    }
  ]
}

---

### 4. Integration Instructions:
- Keep all original Delhi platform APIs, mock files, and components completely untouched.
- Create modular getter utilities (e.g., `getCivicDataByWard(wardName)`) so current React/Vue components can optionally consume this expanded dataset without refactoring existing UI components.
-