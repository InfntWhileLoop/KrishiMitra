import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import {
  Leaf,
  Star,
  BarChart3,
  Phone,
  Navigation,
  Download,
  Share,
  Plus,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle,
  AlertTriangle,
  Thermometer,
  Clock,
  FlaskRound as Flask,
  Shield,
  Droplets,
} from "lucide-react";
import axios from "axios";
import { API_BASE } from "../config";



/** ======== API TYPES (aligns with your backend payloads) ======== */
type AvailableCropsResponse = { available_crops: string[] };

type RecommendItem = {
  variety: string;
  final_score: number; // 0..1
  reasons: string;

  // Optional fields if your backend sends them; safe defaults used otherwise
  code?: string;
  maturity_days?: number;
  yield_t_ha?: [number, number];
  traits?: string[];
  dealer?: { name: string; distance?: string; price?: string };
  soil_match?: { ph?: number; oc?: number; texture?: number };
};

type RecommendResponse = {
  recommendations: RecommendItem[];
};

/** ======== UI TYPES ======== */
interface Variety {
  id: number;
  name: string;
  code: string;
  score: number; // 0..1
  confidence: number; // %
  yield: [number, number]; // t/ha
  maturity: number; // days
  traits: string[];
  risks: string;
  requirements: string;
  imageUrl?: string;
  dealer: {
    name: string;
    distance: string;
    price: string;
  };
  soilMatch: {
    ph: number;
    oc: number;
    texture: number;
  };
}

type Toast = { id: string; text: string; type: "success" | "info" | "warn" };

/** ======== FALLBACK IMAGES ======== */
const VARIETY_FALLBACKS: Record<string, string> = {
  sahbhagi:
    "https://images.unsplash.com/photo-1589927986089-35812388d1d1?q=80&w=1200&auto=format&fit=crop",
  ir64:
    "https://images.unsplash.com/photo-1599050751795-5b4a5a0f3279?q=80&w=1200&auto=format&fit=crop",
  swarna:
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop",
  rice:
    "https://images.unsplash.com/photo-1604335399105-0d4f1be8472c?q=80&w=1200&auto=format&fit=crop",
  generic:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
};

const getVarietyFallback = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes("sahbhagi")) return VARIETY_FALLBACKS.sahbhagi;
  if (n.includes("ir-64") || n.includes("ir 64")) return VARIETY_FALLBACKS.ir64;
  if (n.includes("swarna")) return VARIETY_FALLBACKS.swarna;
  if (n.includes("rice") || n.includes("dhan")) return VARIETY_FALLBACKS.rice;
  return VARIETY_FALLBACKS.generic;
};

const SeedVariety: React.FC = () => {
  /** ======== Toasts ======== */
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pushToast = (text: string, type: Toast["type"] = "success") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  /** ======== Inputs sent to backend ======== */
  const [crop, setCrop] = useState("RICE");
  const [soilPh, setSoilPh] = useState(7.0);
  const [soilTexture, setSoilTexture] = useState<"loam" | "clay" | "sandy">(
    "loam"
  );
  const [seasonLength, setSeasonLength] = useState(120);
  const [zone, setZone] = useState("N1");
  const [risks, setRisks] = useState({
    heat: false,
    flood: false,
    drought: false,
  });
  const [hybridEnabled, setHybridEnabled] = useState(false);

  /** ======== Backend data ======== */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendItem[]>([]);

  /** ======== Page UI state ======== */
  const [selectedVarieties, setSelectedVarieties] = useState<Set<number>>(
    new Set()
  );
  const [expandedExplanation, setExpandedExplanation] = useState<number | null>(
    null
  );
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState<number | null>(
    null
  );
  const [showConfidenceModal, setShowConfidenceModal] = useState(false);
  const [plannedVarieties, setPlannedVarieties] = useState<Set<number>>(
    new Set()
  );
  const [currentSettings, setCurrentSettings] = useState({
    irrigation: "limited",
    riskStance: 50,
    budget: 15000,
    sowingShift: 0,
    dataSource: "auto",
  });

  /** ======== Context card data (static) ======== */
  const fieldData = {
    location: "Patna Village",
    plotId: "12-A",
    area: "2.5 ha",
    crop: "Kharif Rice",
    sowingWindow: "15–30 June",
    soilPh: 6.4,
    organicCarbon: 0.55,
    soilType: "Loam",
  };

  /** ======== Check if hybrid model exists for selected crop ======== */
  useEffect(() => {
    let cancelled = false;
    axios
      .get<AvailableCropsResponse>(`${API_BASE}/api/seed/models/available`)
      .then((res) => {
        const available = res.data.available_crops.map((c) => c.toUpperCase());
        if (!cancelled)
          setHybridEnabled(available.includes(crop.toUpperCase()));
      })
      .catch(() => {
        if (!cancelled) setHybridEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [crop]);

  /** ======== Submit to get recommendations ======== */
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      crop,
      soil_ph: soilPh,
      soil_texture: soilTexture.toLowerCase(),
      season_len_days: seasonLength,
      zone_code: zone,
      risk_flags: {
        heat_risk: risks.heat,
        flood_risk: risks.flood,
        drought_risk: risks.drought,
      },
      top_k: 5,
      use_hybrid: hybridEnabled,
    };

    try {
  const { data } = await axios.post<RecommendResponse>(
    `${API_BASE}/recommend`,
    payload
  );
  setRecommendations(data.recommendations);
  pushToast(`Got ${data.recommendations.length} recommendations`, "success");
} catch (err: unknown) {
  const message =
    (err as any)?.response?.data?.detail ??
    "Failed to fetch recommendations";
  setError(message);
  pushToast("Failed to fetch recommendations", "warn");
} finally {
  setLoading(false);
}

  };

  /** ======== Map backend -> UI card model ======== */
  const apiVarieties: Variety[] = useMemo(() => {
    return recommendations.map((r, idx) => ({
      id: idx + 1,
      name: r.variety,
      code: r.code ?? "",
      score: r.final_score,
      confidence: 75, // you can compute this if backend provides
      yield: r.yield_t_ha ?? [3.0, 3.8],
      maturity: r.maturity_days ?? seasonLength,
      traits: r.traits ?? [],
      risks: "", // you can surface r.reasons here or keep a separate section
      requirements: "",
      imageUrl: undefined,
      dealer: {
        name: r.dealer?.name ?? "Local Dealer",
        distance: r.dealer?.distance ?? "—",
        price: r.dealer?.price ?? "—",
      },
      soilMatch: {
        ph: r.soil_match?.ph ?? 70,
        oc: r.soil_match?.oc ?? 70,
        texture: r.soil_match?.texture ?? 70,
      },
    }));
  }, [recommendations, seasonLength]);

  /** ======== Static fallback (used when no backend data yet) ======== */
  const fallbackVarieties: Variety[] = [
    {
      id: 1,
      name: "Sahbhagi Dhan",
      code: "IR 74371-70-1-1-2",
      score: 0.82,
      confidence: 78,
      yield: [3.2, 3.8],
      maturity: 110,
      traits: ["Heat-tolerant", "Drought-tolerant", "BLB-resistant"],
      risks: "Lower performance under standing water > 5 days",
      requirements: "Needs 60–80 kg N/ha; prefers 20–25 cm spacing",
      imageUrl: "/varieties/sahbhagi.png",
      dealer: { name: "Patna Agro Seeds", distance: "7 km", price: "₹65/kg" },
      soilMatch: { ph: 85, oc: 60, texture: 90 },
    },
    {
      id: 2,
      name: "IR-64",
      code: "IR 64-18",
      score: 0.76,
      confidence: 72,
      yield: [3.5, 4.2],
      maturity: 130,
      traits: ["High-yielding", "Disease-resistant"],
      risks: "Susceptible to heat stress during flowering",
      requirements: "Requires assured irrigation; 80-100 kg N/ha",
      imageUrl: "/varieties/ir64.png",
      dealer: { name: "Bihar Seeds Co.", distance: "12 km", price: "₹58/kg" },
      soilMatch: { ph: 80, oc: 75, texture: 65 },
    },
    {
      id: 3,
      name: "Swarna",
      code: "MTU 7029",
      score: 0.71,
      confidence: 68,
      yield: [2.8, 3.5],
      maturity: 145,
      traits: ["Premium grain", "Flood-tolerant"],
      risks: "Long duration increases pest exposure risk",
      requirements: "Prefers deep water; 70-90 kg N/ha",
      imageUrl: "/varieties/swarna.png",
      dealer: { name: "Hajipur Agro", distance: "18 km", price: "₹72/kg" },
      soilMatch: { ph: 70, oc: 80, texture: 85 },
    },
  ];

  /** Choose api results if present */
  const varieties: Variety[] =
    apiVarieties.length > 0 ? apiVarieties : fallbackVarieties;

  /** ======== UI helpers ======== */
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.7) return "text-blue-600";
    return "text-yellow-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return "High Suitability";
    if (score >= 0.7) return "Good Suitability";
    return "Moderate Suitability";
  };

  const getBorderColor = (index: number) => {
    const colors = ["border-green-500", "border-blue-400", "border-yellow-400"];
    return colors[index] || "border-gray-400";
  };

  const getRankColor = (index: number) => {
    const colors = ["bg-green-500", "bg-blue-500", "bg-yellow-500"];
    return colors[index] || "bg-gray-500";
  };

  const toggleCompare = (varietyId: number) => {
    const newSelected = new Set(selectedVarieties);
    if (newSelected.has(varietyId)) newSelected.delete(varietyId);
    else newSelected.add(varietyId);
    setSelectedVarieties(newSelected);
    if (newSelected.size >= 2) setShowCompareModal(true);
    else if (newSelected.size === 0) setShowCompareModal(false);
  };

  const toggleExplanation = (varietyId: number) =>
    setExpandedExplanation(expandedExplanation === varietyId ? null : varietyId);

  /** ======== Compare Modal ======== */
  const CompareModal = () => {
    if (!showCompareModal || selectedVarieties.size < 2) return null;
    const selectedVarietiesData = Array.from(selectedVarieties)
      .map((id) => varieties.find((v) => v.id === id))
      .filter(Boolean) as Variety[];

    const features = ["Score", "Yield (t/ha)", "Maturity (days)", "Confidence (%)"];

    const getFeatureValue = (variety: Variety, feature: string) => {
      switch (feature) {
        case "Score":
          return variety.score * 100;
        case "Yield (t/ha)":
          return variety.yield[1];
        case "Maturity (days)":
          return 200 - variety.maturity; // invert for bar fill
        case "Confidence (%)":
          return variety.confidence;
        default:
          return 0;
      }
    };

    const maxValues = features.map((f) =>
      Math.max(...selectedVarietiesData.map((v) => getFeatureValue(v, f)))
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <BarChart3 className="h-5 w-5 text-blue-500 mr-3" />
                Compare Varieties
              </h3>
              <button
                onClick={() => {
                  setShowCompareModal(false);
                  setSelectedVarieties(new Set());
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">Feature Comparison</h4>
                {features.map((feature, featureIndex) => (
                  <div key={feature} className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      {feature}
                    </h5>
                    <div className="space-y-2">
                      {selectedVarietiesData.map((variety, varietyIndex) => {
                        const value = getFeatureValue(variety, feature);
                        const maxValue = maxValues[featureIndex] || 1;
                        const percentage = (value / maxValue) * 100;
                        const colors = [
                          "bg-green-500",
                          "bg-blue-500",
                          "bg-yellow-500",
                        ];
                        return (
                          <div key={variety.id} className="flex items-center">
                            <div className="w-24 text-sm text-gray-600 mr-4">
                              {variety.name}
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                              <div
                                className={`h-4 rounded-full ${
                                  colors[varietyIndex % colors.length]
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-16 text-sm font-medium text-gray-800">
                              {feature === "Score"
                                ? `${(value / 100).toFixed(2)}`
                                : feature === "Yield (t/ha)"
                                ? `${value}`
                                : feature === "Maturity (days)"
                                ? `${200 - value}`
                                : `${value}%`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-left">
                        Feature
                      </th>
                      {selectedVarietiesData.map((v) => (
                        <th
                          key={v.id}
                          className="border border-gray-300 p-3 text-center"
                        >
                          {v.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">
                        Score
                      </td>
                      {selectedVarietiesData.map((v) => (
                        <td
                          key={v.id}
                          className="border border-gray-300 p-3 text-center"
                        >
                          {v.score.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">
                        Yield Range
                      </td>
                      {selectedVarietiesData.map((v) => (
                        <td
                          key={v.id}
                          className="border border-gray-300 p-3 text-center"
                        >
                          {v.yield[0]}–{v.yield[1]} t/ha
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">
                        Maturity
                      </td>
                      {selectedVarietiesData.map((v) => (
                        <td
                          key={v.id}
                          className="border border-gray-300 p-3 text-center"
                        >
                          {v.maturity} days
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">
                        Confidence
                      </td>
                      {selectedVarietiesData.map((v) => (
                        <td
                          key={v.id}
                          className="border border-gray-300 p-3 text-center"
                        >
                          {v.confidence}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">
                        Key Traits
                      </td>
                      {selectedVarietiesData.map((v) => (
                        <td key={v.id} className="border border-gray-300 p-3">
                          <div className="flex flex-wrap gap-1">
                            {v.traits.map((trait, i) => (
                              <span
                                key={i}
                                className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                              >
                                {trait}
                              </span>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3 font-medium">
                        Price
                      </td>
                      {selectedVarietiesData.map((v) => (
                        <td
                          key={v.id}
                          className="border border-gray-300 p-3 text-center"
                        >
                          {v.dealer.price}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /** ======== MAIN RENDER ======== */
  return (
    <Layout>
      <div className="space-y-8">
        {/* Context Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-green-700 flex items-center">
                <Leaf className="h-6 w-6 mr-2" />
                Seed Variety Recommendations
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{fieldData.location}</span>
                <span>•</span>
                <span>Plot ID: {fieldData.plotId}</span>
                <span>•</span>
                <span>{fieldData.area}</span>
              </div>
            </div>
            <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
              <div className="w-4 h-4 mr-2 relative">
                <div className="w-4 h-4 bg-green-500 rounded-full" />
              </div>
              <span className="text-sm font-medium text-green-700">
                {apiVarieties.length > 0 ? "From Model" : "High Confidence"}
              </span>
              <Info
                className="h-4 w-4 ml-1 text-green-600 cursor-pointer"
                onClick={() => setShowConfidenceModal(true)}
              />
            </div>
          </div>

          {/* Inputs sent to backend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center mb-2 justify-between">
                <span className="font-semibold text-blue-800">Crop</span>
                <button
                  onClick={handleSubmit}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Get Recommendations"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="border p-1 rounded text-sm flex-1"
                />
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    hybridEnabled
                      ? "bg-green-200 text-green-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {hybridEnabled ? "Hybrid ON" : "Hybrid OFF"}
                </span>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-3">
              <div className="font-semibold text-orange-800 mb-1">Soil</div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <label className="flex items-center gap-1">
                  pH
                  <input
                    type="number"
                    step="0.1"
                    value={soilPh}
                    onChange={(e) => setSoilPh(Number(e.target.value))}
                    className="border p-1 rounded w-20"
                  />
                </label>
                <label className="flex items-center gap-1">
                  Texture
                  <select
                    value={soilTexture}
                    onChange={(e) =>
                      setSoilTexture(e.target.value as typeof soilTexture)
                    }
                    className="border p-1 rounded"
                  >
                    <option value="loam">Loam</option>
                    <option value="clay">Clay</option>
                    <option value="sandy">Sandy</option>
                  </select>
                </label>
                <label className="flex items-center gap-1">
                  Season (d)
                  <input
                    type="number"
                    value={seasonLength}
                    onChange={(e) => setSeasonLength(Number(e.target.value))}
                    className="border p-1 rounded w-20"
                  />
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="font-semibold text-yellow-800 mb-1">Zone & Risk</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">Zone</span>
                <input
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="border p-1 rounded text-sm w-24"
                />
              </div>
              <div className="flex gap-3 text-sm">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={risks.heat}
                    onChange={(e) =>
                      setRisks((r) => ({ ...r, heat: e.target.checked }))
                    }
                  />
                  Heat
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={risks.flood}
                    onChange={(e) =>
                      setRisks((r) => ({ ...r, flood: e.target.checked }))
                    }
                  />
                  Flood
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={risks.drought}
                    onChange={(e) =>
                      setRisks((r) => ({ ...r, drought: e.target.checked }))
                    }
                  />
                  Drought
                </label>
              </div>
              {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Irrigation */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Irrigation
              </label>
              <div className="flex space-x-1">
                {["none", "limited", "assured"].map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setCurrentSettings({ ...currentSettings, irrigation: type })
                    }
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      currentSettings.irrigation === type
                        ? type === "none"
                          ? "bg-red-500 text-white"
                          : type === "limited"
                          ? "bg-yellow-500 text-white"
                          : "bg-green-500 text-white"
                        : type === "none"
                        ? "bg-red-100 text-red-700"
                        : type === "limited"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk stance */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Stance
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Conservative</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentSettings.riskStance}
                  onChange={(e) =>
                    setCurrentSettings({
                      ...currentSettings,
                      riskStance: parseInt(e.target.value, 10),
                    })
                  }
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-500">Aggressive</span>
              </div>
              <div className="text-center mt-1">
                <span
                  className={`text-xs font-medium ${
                    currentSettings.riskStance < 33
                      ? "text-green-600"
                      : currentSettings.riskStance > 66
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {currentSettings.riskStance < 33
                    ? "Conservative"
                    : currentSettings.riskStance > 66
                    ? "Aggressive"
                    : "Balanced"}
                </span>
              </div>
            </div>

            {/* Budget */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget/acre
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">₹5k</span>
                <input
                  type="range"
                  min="5000"
                  max="25000"
                  value={currentSettings.budget}
                  step="1000"
                  onChange={(e) =>
                    setCurrentSettings({
                      ...currentSettings,
                      budget: parseInt(e.target.value, 10),
                    })
                  }
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-500">₹25k</span>
              </div>
              <div className="text-center mt-1">
                <span className="text-xs font-medium text-green-600">
                  ₹{(currentSettings.budget / 1000).toFixed(0)}k
                </span>
              </div>
            </div>

            {/* Sowing date */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sowing Date
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">-2w</span>
                <input
                  type="range"
                  min="-14"
                  max="14"
                  value={currentSettings.sowingShift}
                  onChange={(e) =>
                    setCurrentSettings({
                      ...currentSettings,
                      sowingShift: parseInt(e.target.value, 10),
                    })
                  }
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-500">+2w</span>
              </div>
              <div className="text-center mt-1">
                <span className="text-xs font-medium text-purple-600">
                  {new Date(
                    new Date("2025-06-22").getTime() +
                      currentSettings.sowingShift * 24 * 60 * 60 * 1000
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </div>

            {/* Data source */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Source
              </label>
              <div className="flex space-x-1">
                {["auto", "manual"].map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setCurrentSettings({ ...currentSettings, dataSource: type })
                    }
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      currentSettings.dataSource === type
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {type === "auto" ? "Auto" : "Edit"}
                  </button>
                ))}
              </div>
              {currentSettings.dataSource === "manual" && (
                <div className="mt-1">
                  <span className="text-xs text-orange-600">✎ Overridden</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Variety Cards */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Star className="h-6 w-6 text-yellow-500 mr-3" />
            Seed Variety Recommendations
          </h2>

          {varieties.map((variety, index) => (
            <div
              key={variety.id}
              className={`bg-white rounded-xl shadow-lg border-l-4 ${getBorderColor(
                index
              )} overflow-hidden`}
            >
              {/* Header with bg image */}
              <div className="relative px-6 py-6 rounded-t-xl overflow-hidden">
                <img
                  src={variety.imageUrl || getVarietyFallback(variety.name)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-bottom"
                  data-try="png"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const tried = target.getAttribute("data-try") || "png";
                    if (tried === "png" && /\.png(\?.*)?$/i.test(target.src)) {
                      target.setAttribute("data-try", "jpg");
                      target.src = target.src.replace(
                        /\.png(\?.*)?$/i,
                        ".jpg$1"
                      );
                      return;
                    }
                    if (tried === "jpg" && /\.jpg(\?.*)?$/i.test(target.src)) {
                      target.setAttribute("data-try", "jpeg");
                      target.src = target.src.replace(
                        /\.jpg(\?.*)?$/i,
                        ".jpeg$1"
                      );
                      return;
                    }
                    const fb = getVarietyFallback(variety.name);
                    if (target.src !== fb) target.src = fb;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/20" />

                <div className="relative z-10 flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`${getRankColor(
                        index
                      )} text-white px-3 py-1 rounded-full text-sm font-bold`}
                    >
                      #{index + 1} of {varieties.length}
                    </span>
                    <h3 className="text-xl font-bold text-white">
                      {variety.name}
                    </h3>
                    <span className="text-sm text-white/80">({variety.code})</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleCompare(variety.id)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedVarieties.has(variety.id)
                          ? "bg-blue-500 text-white"
                          : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                      }`}
                    >
                      <BarChart3 className="h-4 w-4 inline mr-1" />
                      Compare
                    </button>
                  </div>
                </div>

                {/* Trait chips */}
                <div className="relative z-10 flex flex-wrap gap-2">
                  <span className="bg-orange-100/90 text-orange-900 px-3 py-1 rounded-full text-sm">
                    {variety.maturity} days
                  </span>
                  {variety.traits.map((t, i) => (
                    <span
                      key={i}
                      className="bg-green-100/90 text-green-900 px-3 py-1 rounded-full text-sm"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {/* Fit & Score */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="flex items-center mb-3">
                      <span
                        className={`text-2xl font-bold ${getScoreColor(
                          variety.score
                        )}`}
                      >
                        {variety.score.toFixed(2)}
                      </span>
                      <span className="ml-2 text-lg text-gray-600">
                        {getScoreLabel(variety.score)}
                      </span>
                      <span className="ml-4 text-sm text-gray-500">
                        {variety.confidence}% confidence
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          Expected Yield
                        </span>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {variety.yield[0]}–{variety.yield[1]} t/ha
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700 block mb-2">
                        Soil Match
                      </span>
                      <div className="space-y-2">
                        {Object.entries(variety.soilMatch).map(([key, value]) => (
                          <div key={key} className="flex items-center">
                            <span className="w-16 text-sm text-gray-600 capitalize">
                              {key}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                              <div
                                className={`h-2 rounded-full ${
                                  value >= 80
                                    ? "bg-green-500"
                                    : value >= 60
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span
                              className={`text-sm ${
                                value >= 80
                                  ? "text-green-600"
                                  : value >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {value >= 80 ? "✓" : value >= 60 ? "△" : "✗"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Sowing Fit
                      </span>
                      <div className="text-sm text-gray-600">
                        Best by 25 June (OK till 5 July)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Why this variety */}
                <div className="mb-6">
                  <button
                    onClick={() => toggleExplanation(variety.id)}
                    className="flex items-center justify-between w-full bg-gray-50 hover:bg-gray-100 rounded-lg px-4 py-3 transition-colors"
                  >
                    <span className="font-medium text-gray-800">
                      Why this variety?
                      <span className="text-sm text-gray-500 ml-1">
                        ({variety.confidence}% confidence based on IMD 01-06
                        forecast & ICAR trials)
                      </span>
                    </span>
                    {expandedExplanation === variety.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {expandedExplanation === variety.id && (
                    <div className="mt-3 px-4 py-3 bg-blue-50 rounded-lg">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <Clock className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                          <span>
                            Short maturity + delayed monsoon → lowers terminal
                            drought risk
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Thermometer className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                          <span>
                            High heat tolerance matches forecasted 4–6 hot days in
                            flowering
                          </span>
                        </li>
                        <li className="flex items-start">
                          <Flask className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                          <span>Soil pH {fieldData.soilPh} within optimal 5.5–7.0</span>
                        </li>
                      </ul>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <span className="text-xs text-gray-600">
                          <strong>Sources:</strong> IMD forecast (01-06), ICAR
                          trials (2019–22), Soil Card (Plot-12)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Risks & Requirements */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Risks
                    </h4>
                    <p className="text-sm text-red-700">{variety.risks}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Requirements
                    </h4>
                    <p className="text-sm text-green-700">{variety.requirements}</p>
                  </div>
                </div>

                {/* Availability & Cost */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">🏪</span>
                    Availability & Cost
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm mb-2">
                        <strong>Nearby Dealers:</strong>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-800">
                              {variety.dealer.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {variety.dealer.distance} • {variety.dealer.price}
                            </div>
                          </div>
                          <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors">
                            Check Stock
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm mb-2">
                        <strong>Subsidy:</strong>
                      </div>
                      <div className="bg-green-100 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-green-800">
                              Seed Minikit Available
                            </div>
                            <div className="text-sm text-green-600">
                              State scheme
                            </div>
                          </div>
                          <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors">
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setPlannedVarieties((prev) => new Set(prev).add(variety.id));
                      pushToast(`${variety.name} added to Season Plan`, "success");
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium flex items-center transition-colors"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Select
                  </button>
                  <button
                    onClick={() => {
                      toggleCompare(variety.id);
                      pushToast(`Selected for comparison: ${variety.name}`, "info");
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Compare
                  </button>
                  <button
                    onClick={() => setShowEvidenceModal(variety.id)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    View Evidence
                  </button>
                  <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Plan
                  </button>
                </div>

                {/* Dealer Actions */}
                <div className="flex flex-wrap gap-3 mt-3">
                  <button
                    onClick={() => pushToast(`Calling ${variety.dealer.name}…`, "info")}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm transition-colors"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Dealer
                  </button>
                  <button
                    onClick={() => pushToast("Opening maps…", "info")}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm transition-colors"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate
                  </button>
                  <button
                    onClick={() => pushToast("Saved offline", "success")}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Save Offline
                  </button>
                  <button
                    onClick={() => pushToast("Shared to WhatsApp (demo)", "success")}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm transition-colors"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Show More Button */}
          <div className="text-center">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium border-2 border-dashed border-gray-300 transition-colors">
              <ChevronDown className="h-4 w-4 mr-2 inline" />
              Show more varieties ({Math.max(0, 10 - varieties.length)} remaining)
            </button>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                if (plannedVarieties.size === 0) {
                  pushToast("Select at least one variety first", "warn");
                } else {
                  pushToast(
                    `Added ${plannedVarieties.size} variety(ies) to Season Plan`,
                    "success"
                  );
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg flex items-center shadow-lg transition-colors"
            >
              <Plus className="h-5 w-5 mr-3" />
              Add Chosen Variety to Season Plan
            </button>
            <button
              onClick={() => pushToast("Downloading advisory…", "info")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Advisory (PDF)
            </button>
            <button
              onClick={() => pushToast("Shared to WhatsApp", "success")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
            >
              <Share className="h-4 w-4 mr-2" />
              Share to WhatsApp
            </button>
            <button
              onClick={() => pushToast("Calling nearest dealer…", "info")}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Nearest Dealer
            </button>
          </div>
        </div>

        {/* Toasts */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 space-y-2 w-[90%] max-w-md">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-lg px-4 py-2 shadow-lg text-white ${
                t.type === "success"
                  ? "bg-green-600"
                  : t.type === "warn"
                  ? "bg-yellow-600"
                  : "bg-blue-600"
              }`}
            >
              {t.text}
            </div>
          ))}
        </div>

        {/* Compare Modal */}
        <CompareModal />

        {/* Evidence Modal */}
{showEvidenceModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <Info className="h-5 w-5 text-purple-500 mr-3" />
            Scientific Evidence
          </h3>
          <button
            onClick={() => setShowEvidenceModal(null)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Evidence content */}
{(() => {
  const selected = varieties.find(v => v.id === showEvidenceModal);

  const points: string[] = selected
    ? [
        `Yield: ${selected.yield?.[0]}–${selected.yield?.[1]} t/ha`,
        `Maturity: ${selected.maturity} days`,
        ...(Array.isArray(selected.traits) ? selected.traits.map((t: string) => `Trait: ${t}`) : []),
        ...(Array.isArray(selected.requirements) ? selected.requirements.map((r: string) => `Needs: ${r}`) : []),
        ...(Array.isArray(selected.risks) ? selected.risks.map((r: string) => `Risk: ${r}`) : []),
      ]
    : [];

  return (
    <div className="space-y-4">
      {points.length > 0 ? (
        points.map((item, idx) => (
          <div
            key={idx}
            className="p-4 border border-purple-200 rounded-lg bg-purple-50 text-gray-700"
          >
            {item}
          </div>
        ))
      ) : (
        <p className="text-gray-500 italic">
          No scientific evidence available for this variety.
        </p>
      )}
    </div>
  );
})()}



        {/* Close button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowEvidenceModal(null)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}
          </div> {/* closes the wrapper opened at line 547 */}
    </Layout> 
);
};

export default SeedVariety;

 