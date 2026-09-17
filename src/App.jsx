import { useEffect, useState } from "react";
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
import {
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
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
const statusMeta = {
  dead: { label: "Dead / missing", color: "#ff8a22" },
  working: { label: "Verified working", color: "#1976d2" },
  unverified: { label: "Unverified", color: "#ff8a22" },
  "in-progress": { label: "Work in progress", color: "#fff" },
};
const wardContacts = (ward) => ({
  representative: `@${ward.rep.toLowerCase().replace(/\s+/g, "_")}_mcd`,
  representativePhone: "+91 11 2345 0" + ward.id.slice(-2),
  officerEmail: `${ward.officer.toLowerCase().replace(/[^a-z]/g, ".")}@mcd.delhi.gov.in`,
  officerPhone: "+91 11 2654 0" + ward.id.slice(-2),
});
const socialReports = [
  { id: "X-DEL-021", handle: "@southdelhi_watch", text: "Dark crossing reported again near Nehru Place. Work was marked complete last quarter.", ward: "Kalkaji", time: "18 min ago", status: "Needs review", source: "X public post" },
  { id: "X-DEL-022", handle: "@rohini_residents", text: "Rohini Sector 9 park pump is running after the repair visit.", ward: "Rohini", time: "43 min ago", status: "Matched to asset", source: "X public post" },
  { id: "X-DEL-023", handle: "@dwarka_civic", text: "Streetlight upgrade at Sector 10 is visible and working tonight.", ward: "Dwarka", time: "1 hr ago", status: "Matched to asset", source: "X public post" },
];
const markerSymbols = {
  Streetlight: "✦",
  "Water pump": "♒",
  Hydrant: "◉",
  Pothole: "!",
  Divider: "▥",
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
const wardShape = (wardId, index) => {
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

function WardFocus({ selectedWard }) {
  const map = useMap();
  useEffect(() => {
    if (selectedWard === "All wards") {
      map.setView([28.635, 77.21], 10.8, { animate: true });
      return;
    }
    const ward = wards.find((item) => item.name === selectedWard);
    if (!ward) return;
    map.fitBounds(wardShape(ward.id, wards.indexOf(ward)), {
      padding: [40, 40],
      maxZoom: 15,
      animate: true,
    });
  }, [map, selectedWard]);
  return null;
}

function WardDatasetLayer({ setSelectedWard }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(sources.wardsGeoJson)
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);
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
        const label =
          properties.ward_no ||
          properties.WARD_NO ||
          properties.ward ||
          properties.WARD ||
          "Delhi ward";
        layer.bindTooltip(`Ward ${label} · DataMeet boundary`, {
          sticky: true,
        });
        layer.on({
          click: () => {
            const match = wards.find(
              (ward) => ward.id.replace("W-", "") === String(label),
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

function App() {
  const [activeTab, setActiveTab] = useState("Map");
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);
  const [selectedWard, setSelectedWard] = useState("All wards");
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
    wards.find((ward) => ward.id === selectedAsset.ward) || wards[0];
  const tabs = [
    { name: "Map", icon: MapPin },
    { name: "Leaderboard", icon: BarChart3 },
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
            <span className="online-dot" /> Demo citizen{" "}
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
              <span /> LIVE DEMO
            </span>
            <span className="update-time">
              Last sync 18 Sep 2024 · 09:42 IST
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
          />
        )}
        {activeTab === "Leaderboard" && (
          <Leaderboard setActiveTab={setActiveTab} />
        )}
        {activeTab === "Rep Profile" && (
          <Profile
            ward={currentWard}
            assets={assets.filter((asset) => asset.ward === currentWard.id)}
            rating={rating}
            setRating={setRating}
            ratingSubmitted={ratingSubmitted}
            setRatingSubmitted={setRatingSubmitted}
          />
        )}
        {activeTab === "Officers" && <Officers />}
        {activeTab === "Social Watch" && <SocialWatch />}
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
          />
        )}
        {activeTab === "Login / Signup" && (
          <AuthView mode={authMode} setMode={setAuthMode} />
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
          · Asset registry <b>SIMULATED FOR DEMO</b>
        </span>
      </footer>
    </div>
  );
}

function MapView({
  assets: mapAssets,
  selectedAsset,
  setSelectedAsset,
  selectedWard,
  setSelectedWard,
}) {
  return (
    <section className="map-layout">
      <aside className="map-sidebar">
        <div className="section-head">
          <div>
            <span className="kicker">FIELD OVERVIEW</span>
            <h2>All Delhi zones</h2>
          </div>
          <button className="icon-button" title="Filter wards">
            <SlidersHorizontal size={18} />
          </button>
        </div>
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Search asset, ward or rep" />
        </div>
        <div className="ward-select">
          <Filter size={14} />
          <select
            value={selectedWard}
            onChange={(event) => setSelectedWard(event.target.value)}
          >
            <option>All wards</option>
            {wards.map((ward) => (
              <option key={ward.id}>{ward.name}</option>
            ))}
          </select>
        </div>
        <div className="legend">
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
            <span>WARD INTEGRITY GAP</span>
            <Info size={14} />
          </div>
          <strong>
            52<span>pts</span>
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
            <span>92% paper utilized</span>
            <span>40% verified working</span>
          </div>
        </div>
        <div className="asset-list">
          <div className="list-title">
            RECENT FIELD SIGNALS <span>{mapAssets.length} assets</span>
          </div>
          {mapAssets.slice(0, 6).map((asset) => (
            <button
              className={
                selectedAsset.id === asset.id
                  ? "asset-row selected"
                  : "asset-row"
              }
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
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
            <span className="map-dot" /> Delhi ward layer · 23 demo wards · {mapAssets.length}{" "}
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
          />
          <WardFocus selectedWard={selectedWard} />
          {wards.map((ward, index) => (
            <Polygon
              key={ward.id}
              positions={wardShape(ward.id, index)}
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
                  if (firstAsset) setSelectedAsset(firstAsset);
                },
              }}
            >
              <Tooltip sticky>
                <b>{ward.name}</b> · {ward.zone} zone · {wardAssets(ward.id).length} mapped assets
              </Tooltip>
            </Polygon>
          ))}
          {mapAssets.map((asset) => (
            <Marker
              key={asset.id}
              position={[asset.lat, asset.lng]}
              icon={markerIcon(asset, asset.id === selectedAsset.id)}
              eventHandlers={{ click: () => setSelectedAsset(asset) }}
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
          </span>
        </div>
      </div>
      <AssetDrawer
        asset={selectedAsset}
        ward={wards.find((ward) => ward.id === selectedAsset.ward) || wards[0]}
      />
    </section>
  );
}

function AssetDrawer({ asset, ward }) {
  const contacts = wardContacts(ward);
  return (
    <aside className="asset-drawer">
      <div className="drawer-top">
        <span className="sim-badge">
          <span /> SIMULATED ASSET REGISTRY
        </span>
        <button className="icon-button" title="Close detail">
          <X size={17} />
        </button>
      </div>
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
      </div>
      <div className="ground-note">
        <div className="note-heading">
          <Sparkles size={15} /> GROUNDED AI BRIEF <span>cached</span>
        </div>
        <p>{asset.narrative}</p>
        <small>
          <FileText size={12} /> {asset.source}
        </small>
      </div>
      <div className="responsibility">
        <div className="responsibility-heading">
          ACCOUNTABILITY CHAIN <ArrowUpRight size={15} />
        </div>
        <div className="person-row">
          <div className="avatar rep">RK</div>
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
          <div className="avatar officer">VS</div>
          <div>
            <small>MCD RESPONSIBLE OFFICER</small>
            <b>{ward.officer}</b>
            <span>Executive Engineer · {ward.zone} Zone</span>
            <div className="contact-links"><a href={`mailto:${contacts.officerEmail}`}>{contacts.officerEmail}</a><a href={`tel:${contacts.officerPhone}`}>{contacts.officerPhone}</a></div>
          </div>
        </div>
      </div>
      <div className="drawer-actions">
        <button className="primary-action">
          <Camera size={16} /> Add civic proof
        </button>
        <button className="secondary-action">
          View profile <ChevronRight size={15} />
        </button>
      </div>
      <div className="sources-link">
        <ShieldCheck size={14} /> <span>Sources for this claim</span>
        <a href={sources.mplad} target="_blank" rel="noreferrer">
          MPLAD raw record ↗
        </a>
      </div>
    </aside>
  );
}

function Officers() {
  return (
    <section className="content-view officers-view">
      <div className="content-toolbar">
        <div>
          <span className="kicker">MCD RESPONSIBILITY DIRECTORY</span>
          <h2>Officers across monitored wards</h2>
          <p>Every public asset is connected to a civic chain, not only an elected representative.</p>
          <span className="directory-disclaimer">SIMULATED FOR DEMO · Replace with verified MCD zonal disclosure before public launch</span>
        </div>
        <div className="directory-count"><b>{wards.length}</b><span>wards indexed</span></div>
      </div>
      <div className="officer-directory">
        {wards.map((ward) => (
          <article className="directory-card" key={ward.id}>
            <div className="directory-card-top"><span className="ward-code">{ward.id}</span><span className="zone-tag">{ward.zone} zone</span></div>
            <h3>{ward.name}</h3>
            <div className="directory-person"><div className="directory-avatar">{ward.officer.split(" ").map((part) => part[0]).join("")}</div><div><small>EXECUTIVE ENGINEER</small><b>{ward.officer}</b><span>{ward.zone} / Delhi MCD</span><div className="contact-links"><a href={`mailto:${wardContacts(ward).officerEmail}`}>email</a><a href={`tel:${wardContacts(ward).officerPhone}`}>call</a></div></div><BadgeCheck size={15} /></div>
            <div className="directory-person compact"><div className="directory-avatar assistant">AE</div><div><small>ASSISTANT ENGINEER</small><b>{ward.officer.split(" ")[0]} {ward.officer.split(" ").at(-1)}</b><span>Ward works desk · {ward.id}</span></div></div>
            <div className="directory-footer"><span>{assets.filter((asset) => asset.ward === ward.id).length} mapped assets</span><a href={`https://x.com/${wardContacts(ward).representative.slice(1)}`} target="_blank" rel="noreferrer">{wardContacts(ward).representative} ↗</a><a href={sources.officers} target="_blank" rel="noreferrer">MCD source ↗</a></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SocialWatch() {
  return (
    <section className="content-view social-watch-view">
      <div className="content-toolbar"><div><span className="kicker">PUBLIC SIGNALS / AWS-READY</span><h2>Social Watch</h2><p>Public posts can become leads for civic verification, never automatic truth.</p><span className="directory-disclaimer">DEMO POSTS · X API ingestion requires AWS Lambda + Secrets Manager</span></div><div className="directory-count"><b>{socialReports.length}</b><span>signals queued</span></div></div>
      <div className="social-pipeline"><span>Public X post</span><ChevronRight size={15}/><span>EventBridge schedule</span><ChevronRight size={15}/><span>Lambda normalizer</span><ChevronRight size={15}/><span>Ward match</span><ChevronRight size={15}/><span>Human review</span></div>
      <div className="social-report-list">{socialReports.map((report) => <article className="social-report" key={report.id}><div className="social-report-top"><span className="social-handle">{report.handle}</span><span className="social-status">{report.status}</span></div><p>{report.text}</p><div className="social-report-footer"><span>{report.id} · {report.time}</span><span>{report.ward}</span><a href="https://developer.x.com/en/docs/x-api" target="_blank" rel="noreferrer">{report.source} ↗</a></div></article>)}</div>
      <div className="social-note"><ShieldCheck size={16}/><div><b>Traceability rule</b><span>A social post creates a review lead. It does not change an asset status or score until a geo-checked photo or officer confirmation is stored.</span></div></div>
    </section>
  );
}

function Leaderboard({ setActiveTab }) {
  const rankWards = [...wards].sort((a, b) => a.score - b.score);
  return (
    <section className="content-view">
      <div className="content-toolbar">
        <div>
          <span className="kicker">ACCOUNTABILITY INDEX · 18 SEP 2024</span>
          <h2>Ground-work leaderboard</h2>
          <p>
            Worst to best, based on public utilization and verified reality.
          </p>
        </div>
        <div className="toolbar-actions">
          <button className="filter-button">
            <Filter size={15} /> All parties
          </button>
          <button className="filter-button">
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
      <div className="leaderboard-list">
        {rankWards.map((ward, index) => (
          <button
            className="leader-row"
            key={ward.id}
            onClick={() => setActiveTab("Rep Profile")}
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
}) {
  return (
    <section className="content-view profile-view">
      <div className="profile-hero">
        <div className="profile-avatar">RK</div>
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
            <span>◎ @ravi.kumar.mcd</span>
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
          <b>{Math.round((ward.utilized / ward.funds) * 100)}%</b>
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
          <span>92% paper / 40% verified reality</span>
          <a href={sources.mplad} target="_blank" rel="noreferrer">
            Inspect calculation ↗
          </a>
        </div>
        <div className="metric-card">
          <small>CITIZEN RATING</small>
          <b>
            2.8<span>/5</span>
          </b>
          <span>24 ward-verified ratings</span>
          <button
            onClick={() =>
              document.getElementById("rate-box")?.scrollIntoView()
            }
          >
            Rate this rep →
          </button>
        </div>
      </div>
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
            {wardAssets.map((asset, index) => (
              <div className="timeline-row" key={asset.id}>
                <div className="timeline-label">
                  <b>{asset.type}</b>
                  <span>{asset.id}</span>
                </div>
                <div className="timeline-track">
                  <span
                    className={
                      asset.status === "dead"
                        ? "timeline-bar delayed-bar"
                        : "timeline-bar working-bar"
                    }
                    style={{
                      left: `${index * 7 + 5}%`,
                      width: `${asset.status === "dead" ? 36 : 27}%`,
                    }}
                  />
                  <i
                    className={
                      asset.status === "dead"
                        ? "timeline-point dead-point"
                        : "timeline-point"
                    }
                    style={{ left: `${index * 7 + 28}%` }}
                  />
                </div>
                <span className="timeline-status">
                  {asset.status === "dead" ? "Delayed" : "Working"}
                </span>
              </div>
            ))}
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
              <div className="avatar officer">VS</div>
              <div>
                <b>{ward.officer}</b>
                <span>Executive Engineer</span>
                <small>South Zone · MCD</small>
              </div>
              <BadgeCheck size={15} />
            </div>
            <div className="officer-card">
              <div className="avatar officer alt">AK</div>
              <div>
                <b>A. K. Tyagi</b>
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
            <div className="stars">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  className={rating >= value ? "star active" : "star"}
                  onClick={() => setRating(value)}
                >
                  <Star
                    size={20}
                    fill={rating >= value ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
            {ratingSubmitted ? (
              <div className="rating-confirm">
                <Check size={15} /> Rating saved for Ward{" "}
                {ward.id.replace("W-", "")}
              </div>
            ) : (
              <button
                className="submit-rating"
                disabled={!rating}
                onClick={() => setRatingSubmitted(true)}
              >
                Submit rating <ArrowUpRight size={15} />
              </button>
            )}
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
  const demoPublicUrl = reportImage
    ? `https://nirvasan-demo.s3.ap-south-1.amazonaws.com/reports/2026/09/${reportImage.name.replace(/[^a-z0-9.-]/gi, "-").toLowerCase()}`
    : "";

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
          {reportImage && <span className="upload-file-meta">{Math.round(reportImage.size / 1024)} KB · ready for S3 upload</span>}
          <span className="upload-note">
            <ShieldCheck size={13} /> Location metadata checked on upload
          </span>
        </div>
        <div className="form-fields">
          <label>
            What are you reporting?
            <select>
              <option>Streetlight</option>
              <option>Water pump</option>
              <option>Hydrant</option>
              <option>Pothole</option>
              <option>Divider</option>
              <option>Work in progress</option>
              <option>Other public asset</option>
            </select>
          </label>
          <label>
            Where is it?
            <div className="input-with-icon">
              <MapPin size={15} />
              <input placeholder="Search an address or asset ID" />
            </div>
          </label>
          <label>
            What is the current state?
            <div className="choice-grid">
              <button className="choice active">
                <CircleAlert size={16} /> Dead / missing
              </button>
              <button className="choice">
                <Clock3 size={16} /> Intermittent
              </button>
            </div>
          </label>
          <button className="submit-form" disabled={!reportImage} onClick={() => setSubmitted(true)}>
            {submitted ? "Report submitted" : "Submit report"} <ArrowUpRight size={16} />
          </button>
          {submitted && <div className="public-url-card"><div><small>PUBLIC IMAGE URL · DEMO S3 PATH</small><b>{demoPublicUrl}</b></div><button className="copy-url" onClick={() => navigator.clipboard?.writeText(demoPublicUrl)}>Copy URL</button></div>}
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
}) {
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
          <span className="online-dot" /> Verified citizen · Ward 042{" "}
          <BadgeCheck size={15} />
        </div>
      </div>
      <div className="proof-layout">
        <div className="proof-target">
          <div className="proof-target-head">
            <span className="kicker">SELECT TARGET ASSET</span>
            <select
              value={selectedAsset.id}
              onChange={(event) =>
                setSelectedAsset(
                  assets.find((asset) => asset.id === event.target.value) ||
                    selectedAsset,
                )
              }
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.id} · {asset.type}
                </option>
              ))}
            </select>
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
                {selectedAsset.photos + (submitted ? 1 : 0)} submissions
              </span>
            </div>
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
            {submitted && (
              <div className="photo-row new-photo">
                <div className="photo-placeholder new">
                  <Check size={20} />
                </div>
                <div>
                  <b>Still broken</b>
                  <span>Ward 042 · just now</span>
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
            <div className="proof-type">
              <button className="choice active">
                <CircleAlert size={15} /> Still broken
              </button>
              <button className="choice">
                <Check size={15} /> Fixed now
              </button>
            </div>
            <button
              className="primary-action"
              onClick={() => setSubmitted(true)}
            >
              <Upload size={16} />{" "}
              {submitted ? "Evidence submitted" : "Upload proof"}
            </button>
            <span className="upload-note">
              <ShieldCheck size={13} /> GPS within 50m of asset required
            </span>
          </div>
          <div className="proof-rules">
            <div>
              <ShieldCheck size={16} />
              <b>Two-person verification</b>
              <span>
                A second citizen or admin must confirm before status changes.
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

function AuthView({ mode, setMode }) {
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
        {submitted ? <div className="auth-success"><BadgeCheck size={18}/><div><b>Demo identity saved</b><span>{form.name || form.email} is ready for ward-locked reports, proof uploads, and ratings.</span></div></div> : <button className="auth-submit" type="submit">{mode === "signup" ? "Save identity" : "Continue as citizen"}<ArrowUpRight size={16} /></button>}
        <div className="auth-foot"><ShieldCheck size={14} /><span>We never display your identity publicly. Only your ward and timestamp appear on reports.</span></div>
      </form>
    </section>
  );
}

export default App;
