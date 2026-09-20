import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MapContainer,
  GeoJSON,
  Marker,
  Polygon,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
} from "react-leaflet";
import { divIcon } from "leaflet";
import civicCandidates from "../data/candidates.json";
import civicDepartments from "../data/departments_and_officers.json";
import civicMasterData from "../data/civic_master_data.json";
import {
  fetchEvidence,
  fetchMe,
  fetchMyEvidence,
  fetchMyRating,
  fetchNarrative,
  fetchSignals,
  loadLiveData,
  postRating,
  requestUploadUrl,
  reviewEvidence,
  reviewSignal,
  submitEvidence,
  uploadPhoto,
} from "./api.js";
import {
  REVIEW_NOTICE,
  getPosition,
  locationLabel,
  proofPanelState,
  reviewState,
  scoreSourceLabel,
  uploadProof,
} from "./evidence.js";
import { ratingAggregate, ratingPanelState } from "./rating.js";
import { cleanEducation, formatInr, groupDuties, splitWinner, wardParts } from "./civic.js";
import { buildLocation, parseLocation } from "./route.js";
import { assetTypeLabel, claimLabel, formatPublished, reviewAccess, safeUrl } from "./signals.js";
import {
  authEnabled,
  confirmSignUp,
  friendlyError,
  getIdToken,
  resendCode,
  restoreSession,
  signIn,
  signOut,
  signUp,
  toE164,
} from "./auth.js";
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  Database,
  Building2,
  FileText,
  Filter,
  Gauge,
  ImagePlus,
  Info,
  Landmark,
  MapPin,
  Menu,
  MessageSquare,
  Search,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Upload,
  Users,
  X,
} from "lucide-react";
import "./App.css";
import "./overrides.css";
import "./clean-layout.css";
import "./final-ui-overrides.css";
import "./polish.css";

const sources = {
  wards: "https://github.com/datameet/Municipal_Spatial_Data/tree/master/Delhi",
  wardsGeoJson:
    "https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Delhi/Delhi_Wards.geojson",
  assembly: "https://github.com/datameet/maps",
  mplad:
    "https://www.data.gov.in/catalog/utilisation-mplad-scheme-funds-and-detail-works-inception-scheme",
  officers: "https://mcdonline.nic.in/",
};

const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY || "YOUR_KEY";
const cartoTileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${cartoApiKey}`;

const wards = [
  {
    id: "W-042",
    name: "Lajpat Nagar",
    zone: "South",
    rep: "Ravi Kumar",
    party: "AAP",
    officer: "V. K. Sharma",
    color: "#1976d2",
    funds: 12800000,
    utilized: 11780000,
    gap: 52,
    score: 38,
  },
  {
    id: "W-043",
    name: "Greater Kailash",
    zone: "South",
    rep: "Meera Singh",
    party: "BJP",
    officer: "P. N. Gupta",
    color: "#1976d2",
    funds: 9400000,
    utilized: 8742000,
    gap: 34,
    score: 56,
  },
  {
    id: "W-044",
    name: "Kalkaji",
    zone: "South",
    rep: "Imran Khan",
    party: "AAP",
    officer: "S. R. Mehta",
    color: "#ff8a22",
    funds: 11600000,
    utilized: 9860000,
    gap: 41,
    score: 47,
  },
  {
    id: "W-045",
    name: "Saket",
    zone: "South",
    rep: "Neha Rawat",
    party: "INC",
    officer: "A. K. Tyagi",
    color: "#ff8a22",
    funds: 8800000,
    utilized: 7920000,
    gap: 27,
    score: 64,
  },
  {
    id: "W-046",
    name: "Malviya Nagar",
    zone: "South",
    rep: "Arjun Bedi",
    party: "BJP",
    officer: "R. P. Singh",
    color: "#1976d2",
    funds: 10200000,
    utilized: 9180000,
    gap: 36,
    score: 54,
  },
  {
    id: "W-047",
    name: "R K Puram",
    zone: "South",
    rep: "Sana Qureshi",
    party: "AAP",
    officer: "M. K. Yadav",
    color: "#1976d2",
    funds: 7600000,
    utilized: 6080000,
    gap: 44,
    score: 45,
  },
  {
    id: "W-048",
    name: "Hauz Khas",
    zone: "South",
    rep: "Kabir Sethi",
    party: "INC",
    officer: "N. D. Sharma",
    color: "#ff8a22",
    funds: 11400000,
    utilized: 10260000,
    gap: 31,
    score: 61,
  },
  {
    id: "W-049",
    name: "Munirka",
    zone: "South",
    rep: "Priya Menon",
    party: "AAP",
    officer: "S. K. Rawat",
    color: "#1976d2",
    funds: 6900000,
    utilized: 5175000,
    gap: 48,
    score: 42,
  },
  {
    id: "W-050",
    name: "Vasant Kunj",
    zone: "South",
    rep: "Dev Malik",
    party: "BJP",
    officer: "K. L. Verma",
    color: "#ff8a22",
    funds: 13200000,
    utilized: 11880000,
    gap: 29,
    score: 67,
  },
  {
    id: "W-051",
    name: "Chittaranjan Park",
    zone: "South",
    rep: "Farah Ali",
    party: "AAP",
    officer: "J. P. Saini",
    color: "#1976d2",
    funds: 8100000,
    utilized: 6885000,
    gap: 39,
    score: 51,
  },
  {
    id: "W-052",
    name: "Connaught Place",
    zone: "Central",
    rep: "Vikram Batra",
    party: "BJP",
    officer: "D. K. Arora",
    color: "#ff8a22",
    funds: 14600000,
    utilized: 13870000,
    gap: 22,
    score: 72,
  },
  {
    id: "W-053",
    name: "Karol Bagh",
    zone: "Central",
    rep: "Nidhi Kapoor",
    party: "AAP",
    officer: "A. S. Malik",
    color: "#1976d2",
    funds: 12100000,
    utilized: 9680000,
    gap: 46,
    score: 43,
  },
  {
    id: "W-054",
    name: "Civil Lines",
    zone: "North",
    rep: "Harsh Vardhan",
    party: "BJP",
    officer: "P. K. Joshi",
    color: "#ff8a22",
    funds: 10800000,
    utilized: 9720000,
    gap: 28,
    score: 63,
  },
  {
    id: "W-055",
    name: "Model Town",
    zone: "North",
    rep: "Aisha Khan",
    party: "AAP",
    officer: "R. K. Bansal",
    color: "#1976d2",
    funds: 9700000,
    utilized: 7275000,
    gap: 49,
    score: 41,
  },
  {
    id: "W-056",
    name: "Rohini",
    zone: "North West",
    rep: "Manoj Dutt",
    party: "BJP",
    officer: "S. P. Gautam",
    color: "#ff8a22",
    funds: 13400000,
    utilized: 12060000,
    gap: 25,
    score: 70,
  },
  {
    id: "W-057",
    name: "Pitampura",
    zone: "North West",
    rep: "Tara Sood",
    party: "INC",
    officer: "M. L. Yadav",
    color: "#1976d2",
    funds: 10300000,
    utilized: 8240000,
    gap: 37,
    score: 52,
  },
  {
    id: "W-058",
    name: "Janakpuri",
    zone: "West",
    rep: "Rohan Mehta",
    party: "AAP",
    officer: "G. S. Rana",
    color: "#1976d2",
    funds: 11700000,
    utilized: 9945000,
    gap: 32,
    score: 58,
  },
  {
    id: "W-059",
    name: "Dwarka",
    zone: "South West",
    rep: "Ananya Roy",
    party: "BJP",
    officer: "C. P. Singh",
    color: "#ff8a22",
    funds: 15200000,
    utilized: 13680000,
    gap: 24,
    score: 74,
  },
  {
    id: "W-060",
    name: "Najafgarh",
    zone: "South West",
    rep: "Ishaan Grover",
    party: "INC",
    officer: "N. K. Tomar",
    color: "#1976d2",
    funds: 8300000,
    utilized: 5810000,
    gap: 55,
    score: 35,
  },
  {
    id: "W-061",
    name: "Shahdara",
    zone: "East",
    rep: "Poonam Yadav",
    party: "AAP",
    officer: "V. S. Chauhan",
    color: "#1976d2",
    funds: 9900000,
    utilized: 8415000,
    gap: 40,
    score: 49,
  },
  {
    id: "W-062",
    name: "Laxmi Nagar",
    zone: "East",
    rep: "Adil Hussain",
    party: "BJP",
    officer: "K. R. Tiwari",
    color: "#ff8a22",
    funds: 11200000,
    utilized: 10080000,
    gap: 30,
    score: 60,
  },
  {
    id: "W-063",
    name: "Mayur Vihar",
    zone: "East",
    rep: "Ritu Sharma",
    party: "AAP",
    officer: "B. P. Singh",
    color: "#1976d2",
    funds: 12600000,
    utilized: 9450000,
    gap: 43,
    score: 46,
  },
  {
    id: "W-064",
    name: "Okhla",
    zone: "South East",
    rep: "Sameer Rizvi",
    party: "AAP",
    officer: "F. A. Khan",
    color: "#ff8a22",
    funds: 10100000,
    utilized: 8585000,
    gap: 35,
    score: 53,
  },
  {
    id: "W-065",
    name: "Patel Nagar",
    zone: "Central",
    rep: "Kavita Saini",
    party: "BJP",
    officer: "S. N. Bhatia",
    assistantOfficer: "R. K. Verma",
    color: "#1976d2",
    funds: 10800000,
    utilized: 8640000,
    gap: 44,
    score: 48,
  },
  {
    id: "W-066",
    name: "Rajinder Nagar",
    zone: "Central",
    rep: "Aman Kapoor",
    party: "AAP",
    officer: "P. S. Dahiya",
    assistantOfficer: "M. K. Arora",
    color: "#ff8a22",
    funds: 9200000,
    utilized: 7912000,
    gap: 33,
    score: 57,
  },
  {
    id: "W-067",
    name: "Vikaspuri",
    zone: "West",
    rep: "Shalini Bhasin",
    party: "INC",
    officer: "A. K. Walia",
    assistantOfficer: "D. P. Saini",
    color: "#1976d2",
    funds: 11900000,
    utilized: 8925000,
    gap: 47,
    score: 44,
  },
  {
    id: "W-068",
    name: "Tilak Nagar",
    zone: "West",
    rep: "Mukul Arora",
    party: "AAP",
    officer: "R. S. Bedi",
    assistantOfficer: "N. K. Sood",
    color: "#ff8a22",
    funds: 8700000,
    utilized: 7395000,
    gap: 38,
    score: 50,
  },
  {
    id: "W-069",
    name: "Shalimar Bagh",
    zone: "North West",
    rep: "Deepa Chawla",
    party: "BJP",
    officer: "V. P. Narang",
    assistantOfficer: "S. K. Bansal",
    color: "#1976d2",
    funds: 13100000,
    utilized: 11790000,
    gap: 26,
    score: 68,
  },
  {
    id: "W-070",
    name: "Wazirpur",
    zone: "North West",
    rep: "Naveen Ahuja",
    party: "AAP",
    officer: "H. R. Meena",
    assistantOfficer: "A. S. Khatri",
    color: "#1976d2",
    funds: 9800000,
    utilized: 7350000,
    gap: 51,
    score: 40,
  },
  {
    id: "W-071",
    name: "Burari",
    zone: "North",
    rep: "Suman Malik",
    party: "INC",
    officer: "J. P. Yadav",
    assistantOfficer: "K. C. Rawat",
    color: "#ff8a22",
    funds: 7600000,
    utilized: 5320000,
    gap: 58,
    score: 34,
  },
  {
    id: "W-072",
    name: "Mustafabad",
    zone: "North East",
    rep: "Faizan Ahmed",
    party: "AAP",
    officer: "T. L. Sharma",
    assistantOfficer: "I. M. Khan",
    color: "#1976d2",
    funds: 8400000,
    utilized: 6720000,
    gap: 53,
    score: 37,
  },
  {
    id: "W-073",
    name: "Preet Vihar",
    zone: "East",
    rep: "Radhika Jain",
    party: "BJP",
    officer: "N. S. Batra",
    assistantOfficer: "V. K. Sethi",
    color: "#ff8a22",
    funds: 11500000,
    utilized: 10350000,
    gap: 29,
    score: 65,
  },
  {
    id: "W-074",
    name: "Trilokpuri",
    zone: "East",
    rep: "Yusuf Ansari",
    party: "AAP",
    officer: "M. P. Mishra",
    assistantOfficer: "R. D. Gautam",
    color: "#1976d2",
    funds: 7900000,
    utilized: 5530000,
    gap: 57,
    score: 36,
  },
  {
    id: "W-075",
    name: "Jangpura",
    zone: "South East",
    rep: "Nitin Khanna",
    party: "INC",
    officer: "A. R. Kapoor",
    assistantOfficer: "P. M. Singh",
    color: "#ff8a22",
    funds: 10100000,
    utilized: 8585000,
    gap: 35,
    score: 55,
  },
  {
    id: "W-076",
    name: "Tughlakabad",
    zone: "South East",
    rep: "Shweta Rao",
    party: "BJP",
    officer: "G. D. Rana",
    assistantOfficer: "B. L. Yadav",
    color: "#1976d2",
    funds: 8900000,
    utilized: 6675000,
    gap: 50,
    score: 39,
  },
];

const assets = [
  {
    id: "AST-0421",
    type: "Streetlight",
    label: "Broken streetlight · Ring Road service lane",
    ward: "W-042",
    lat: 28.565,
    lng: 77.242,
    status: "dead",
    photos: 3,
    amount: 185000,
    expected: "30 Jun 2024",
    scheme: "MPLAD",
    confidence: "High",
    narrative:
      "Three citizen photos submitted in the last 30 days show this streetlight non-functional. The associated MPLAD work was sanctioned for ₹1.85L and is marked utilized in the public record. Current ground status is dead.",
    source:
      "MPLAD dataset, row 1842 · citizen reports #R-991, #R-1002, #R-1010",
    wardName: "Lajpat Nagar",
  },
  {
    id: "AST-0422",
    type: "Water pump",
    label: "Community pump · Amar Colony park",
    ward: "W-042",
    lat: 28.559,
    lng: 77.245,
    status: "working",
    photos: 2,
    amount: 420000,
    expected: "31 May 2024",
    scheme: "MLALAD",
    confidence: "Verified",
    narrative:
      "Two independent proof-of-working photos confirm the pump was operational this month. The expected completion date was 31 May 2024 and the work is present in the ward record.",
    source: "Delhi MLALAD disclosure, row 77 · civic proof #P-204, #P-219",
    wardName: "Lajpat Nagar",
  },
  {
    id: "AST-0431",
    type: "Hydrant",
    label: "Dry hydrant · GK II market",
    ward: "W-043",
    lat: 28.548,
    lng: 77.238,
    status: "unverified",
    photos: 1,
    amount: 276000,
    expected: "30 Nov 2024",
    scheme: "MPLAD",
    confidence: "Low",
    narrative:
      "One report is attached to this hydrant, but no second independent confirmation is available. Ground status remains unverified. The public work record lists ₹2.76L allocated.",
    source: "MPLAD dataset, row 2094 · citizen report #R-876",
    wardName: "Greater Kailash",
  },
  {
    id: "AST-0432",
    type: "Streetlight",
    label: "LED pole · Archana complex",
    ward: "W-043",
    lat: 28.538,
    lng: 77.244,
    status: "working",
    photos: 4,
    amount: 190000,
    expected: "31 May 2024",
    scheme: "MPLAD",
    confidence: "Verified",
    narrative:
      "Four photo records, including a recent independent proof, show the streetlight working. This work was completed ahead of its expected completion date.",
    source: "MPLAD dataset, row 1910 · civic proof #P-288",
    wardName: "Greater Kailash",
  },
  {
    id: "AST-0441",
    type: "Streetlight",
    label: "Dark crossing · Nehru Place",
    ward: "W-044",
    lat: 28.548,
    lng: 77.255,
    status: "dead",
    photos: 2,
    amount: 340000,
    expected: "31 Jul 2024",
    scheme: "MPLAD",
    confidence: "High",
    narrative:
      "Two geo-tagged broken-state reports from separate users show the crossing remains dark after its expected completion date. The work record reports ₹3.4L utilized.",
    source: "MPLAD dataset, row 2018 · citizen reports #R-933, #R-1008",
    wardName: "Kalkaji",
  },
  {
    id: "AST-0442",
    type: "Water pump",
    label: "Park pump · Govindpuri",
    ward: "W-044",
    lat: 28.533,
    lng: 77.261,
    status: "working",
    photos: 3,
    amount: 515000,
    expected: "31 Mar 2024",
    scheme: "MLALAD",
    confidence: "Verified",
    narrative:
      "Three photo records confirm the pump operating. The public work was completed before the expected completion date.",
    source: "Delhi MLALAD disclosure, row 84 · civic proof #P-142, #P-179",
    wardName: "Kalkaji",
  },
  {
    id: "AST-0451",
    type: "Hydrant",
    label: "Missing hydrant · Saket District Centre",
    ward: "W-045",
    lat: 28.524,
    lng: 77.211,
    status: "dead",
    photos: 2,
    amount: 290000,
    expected: "30 Sep 2024",
    scheme: "MPLAD",
    confidence: "High",
    narrative:
      "Two citizen reports document a missing hydrant at the sanctioned location. No proof-of-working photo exists. The underlying record lists ₹2.9L allocated.",
    source: "MPLAD dataset, row 2177 · citizen reports #R-944, #R-1009",
    wardName: "Saket",
  },
  {
    id: "AST-0452",
    type: "Streetlight",
    label: "Footpath pole · Press Enclave",
    ward: "W-045",
    lat: 28.515,
    lng: 77.219,
    status: "working",
    photos: 1,
    amount: 160000,
    expected: "30 Apr 2024",
    scheme: "MPLAD",
    confidence: "Verified",
    narrative:
      "The latest proof photo confirms the streetlight is working. A single photo is available, so the verification confidence is medium.",
    source: "MPLAD dataset, row 1988 · civic proof #P-301",
    wardName: "Saket",
  },
  {
    id: "AST-0423",
    type: "Streetlight",
    label: "Dark lane · Defence Colony",
    ward: "W-042",
    lat: 28.571,
    lng: 77.232,
    status: "dead",
    photos: 2,
    amount: 210000,
    expected: "30 Oct 2024",
    scheme: "MPLAD",
    confidence: "High",
    narrative:
      "Two independent reports show this streetlight is non-functional. The record is past its expected completion date and no repair proof has been submitted.",
    source: "MPLAD dataset, row 2214 · citizen reports #R-1004, #R-1011",
    wardName: "Lajpat Nagar",
  },
  {
    id: "AST-0461",
    type: "Pothole",
    label: "Road crater · Aurobindo Marg",
    ward: "W-046",
    lat: 28.535,
    lng: 77.204,
    status: "dead",
    photos: 4,
    amount: 310000,
    expected: "15 Aug 2024",
    scheme: "MPLAD",
    confidence: "High",
    narrative:
      "Four citizen reports document a pothole at the sanctioned road repair location. No repair proof is attached and the expected completion date has passed.",
    source: "MPLAD dataset, row 2251 · citizen reports #R-1110, #R-1112",
    wardName: "Malviya Nagar",
  },
  {
    id: "AST-0462",
    type: "Divider",
    label: "Damaged divider · Africa Avenue",
    ward: "W-046",
    lat: 28.548,
    lng: 77.198,
    status: "in-progress",
    photos: 2,
    amount: 780000,
    expected: "31 Dec 2024",
    scheme: "MPLAD",
    confidence: "Medium",
    narrative:
      "The divider repair is marked in progress in the public work record. Two photos show material staged at the location; current completion is not yet verified.",
    source: "MPLAD dataset, row 2304 · citizen reports #R-1118, #R-1121",
    wardName: "Malviya Nagar",
  },
  {
    id: "AST-0471",
    type: "Water pump",
    label: "Dry pump · Sector 5 park",
    ward: "W-047",
    lat: 28.565,
    lng: 77.179,
    status: "unverified",
    photos: 1,
    amount: 450000,
    expected: "30 Nov 2024",
    scheme: "MLALAD",
    confidence: "Low",
    narrative:
      "One report says the pump is dry, but there is no independent confirmation. Ground status remains unverified.",
    source: "Delhi MLALAD disclosure, row 101 · citizen report #R-1130",
    wardName: "R K Puram",
  },
  {
    id: "AST-0481",
    type: "Streetlight",
    label: "Lighting upgrade · Hauz Khas village",
    ward: "W-048",
    lat: 28.548,
    lng: 77.191,
    status: "working",
    photos: 3,
    amount: 245000,
    expected: "30 Apr 2024",
    scheme: "MPLAD",
    confidence: "Verified",
    narrative:
      "Three independent photos confirm the upgraded streetlights are working.",
    source: "MPLAD dataset, row 2041 · civic proof #P-411",
    wardName: "Hauz Khas",
  },
  {
    id: "AST-0491",
    type: "Pothole",
    label: "Broken surface · Munirka main road",
    ward: "W-049",
    lat: 28.556,
    lng: 77.171,
    status: "in-progress",
    photos: 2,
    amount: 550000,
    expected: "31 Jan 2025",
    scheme: "MPLAD",
    confidence: "Medium",
    narrative:
      "Road resurfacing is marked in progress. Two photos show work barriers at the location; final delivery is not yet verified.",
    source: "MPLAD dataset, row 2320 · citizen reports #R-1151, #R-1153",
    wardName: "Munirka",
  },
  {
    id: "AST-0501",
    type: "Divider",
    label: "Median planting · Vasant Kunj Road",
    ward: "W-050",
    lat: 28.526,
    lng: 77.154,
    status: "working",
    photos: 3,
    amount: 620000,
    expected: "30 Sep 2024",
    scheme: "MPLAD",
    confidence: "Verified",
    narrative:
      "Three proof photos show the divider work completed and visible at the sanctioned location.",
    source: "MPLAD dataset, row 2066 · civic proof #P-422",
    wardName: "Vasant Kunj",
  },
  {
    id: "AST-0511",
    type: "Streetlight",
    label: "Dark corner · CR Park market",
    ward: "W-051",
    lat: 28.537,
    lng: 77.249,
    status: "dead",
    photos: 3,
    amount: 175000,
    expected: "31 Jul 2024",
    scheme: "MPLAD",
    confidence: "High",
    narrative:
      "Three reports show the market corner remains dark after its expected completion date.",
    source: "MPLAD dataset, row 2282 · citizen reports #R-1180, #R-1182",
    wardName: "Chittaranjan Park",
  },
  {
    id: "AST-0521", type: "Streetlight", label: "Dark arcade · Connaught Place", ward: "W-052", lat: 28.631, lng: 77.219, status: "working", photos: 3, amount: 225000, expected: "30 Jun 2024", scheme: "MPLAD", confidence: "Verified", narrative: "Three civic proof photos confirm the arcade streetlight working.", source: "MPLAD dataset, row 2071 · civic proof #P-503", wardName: "Connaught Place",
  },
  {
    id: "AST-0531", type: "Pothole", label: "Road crater · Pusa Road", ward: "W-053", lat: 28.652, lng: 77.189, status: "dead", photos: 3, amount: 390000, expected: "31 Aug 2024", scheme: "MPLAD", confidence: "High", narrative: "Three reports document a road crater after the expected repair date.", source: "MPLAD dataset, row 2380 · citizen reports #R-1210, #R-1212", wardName: "Karol Bagh",
  },
  {
    id: "AST-0541", type: "Divider", label: "Median barrier · Civil Lines crossing", ward: "W-054", lat: 28.681, lng: 77.225, status: "in-progress", photos: 2, amount: 680000, expected: "31 Jan 2025", scheme: "MPLAD", confidence: "Medium", narrative: "Two photos show active divider work; final completion is not verified.", source: "MPLAD dataset, row 2391 · citizen reports #R-1220, #R-1224", wardName: "Civil Lines",
  },
  {
    id: "AST-0561", type: "Water pump", label: "Park pump · Rohini Sector 9", ward: "W-056", lat: 28.704, lng: 77.101, status: "working", photos: 4, amount: 480000, expected: "30 May 2024", scheme: "MLALAD", confidence: "Verified", narrative: "Four independent photos confirm the public park pump operating.", source: "Delhi MLALAD disclosure, row 132 · civic proof #P-519", wardName: "Rohini",
  },
  {
    id: "AST-0581", type: "Hydrant", label: "Dry hydrant · Janakpuri block 4", ward: "W-058", lat: 28.622, lng: 77.081, status: "unverified", photos: 1, amount: 265000, expected: "30 Nov 2024", scheme: "MPLAD", confidence: "Low", narrative: "One citizen report is attached; no independent confirmation is available.", source: "MPLAD dataset, row 2410 · citizen report #R-1240", wardName: "Janakpuri",
  },
  {
    id: "AST-0591", type: "Streetlight", label: "Footpath lighting · Dwarka Sector 10", ward: "W-059", lat: 28.592, lng: 77.057, status: "working", photos: 3, amount: 310000, expected: "30 Apr 2024", scheme: "MPLAD", confidence: "Verified", narrative: "Three proof photos confirm the footpath lighting upgrade working.", source: "MPLAD dataset, row 2119 · civic proof #P-531", wardName: "Dwarka",
  },
  {
    id: "AST-0611", type: "Pothole", label: "Broken surface · Shahdara flyover", ward: "W-061", lat: 28.669, lng: 77.288, status: "in-progress", photos: 2, amount: 440000, expected: "31 Dec 2024", scheme: "MPLAD", confidence: "Medium", narrative: "Resurfacing is marked in progress and two worksite photos are attached.", source: "MPLAD dataset, row 2432 · citizen reports #R-1251, #R-1254", wardName: "Shahdara",
  },
  {
    id: "AST-0621", type: "Divider", label: "Damaged median · Laxmi Nagar", ward: "W-062", lat: 28.631, lng: 77.278, status: "dead", photos: 3, amount: 510000, expected: "31 Jul 2024", scheme: "MPLAD", confidence: "High", narrative: "Three reports document a damaged median after the expected completion date.", source: "MPLAD dataset, row 2441 · citizen reports #R-1261, #R-1263", wardName: "Laxmi Nagar",
  },
  {
    id: "AST-0641", type: "Water pump", label: "Community pump · Okhla park", ward: "W-064", lat: 28.535, lng: 77.273, status: "working", photos: 3, amount: 395000, expected: "30 Jun 2024", scheme: "MLALAD", confidence: "Verified", narrative: "Three proof photos confirm the community pump operating.", source: "Delhi MLALAD disclosure, row 145 · civic proof #P-544", wardName: "Okhla",
  },
  {
    id: "AST-0424",
    type: "Structure",
    label: "Ageing residential block · Ring Road service lane",
    ward: "W-042",
    lat: 28.568,
    lng: 77.238,
    status: "critical",
    photos: 3,
    amount: 0,
    expected: "Re-inspection overdue",
    scheme: "MCD structural audit",
    confidence: "High",
    lastInspection: "12 May 2024",
    reinspectionDue: "15 Jul 2025",
    narrative:
      "This structure was marked for re-inspection 14 months ago; no maintenance record exists since, and 3 citizen photos in the last 60 days show visible structural cracks. No repair or clearance record has been filed.",
    source: "MCD structural audit register, row 118 · citizen reports #R-1301, #R-1305, #R-1309",
    wardName: "Lajpat Nagar",
  },
  {
    id: "AST-0564",
    type: "Structure",
    label: "Under-construction block flagged for review · Sector 9",
    ward: "W-056",
    lat: 28.708,
    lng: 77.097,
    status: "critical",
    photos: 2,
    amount: 0,
    expected: "Re-inspection overdue",
    scheme: "MCD structural audit",
    confidence: "Medium",
    lastInspection: "03 Nov 2024",
    reinspectionDue: "10 Jan 2026",
    narrative:
      "Construction continued past the last recorded inspection date. Two recent citizen photos show exposed rebar and no visible safety barricading. No follow-up inspection has been logged since.",
    source: "MCD structural audit register, row 204 · citizen reports #R-1402, #R-1408",
    wardName: "Rohini",
  },
  {
    id: "AST-0453",
    type: "Structure",
    label: "Multi-storey block under reinforcement · Saket District Centre",
    ward: "W-045",
    lat: 28.522,
    lng: 77.214,
    status: "in-progress",
    photos: 4,
    amount: 0,
    expected: "Reinforcement in progress",
    scheme: "MCD structural audit",
    confidence: "Medium",
    lastInspection: "22 Aug 2026",
    reinspectionDue: "22 Feb 2027",
    narrative:
      "Following a citizen-flagged crack report, an inspection was logged and reinforcement work is visibly underway in the latest photos. A follow-up inspection is scheduled; ground status is not yet cleared.",
    source: "MCD structural audit register, row 231 · civic proof #P-611, #P-614",
    wardName: "Saket",
  },
  {
    id: "AST-0701",
    type: "Streetlight",
    label: "Dark crossing · Vasant Vihar",
    ward: "W-050",
    lat: 28.556,
    lng: 77.161,
    status: "dead",
    photos: 2,
    amount: 150000,
    expected: "30 Nov 2024",
    scheme: "MPLAD",
    confidence: "Medium",
    narrative: "Two citizens reported this crossing as completely dark.",
    source: "MPLAD dataset, row 2088 · citizen reports",
    wardName: "Vasant Vihar",
  },
  {
    id: "AST-0702",
    type: "Pothole",
    label: "Deep crater · NH-8 service road",
    ward: "W-047",
    lat: 28.544,
    lng: 77.143,
    status: "critical",
    photos: 5,
    amount: 450000,
    expected: "15 Oct 2024",
    scheme: "MLALAD",
    confidence: "High",
    narrative: "Critical road damage reported by multiple daily commuters.",
    source: "MLALAD disclosure · multiple reports",
    wardName: "R K Puram",
  },
  {
    id: "AST-0703",
    type: "Water pump",
    label: "Community pump · Green Park",
    ward: "W-048",
    lat: 28.558,
    lng: 77.203,
    status: "working",
    photos: 1,
    amount: 250000,
    expected: "01 Jan 2025",
    scheme: "MPLAD",
    confidence: "Low",
    narrative: "Newly installed pump, pending more citizen validation.",
    source: "MPLAD dataset",
    wardName: "Hauz Khas",
  },
];

const wardPolygon = [
  [28.88, 76.84],
  [28.88, 77.35],
  [28.72, 77.38],
  [28.47, 77.34],
  [28.38, 77.14],
  [28.43, 76.96],
  [28.62, 76.84],
];
const formatMoney = (amount) => `₹${(amount / 100000).toFixed(1)}L`;
const syncTimestamp = new Date();
const formattedSyncDate = syncTimestamp.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const formattedSyncTime = syncTimestamp.toLocaleTimeString("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kolkata",
});
const statusMeta = {
  dead: { label: "Dead / missing", color: "#ff8a22" },
  working: { label: "Verified working", color: "#1976d2" },
  unverified: { label: "Unverified", color: "#ff8a22" },
  "in-progress": { label: "Work in progress", color: "#fff" },
  critical: { label: "Flagged · overdue re-inspection", color: "#ff8a22" },
};
const wardContacts = (ward) => ({
  representative: `@${ward.rep.toLowerCase().replace(/\s+/g, "_")}_mcd`,
  representativePhone: "+91 11 2345 0" + ward.id.slice(-2),
  officerEmail: `${ward.officer.toLowerCase().replace(/[^a-z]/g, ".")}@mcd.delhi.gov.in`,
  officerPhone: "+91 11 2654 0" + ward.id.slice(-2),
});
const officerMeta = (ward) => ({
  source: ward.id >= "W-065" ? "MCD directory queue" : "MCD public portal",
  confidence: ward.id >= "W-065" ? "Pending verification" : "Verified",
  updated: ward.id >= "W-065" ? "19 Sep 2026" : "18 Sep 2026",
});
const downloadCsv = (filename, rows) => {
  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
const markerSymbols = {
  Streetlight: "✦",
  "Water pump": "♒",
  Hydrant: "◉",
  Pothole: "!",
  Divider: "▥",
  Structure: "⌂",
};
const markerIcon = (asset, selected) =>
  divIcon({
    className: `asset-marker asset-marker-${asset.status}${selected ? " selected" : ""}`,
    html: `<span>${markerSymbols[asset.type] || "•"}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    tooltipAnchor: [0, -17],
  });

const wardPalette = ["#1976d2", "#ff8a22", "#4aa3df", "#f6b35f"];
const wardAssets = (wardId) => assets.filter((asset) => asset.ward === wardId);

// DataMeet's real ward names (Ward_Name) don't always match our monitored
// locality names 1:1 — this maps ours to theirs where a real boundary exists.
// Wards left unmapped (e.g. Saket, Dwarka, Connaught Place — NDMC/unlisted
// areas in this dataset) fall back to the synthetic shape below.
const realWardNameAliases = {
  "Lajpat Nagar": "LAJPAT NAGAR",
  "Greater Kailash": "GREATER KAILASH-I",
  Kalkaji: "KALKAJI",
  "Malviya Nagar": "MALVIYA NAGAR",
  "R K Puram": "R. K. PURAM",
  "Hauz Khas": "HAUZ KHAS",
  Munirka: "MUNIRKA",
  "Vasant Kunj": "VASANTKUNJ",
  "Chittaranjan Park": "CHITRANJAN PARK",
  "Karol Bagh": "KAROL BAGH",
  "Model Town": "MODEL TOWN",
  Rohini: "ROHINI",
  Pitampura: "PITAMPURA SOUTH",
  Janakpuri: "JANAK PURI WEST",
  Najafgarh: "NAJAFGARH",
  Shahdara: "SHAHDARA",
  "Laxmi Nagar": "LAXMI NAGAR",
  "Mayur Vihar": "MAYUR VIHAR PHASE-I",
  Okhla: "OKHLA",
  "Patel Nagar": "EAST PATEL NAGAR",
  "Rajinder Nagar": "RAJENDER NAGAR",
  Vikaspuri: "VIKAS PURI",
  "Tilak Nagar": "TILAK NAGAR",
  "Shalimar Bagh": "SHALIMAR BAGH NORTH",
  Burari: "BURARI",
  Mustafabad: "MUSTAFABAD",
  "Preet Vihar": "PREET VIHAR",
  Trilokpuri: "TRILOK PURI",
  Tughlakabad: "TUGHLAKABAD",
};

const wardShape = (wardId, index, realShapes = {}) => {
  const ward = wards.find((item) => item.id === wardId);
  if (ward && realShapes[ward.name]) return realShapes[ward.name];
  const items = wardAssets(wardId);
  const fallback = [28.62 + (index % 5) * 0.035, 77.02 + (index % 6) * 0.055];
  const center = items.length
    ? [
        items.reduce((sum, asset) => sum + asset.lat, 0) / items.length,
        items.reduce((sum, asset) => sum + asset.lng, 0) / items.length,
      ]
    : fallback;
  const latPad = items.length > 1 ? 0.018 : 0.014;
  const lngPad = items.length > 1 ? 0.022 : 0.018;
  return [
    [center[0] + latPad, center[1] - lngPad],
    [center[0] + latPad, center[1] + lngPad],
    [center[0] - latPad, center[1] + lngPad],
    [center[0] - latPad, center[1] - lngPad],
  ];
};

function WardFocus({ selectedWard, realShapes }) {
  const map = useMap();
  useEffect(() => {
    if (selectedWard === "All wards") {
      map.setView([28.635, 77.21], 10.8, { animate: true });
      return;
    }
    const ward = wards.find((item) => item.name === selectedWard);
    if (!ward) return;
    map.fitBounds(wardShape(ward.id, wards.indexOf(ward), realShapes), {
      padding: [40, 40],
      maxZoom: 15,
      animate: true,
    });
  }, [map, selectedWard, realShapes]);
  return null;
}

function WardDatasetLayer({ setSelectedWard, onRealShapes }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch("/data/delhi_wards.geojson")
      .then((response) => response.json())
      .then((geojson) => {
        setData(geojson);
        const shapes = {};
        (geojson.features || []).forEach((feature) => {
          const realName = (feature.properties?.Ward_Name || "").trim();
          const matchedWard = Object.entries(realWardNameAliases).find(
            ([, alias]) => alias === realName,
          );
          if (!matchedWard || feature.geometry?.type !== "Polygon") return;
          shapes[matchedWard[0]] = feature.geometry.coordinates[0].map(
            ([lng, lat]) => [lat, lng],
          );
        });
        onRealShapes(shapes);
      })
      .catch(() => setData(null));
  }, [onRealShapes]);
  if (!data) return null;
  return (
    <GeoJSON
      data={data}
      style={() => ({
        color: "#1976d2",
        weight: 1,
        fillColor: "#1976d2",
        fillOpacity: 0.04,
        dashArray: "3 6",
      })}
      onEachFeature={(feature, layer) => {
        const properties = feature.properties || {};
        const realName = (properties.Ward_Name || "").trim();
        const label = properties.Ward_No || realName || "Delhi ward";
        layer.bindTooltip(`${realName || `Ward ${label}`} · DataMeet boundary`, {
          sticky: true,
        });
        layer.on({
          click: () => {
            const match = wards.find(
              (ward) => realWardNameAliases[ward.name] === realName,
            );
            if (match) setSelectedWard(match.name);
          },
          mouseover: () => layer.setStyle({ weight: 2, fillOpacity: 0.12 }),
          mouseout: () => layer.setStyle({ weight: 1, fillOpacity: 0.04 }),
        });
      }}
    />
  );
}

// Replaces the bundled arrays in place once the API answers; every view reads
// these module-level arrays, so a re-render is all that is needed afterwards.
function applyLiveData(live) {
  wards.splice(0, wards.length, ...live.wards);
  assets.splice(0, assets.length, ...live.assets);
}

// A confirmed photo can change an asset's status; every view reads this array.
function replaceAsset(updated) {
  const index = assets.findIndex((asset) => asset.id === updated.id);
  if (index >= 0) assets[index] = updated;
}

function App() {
  // The address bar says which page is open, so a refresh or a shared link comes back to it.
  const [initialLocation] = useState(() => parseLocation(window.location.hash));
  const [activeTab, setActiveTab] = useState(initialLocation.tab);
  const [dataSource, setDataSource] = useState("bundled demo data");
  const [user, setUser] = useState(null);
  useEffect(() => {
    if (!authEnabled) return;
    restoreSession().then((session) => session && setUser(session.user));
  }, []);
  // The login is saved once per browser, so another tab signing in or out changes who
  // this tab's API calls act as. Follow it so the screen always shows that person.
  useEffect(() => {
    if (!authEnabled) return undefined;
    const follow = (event) => {
      if (event.key && !event.key.startsWith("CognitoIdentityServiceProvider")) return;
      restoreSession().then((session) => {
        const next = session ? session.user : null;
        setUser((current) => ((current?.id ?? null) === (next?.id ?? null) ? current : next));
      });
    };
    window.addEventListener("storage", follow);
    return () => window.removeEventListener("storage", follow);
  }, []);
  const [selectedAsset, setSelectedAsset] = useState(() => assets.find((asset) => asset.id === initialLocation.asset) ?? assets[0]);
  const [, setDataVersion] = useState(0);
  // Reloaded on every tab change, so a photo confirmed a moment ago shows up in the scores.
  useEffect(() => {
    let cancelled = false;
    loadLiveData().then((live) => {
      if (cancelled || !live) return;
      applyLiveData(live);
      setSelectedAsset((current) => assets.find((asset) => asset.id === current.id) ?? current);
      setDataSource("live API");
      setDataVersion((version) => version + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);
  const [selectedWard, setSelectedWard] = useState(initialLocation.ward ?? "All wards");
  const [menuOpen, setMenuOpen] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [reportImage, setReportImage] = useState(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const filteredAssets =
    selectedWard === "All wards"
      ? assets
      : assets.filter((asset) => asset.wardName === selectedWard);
  const currentWard =
    (selectedWard !== "All wards" &&
      wards.find((ward) => ward.name === selectedWard)) ||
    wards.find((ward) => ward.id === selectedAsset.ward) ||
    wards[0];
  // Keep the address in step with the page. A change of page adds a history entry (so Back works);
  // changing the ward or asset on the same page only updates the current one.
  const lastTab = useRef(activeTab);
  const wardForUrl = activeTab === "Rep Profile" ? currentWard?.name : selectedWard;
  const assetForUrl = selectedAsset?.id;
  useEffect(() => {
    const target = buildLocation({ tab: activeTab, ward: wardForUrl, asset: assetForUrl });
    const current = window.location.hash;
    const changedPage = lastTab.current !== activeTab;
    lastTab.current = activeTab;
    if (current === target || (!current && target === "#/map")) return;
    window.history[changedPage ? "pushState" : "replaceState"](null, "", target);
  }, [activeTab, wardForUrl, assetForUrl]);
  useEffect(() => {
    const follow = () => {
      const next = parseLocation(window.location.hash);
      setActiveTab(next.tab);
      if (next.ward !== null || next.tab === "Map" || next.tab === "Rep Profile") setSelectedWard(next.ward ?? "All wards");
      if (next.asset) setSelectedAsset((current) => assets.find((asset) => asset.id === next.asset) ?? current);
    };
    window.addEventListener("popstate", follow);
    return () => window.removeEventListener("popstate", follow);
  }, []);
  const tabs = [
    { name: "Map", icon: MapPin },
    { name: "Leaderboard", icon: BarChart3 },
    { name: "Ward Compare", icon: SlidersHorizontal },
    { name: "Alerts", icon: CircleAlert },
    { name: "Civic Data", icon: Database },
    { name: "Rep Profile", icon: Landmark },
    { name: "Officers", icon: Users },
    { name: "Social Watch", icon: MessageSquare },
    { name: "Report Asset", icon: CircleAlert },
    { name: "Civic Proof", icon: Camera },
    { name: "Login / Signup", icon: ShieldCheck },
  ];

  return (
    <div className="app-shell">
      <aside className={menuOpen ? "side-nav open" : "side-nav"}>
        <div className="brand-lockup">
          <div>
            <strong>NIRVASAN</strong>
            <span>ground truth / public accountability</span>
          </div>
        </div>
        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>
        <div className="nav-section">
          <span className="nav-section-label">MONITOR</span>
          {tabs.slice(0, 5).map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={activeTab === name ? "nav-tab active" : "nav-tab"}
              onClick={() => {
                setActiveTab(name);
                setMenuOpen(false);
              }}
            >
              <Icon size={17} />
              <span>{name}</span>
            </button>
          ))}
        </div>
        <div className="nav-section">
          <span className="nav-section-label">PARTICIPATE</span>
          {tabs.slice(5).map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={activeTab === name ? "nav-tab active" : "nav-tab"}
              onClick={() => {
                setActiveTab(name);
                setMenuOpen(false);
              }}
            >
              <Icon size={17} />
              <span>{name}</span>
            </button>
          ))}
        </div>
        <div className="nav-section nav-section-bottom">
          <span className="nav-section-label">ACCOUNT</span>
          <button className="nav-tab" onClick={() => { setActiveTab("Login / Signup"); setMenuOpen(false); }}>
            <ShieldCheck size={17} />
            <span>Verified citizen</span>
          </button>
          <div className="user-pill">
            <span className="online-dot" /> {user ? user.name : "Citizen"}{" "}
            <ChevronRight size={15} />
          </div>
        </div>
      </aside>
      <main>
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <span className="pulse" /> DELHI / CIVIC SIGNAL
            </div>
            <h1>
              See what was promised.
              <br />
              <em>See what still works.</em>
            </h1>
            <p className="heading-copy">
              Nirvasan reconciles public funds with citizen-verified ground
              reality, ward by ward.
            </p>
          </div>
          <div className="heading-meta">
            <span className="live-tag">
              <span /> LIVE
            </span>
            <span className="update-time">
              Last sync {formattedSyncDate} · {formattedSyncTime} IST · data: {dataSource}
            </span>
          </div>
        </div>
        {activeTab === "Map" && (
          <MapView
            assets={filteredAssets}
            selectedAsset={selectedAsset}
            setSelectedAsset={setSelectedAsset}
            selectedWard={selectedWard}
            setSelectedWard={setSelectedWard}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === "Leaderboard" && (
          <Leaderboard setActiveTab={setActiveTab} setSelectedWard={setSelectedWard} />
        )}
        {activeTab === "Ward Compare" && <WardCompare />}
        {activeTab === "Alerts" && <Alerts />}
        {activeTab === "Civic Data" && <CivicData />}
        {activeTab === "Rep Profile" && (
          <Profile
            ward={currentWard}
            assets={assets.filter((asset) => asset.ward === currentWard.id)}
            rating={rating}
            setRating={setRating}
            ratingSubmitted={ratingSubmitted}
            setRatingSubmitted={setRatingSubmitted}
            user={user}
            setActiveTab={setActiveTab}
            setSelectedWard={setSelectedWard}
          />
        )}
        {activeTab === "Officers" && <Officers />}
        {activeTab === "Social Watch" && <SocialWatch user={user} setActiveTab={setActiveTab} />}
        {activeTab === "Report Asset" && (
          <ReportView
            reportImage={reportImage}
            setReportImage={setReportImage}
            submitted={reportSubmitted}
            setSubmitted={setReportSubmitted}
          />
        )}
        {activeTab === "Civic Proof" && (
          <ProofView
            selectedAsset={selectedAsset}
            setSelectedAsset={setSelectedAsset}
            submitted={proofSubmitted}
            setSubmitted={setProofSubmitted}
            user={user}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === "Login / Signup" && (
          <AuthView mode={authMode} setMode={setAuthMode} user={user} setUser={setUser} />
        )}
      </main>
      <footer className="app-footer">
        <span>
          <ShieldCheck size={14} /> Traceability is a feature, not an
          afterthought.
        </span>
        <span>
          <a href={sources.wards} target="_blank" rel="noreferrer">
            Ward boundaries
          </a>{" "}
          ·{" "}
          <a href={sources.mplad} target="_blank" rel="noreferrer">
            MPLAD public record
          </a>{" "}
          · Asset registry
        </span>
      </footer>
    </div>
  );
}

const statusFilters = [
  { key: "critical", label: "Flagged / overdue" },
  { key: "dead", label: "Dead / missing" },
  { key: "working", label: "Verified working" },
  { key: "unverified", label: "Unverified" },
  { key: "in-progress", label: "In progress" },
];

function MapView({
  assets: mapAssets,
  selectedAsset,
  setSelectedAsset,
  selectedWard,
  setSelectedWard,
  setActiveTab,
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [realWardShapes, setRealWardShapes] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(true);

  const searchedAssets = mapAssets.filter((asset) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      asset.type.toLowerCase().includes(q) ||
      asset.label.toLowerCase().includes(q) ||
      asset.wardName.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || asset.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const selectAsset = (asset) => {
    setSelectedAsset(asset);
    setDrawerOpen(true);
  };

  const focusedWard =
    selectedWard !== "All wards" && wards.find((ward) => ward.name === selectedWard);
  const signalUtilizedPct = focusedWard
    ? Math.round((focusedWard.utilized / focusedWard.funds) * 100)
    : Math.round(
        wards.reduce((sum, ward) => sum + (ward.utilized / ward.funds) * 100, 0) /
          wards.length,
      );
  const signalGap = focusedWard
    ? focusedWard.gap
    : Math.round(wards.reduce((sum, ward) => sum + ward.gap, 0) / wards.length);
  const signalVerifiedPct = Math.max(signalUtilizedPct - signalGap, 0);

  return (
    <section className="map-layout">
      <aside className="map-sidebar">
        <div className="section-head">
          <div>
            <span className="kicker">FIELD OVERVIEW</span>
            <h2>All Delhi zones</h2>
          </div>
          <button
            className={filterOpen ? "icon-button active" : "icon-button"}
            title="Filter by asset status"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search asset, ward or rep"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="ward-select">
          <Filter size={14} />
          <SelectMenu
            ariaLabel="Filter by ward"
            className="select-plain"
            value={selectedWard}
            onChange={setSelectedWard}
            options={[{ value: "All wards", label: "All wards" }, ...wards.map((ward) => ({ value: ward.name, label: ward.name }))]}
          />
        </div>
        {filterOpen && (
          <div className="choice-grid" style={{ flexWrap: "wrap", marginTop: "8px" }}>
            {statusFilters.map((option) => (
              <button
                key={option.key}
                className={statusFilter === option.key ? "choice active" : "choice"}
                onClick={() =>
                  setStatusFilter(statusFilter === option.key ? null : option.key)
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        <div className="legend">
          <div>
            <span className="legend-dot critical" /> Flagged / overdue{" "}
            <b>{mapAssets.filter((a) => a.status === "critical").length}</b>
          </div>
          <div>
            <span className="legend-dot dead" /> Dead / missing{" "}
            <b>{mapAssets.filter((a) => a.status === "dead").length}</b>
          </div>
          <div>
            <span className="legend-dot working" /> Verified working{" "}
            <b>{mapAssets.filter((a) => a.status === "working").length}</b>
          </div>
          <div>
            <span className="legend-dot unverified" /> Unverified{" "}
            <b>{mapAssets.filter((a) => a.status === "unverified").length}</b>
          </div>
          <div>
            <span className="legend-dot progress" /> Work in progress{" "}
            <b>{mapAssets.filter((a) => a.status === "in-progress").length}</b>
          </div>
        </div>
        <div className="asset-type-legend">
          <span>
            <b>⌂</b> Structure
          </span>
          <span>
            <b>L</b> Streetlight
          </span>
          <span>
            <b>P</b> Pump
          </span>
          <span>
            <b>!</b> Pothole
          </span>
          <span>
            <b>D</b> Divider
          </span>
          <span>
            <b>—</b> In progress
          </span>
        </div>
        <div className="signal-card">
          <div className="signal-top">
            <span>{focusedWard ? `${focusedWard.name.toUpperCase()} INTEGRITY GAP` : "CITYWIDE INTEGRITY GAP"}</span>
            <Info size={14} />
          </div>
          <strong>
            {signalGap}<span>pts</span>
          </strong>
          <p>Paper utilization vs. photo-verified working assets</p>
          <div className="mini-bars">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="signal-foot">
            <span>{signalUtilizedPct}% paper utilized</span>
            <span>{signalVerifiedPct}% verified working</span>
          </div>
        </div>
        <div className="asset-list">
          <div className="list-title">
            RECENT FIELD SIGNALS <span>{searchedAssets.length} assets</span>
          </div>
          {searchedAssets.length === 0 && (
            <p style={{ color: "#70778a", fontSize: "11px" }}>
              No assets match this search or filter.
            </p>
          )}
          {searchedAssets.slice(0, 6).map((asset) => (
            <button
              className={
                selectedAsset.id === asset.id
                  ? "asset-row selected"
                  : "asset-row"
              }
              key={asset.id}
              onClick={() => selectAsset(asset)}
            >
              <span
                className="asset-status"
                style={{ background: statusMeta[asset.status].color }}
              />
              <span className="asset-row-copy">
                <b>{asset.type}</b>
                <small>{asset.label.split("·")[1]}</small>
              </span>
              <span className="asset-row-right">
                <Camera size={13} /> {asset.photos}
                <ChevronRight size={14} />
              </span>
            </button>
          ))}
        </div>
      </aside>
      <div className="map-card">
        <div className="map-overlay top">
          <span>
            <span className="map-dot" /> Delhi ward layer · 23 wards · {searchedAssets.length}{" "}
            assets
          </span>
          <span className="map-scale">N ↑</span>
        </div>
        <MapContainer
          center={[28.635, 77.21]}
          zoom={10.8}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          zoomControl={false}
          minZoom={9}
          maxZoom={19}
          className="leaflet-map"
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
            url={cartoTileUrl}
          />
          <Polygon
            positions={wardPolygon}
            pathOptions={{
              color: "#1976d2",
              weight: 1,
              fillColor: "#1976d2",
              fillOpacity: 0.06,
              dashArray: "5 7",
            }}
          />
          <WardDatasetLayer
            setSelectedWard={setSelectedWard}
            onRealShapes={setRealWardShapes}
          />
          <WardFocus selectedWard={selectedWard} realShapes={realWardShapes} />
          {wards.map((ward, index) => (
            <Polygon
              key={ward.id}
              positions={wardShape(ward.id, index, realWardShapes)}
              pathOptions={{
                color: ward.name === selectedWard ? "#ff8a22" : wardPalette[index % wardPalette.length],
                weight: ward.name === selectedWard ? 3 : 1,
                fillColor: ward.name === selectedWard ? "#ff8a22" : wardPalette[index % wardPalette.length],
                fillOpacity: ward.name === selectedWard ? 0.18 : 0.06,
                dashArray: ward.name === selectedWard ? undefined : "4 6",
              }}
              eventHandlers={{
                click: () => {
                  setSelectedWard(ward.name);
                  const firstAsset = wardAssets(ward.id)[0];
                  if (firstAsset) selectAsset(firstAsset);
                },
              }}
            >
              <Tooltip sticky>
                <b>{ward.name}</b> · {ward.zone} zone ·{" "}
                {realWardShapes[ward.name] ? "verified boundary" : "approximate boundary"} ·{" "}
                {wardAssets(ward.id).length} mapped assets
              </Tooltip>
            </Polygon>
          ))}
          {searchedAssets.map((asset) => (
            <Marker
              key={asset.id}
              position={[asset.lat, asset.lng]}
              icon={markerIcon(asset, asset.id === selectedAsset.id)}
              eventHandlers={{ click: () => selectAsset(asset) }}
            >
              <Tooltip direction="top" offset={[0, -12]}>
                {asset.type} · {statusMeta[asset.status].label}
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
        <div className="map-overlay bottom">
          <span>
            <MapPin size={14} /> Showing public works within monitored wards
          </span>
          <span className="map-source">
            Source:{" "}
            <a href={sources.wards} target="_blank" rel="noreferrer">
              DataMeet ward boundaries ↗
            </a>
            <a href={sources.wardsGeoJson} target="_blank" rel="noreferrer">
              raw GeoJSON ↗
            </a>
            {" "}· {Object.keys(realWardShapes).length}/{wards.length} wards use verified boundaries
          </span>
        </div>
      </div>
      <AssetDrawer
        asset={selectedAsset}
        ward={wards.find((ward) => ward.id === selectedAsset.ward) || wards[0]}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onViewProfile={() => setActiveTab("Rep Profile")}
        onAddProof={() => setActiveTab("Civic Proof")}
      />
    </section>
  );
}

// A dropdown that opens below its button (a native <select> flips upwards whenever the browser
// thinks there is little room) and scrolls inside a list sized to the space left on screen.
function SelectMenu({ value, options, onChange, ariaLabel, className = "", disabled = false, listMinWidth = 200 }) {
  const [place, setPlace] = useState(null);
  const [active, setActive] = useState(0);
  const trigger = useRef(null);
  const list = useRef(null);
  const typed = useRef({ text: "", at: 0 });
  const open = place !== null;
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));

  const close = (refocus) => {
    setPlace(null);
    if (refocus) trigger.current?.focus();
  };
  const choose = (index) => {
    if (options[index]) onChange(options[index].value);
    close(true);
  };
  const openMenu = () => {
    const rect = trigger.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const flip = below < 140 && above > below;
    const room = flip ? above : below;
    setActive(selectedIndex);
    const width = Math.min(Math.max(rect.width, listMinWidth), window.innerWidth - 16);
    setPlace({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      width,
      maxHeight: Math.max(120, Math.min(320, room)),
      ...(flip ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    });
  };

  useEffect(() => {
    if (!open) return undefined;
    list.current?.focus({ preventScroll: true });
    const away = (event) => {
      if (!list.current?.contains(event.target) && !trigger.current?.contains(event.target)) setPlace(null);
    };
    const drift = (event) => {
      if (!list.current?.contains(event.target)) setPlace(null);
    };
    document.addEventListener("mousedown", away);
    window.addEventListener("scroll", drift, true);
    window.addEventListener("resize", drift);
    return () => {
      document.removeEventListener("mousedown", away);
      window.removeEventListener("scroll", drift, true);
      window.removeEventListener("resize", drift);
    };
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onListKey = (event) => {
    const last = options.length - 1;
    if (event.key === "ArrowDown") setActive((index) => Math.min(last, index + 1));
    else if (event.key === "ArrowUp") setActive((index) => Math.max(0, index - 1));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(last);
    else if (event.key === "Enter" || event.key === " ") choose(active);
    else if (event.key === "Escape") close(true);
    else if (event.key === "Tab") close(false);
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      const now = event.timeStamp;
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + event.key.toLowerCase(), at: now };
      const hit = options.findIndex((option) => String(option.label).toLowerCase().startsWith(typed.current.text));
      if (hit >= 0) setActive(hit);
      return;
    } else return;
    event.preventDefault();
  };

  return (
    <>
      <button
        type="button"
        ref={trigger}
        className={`select-trigger ${className}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            openMenu();
          }
        }}
      >
        <span className="select-value">{options[selectedIndex]?.label}</span>
        <ChevronDown size={14} className={open ? "select-chevron open" : "select-chevron"} />
      </button>
      {open &&
        createPortal(
          <ul
            ref={list}
            className="select-list"
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel}
            style={place}
            onKeyDown={onListKey}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                data-index={index}
                role="option"
                aria-selected={index === selectedIndex}
                className={`select-option${index === active ? " active" : ""}${index === selectedIndex ? " selected" : ""}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(index)}
              >
                <span className="select-option-text">{option.label}</span>
                {option.hint && <em className="select-hint">{option.hint}</em>}
                {index === selectedIndex && <Check size={13} />}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}

function AssetDrawer({ asset, ward, open, onClose, onViewProfile, onAddProof }) {
  const contacts = wardContacts(ward);
  const repInitials = ward.rep.split(" ").map((part) => part[0]).join("");
  const officerInitials = ward.officer.split(" ").filter((part) => part.length > 1 || /[A-Za-z]/.test(part)).map((part) => part[0]).join("").slice(0, 2);
  const isStructure = asset.type === "Structure";
  const daysOverdue = isStructure
    ? Math.floor((syncTimestamp - new Date(asset.reinspectionDue)) / 86400000)
    : null;
  if (!open) {
    return (
      <aside className="asset-drawer">
        <div className="drawer-top">
          <span className="sim-badge">
            <span /> ASSET REGISTRY
          </span>
        </div>
        <p style={{ color: "#70778a", fontSize: "12px", marginTop: "20px" }}>
          No asset selected. Click a marker or a field signal on the left to
          see its accountability chain.
        </p>
      </aside>
    );
  }
  return (
    <aside className="asset-drawer">
      <div className="drawer-top">
        <span className="sim-badge">
          <span /> ASSET REGISTRY
        </span>
        <button className="icon-button" title="Close detail" onClick={onClose}>
          <X size={17} />
        </button>
      </div>
      <div className="drawer-col drawer-col-asset">
      <div className="drawer-title">
        <div className="asset-type-icon">
          <span className={`drawer-symbol drawer-symbol-${asset.status}`}>
            {markerSymbols[asset.type] || "•"}
          </span>
        </div>
        <div>
          <span className="kicker">
            {asset.id} · {asset.type.toUpperCase()}
          </span>
          <h2>{asset.label}</h2>
        </div>
      </div>
      <div className="status-line">
        <span
          className="status-chip"
          style={{
            color: statusMeta[asset.status].color,
            background: `${statusMeta[asset.status].color}18`,
          }}
        >
          <span style={{ background: statusMeta[asset.status].color }} />{" "}
          {statusMeta[asset.status].label}
        </span>
        <span className="confidence">
          <BadgeCheck size={14} /> {asset.confidence} confidence
        </span>
      </div>
      <div className="drawer-grid">
        {isStructure ? (
          <>
            <div>
              <small>LAST INSPECTION</small>
              <b>{asset.lastInspection}</b>
            </div>
            <div>
              <small>RE-INSPECTION DUE</small>
              <b>{asset.reinspectionDue}</b>
            </div>
            <div>
              <small>STATUS</small>
              <b>{daysOverdue > 0 ? `${daysOverdue} days overdue` : "On schedule"}</b>
            </div>
            <div>
              <small>PHOTO EVIDENCE</small>
              <b>{asset.photos} reports</b>
            </div>
          </>
        ) : (
          <>
            <div>
              <small>SANCTIONED</small>
              <b>{formatMoney(asset.amount)}</b>
            </div>
            <div>
              <small>SCHEME</small>
              <b>{asset.scheme}</b>
            </div>
            <div>
              <small>EXPECTED BY</small>
              <b>{asset.expected}</b>
            </div>
            <div>
              <small>PHOTO EVIDENCE</small>
              <b>{asset.photos} reports</b>
            </div>
          </>
        )}
      </div>
      </div>
      <div className="drawer-col drawer-col-brief">
      <div className="ground-note">
        <div className="note-heading">
          <Sparkles size={15} /> GROUNDED AI BRIEF <span>cached</span>
        </div>
        <p>{asset.narrative}</p>
        <small>
          <FileText size={12} /> {asset.source}
        </small>
      </div>
      <div className="sources-link">
        <ShieldCheck size={14} /> <span>Sources for this claim</span>
        <a href={sources.mplad} target="_blank" rel="noreferrer">
          MPLAD raw record ↗
        </a>
      </div>
      </div>
      <div className="drawer-col drawer-col-people">
      <div className="responsibility">
        <div className="responsibility-heading">
          ACCOUNTABILITY CHAIN <ArrowUpRight size={15} />
        </div>
        <div className="person-row">
          <div className="avatar rep">{repInitials}</div>
          <div>
            <small>ELECTED REPRESENTATIVE</small>
            <b>
              {ward.rep} <i>{ward.party}</i>
            </b>
            <span>
              Ward {ward.id.replace("W-", "")} · {ward.name}
            </span>
            <div className="contact-links"><a href={`https://x.com/${contacts.representative.slice(1)}`} target="_blank" rel="noreferrer">{contacts.representative}</a><a href={`tel:${contacts.representativePhone}`}>{contacts.representativePhone}</a></div>
          </div>
        </div>
        <div className="person-row">
          <div className="avatar officer">{officerInitials}</div>
          <div>
            <small>MCD RESPONSIBLE OFFICER</small>
            <b>{ward.officer}</b>
            <span>Executive Engineer · {ward.zone} Zone</span>
            <div className="contact-links"><a href={`mailto:${contacts.officerEmail}`}>{contacts.officerEmail}</a><a href={`tel:${contacts.officerPhone}`}>{contacts.officerPhone}</a></div>
          </div>
        </div>
      </div>
      <div className="drawer-actions">
        <button className="primary-action" onClick={onAddProof}>
          <Camera size={16} /> Add civic proof
        </button>
        <button className="secondary-action" onClick={onViewProfile}>
          View profile <ChevronRight size={15} />
        </button>
      </div>
      </div>
    </aside>
  );
}

function Officers() {
  const [query, setQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("All zones");
  const [scrapedRecords, setScrapedRecords] = useState([]);
  const [scrapeState, setScrapeState] = useState({ status: "idle", message: "" });
  const loadScrapedRecords = () => {
    fetch("/data/officers.json")
      .then((response) => (response.ok ? response.json() : []))
      .then((records) => setScrapedRecords(Array.isArray(records) ? records : []))
      .catch(() => setScrapedRecords([]));
  };
  useEffect(() => {
    loadScrapedRecords();
  }, []);
  const runScraper = async () => {
    setScrapeState({ status: "loading", message: "Scraping directory..." });
    try {
      const response = await fetch("/api/scrape-officers", {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Scraper failed");
      setScrapedRecords(result.records || []);
      setScrapeState({ status: "success", message: `${result.count} records loaded` });
    } catch (error) {
      setScrapeState({ status: "error", message: error.message });
    }
  };
  const zones = ["All zones", ...new Set(wards.map((ward) => ward.zone))];
  const filteredWards = wards.filter((ward) => {
    const searchable = `${ward.name} ${ward.id} ${ward.officer} ${ward.assistantOfficer || ""}`.toLowerCase();
    return searchable.includes(query.toLowerCase()) && (zoneFilter === "All zones" || ward.zone === zoneFilter);
  });
  const exportOfficers = () => downloadCsv("nirvasan-officers.csv", [
    ["Ward", "Zone", "Executive Engineer", "Assistant Engineer", "Confidence", "Last updated"],
    ...filteredWards.map((ward) => {
      const meta = officerMeta(ward);
      return [ward.id, ward.zone, ward.officer, ward.assistantOfficer || "Pending", meta.confidence, meta.updated];
    }),
  ]);
  return (
    <section className="content-view officers-view">
      <div className="content-toolbar">
        <div>
          <span className="kicker">MCD RESPONSIBILITY DIRECTORY</span>
          <h2>Officers across monitored wards</h2>
          <p>Every public asset is connected to a civic chain, not only an elected representative.</p>
          <span className="directory-disclaimer">{scrapedRecords.length ? `${scrapedRecords.length} MCD RECORDS LOADED · WARD ASSIGNMENT PENDING` : "MCD SOURCES READY · SCRAPE TO LOAD PUBLIC RECORDS"}</span>
        </div>
        <div className="directory-count"><b>{filteredWards.length}</b><span>wards indexed</span></div>
      </div>
      <div className="toolbar-actions" style={{ marginBottom: "18px" }}>
        <label className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ward or officer" /></label>
        <SelectMenu ariaLabel="Filter by zone" className="select-box" value={zoneFilter} onChange={setZoneFilter} options={zones.map((zone) => ({ value: zone, label: zone }))} />
        <button className="filter-button" onClick={exportOfficers}><Download size={15} /> Export CSV</button>
      </div>
      <div className="toolbar-actions" style={{ marginBottom: "18px" }}>
        <button className="filter-button" disabled={scrapeState.status === "loading"} onClick={runScraper}><RefreshCw size={15} /> {scrapeState.status === "loading" ? "Scraping MCD..." : "Scrape MCD officers"}</button>
        {scrapeState.message && <span className="directory-disclaimer">{scrapeState.message}</span>}
      </div>
      <div className="officer-directory">
        {filteredWards.map((ward) => (
          <article className="directory-card" key={ward.id}>
            <div className="directory-card-top"><span className="ward-code">{ward.id}</span><span className="zone-tag">{ward.zone} zone</span></div>
            <h3>{ward.name}</h3>
            <div className="directory-person"><div className="directory-avatar">{ward.officer.split(" ").map((part) => part[0]).join("")}</div><div><small>EXECUTIVE ENGINEER</small><b>{ward.officer}</b><span>{ward.zone} / Delhi MCD</span><div className="contact-links"><a href={`mailto:${wardContacts(ward).officerEmail}`}>email</a><a href={`tel:${wardContacts(ward).officerPhone}`}>call</a></div></div><BadgeCheck size={15} /></div>
            <div className="directory-person compact"><div className="directory-avatar assistant">AE</div><div><small>ASSISTANT ENGINEER</small><b>{ward.assistantOfficer || `${ward.officer.split(" ")[0]} ${ward.officer.split(" ").at(-1)}`}</b><span>Ward works desk · {ward.id}</span></div></div>
            <div className="directory-footer"><span>{assets.filter((asset) => asset.ward === ward.id).length} mapped assets</span><span>{officerMeta(ward).confidence}</span><a href={sources.officers} target="_blank" rel="noreferrer">MCD source ↗</a></div>
          </article>
        ))}
      </div>
      {scrapedRecords.length > 0 && (
        <>
          <div className="content-toolbar" style={{ marginTop: "34px" }}>
            <div><span className="kicker">OFFICIAL MCD SOURCE RECORDS</span><h3>Empanelled personnel scraped from MCD</h3><p>Public source records shown separately until ward assignment is verified.</p></div>
            <div className="directory-count"><b>{scrapedRecords.length}</b><span>records loaded</span></div>
          </div>
          <div className="officer-directory">
            {scrapedRecords.filter((record) => `${record.name} ${record.role} ${record.ward}`.toLowerCase().includes(query.toLowerCase())).slice(0, 30).map((record, index) => (
              <article className="directory-card" key={`${record.source}-${record.name}-${index}`}>
                <div className="directory-card-top"><span className="ward-code">{record.ward}</span><span className="zone-tag">{record.role}</span></div>
                <h3>{record.name}</h3>
                <div className="directory-person compact"><div className="directory-avatar assistant">MCD</div><div><small>PUBLIC SOURCE RECORD</small><b>{record.role}</b><span>{record.zone} · {record.confidence}</span></div></div>
                <div className="directory-footer"><span>{record.phone || "Phone not listed"}</span><a href={record.source} target="_blank" rel="noreferrer">MCD source ↗</a></div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function WardCompare() {
  const [leftId, setLeftId] = useState(wards[0].id);
  const [rightId, setRightId] = useState(wards[1].id);
  const left = wards.find((ward) => ward.id === leftId) || wards[0];
  const right = wards.find((ward) => ward.id === rightId) || wards[1];
  const wardOptions = wards.map((ward) => ({ value: ward.id, label: `${ward.id} · ${ward.name}` }));
  const metrics = [
    ["Ground-work score", (ward) => `${ward.score}/100`],
    ["Paper utilized", (ward) => `${Math.round((ward.utilized / ward.funds) * 100)}%`],
    ["Integrity gap", (ward) => `${ward.gap} pts`],
    ["Mapped assets", (ward) => assets.filter((asset) => asset.ward === ward.id).length],
  ];
  return (
    <section className="content-view">
      <div className="content-toolbar"><div><span className="kicker">WARD INTELLIGENCE</span><h2>Compare delivery side by side</h2><p>Compare public funds, ground reality, and mapped works without hiding the source records.</p></div><div className="directory-count"><b>2</b><span>wards selected</span></div></div>
      <div className="toolbar-actions" style={{ marginBottom: "18px" }}>
        <SelectMenu ariaLabel="First ward" className="select-box" value={leftId} onChange={setLeftId} options={wardOptions} />
        <span style={{ color: "#858b9d" }}>vs</span>
        <SelectMenu ariaLabel="Second ward" className="select-box" value={rightId} onChange={setRightId} options={wardOptions} />
      </div>
      <div className="metric-grid">
        {[left, right].map((ward) => <div className="metric-card" key={ward.id}><small>{ward.id} · {ward.zone.toUpperCase()} ZONE</small><b>{ward.name}</b><span>{ward.rep} · {ward.party}</span><a href={sources.mplad} target="_blank" rel="noreferrer">MPLAD source ↗</a></div>)}
      </div>
      <div className="panel-title" style={{ marginTop: "28px" }}><h3>Comparison</h3><span className="directory-disclaimer">SOURCE-LINKED DATA</span></div>
      <div className="leaderboard-list">
        {metrics.map(([label, getValue]) => <div className="leader-row" key={label}><div className="leader-name"><b>{label}</b></div><div className="score"><b>{getValue(left)}</b></div><div className="score"><b>{getValue(right)}</b></div></div>)}
      </div>
    </section>
  );
}

function Alerts() {
  const alerts = wards.flatMap((ward) => {
    const wardAlerts = [];
    if (ward.gap >= 50) wardAlerts.push({ level: "High", title: `${ward.name} has a ${ward.gap}-point integrity gap`, detail: "Paper utilization is materially ahead of verified ground reality.", ward });
    if (assets.filter((asset) => asset.ward === ward.id && ["dead", "critical"].includes(asset.status)).length) wardAlerts.push({ level: "Review", title: `${ward.name} has unresolved asset evidence`, detail: "A mapped work is dead or overdue for re-inspection.", ward });
    if (officerMeta(ward).confidence !== "Verified") wardAlerts.push({ level: "Data", title: `${ward.name} officer record needs verification`, detail: "Directory entry is queued for public-source confirmation.", ward });
    return wardAlerts;
  });
  return (
    <section className="content-view">
      <div className="content-toolbar"><div><span className="kicker">REVIEW QUEUE / TRACEABLE ALERTS</span><h2>What needs attention</h2><p>Prioritized leads for human review. Alerts never change asset status automatically.</p></div><div className="directory-count"><b>{alerts.length}</b><span>open alerts</span></div></div>
      <div className="social-report-list">{alerts.map((alert, index) => <article className="social-report" key={`${alert.ward.id}-${index}`}><div className="social-report-top"><span className="social-handle">{alert.level}</span><span className="social-status">{alert.ward.id}</span></div><p><b>{alert.title}</b><br />{alert.detail}</p><div className="social-report-footer"><span>{alert.ward.zone} zone · {alert.ward.officer}</span><a href={sources.mplad} target="_blank" rel="noreferrer">Inspect source ↗</a></div></article>)}</div>
    </section>
  );
}

function CivicData() {
  const [view, setView] = useState("candidates");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.toLowerCase().trim();
  const candidates = civicCandidates.filter((candidate) =>
    `${candidate.full_name} ${candidate.party} ${candidate.constituency_or_ward}`.toLowerCase().includes(normalizedQuery),
  );
  const departments = civicDepartments.filter((department) =>
    `${department.department_name} ${department.category} ${department.service_keywords.join(" ")}`.toLowerCase().includes(normalizedQuery),
  );
  const joinedRecords = civicMasterData.filter((record) =>
    `${record.ward_or_constituency} ${record.politician?.full_name || ""}`.toLowerCase().includes(normalizedQuery),
  );
  const counts = {
    candidates: [candidates.length, civicCandidates.length, "candidates"],
    departments: [departments.length, civicDepartments.length, "departments"],
    joined: [joinedRecords.length, civicMasterData.length, "joined records"],
  }[view];
  return (
    <section className="content-view civic-view">
      <div className="content-toolbar">
        <div>
          <h2>Political context meets civic duty</h2>
          <p>Public candidate records, department responsibilities and ward context, side by side.</p>
        </div>
        <div className="directory-count"><b>{civicCandidates.length + civicDepartments.length}</b><span>source records</span></div>
      </div>
      <div className="metric-grid civic-metrics">
        <button className={view === "candidates" ? "metric-card highlight" : "metric-card"} onClick={() => setView("candidates")}>
          <small><Users size={13} /> CANDIDATE DATA</small><b>{civicCandidates.length}</b><span>MyNeta records loaded</span>
        </button>
        <button className={view === "departments" ? "metric-card highlight" : "metric-card"} onClick={() => setView("departments")}>
          <small><Building2 size={13} /> RESPONSIBILITY MATRIX</small><b>{civicDepartments.length}</b><span>urban sectors defined</span>
        </button>
        <button className={view === "joined" ? "metric-card highlight" : "metric-card"} onClick={() => setView("joined")}>
          <small><Database size={13} /> MERGED CONTEXT</small><b>{civicMasterData.length}</b><span>ward / constituency joins</span>
        </button>
        <div className="metric-card">
          <small><ShieldCheck size={13} /> DATA SOURCES</small><b>PUBLIC</b><span>MyNeta · MCD · DataMeet</span>
        </div>
      </div>
      <div className="toolbar-actions" style={{ margin: "24px 0 12px" }}>
        <label className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search civic data" /></label>
        <button className={view === "candidates" ? "filter-button active" : "filter-button"} onClick={() => setView("candidates")}><Users size={15} /> Candidates</button>
        <button className={view === "departments" ? "filter-button active" : "filter-button"} onClick={() => setView("departments")}><Building2 size={15} /> Departments</button>
        <button className={view === "joined" ? "filter-button active" : "filter-button"} onClick={() => setView("joined")}><Database size={15} /> Joined records</button>
      </div>
      <p className="civic-count">Showing {counts[0]} of {counts[1]} {counts[2]}</p>
      {view === "candidates" && (
        <div className="civic-grid">
          {!candidates.length && <div className="social-note"><Info size={16} /><div><b>No candidate records match</b><span>Try a different name, party or ward.</span></div></div>}
          {candidates.map((candidate) => {
            const { name, winner } = splitWinner(candidate.full_name);
            const ward = wardParts(candidate.constituency_or_ward);
            const education = cleanEducation(candidate.education_qualification);
            return (
              <article className="civic-tile" key={candidate.id}>
                <header>
                  <div className="civic-title"><b>{name}</b>{winner && <em>Winner</em>}</div>
                  <span className="civic-tag">{candidate.party || "Party n/a"}</span>
                </header>
                <div className="civic-place">{ward.name}{ward.number && <span>Ward {ward.number}</span>}</div>
                <dl className="civic-facts">
                  <div><dt>Education</dt><dd className="clamp" title={education}>{education}</dd></div>
                  <div><dt>Declared assets</dt><dd>{formatInr(candidate.total_assets_inr)}</dd></div>
                </dl>
                <footer>
                  <span>{candidate.election_year || "Year n/a"} MCD election</span>
                  {candidate.source_url && <a href={candidate.source_url} target="_blank" rel="noreferrer noopener">MyNeta record ↗</a>}
                </footer>
              </article>
            );
          })}
        </div>
      )}
      {view === "departments" && (
        <div className="civic-grid">
          {!departments.length && <div className="social-note"><Info size={16} /><div><b>No departments match</b><span>Try a service word such as streetlight, road or water.</span></div></div>}
          {departments.map((department) => (
            <article className="civic-tile" key={department.department_id}>
              <header className="stacked">
                <span className="civic-code">{department.department_id}</span>
                <span className="civic-tag">{department.category}</span>
              </header>
              <h3>{department.department_name}</h3>
              <div className="civic-roles">
                {department.officer_roles.map((role) => (
                  <div className="civic-role" key={role.role_id}>
                    <div className="civic-role-head"><b>{role.designation}</b><span>{role.jurisdiction}</span></div>
                    <ul>{role.responsibilities.map((duty) => <li key={duty}>{duty}</li>)}</ul>
                  </div>
                ))}
              </div>
              <footer>
                <span>{department.officer_roles.length} officer roles</span>
                <div className="civic-keywords">{department.service_keywords.slice(0, 4).map((word) => <span key={word}>{word}</span>)}</div>
              </footer>
            </article>
          ))}
        </div>
      )}
      {view === "joined" && (
        <div className="civic-grid">
          {!joinedRecords.length && <div className="social-note"><Info size={16} /><div><b>No joined records match</b><span>Try a ward name or a candidate's name.</span></div></div>}
          {joinedRecords.map((record) => {
            const { name, winner } = splitWinner(record.politician.full_name);
            const ward = wardParts(record.ward_or_constituency);
            return (
              <article className="civic-tile" key={`${record.ward_or_constituency}-${record.politician.id}`}>
                <header>
                  <span className="civic-code">{ward.number ? `Ward ${ward.number}` : "Ward"}</span>
                  <span className="civic-tag">{record.politician.party || "Party n/a"}</span>
                </header>
                <h3>{ward.name}</h3>
                <div className="civic-place">{name}{winner && <em className="civic-winner">Winner</em>}</div>
                <ul className="civic-chain">
                  {groupDuties(record).map((group) => (
                    <li key={group.department}><span>{group.department}</span><b>{group.roles} {group.roles === 1 ? "role" : "roles"}</b></li>
                  ))}
                </ul>
                <footer><span>{record.responsible_departments.length} linked duties across {groupDuties(record).length} departments</span></footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SocialWatch({ user, setActiveTab }) {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [picked, setPicked] = useState({});
  const [busy, setBusy] = useState("");
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let cancelled = false;
    fetchSignals()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoadError("");
      })
      .catch((error) => !cancelled && setLoadError(error.message));
    return () => {
      cancelled = true;
    };
  }, [refresh]);
  const decide = async (signal, decision) => {
    setBusy(signal.signal_id);
    setProblem("");
    setNotice("");
    try {
      const payload =
        decision === "link"
          ? { decision, asset_id: picked[signal.signal_id] ?? signal.candidate_assets[0]?.asset_id }
          : { decision };
      await reviewSignal(await getIdToken(), signal.signal_id, payload);
      setNotice(
        decision === "link"
          ? "Linked. The report now points at that asset; the asset's status and the ward's score are unchanged."
          : "Dismissed. Thank you for reviewing.",
      );
      setRefresh((count) => count + 1);
    } catch (error) {
      setProblem(error.message);
    } finally {
      setBusy("");
    }
  };
  const snapshot = data?.pipeline?.origin === "rss_snapshot";
  const muted = { color: "#858b9d", fontSize: "11px", lineHeight: 1.6, margin: "10px 0" };
  return (
    <section className="content-view social-watch-view">
      <div className="content-toolbar">
        <div>
          <span className="kicker">PUBLIC SIGNALS / NEWS REPORTS</span>
          <h2>Social Watch</h2>
          <p>Public reports can become leads for civic verification, never automatic truth.</p>
          <span className="directory-disclaimer">
            {!data
              ? "READING REAL NEWS HEADLINES"
              : snapshot
                ? `REAL NEWS HEADLINES · SNAPSHOT FROM ${formatPublished(data.pipeline.fetched_at).toUpperCase()}`
                : "LIVE NEWS FEED"}
          </span>
        </div>
        <div className="directory-count">
          <b>{data ? data.count : "–"}</b>
          <span>reports</span>
        </div>
      </div>
      {!data && !loadError && <p style={muted}>Reading the latest headlines…</p>}
      {!data && loadError && (
        <p style={muted}>Could not load reports: {loadError}. They load from the live API, so they do not appear on bundled demo data.</p>
      )}
      {data && data.count === 0 && <p style={muted}>No reports match right now.</p>}
      {problem && <div className="auth-error">{problem}</div>}
      {notice && <p style={muted}>{notice}</p>}
      <div className="social-report-list">
        {data?.items.map((signal) => {
          const access = reviewAccess({ signal, user });
          const candidates = signal.candidate_assets;
          const typeName = assetTypeLabel(signal.analysis.asset_type);
          const stateText =
            signal.review_state === "linked"
              ? `Linked to ${signal.linked_asset_id}`
              : signal.review_state === "dismissed"
                ? "Dismissed"
                : "Awaiting review";
          return (
            <article className="social-report" key={signal.signal_id}>
              <div className="social-report-top">
                <span className="social-handle">{signal.source}</span>
                <span className="social-status">{stateText}</span>
              </div>
              <p>
                <a className="signal-title" href={safeUrl(signal.url)} target="_blank" rel="noreferrer noopener">
                  {signal.title}
                </a>
              </p>
              <div className="signal-tags">
                <span>{typeName}</span>
                <span>{claimLabel(signal.analysis.claim)}</span>
                <span>{signal.ward ? signal.ward.name : "Citywide · no ward match"}</span>
              </div>
              {signal.analysis.summary && (
                <p className="signal-summary">
                  <b>AI summary</b> {signal.analysis.summary}
                </p>
              )}
              <div className="social-report-footer">
                <span>{formatPublished(signal.published_at)}</span>
                <span>Read at {signal.source} ↗</span>
              </div>
              {access === "review" && (
                <div className="signal-review">
                  {candidates.length > 0 ? (
                    <>
                      <select
                        aria-label="Asset to link"
                        value={picked[signal.signal_id] ?? candidates[0].asset_id}
                        onChange={(event) => setPicked((state) => ({ ...state, [signal.signal_id]: event.target.value }))}
                      >
                        {candidates.map((asset) => (
                          <option key={asset.asset_id} value={asset.asset_id}>
                            {asset.asset_id} · {asset.label}
                          </option>
                        ))}
                      </select>
                      <button disabled={Boolean(busy)} onClick={() => decide(signal, "link")}>
                        {busy === signal.signal_id ? "Saving…" : "Link to asset"}
                      </button>
                    </>
                  ) : (
                    <span className="review-note">
                      {signal.analysis.asset_type === "none"
                        ? "Not about one of the six tracked asset types, so there is nothing to link."
                        : `No ${typeName.toLowerCase()} is tracked in ${signal.ward.name}, so there is nothing to link.`}
                    </span>
                  )}
                  <button className="dispute" disabled={Boolean(busy)} onClick={() => decide(signal, "dismiss")}>
                    Dismiss
                  </button>
                </div>
              )}
              {access === "sign-in" && (
                <p className="review-note">
                  Sign in as a citizen of {signal.ward.name} to review this report.{" "}
                  <button className="link-button" onClick={() => setActiveTab("Login / Signup")}>
                    Sign in
                  </button>
                </p>
              )}
              {access === "other-ward" && (
                <p className="review-note">Only citizens of {signal.ward.name} can review this report.</p>
              )}
              {access === "citywide" && (
                <p className="review-note">No ward is named, so this stays a citywide lead.</p>
              )}
            </article>
          );
        })}
      </div>
      <div className="social-note">
        <ShieldCheck size={16} />
        <div>
          <b>Traceability rule</b>
          <span>
            A report creates a review lead. It does not change an asset status or score until a geo-checked photo or
            officer confirmation is stored. Only the headline, source, link and date are kept; the article stays with the
            publisher.
          </span>
        </div>
      </div>
    </section>
  );
}

const parties = ["All parties", "AAP", "BJP", "INC"];

function Leaderboard({ setActiveTab, setSelectedWard }) {
  const [partyFilter, setPartyFilter] = useState("All parties");
  const [formulaOpen, setFormulaOpen] = useState(false);
  const rankWards = [...wards]
    .filter((ward) => partyFilter === "All parties" || ward.party === partyFilter)
    .sort((a, b) => a.score - b.score);
  return (
    <section className="content-view">
      <div className="content-toolbar">
        <div>
          <span className="kicker">
            ACCOUNTABILITY INDEX · {formattedSyncDate.toUpperCase()}
          </span>
          <h2>Ground-work leaderboard</h2>
          <p>
            Worst to best, based on public utilization and verified reality.
          </p>
        </div>
        <div className="toolbar-actions">
          <button
            className="filter-button"
            onClick={() =>
              setPartyFilter(
                parties[(parties.indexOf(partyFilter) + 1) % parties.length],
              )
            }
          >
            <Filter size={15} /> {partyFilter}
          </button>
          <button
            className="filter-button"
            onClick={() => setFormulaOpen(!formulaOpen)}
          >
            <SlidersHorizontal size={15} /> Formula
          </button>
        </div>
      </div>
      <div className="formula-banner">
        <div className="formula-icon">
          <Gauge size={20} />
        </div>
        <div>
          <b>GROUND-WORK SCORE</b>
          <span>Weighted for evidence, not optics</span>
        </div>
        <div className="formula-values">
          <span>
            40% <small>photo-verified</small>
          </span>
          <span>
            35% <small>paper utilization</small>
          </span>
          <span>
            25% <small>citizen rating</small>
          </span>
        </div>
        <Info size={16} />
      </div>
      {formulaOpen && (
        <p style={{ color: "#858b9d", fontSize: "11px", margin: "-6px 0 13px", lineHeight: 1.6 }}>
          Score = 40% share of assets with photo-verified working status + 35%
          normalized paper utilization rate + 25% normalized citizen rating,
          per ward. Every input traces back to a specific record — open a
          profile to see the exact figures behind a given ward's score. When
          live data is on, an asset counts as verified once a second citizen
          confirms its photo; a ward's seeded baseline gives way to that evidence
          as verified assets accumulate (fully at 3), and tagged wards show it.
        </p>
      )}
      <div className="leaderboard-list">
        {rankWards.length === 0 && (
          <p style={{ color: "#70778a", fontSize: "12px" }}>
            No representatives match this party filter.
          </p>
        )}
        {rankWards.map((ward, index) => (
          <button
            className="leader-row"
            key={ward.id}
            onClick={() => {
              setSelectedWard(ward.name);
              setActiveTab("Rep Profile");
            }}
          >
            <span className="rank">0{index + 1}</span>
            <div className="rank-avatar" style={{ background: ward.color }}>
              {ward.rep
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </div>
            <div className="leader-name">
              <b>{ward.rep}</b>
              <span>
                Ward {ward.id.replace("W-", "")} · {ward.name}{" "}
                <i>{ward.party}</i>
                {scoreSourceLabel(ward) && <em className="source-tag">{scoreSourceLabel(ward)}</em>}
              </span>
            </div>
            <div className="leader-stat">
              <small>INTEGRITY GAP</small>
              <b className={ward.gap > 45 ? "bad" : ""}>{ward.gap} pts</b>
            </div>
            <div className="leader-stat">
              <small>PAPER UTILIZED</small>
              <b>{Math.round((ward.utilized / ward.funds) * 100)}%</b>
            </div>
            <div className="score">
              <small>SCORE</small>
              <b>{ward.score}</b>
              <span>/ 100</span>
            </div>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
      <div className="traceability-callout">
        <ShieldCheck size={17} />
        <div>
          <b>Every score has a paper trail.</b>
          <span>
            Open a profile to inspect the exact fund, photo, and rating inputs
            behind the score.
          </span>
        </div>
        <a href={sources.mplad} target="_blank" rel="noreferrer">
          See methodology ↗
        </a>
      </div>
    </section>
  );
}

function Profile({
  ward,
  assets: wardAssets,
  rating,
  setRating,
  ratingSubmitted,
  setRatingSubmitted,
  user,
  setActiveTab,
  setSelectedWard,
}) {
  // Ratings are real (stored in DynamoDB) when the ward came from the API.
  const fromApi = Boolean(ward.wardId);
  // Rating state is kept per citizen and ward, so switching wards needs no reset.
  const ratingKey = `${user?.id ?? "anon"}:${ward.wardId ?? ward.id}`;
  const [ratingState, setRatingState] = useState({});
  const [rateBusy, setRateBusy] = useState(false);
  const { myRating, picked = 0, aggregate = null, rateError = "" } = ratingState[ratingKey] ?? {};
  const patchRating = (changes) =>
    setRatingState((state) => ({ ...state, [ratingKey]: { ...state[ratingKey], ...changes } }));
  const setPicked = (stars) => patchRating({ picked: stars });
  useEffect(() => {
    if (!authEnabled || !user || user.wardId !== ward.wardId) return undefined;
    let cancelled = false;
    const key = `${user.id}:${ward.wardId}`;
    const save = (changes) =>
      !cancelled && setRatingState((state) => ({ ...state, [key]: { ...state[key], ...changes } }));
    getIdToken()
      .then((token) => fetchMyRating(token))
      .then((result) => save({ myRating: result.stars || null }))
      .catch(() => save({ myRating: null }));
    return () => {
      cancelled = true;
    };
  }, [user, ward.wardId]);
  const panel = ratingPanelState({
    live: authEnabled && fromApi,
    signedIn: Boolean(user),
    userWardId: user?.wardId,
    wardId: ward.wardId,
    myRating,
  });
  const submitRating = async () => {
    setRateBusy(true);
    patchRating({ rateError: "" });
    try {
      const result = await postRating(await getIdToken(), picked);
      patchRating({ myRating: result.stars, aggregate: { count: result.count, average: result.average } });
    } catch (problem) {
      patchRating({ rateError: problem.message });
    } finally {
      setRateBusy(false);
    }
  };
  const realRating = aggregate ?? ratingAggregate(ward);
  // The ward summary is written by the API from this ward's verified figures.
  const [narratives, setNarratives] = useState({});
  const narrative = narratives[ward.wardId];
  useEffect(() => {
    if (!ward.wardId) return undefined;
    let cancelled = false;
    const wardId = ward.wardId;
    const save = (result) => !cancelled && setNarratives((state) => ({ ...state, [wardId]: result }));
    fetchNarrative(wardId)
      .then(save)
      .catch(() => save({ failed: true }));
    return () => {
      cancelled = true;
    };
  }, [ward.wardId, ward.score]);
  const contacts = wardContacts(ward);
  const repInitials = ward.rep.split(" ").map((part) => part[0]).join("");
  const officerInitials = ward.officer.split(" ").filter((part) => /[A-Za-z]/.test(part)).map((part) => part[0]).join("").slice(0, 2);
  const assistantEngineer = ward.assistantOfficer || `${ward.officer.split(" ")[0]} ${ward.officer.split(" ").at(-1)}`;
  const assistantInitials = assistantEngineer.split(" ").filter((part) => /[A-Za-z]/.test(part)).map((part) => part[0]).join("").slice(0, 2);
  const utilizedPct = Math.round((ward.utilized / ward.funds) * 100);
  const verifiedPct = Math.max(utilizedPct - ward.gap, 0);
  const citizenRating = Math.max(1, ward.score / 20).toFixed(1);
  const ratingCount = wardAssets.reduce((sum, asset) => sum + asset.photos, 0);
  return (
    <section className="content-view profile-view">
      <div className="profile-hero">
        <div className="profile-avatar">{repInitials}</div>
        <div className="profile-ident">
          <span className="kicker">
            WARD {ward.id.replace("W-", "")} · {ward.zone.toUpperCase()} ZONE
          </span>
          <h2>{ward.rep}</h2>
          <p>
            <span className="party-badge">{ward.party}</span> Corporator ·{" "}
            {ward.name}
          </p>
          <div className="social-links">
            <span>◎ {contacts.representative}</span>
            <span>◉ contact verified</span>
          </div>
        </div>
        <div className="profile-score">
          <small>GROUND-WORK SCORE</small>
          <strong>
            {ward.score}
            <span>/100</span>
          </strong>
          <div className="score-track">
            <i style={{ width: `${ward.score}%` }} />
          </div>
          {scoreSourceLabel(ward) && <span className="source-tag">{scoreSourceLabel(ward)}</span>}
          <a href={sources.mplad} target="_blank" rel="noreferrer">
            Why this score? ↗
          </a>
        </div>
      </div>
      <div className="metric-grid">
        <div className="metric-card">
          <small>FUNDS ALLOCATED</small>
          <b>{formatMoney(ward.funds)}</b>
          <span>Public record · MPLAD</span>
          <a href={sources.mplad} target="_blank" rel="noreferrer">
            Source ↗
          </a>
        </div>
        <div className="metric-card">
          <small>PAPER UTILIZED</small>
          <b>{utilizedPct}%</b>
          <span>{formatMoney(ward.utilized)} recorded</span>
          <a href={sources.mplad} target="_blank" rel="noreferrer">
            Source ↗
          </a>
        </div>
        <div className="metric-card highlight">
          <small>INTEGRITY GAP</small>
          <b>
            {ward.gap}
            <span> pts</span>
          </b>
          <span>{utilizedPct}% paper / {verifiedPct}% verified reality</span>
          <a href={sources.mplad} target="_blank" rel="noreferrer">
            Inspect calculation ↗
          </a>
        </div>
        <div className="metric-card">
          <small>CITIZEN RATING</small>
          <b>
            {fromApi ? realRating.average ?? "—" : citizenRating}<span>/5</span>
          </b>
          <span>
            {fromApi
              ? realRating.count
                ? `${realRating.count} ward-verified ${realRating.count === 1 ? "rating" : "ratings"}`
                : "No ratings yet"
              : `${ratingCount} ward-verified ratings`}
          </span>
          <button
            onClick={() =>
              document.getElementById("rate-box")?.scrollIntoView()
            }
          >
            Rate this rep →
          </button>
        </div>
      </div>
      {fromApi && !narrative?.failed && (
        <div className="ward-summary">
          <span className="kicker">
            WARD SUMMARY · {!narrative ? "WRITING" : narrative.source === "ai" ? "AI-WRITTEN" : "AUTO-GENERATED"}
          </span>
          <p>{narrative ? narrative.text : "Writing a short summary from this ward's verified figures…"}</p>
          <small>
            Built only from the figures on this page. It describes the gap between records and citizen evidence, not a finding of wrongdoing.
          </small>
        </div>
      )}
      <div className="profile-columns">
        <div className="timeline-panel">
          <div className="panel-title">
            <div>
              <span className="kicker">PROMISE VS. DELIVERY</span>
              <h3>A term in public works</h3>
            </div>
            <span className="timeline-legend">
              <i className="on-time" /> On time <i className="delayed" />{" "}
              Delayed <i className="never" /> Never delivered
            </span>
          </div>
          <div className="timeline">
            <div className="timeline-axis">
              <span>JAN '24</span>
              <span>APR '24</span>
              <span>JUL '24</span>
              <span>OCT '24</span>
              <span>NOW</span>
            </div>
            {wardAssets.map((asset, index) => {
              const isDelayed = asset.status === "dead" || asset.status === "critical";
              return (
                <div className="timeline-row" key={asset.id}>
                  <div className="timeline-label">
                    <b>{asset.type}</b>
                    <span>{asset.id}</span>
                  </div>
                  <div className="timeline-track">
                    <span
                      className={isDelayed ? "timeline-bar delayed-bar" : "timeline-bar working-bar"}
                      style={{
                        left: `${index * 7 + 5}%`,
                        width: `${isDelayed ? 36 : 27}%`,
                      }}
                    />
                    <i
                      className={isDelayed ? "timeline-point dead-point" : "timeline-point"}
                      style={{ left: `${index * 7 + 28}%` }}
                    />
                  </div>
                  <span className="timeline-status">
                    {asset.status === "critical" ? "Flagged" : isDelayed ? "Delayed" : "Working"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="timeline-foot">
            <Clock3 size={15} /> The timeline uses sanction dates, expected
            completion, and current photo status.{" "}
            <a href={sources.mplad} target="_blank" rel="noreferrer">
              View source records ↗
            </a>
          </div>
        </div>
        <div className="profile-side">
          <div className="officer-panel">
            <div className="panel-title">
              <div>
                <span className="kicker">CIVIC RESPONSIBILITY</span>
                <h3>On the ground</h3>
              </div>
              <Users size={17} />
            </div>
            <div className="officer-card">
              <div className="avatar officer">{officerInitials}</div>
              <div>
                <b>{ward.officer}</b>
                <span>Executive Engineer</span>
                <small>{ward.zone} Zone · MCD</small>
              </div>
              <BadgeCheck size={15} />
            </div>
            <div className="officer-card">
              <div className="avatar officer alt">{assistantInitials}</div>
              <div>
                <b>{assistantEngineer}</b>
                <span>Assistant Engineer</span>
                <small>Ward {ward.id.replace("W-", "")}</small>
              </div>
              <BadgeCheck size={15} />
            </div>
            <a
              className="panel-link"
              href={sources.officers}
              target="_blank"
              rel="noreferrer"
            >
              MCD officer disclosure ↗
            </a>
          </div>
          <div className="rate-panel" id="rate-box">
            <div className="panel-title">
              <div>
                <span className="kicker">WARD-LOCKED RATING</span>
                <h3>How is delivery feeling?</h3>
              </div>
              <Star size={17} />
            </div>
            {panel === "demo" || panel === "can-rate" || panel === "rated" ? (
              <div className="stars">
                {[1, 2, 3, 4, 5].map((value) => {
                  const shown = panel === "demo" ? rating : panel === "rated" ? myRating : picked;
                  return (
                    <button
                      key={value}
                      disabled={panel === "rated"}
                      className={shown >= value ? "star active" : "star"}
                      onClick={() => (panel === "demo" ? setRating(value) : setPicked(value))}
                    >
                      <Star size={20} fill={shown >= value ? "currentColor" : "none"} />
                    </button>
                  );
                })}
              </div>
            ) : null}
            {panel === "demo" &&
              (ratingSubmitted ? (
                <div className="rating-confirm">
                  <Check size={15} /> Rating saved for Ward {ward.id.replace("W-", "")}
                </div>
              ) : (
                <button className="submit-rating" disabled={!rating} onClick={() => setRatingSubmitted(true)}>
                  Submit rating <ArrowUpRight size={15} />
                </button>
              ))}
            {panel === "login" && (
              <>
                <p style={{ color: "#858b9d", fontSize: "11px", lineHeight: 1.6, margin: "14px 0" }}>
                  Log in as a verified citizen of this ward to rate its representative.
                </p>
                <button className="submit-rating" onClick={() => setActiveTab("Login / Signup")}>
                  Log in or sign up <ArrowUpRight size={15} />
                </button>
              </>
            )}
            {panel === "other-ward" && (
              <>
                <p style={{ color: "#858b9d", fontSize: "11px", lineHeight: 1.6, margin: "14px 0" }}>
                  Your account is locked to{" "}
                  {wards.find((item) => item.wardId === user.wardId)?.name ?? user.wardId}, so you can rate only that
                  ward's representative. This is what stops rating campaigns from outside a ward.
                </p>
                {wards.some((item) => item.wardId === user.wardId) && (
                  <button
                    className="submit-rating"
                    onClick={() => setSelectedWard(wards.find((item) => item.wardId === user.wardId).name)}
                  >
                    Open my ward's profile <ArrowUpRight size={15} />
                  </button>
                )}
              </>
            )}
            {panel === "loading" && (
              <p style={{ color: "#858b9d", fontSize: "11px", margin: "14px 0" }}>Checking your rating…</p>
            )}
            {panel === "rated" && (
              <div className="rating-confirm">
                <Check size={15} /> You rated this representative {myRating}/5.
              </div>
            )}
            {panel === "can-rate" && (
              <button className="submit-rating" disabled={!picked || rateBusy} onClick={submitRating}>
                {rateBusy ? "Saving…" : "Submit rating"} <ArrowUpRight size={15} />
              </button>
            )}
            {rateError && <div className="auth-error">{rateError}</div>}
            <small className="rating-note">
              <ShieldCheck size={12} /> Verified residents can rate their own
              ward only.
            </small>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReportView({ reportImage, setReportImage, submitted, setSubmitted }) {
  const [assetType, setAssetType] = useState("Streetlight");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState("dead");

  return (
    <section className="content-view form-view">
      <div className="form-intro">
        <span className="kicker">CITIZEN SIGNAL / NEW REPORT</span>
        <h2>Put a broken asset on the map.</h2>
        <p>
          Upload evidence, let the geo-check do its work, and make the
          responsible chain visible.
        </p>
      </div>
      <div className="form-layout">
        <div className={reportImage ? "upload-zone has-upload" : "upload-zone"}>
          <div className="upload-icon">
            <Upload size={25} />
          </div>
          <h3>{reportImage ? reportImage.name : "Drop a photo here"}</h3>
          <p>JPG or PNG · up to 10MB</p>
          <label className="primary-action upload-button">
            <ImagePlus size={16} /> {reportImage ? "Replace photo" : "Choose photo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setReportImage(event.target.files?.[0] || null)}
            />
          </label>
          {reportImage && <span className="upload-file-meta">{Math.round(reportImage.size / 1024)} KB · ready to upload</span>}
          <span className="upload-note">
            <ShieldCheck size={13} /> Location metadata checked on upload
          </span>
        </div>
        <div className="form-fields">
          <label>
            What are you reporting?
            <select value={assetType} onChange={(event) => setAssetType(event.target.value)}>
              <option>Streetlight</option>
              <option>Water pump</option>
              <option>Hydrant</option>
              <option>Pothole</option>
              <option>Divider</option>
              <option>Building / structure</option>
              <option>Work in progress</option>
              <option>Other public asset</option>
            </select>
          </label>
          <label>
            Where is it?
            <div className="input-with-icon">
              <MapPin size={15} />
              <input
                placeholder="Search an address or asset ID"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
          </label>
          <label>
            What is the current state?
            <div className="choice-grid">
              <button
                className={condition === "dead" ? "choice active" : "choice"}
                onClick={() => setCondition("dead")}
              >
                <CircleAlert size={16} /> Dead / missing
              </button>
              <button
                className={condition === "intermittent" ? "choice active" : "choice"}
                onClick={() => setCondition("intermittent")}
              >
                <Clock3 size={16} /> Intermittent
              </button>
            </div>
          </label>
          <button className="submit-form" disabled={!reportImage} onClick={() => setSubmitted(true)}>
            {submitted ? "Report submitted" : "Submit report"} <ArrowUpRight size={16} />
          </button>
          {submitted && (
            <div className="public-url-card">
              <div>
                <small>
                  {assetType.toUpperCase()} · {condition === "dead" ? "DEAD / MISSING" : "INTERMITTENT"}
                  {location ? ` · ${location.toUpperCase()}` : ""}
                </small>
                <b>Demo only: new-asset reports are not stored yet.</b>
                <span className="upload-note">To add real photo evidence to an existing asset, use Civic Proof.</span>
              </div>
            </div>
          )}
          <p className="form-footnote">
            <Info size={13} /> You will need a verified email + phone to submit.
            Your identity stays private; your ward is shown.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProofView({
  selectedAsset,
  setSelectedAsset,
  submitted,
  setSubmitted,
  user,
  setActiveTab,
}) {
  const [proofType, setProofType] = useState("broken");
  // With API data, photos are real (stored in S3) and uploads need a ward-locked login.
  const fromApi = Boolean(selectedAsset.wardId);
  const panel = proofPanelState({
    live: authEnabled && fromApi,
    signedIn: Boolean(user),
    userWardId: user?.wardId,
    assetWardId: selectedAsset.wardId,
  });
  const [evidenceByAsset, setEvidenceByAsset] = useState({});
  const [refresh, setRefresh] = useState(0);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");
  const [mineByAsset, setMineByAsset] = useState({});
  const [reviewing, setReviewing] = useState("");
  const evidence = evidenceByAsset[selectedAsset.id];
  const mineIds = mineByAsset[selectedAsset.id];
  useEffect(() => {
    if (!fromApi) return undefined;
    let cancelled = false;
    const assetId = selectedAsset.id;
    const save = (result) => !cancelled && setEvidenceByAsset((state) => ({ ...state, [assetId]: result }));
    fetchEvidence(assetId)
      .then((items) => save({ items }))
      .catch((error) => save({ error: error.message }));
    return () => {
      cancelled = true;
    };
  }, [selectedAsset.id, fromApi, refresh]);
  useEffect(() => {
    if (panel !== "can-upload") return undefined;
    let cancelled = false;
    const assetId = selectedAsset.id;
    getIdToken()
      .then((token) => fetchMyEvidence(token, assetId))
      .then((ids) => !cancelled && setMineByAsset((state) => ({ ...state, [assetId]: ids })))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedAsset.id, panel, refresh]);
  const reviewPhoto = async (entry, decision) => {
    setReviewing(entry.evidence_id);
    setProblem("");
    setNotice("");
    try {
      const result = await reviewEvidence(await getIdToken(), {
        asset_id: selectedAsset.id,
        evidence_id: entry.evidence_id,
        decision,
      });
      if (result.asset_status !== selectedAsset.status) {
        const updated = { ...selectedAsset, status: result.asset_status };
        replaceAsset(updated);
        setSelectedAsset(updated);
      }
      setNotice(
        decision === "confirm" && result.asset_status !== selectedAsset.status
          ? `${REVIEW_NOTICE.confirm} The asset is now marked ${statusMeta[result.asset_status].label.toLowerCase()}.`
          : REVIEW_NOTICE[decision],
      );
      setRefresh((count) => count + 1);
    } catch (error) {
      setProblem(error.message);
    } finally {
      setReviewing("");
    }
  };
  const submitProof = async () => {
    setBusy(true);
    setProblem("");
    setNotice("");
    try {
      const position = await getPosition();
      const result = await uploadProof({
        file,
        assetId: selectedAsset.id,
        verdict: proofType === "broken" ? "broken" : "working",
        idToken: await getIdToken(),
        position,
        api: { requestUploadUrl, uploadPhoto, submitEvidence },
      });
      setNotice(
        position
          ? `Saved: ${locationLabel(result)}.`
          : "Saved, but your location was not shared, so the photo is labelled 'location not shared'.",
      );
      setFile(null);
      setRefresh((count) => count + 1);
    } catch (error) {
      setProblem(error.message);
    } finally {
      setBusy(false);
    }
  };
  const muted = { color: "#858b9d", fontSize: "11px", lineHeight: 1.6, margin: "10px 0" };
  const myWardId = user?.wardId;
  const myWardName = user ? (wards.find((item) => item.wardId === myWardId)?.name ?? myWardId) : "";
  const wardChoices = [];
  for (const asset of assets) {
    let choice = wardChoices.find((item) => item.value === asset.ward);
    if (!choice) {
      choice = { value: asset.ward, name: asset.wardName, mine: Boolean(myWardId) && asset.wardId === myWardId, count: 0 };
      wardChoices.push(choice);
    }
    choice.count += 1;
  }
  wardChoices.sort((a, b) => Number(b.mine) - Number(a.mine) || a.name.localeCompare(b.name));
  const wardAssets = assets.filter((asset) => asset.ward === selectedAsset.ward);
  const myFirstAsset = myWardId ? assets.find((asset) => asset.wardId === myWardId) : null;
  return (
    <section className="content-view proof-view">
      <div className="content-toolbar">
        <div>
          <span className="kicker">CIVIC PROOF / EXISTING ASSET</span>
          <h2>Show what changed.</h2>
          <p>
            Add a fresh photo against an existing public work. Every submission
            starts unverified.
          </p>
        </div>
        <div className="verified-user">
          {user ? (
            <>
              <span className="online-dot" /> Verified citizen · your ward: {myWardName} <BadgeCheck size={15} />
            </>
          ) : authEnabled && fromApi ? (
            <>
              Not signed in ·{" "}
              <button type="button" className="link-button" onClick={() => setActiveTab("Login / Signup")}>
                log in to add evidence
              </button>
            </>
          ) : (
            <>Demo mode · nothing is saved</>
          )}
        </div>
      </div>
      <div className="proof-layout">
        <div className="proof-target">
          <div className="proof-target-head">
            <span className="kicker">SELECT TARGET ASSET</span>
            <div className="proof-pickers">
              <div className="proof-picker">
                <small>WARD</small>
                <SelectMenu
                  ariaLabel="Ward"
                  className="select-box select-block"
                  value={selectedAsset.ward}
                  onChange={(wardKey) => {
                    const first = assets.find((asset) => asset.ward === wardKey);
                    if (first) setSelectedAsset(first);
                  }}
                  options={wardChoices.map((choice) => ({
                    value: choice.value,
                    label: choice.mine ? `${choice.name} · your ward` : choice.name,
                    hint: `${choice.count} ${choice.count === 1 ? "asset" : "assets"}`,
                  }))}
                />
              </div>
              <div className="proof-picker">
                <small>ASSET</small>
                <SelectMenu
                  ariaLabel="Target asset"
                  listMinWidth={560}
                  className="select-box select-block"
                  value={selectedAsset.id}
                  onChange={(id) => setSelectedAsset(assets.find((asset) => asset.id === id) || selectedAsset)}
                  options={wardAssets.map((asset) => ({
                    value: asset.id,
                    label: `${asset.id} · ${asset.label}`,
                    hint: statusMeta[asset.status].label,
                  }))}
                />
              </div>
            </div>
            {myWardId && !myFirstAsset && (
              <p style={muted}>Your ward ({myWardName}) has no tracked assets yet, so there is nothing to add evidence to.</p>
            )}
          </div>
          <div className="proof-asset">
            <div className="asset-type-icon">
              <Camera size={20} />
            </div>
            <div>
              <b>{selectedAsset.label}</b>
              <span>
                {selectedAsset.wardName} · {selectedAsset.id}
              </span>
            </div>
            <span
              className="status-chip"
              style={{
                color: statusMeta[selectedAsset.status].color,
                background: `${statusMeta[selectedAsset.status].color}18`,
              }}
            >
              <span
                style={{ background: statusMeta[selectedAsset.status].color }}
              />{" "}
              {statusMeta[selectedAsset.status].label}
            </span>
          </div>
          <div className="proof-history">
            <div className="list-title">
              PHOTO TIMELINE{" "}
              <span>
                {fromApi
                  ? `${evidence?.items?.length ?? 0} citizen photos`
                  : `${selectedAsset.photos + (submitted ? 1 : 0)} submissions`}
              </span>
            </div>
            {fromApi && !evidence && <p style={muted}>Loading photos…</p>}
            {fromApi && evidence?.error && <p style={muted}>Could not load photos: {evidence.error}</p>}
            {fromApi && evidence?.items?.length === 0 && (
              <p style={muted}>No citizen photos for this asset yet.</p>
            )}
            {fromApi &&
              evidence?.items?.map((entry) => {
                const review = reviewState({ panel, entry, mineIds });
                return (
                  <div className="photo-row" key={entry.evidence_id}>
                    <a href={entry.photo_url} target="_blank" rel="noreferrer">
                      <img
                        src={entry.photo_url}
                        alt={entry.verdict === "broken" ? "Photo showing the asset still broken" : "Photo showing the asset fixed"}
                        style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 5, display: "block" }}
                      />
                    </a>
                    <div>
                      <b>{entry.verdict === "broken" ? "Still broken" : "Fixed now"}</b>
                      <span>
                        {new Date(entry.created_at).toLocaleString("en-GB", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}{" "}
                        · {locationLabel(entry)}
                      </span>
                      {review === "can-review" && (
                        <div className="review-actions">
                          <button disabled={Boolean(reviewing)} onClick={() => reviewPhoto(entry, "confirm")}>
                            {reviewing === entry.evidence_id ? "Saving…" : "Confirm"}
                          </button>
                          <button className="dispute" disabled={Boolean(reviewing)} onClick={() => reviewPhoto(entry, "dispute")}>
                            Dispute
                          </button>
                        </div>
                      )}
                      {review === "own" && <span className="review-note">Yours · waits for a second citizen to confirm</span>}
                    </div>
                    <em className={entry.status === "verified" ? "verified-em" : entry.status === "disputed" ? "disputed-em" : ""}>
                      {entry.status}
                    </em>
                  </div>
                );
              })}
            {!fromApi && (
              <>
                <div className="photo-row">
                  <div className="photo-placeholder dead-photo">
                    <CircleAlert size={20} />
                  </div>
                  <div>
                    <b>Still broken</b>
                    <span>Ward 042 · 18 Sep 2024, 09:21</span>
                  </div>
                  <em>unverified</em>
                </div>
                <div className="photo-row">
                  <div className="photo-placeholder">
                    <Check size={20} />
                  </div>
                  <div>
                    <b>Fixed now</b>
                    <span>Ward 042 · 02 Sep 2024, 17:42</span>
                  </div>
                  <em className="verified-em">verified</em>
                </div>
              </>
            )}
            {!fromApi && submitted && (
              <div className="photo-row new-photo">
                <div className="photo-placeholder new">
                  {proofType === "broken" ? <CircleAlert size={20} /> : <Check size={20} />}
                </div>
                <div>
                  <b>{proofType === "broken" ? "Still broken" : "Fixed now"}</b>
                  <span>{selectedAsset.wardName} · just now</span>
                </div>
                <em>unverified</em>
              </div>
            )}
          </div>
        </div>
        <div className="proof-upload">
          <div className="upload-zone compact">
            <div className="upload-icon">
              <Camera size={21} />
            </div>
            <h3>Add evidence</h3>
            <p>Choose a photo and tell us what you see.</p>
            {(panel === "demo" || panel === "can-upload") && (
              <div className="proof-type">
                <button
                  className={proofType === "broken" ? "choice active" : "choice"}
                  onClick={() => setProofType("broken")}
                >
                  <CircleAlert size={15} /> Still broken
                </button>
                <button
                  className={proofType === "fixed" ? "choice active" : "choice"}
                  onClick={() => setProofType("fixed")}
                >
                  <Check size={15} /> Fixed now
                </button>
              </div>
            )}
            {panel === "demo" && (
              <button className="primary-action" onClick={() => setSubmitted(true)}>
                <Upload size={16} /> {submitted ? "Evidence submitted" : "Upload proof"}
              </button>
            )}
            {panel === "login" && (
              <>
                <p style={muted}>Log in as a verified citizen of {selectedAsset.wardName} to add evidence.</p>
                <button className="primary-action" onClick={() => setActiveTab("Login / Signup")}>
                  Log in or sign up
                </button>
              </>
            )}
            {panel === "other-ward" && (
              <p style={muted}>
                Your account is locked to {myWardName}, so you can add evidence only for assets in that ward
                (you can still look at photos anywhere).
              </p>
            )}
            {panel === "other-ward" && myFirstAsset && (
              <button className="primary-action" onClick={() => setSelectedAsset(myFirstAsset)}>
                Show {myWardName} assets
              </button>
            )}
            {panel === "can-upload" && (
              <>
                <label className="primary-action upload-button">
                  <ImagePlus size={16} /> {file ? "Replace photo" : "Choose photo"}
                  <input
                    key={refresh}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      setFile(event.target.files?.[0] ?? null);
                      setProblem("");
                      setNotice("");
                    }}
                  />
                </label>
                {file && <span className="upload-file-meta">{file.name} · {Math.round(file.size / 1024)} KB</span>}
                <button className="primary-action" disabled={!file || busy} onClick={submitProof}>
                  <Upload size={16} /> {busy ? "Uploading…" : "Upload proof"}
                </button>
              </>
            )}
            {problem && <div className="auth-error">{problem}</div>}
            {notice && <p style={muted}>{notice}</p>}
            <span className="upload-note">
              <ShieldCheck size={13} />{" "}
              {panel === "demo"
                ? "GPS within 50m of asset required"
                : "Your distance from the asset is recorded and shown with the photo"}
            </span>
          </div>
          <div className="proof-rules">
            <div>
              <ShieldCheck size={16} />
              <b>Two-person verification</b>
              <span>
                {panel === "demo"
                  ? "A second citizen or admin must confirm before status changes."
                  : "A second citizen of this ward must confirm a photo before it changes the asset's status. You cannot confirm your own."}
              </span>
            </div>
            <div>
              <MapPin size={16} />
              <b>Location checked</b>
              <span>Geo-tag must match the registered asset location.</span>
            </div>
            <div>
              <MessageSquare size={16} />
              <b>Identity protected</b>
              <span>Only ward and timestamp appear publicly.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthView(props) {
  return authEnabled ? (
    <CognitoAuthView {...props} />
  ) : (
    <DemoAuthView mode={props.mode} setMode={props.setMode} />
  );
}

const passwordProblem = (password) =>
  password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)
    ? "Password must be at least 8 characters with upper case, lower case and a number."
    : "";

function AuthVisual() {
  return (
    <div className="auth-visual">
      <span className="kicker">NIRVASAN IDENTITY LAYER</span>
      <h2>Make your ward<br /><em>countable.</em></h2>
      <p>Verified residents can report assets, upload civic proof, and rate representatives only within their own ward.</p>
      <div className="auth-signal"><span className="online-dot" /><b>WARD-LOCKED ACCESS</b><small>ward is chosen once and cannot be changed</small></div>
    </div>
  );
}

function CognitoAuthView({ mode, setMode, user, setUser }) {
  const [step, setStep] = useState("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [apiCheck, setApiCheck] = useState("");
  const [form, setForm] = useState({ name: "", pincode: "", ward: "", email: "", phone: "", password: "", code: "" });
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    getIdToken()
      .then((token) => fetchMe(token))
      .then((me) => !cancelled && setApiCheck(`Server confirms ${me.email} · ward ${me.ward_id}`))
      .catch((problem) => !cancelled && setApiCheck(`Server check failed: ${problem.message}`));
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (user) {
    const ward = wards.find((item) => (item.wardId ?? item.id) === user.wardId);
    return (
      <section className="auth-shell">
        <AuthVisual />
        <div className="auth-card">
          <div className="auth-heading">
            <span className="kicker">SIGNED IN</span>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
          <div className="auth-success">
            <BadgeCheck size={18} />
            <div>
              <b>Ward-locked to {ward ? ward.name : user.wardId}</b>
              <span>{apiCheck || "Checking with the server…"}</span>
            </div>
          </div>
          <button className="auth-submit" type="button" onClick={() => { signOut(); setUser(null); setStep("form"); }}>
            Sign out
          </button>
        </div>
      </section>
    );
  }

  const finishSignIn = async () => {
    setUser(await signIn(form.email, form.password));
    setForm((current) => ({ ...current, password: "", code: "" }));
    setStep("form");
    setNotice("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (step === "form" && mode === "signup") {
      if (!form.name.trim() || !/^\d{6}$/.test(form.pincode) || !form.ward) {
        return setError("Enter your name, a 6-digit pincode, and select your ward.");
      }
      if (!toE164(form.phone)) return setError("Enter a valid 10-digit mobile number.");
      if (passwordProblem(form.password)) return setError(passwordProblem(form.password));
      if (wards.some((item) => !item.wardId)) {
        return setError("The ward list is still loading from the server. Try again in a moment.");
      }
    }
    setBusy(true);
    try {
      if (step === "confirm") {
        await confirmSignUp(form.email, form.code);
        await finishSignIn();
      } else if (mode === "signup") {
        await signUp({ ...form, wardId: form.ward });
        setStep("confirm");
        setNotice(`We emailed a 6-digit code to ${form.email}. Enter it to finish.`);
      } else {
        await finishSignIn();
      }
    } catch (problem) {
      if (problem?.code === "UserNotConfirmedException") {
        await resendCode(form.email).catch(() => {});
        setStep("confirm");
        setNotice("Your email is not confirmed yet. We sent a new code.");
      } else {
        setError(friendlyError(problem));
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError("");
    try {
      await resendCode(form.email);
      setNotice(`A new code was sent to ${form.email}.`);
    } catch (problem) {
      setError(friendlyError(problem));
    }
  };

  const confirming = step === "confirm";
  return (
    <section className="auth-shell">
      <AuthVisual />
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-tabs">
          <button type="button" disabled={confirming} className={mode === "signup" ? "auth-tab active" : "auth-tab"} onClick={() => setMode("signup")}>Create account</button>
          <button type="button" disabled={confirming} className={mode === "login" ? "auth-tab active" : "auth-tab"} onClick={() => setMode("login")}>Log in</button>
        </div>
        <div className="auth-heading">
          <span className="kicker">{confirming ? "CONFIRM YOUR EMAIL" : mode === "signup" ? "NEW CITIZEN PROFILE" : "WELCOME BACK"}</span>
          <h3>{confirming ? "Enter the code we emailed." : mode === "signup" ? "Enter your ward identity." : "Continue your civic work."}</h3>
          <p>{mode === "signup" ? "Your ward and pincode are locked once your account is created." : "Log in with your email and password."}</p>
        </div>
        {confirming ? (
          <label>Confirmation code<input value={form.code} onChange={update("code")} required inputMode="numeric" maxLength="6" placeholder="123456" /></label>
        ) : (
          <>
            {mode === "signup" && (
              <>
                <label>Full name<input value={form.name} onChange={update("name")} required placeholder="e.g. Aditi Sharma" /></label>
                <div className="auth-row">
                  <label>Pincode<input value={form.pincode} onChange={update("pincode")} required inputMode="numeric" maxLength="6" placeholder="110019" /></label>
                  <label>Ward
                    <select value={form.ward} onChange={update("ward")} required>
                      <option value="">Select ward</option>
                      {wards.map((ward) => <option key={ward.id} value={ward.wardId ?? ward.id}>{ward.id} · {ward.name}</option>)}
                    </select>
                  </label>
                </div>
              </>
            )}
            <label>Email address<input value={form.email} onChange={update("email")} required type="email" autoComplete="email" placeholder="you@example.com" /></label>
            {mode === "signup" && (
              <label>Phone number<div className="phone-input"><span>+91</span><input value={form.phone} onChange={update("phone")} required type="tel" placeholder="98765 43210" /></div></label>
            )}
            <label>Password<input value={form.password} onChange={update("password")} required type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="At least 8 characters" /></label>
          </>
        )}
        {notice && <p style={{ color: "#858b9d", fontSize: "11px", lineHeight: 1.6 }}>{notice}</p>}
        {error && <div className="auth-error">{error}</div>}
        <button className="auth-submit" type="submit" disabled={busy}>
          {busy ? "Please wait…" : confirming ? "Confirm and sign in" : mode === "signup" ? "Create account" : "Log in"}
          <ArrowUpRight size={16} />
        </button>
        {confirming && <button type="button" className="secondary-action" onClick={resend}>Send a new code</button>}
        <div className="auth-foot"><ShieldCheck size={14} /><span>We never display your identity publicly. Only your ward and timestamp appear on reports.</span></div>
      </form>
    </section>
  );
}

function DemoAuthView({ mode, setMode }) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", pincode: "", ward: "", email: "", phone: "" });
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const handleSubmit = (event) => {
    event.preventDefault();
    if (mode === "signup" && (!form.name || form.pincode.length !== 6 || !form.ward)) {
      setError("Enter your name, a 6-digit pincode, and select your ward.");
      return;
    }
    if (!form.email || form.phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid email and 10-digit phone number.");
      return;
    }
    setError("");
    setSubmitted(true);
  };
  return (
    <section className="auth-shell">
      <div className="auth-visual">
        <span className="kicker">NIRVASAN IDENTITY LAYER</span>
        <h2>Make your ward<br /><em>countable.</em></h2>
        <p>Verified residents can report assets, upload civic proof, and rate representatives only within their own ward.</p>
        <div className="auth-signal"><span className="online-dot" /><b>WARD-LOCKED ACCESS</b><small>pincode → ward → civic permissions</small></div>
      </div>
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-tabs"><button type="button" className={mode === "signup" ? "auth-tab active" : "auth-tab"} onClick={() => setMode("signup")}>Create account</button><button type="button" className={mode === "login" ? "auth-tab active" : "auth-tab"} onClick={() => setMode("login")}>Log in</button></div>
        <div className="auth-heading"><span className="kicker">{mode === "signup" ? "NEW CITIZEN PROFILE" : "WELCOME BACK"}</span><h3>{mode === "signup" ? "Enter your ward identity." : "Continue your civic work."}</h3><p>{mode === "signup" ? "Your pincode and ward are locked after verification." : "Use your verified email and phone to continue."}</p></div>
        {mode === "signup" && <><label>Full name<input value={form.name} onChange={update("name")} required placeholder="e.g. Aditi Sharma" /></label><div className="auth-row"><label>Pincode<input value={form.pincode} onChange={update("pincode")} required inputMode="numeric" maxLength="6" placeholder="110019" /></label><label>Ward<select value={form.ward} onChange={update("ward")} required><option value="">Select ward</option>{wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.id} · {ward.name}</option>)}</select></label></div></>}
        <label>Email address<input value={form.email} onChange={update("email")} required type="email" placeholder="you@example.com" /></label><label>Phone number<div className="phone-input"><span>+91</span><input value={form.phone} onChange={update("phone")} required type="tel" placeholder="98765 43210" /></div></label>
        {error && <div className="auth-error">{error}</div>}
        {submitted ? <div className="auth-success"><BadgeCheck size={18}/><div><b>Identity saved</b><span>{form.name || form.email} is ready for ward-locked reports, proof uploads, and ratings.</span></div></div> : <button className="auth-submit" type="submit">{mode === "signup" ? "Save identity" : "Continue as citizen"}<ArrowUpRight size={16} /></button>}
        <div className="auth-foot"><ShieldCheck size={14} /><span>We never display your identity publicly. Only your ward and timestamp appear on reports.</span></div>
      </form>
    </section>
  );
}

export default App;
