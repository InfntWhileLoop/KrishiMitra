import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Cloud, Thermometer, Droplets, Calendar, MapPin,
  TrendingUp, AlertTriangle, CheckCircle, Upload, Download, Phone,
  Users, Flashlight, Zap, GaugeCircle, Play, Pause, ShieldAlert
} from "lucide-react";
import { AlertTriangle as _AlertTriangle } from "lucide-react";
import Layout from "../components/Layout";

/**
 * Single-file irrigation page with these inline components:
 * - SoilAnalysisForm
 * - RankedTable
 * - EnergyCostCalculator
 * - NearbyFarmers
 * - QuickActionsToolbar
 * - CsvBatchUpload
 *
 * Notes
 * - Recommendation remains hidden until the form is submitted.
 * - API_BASE resolves from NEXT_PUBLIC_API_BASE or VITE_API_BASE, then localhost:8000.
 * - Tailwind for styling.
 */

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";



/** ---------- Types ---------- */

type IrrigationForm = {
  // location & crop
  state: string;
  district: string;
  year: number;
  crop: string; // must match model artifacts, e.g., "RICE", "WHEAT"

  // soil analysis
  soilPh: number;
  soilTexture: "sand" | "sandy_loam" | "loam" | "clay_loam" | "clay" | "silt_loam";
  organicCarbon: number;

  // current sensors
  soilMoisturePct: number;
  temperatureC: number;
  humidityPct: number;

  // short-term rain forecast (mm)
  rainTomorrowMm: number;
  rainDayAfterMm: number;

  // optional: pump meta for cost calc
  powerKW?: number;          // pump rated power
  tariffPerKwh?: number;     // electricity tariff
  hoursPerIrrigation?: number;
};

type YieldResp = {
  yhat_kg_ha: number;
  y_std_kg_ha?: number | null;
};

type RankedIrrigation = {
  method: string;
  score: number;     // higher is better
  reason?: string;
  est_water_mm?: number; // optional
  energy_kwh?: number;   // optional
  cost_estimate?: number;// optional currency
};

type RecommendApiResp =
  | { decision: "irrigate" | "wait"; reason: string; confidence: number; ranked?: RankedIrrigation[] }
  | { ranked: RankedIrrigation[]; top?: { method: string; reason?: string; confidence?: number } };

type FarmerContact = {
  id: string;
  name: string;
  phone: string;
  distance_km: number;
  crops?: string[];
  hasPump?: boolean;
  notes?: string;
};

/** ---------- Helpers ---------- */

function clsx(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function fmt(n?: number | null, d = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(d);
}

/** ============ SoilAnalysisForm (inline) ============ */
const SoilAnalysisForm: React.FC<{
  initial?: Partial<IrrigationForm>;
  onSubmit: (values: IrrigationForm) => void;
  loading?: boolean;
}> = ({ initial, onSubmit, loading }) => {
  const [values, setValues] = useState<IrrigationForm>({
    state: initial?.state ?? "Bihar",
    district: initial?.district ?? "Patna",
    year: initial?.year ?? 2012,
    crop: initial?.crop ?? "RICE",

    soilPh: initial?.soilPh ?? 6.4,
    soilTexture: initial?.soilTexture ?? "loam",
    organicCarbon: initial?.organicCarbon ?? 0.55,

    soilMoisturePct: initial?.soilMoisturePct ?? 65,
    temperatureC: initial?.temperatureC ?? 28,
    humidityPct: initial?.humidityPct ?? 72,

    rainTomorrowMm: initial?.rainTomorrowMm ?? 15,
    rainDayAfterMm: initial?.rainDayAfterMm ?? 25,

    powerKW: initial?.powerKW ?? 5,
    tariffPerKwh: initial?.tariffPerKwh ?? 7.0,
    hoursPerIrrigation: initial?.hoursPerIrrigation ?? 2,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!values.state) e.state = "State is required";
    if (!values.district) e.district = "District is required";
    if (!values.crop) e.crop = "Crop is required";
    if (!values.year || values.year < 1980 || values.year > 2100) e.year = "Year must be realistic";

    if (values.soilPh < 3 || values.soilPh > 10) e.soilPh = "pH must be between 3 and 10";
    if (values.organicCarbon < 0 || values.organicCarbon > 5) e.organicCarbon = "OC must be between 0 and 5%";
    if (values.soilMoisturePct < 0 || values.soilMoisturePct > 100) e.soilMoisturePct = "Moisture must be 0–100%";
    if (values.temperatureC < -5 || values.temperatureC > 60) e.temperatureC = "Temperature looks unrealistic";
    if (values.humidityPct < 0 || values.humidityPct > 100) e.humidityPct = "Humidity must be 0–100%";
    if (values.rainTomorrowMm < 0 || values.rainDayAfterMm < 0) e.rain = "Rainfall can’t be negative";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onChange = (k: keyof IrrigationForm, v: any) => {
    setValues((s) => ({ ...s, [k]: v }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(values);
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Cloud className="h-6 w-6 text-green-700" />
          <h2 className="text-xl font-bold text-green-700">Soil Analysis & Context</h2>
        </div>
        <div className="text-sm text-gray-500">Fill this first to see recommendations</div>
      </div>

      {/* location & crop */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">State</label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={values.state}
            onChange={(e) => onChange("state", e.target.value)}
          />
          {errors.state && <p className="text-xs text-red-600 mt-1">{errors.state}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">District</label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={values.district}
            onChange={(e) => onChange("district", e.target.value)}
          />
          {errors.district && <p className="text-xs text-red-600 mt-1">{errors.district}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Year</label>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={values.year}
            onChange={(e) => onChange("year", Number(e.target.value))}
          />
          {errors.year && <p className="text-xs text-red-600 mt-1">{errors.year}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Crop</label>
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={values.crop}
            onChange={(e) => onChange("crop", e.target.value)}
          >
            <option value="RICE">RICE</option>
            <option value="WHEAT">WHEAT</option>
            <option value="MAIZE">MAIZE</option>
            <option value="SORGHUM">SORGHUM</option>
          </select>
          {errors.crop && <p className="text-xs text-red-600 mt-1">{errors.crop}</p>}
        </div>
      </div>

      {/* soil analysis */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Soil pH</label>
          <input
            type="number" step="0.1"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={values.soilPh}
            onChange={(e) => onChange("soilPh", Number(e.target.value))}
          />
          {errors.soilPh && <p className="text-xs text-red-600 mt-1">{errors.soilPh}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Soil Texture</label>
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={values.soilTexture}
            onChange={(e) => onChange("soilTexture", e.target.value)}
          >
            <option value="sand">Sand</option>
            <option value="sandy_loam">Sandy Loam</option>
            <option value="loam">Loam</option>
            <option value="clay_loam">Clay Loam</option>
            <option value="clay">Clay</option>
            <option value="silt_loam">Silt Loam</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Organic Carbon (%)</label>
          <input
            type="number" step="0.01"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={values.organicCarbon}
            onChange={(e) => onChange("organicCarbon", Number(e.target.value))}
          />
          {errors.organicCarbon && <p className="text-xs text-red-600 mt-1">{errors.organicCarbon}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Rain Tomorrow (mm)</label>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={values.rainTomorrowMm}
            onChange={(e) => onChange("rainTomorrowMm", Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Rain Day After (mm)</label>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={values.rainDayAfterMm}
            onChange={(e) => onChange("rainDayAfterMm", Number(e.target.value))}
          />
        </div>
      </div>

      {/* sensors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center mb-1">
            <Droplets className="h-4 w-4 text-blue-600 mr-2" />
            <span className="font-semibold text-blue-800">Soil Moisture</span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="range" min={0} max={100}
              value={values.soilMoisturePct}
              onChange={(e) => onChange("soilMoisturePct", Number(e.target.value))}
              className="w-full"
            />
            <div className="text-blue-700 font-bold w-16 text-right">{values.soilMoisturePct}%</div>
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center mb-1">
            <Thermometer className="h-4 w-4 text-orange-600 mr-2" />
            <span className="font-semibold text-orange-800">Temperature</span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="number" className="w-full rounded-lg border px-3 py-2"
              value={values.temperatureC}
              onChange={(e) => onChange("temperatureC", Number(e.target.value))}
            />
            <div className="text-orange-700 font-bold">°C</div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center mb-1">
            <Cloud className="h-4 w-4 text-green-600 mr-2" />
            <span className="font-semibold text-green-800">Humidity</span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="range" min={0} max={100}
              value={values.humidityPct}
              onChange={(e) => onChange("humidityPct", Number(e.target.value))}
              className="w-full"
            />
            <div className="text-green-700 font-bold w-16 text-right">{values.humidityPct}%</div>
          </div>
        </div>
      </div>

      {/* pump meta for cost calc */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Pump Power (kW)</label>
          <input
            type="number" step="0.1"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={values.powerKW}
            onChange={(e) => onChange("powerKW", Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tariff (₹/kWh)</label>
          <input
            type="number" step="0.01"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={values.tariffPerKwh}
            onChange={(e) => onChange("tariffPerKwh", Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Hours / Irrigation</label>
          <input
            type="number" step="0.1"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={values.hoursPerIrrigation}
            onChange={(e) => onChange("hoursPerIrrigation", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={loading}
          className={clsx(
            "px-5 py-2 rounded-lg text-white font-semibold",
            loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          )}
        >
          {loading ? "Calculating…" : "Get Recommendation"}
        </button>
      </div>
    </form>
  );
};

/** ============ RankedTable (inline) ============ */
const RankedTable: React.FC<{
  ranked: RankedIrrigation[];
  yieldInfo?: YieldResp | null;
}> = ({ ranked, yieldInfo }) => {
  if (!ranked?.length) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
      <div className="flex items-center mb-4">
        <TrendingUp className="h-6 w-6 text-green-700 mr-2" />
        <h3 className="text-lg font-bold text-green-700">Ranked Irrigation Recommendations</h3>
      </div>

      {yieldInfo && (
        <div className="mb-4 text-sm text-gray-700">
          Predicted yield: <b>{fmt(yieldInfo.yhat_kg_ha, 0)} kg/ha</b>
          {yieldInfo.y_std_kg_ha ? ` (±${fmt(yieldInfo.y_std_kg_ha, 0)} sd)` : ""}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-3">Rank</th>
              <th className="py-2 pr-3">Method</th>
              <th className="py-2 pr-3">Score</th>
              <th className="py-2 pr-3">Est. Water (mm)</th>
              <th className="py-2 pr-3">Energy (kWh)</th>
              <th className="py-2 pr-3">Cost (₹)</th>
              <th className="py-2 pr-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r, i) => (
              <tr key={`${r.method}-${i}`} className="border-t">
                <td className="py-2 pr-3 font-semibold">{i + 1}</td>
                <td className="py-2 pr-3">{r.method}</td>
                <td className="py-2 pr-3">{fmt(r.score, 2)}</td>
                <td className="py-2 pr-3">{fmt(r.est_water_mm)}</td>
                <td className="py-2 pr-3">{fmt(r.energy_kwh)}</td>
                <td className="py-2 pr-3">{fmt(r.cost_estimate)}</td>
                <td className="py-2 pr-3 max-w-xl">{r.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/** ============ EnergyCostCalculator (inline) ============ */
const EnergyCostCalculator: React.FC<{
  powerKW?: number;
  tariffPerKwh?: number;
  hoursPerIrrigation?: number;
}> = ({ powerKW = 5, tariffPerKwh = 7.0, hoursPerIrrigation = 2 }) => {
  const [kw, setKw] = useState(powerKW);
  const [tariff, setTariff] = useState(tariffPerKwh);
  const [hours, setHours] = useState(hoursPerIrrigation);

  const kwh = useMemo(() => kw * hours, [kw, hours]);
  const cost = useMemo(() => kwh * tariff, [kwh, tariff]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
      <div className="flex items-center mb-4">
        <Zap className="h-6 w-6 text-yellow-600 mr-2" />
        <h3 className="text-lg font-bold text-gray-900">Energy & Cost Calculator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Pump Power (kW)</label>
          <input
            type="number" step="0.1"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={kw}
            onChange={(e) => setKw(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tariff (₹/kWh)</label>
          <input
            type="number" step="0.01"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={tariff}
            onChange={(e) => setTariff(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Hours / Irrigation</label>
          <input
            type="number" step="0.1"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          />
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-gray-700">Energy</div>
          <div className="text-2xl font-bold">{fmt(kwh, 2)} kWh</div>
          <div className="text-gray-500">Cost ≈ <b>₹{fmt(cost, 0)}</b></div>
        </div>
      </div>
    </div>
  );
};

/** ============ NearbyFarmers (inline) ============ */
const NearbyFarmers: React.FC<{
  farmers: FarmerContact[];
}> = ({ farmers }) => {
  if (!farmers?.length) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
      <div className="flex items-center mb-4">
        <Users className="h-6 w-6 text-green-700 mr-2" />
        <h3 className="text-lg font-bold text-gray-900">Nearby Farmers</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {farmers.map((f) => (
          <div key={f.id} className="border rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900">{f.name}</div>
              <div className="text-sm text-gray-600">
                {fmt(f.distance_km, 1)} km away • {f.crops?.join(", ") || "—"}
              </div>
              {f.notes && <div className="text-xs text-gray-500 mt-1">{f.notes}</div>}
            </div>
            <a
              href={`tel:${f.phone}`}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

/** ============ QuickActionsToolbar (inline) ============ */
const QuickActionsToolbar: React.FC<{
  onStartPump: () => void;
  onLowPressure: () => void;
  onWeatherAlert: () => void;
  busy?: boolean;
}> = ({ onStartPump, onLowPressure, onWeatherAlert, busy }) => {
  return (
    <div className="sticky top-6 space-y-3">
      <div className="bg-white rounded-2xl shadow-lg border p-4">
        <div className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <GaugeCircle className="h-5 w-5 text-green-700" />
          Quick Actions
        </div>
        <div className="grid gap-2">
          <button
            onClick={onStartPump}
            disabled={busy}
            className={clsx("w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white",
              busy ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700")}
          >
            <Play className="h-4 w-4" /> Start Pump Alert
          </button>
          <button
            onClick={onLowPressure}
            disabled={busy}
            className={clsx("w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white",
              busy ? "bg-gray-400" : "bg-orange-600 hover:bg-orange-700")}
          >
            <ShieldAlert className="h-4 w-4" /> Low Pressure Alert
          </button>
          <button
            onClick={onWeatherAlert}
            disabled={busy}
            className={clsx("w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white",
              busy ? "bg-gray-400" : "bg-emerald-600 hover:bg-emerald-700")}
          >
            <Cloud className="h-4 w-4" /> Weather Alerts
          </button>
        </div>
      </div>
    </div>
  );
};

/** ============ CsvBatchUpload (inline) ============ */
const CsvBatchUpload: React.FC<{
  endpoint?: string; // defaults to /irrigation/batch/predict/csv
}> = ({ endpoint = `${API_BASE}/irrigation/batch/predict/csv` }) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onUpload = async (file: File) => {
    setErr(null);
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: form });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "irrigation_predictions.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
      <div className="flex items-center mb-4">
        <Upload className="h-6 w-6 text-blue-700 mr-2" />
        <h3 className="text-lg font-bold text-gray-900">Batch Predictions (CSV)</h3>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        Upload a CSV with the exact columns required by your backend. You’ll get a CSV back with predictions.
      </p>
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept=".csv"
          ref={inputRef}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
          }}
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg
                     file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
        />
        <a
          href="/samples/irrigation_batch_template.csv"
          onClick={(e) => e.preventDefault()}
          className="inline-flex items-center text-blue-700 hover:underline text-sm"
          title="Ask backend team to expose a template route or ship a static file"
        >
          <Download className="h-4 w-4 mr-1" />
          Download Template
        </a>
      </div>
      {busy && <div className="mt-3 text-sm text-gray-700">Processing…</div>}
      {err && <div className="mt-3 text-sm text-red-600">Error: {err}</div>}
    </div>
  );
};

/** ============ Page ============ */
const IrrigationPage: React.FC = () => {
  const [loadingForm, setLoadingForm] = useState(false);
  const [recommendVisible, setRecommendVisible] = useState(false);

  const [ranked, setRanked] = useState<RankedIrrigation[] | null>(null);
  const [yieldInfo, setYieldInfo] = useState<YieldResp | null>(null);
  const [farmers, setFarmers] = useState<FarmerContact[]>([]);
  const [alertsBusy, setAlertsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep last submitted form (for calculators)
  const [lastForm, setLastForm] = useState<IrrigationForm | null>(null);

  // Local heuristic recommender to avoid backend 404s
  const computeIrrigationRanked = (f: IrrigationForm): RankedIrrigation[] => {
    const moisture = f.soilMoisturePct;
    const deficit = Math.max(0, 100 - moisture) / 100; // 0..1
    const rainNext48 = (f.rainTomorrowMm || 0) + (f.rainDayAfterMm || 0);

    // If soil is fairly wet or significant rain is imminent, suggest waiting
    if (moisture >= 70 || rainNext48 >= 25) {
      return [
        {
          method: "Wait",
          score: 0.75,
          reason: moisture >= 70
            ? "Soil moisture is already adequate."
            : "Significant rainfall forecasted in next 48 hours.",
          est_water_mm: 0,
          energy_kwh: 0,
          cost_estimate: 0,
        },
        { method: "Drip", score: 0.45, reason: "If needed, apply minimal spot irrigation." },
        { method: "Sprinkler", score: 0.40, reason: "Hold unless conditions dry out further." },
      ];
    }

    // Base scores by dryness
    let drip = 0.55 + 0.35 * deficit;
    let sprinkler = 0.5 + 0.3 * deficit;
    let surface = 0.45 + 0.25 * deficit;

    // Texture adjustments
    switch (f.soilTexture) {
      case "sand":
      case "sandy_loam":
        drip += 0.1; // minimize percolation losses
        sprinkler += 0.05;
        break;
      case "clay":
      case "clay_loam":
        surface += 0.07; // surface can work for heavy soils
        sprinkler += 0.03;
        break;
      default:
        sprinkler += 0.03; // loam-ish, balanced
    }

    // Weather adjustments
    if (f.temperatureC >= 34) {
      drip += 0.05; // targeted watering reduces evap losses
    }
    if (f.humidityPct <= 35) {
      sprinkler += 0.03; // micro-climate cooling benefit
    }
    if (rainNext48 > 10) {
      drip -= 0.03; sprinkler -= 0.03; surface -= 0.03; // be conservative if rain is coming
    }

    // Estimated water need (mm) simple model
    const estWater = Math.max(10, Math.round(deficit * 50)); // 10–50 mm
    const hours = f.hoursPerIrrigation ?? Math.max(1, Math.round(estWater / 25)); // ~25 mm/hr default
    const energy = f.powerKW ? f.powerKW * hours : undefined;
    const cost = energy && f.tariffPerKwh ? energy * f.tariffPerKwh : undefined;

    const base = [
      { method: "Drip", score: drip },
      { method: "Sprinkler", score: sprinkler },
      { method: "Surface", score: surface },
    ]
      .map((r) => ({
        ...r,
        est_water_mm: estWater,
        energy_kwh: energy,
        cost_estimate: cost,
      }))
      .sort((a, b) => b.score - a.score)
      .map((r) => ({
        ...r,
        reason:
          r.method === "Drip"
            ? "Efficient under current dryness; reduces evaporation and percolation losses."
            : r.method === "Sprinkler"
            ? "Good uniformity; helpful when humidity is low and temperature is moderate-high."
            : "Simple method; acceptable on heavier soils at moderate deficits.",
      }));

    return base;
  };


  const fetchNearbyFarmers = async (f: IrrigationForm) => {
    // If you have GPS, pass coordinates; else pass state/district
    const res = await fetch(`${API_BASE}/farmers/nearby?state=${encodeURIComponent(f.state)}&district=${encodeURIComponent(f.district)}&radius_km=15`);
    if (!res.ok) {
      // graceful fallback — optional static examples if backend not available
      return [
        { id: "f1", name: "Ravi Kumar", phone: "9999990001", distance_km: 3.2, crops: ["Rice"], hasPump: true, notes: "Available evenings" },
        { id: "f2", name: "Sita Devi", phone: "9999990002", distance_km: 5.1, crops: ["Rice","Wheat"], hasPump: false, notes: "Can share labor" },
      ] as FarmerContact[];
    }
    const data = await res.json();
    return data as FarmerContact[];
  };

  const onFormSubmit = async (f: IrrigationForm) => {
    setError(null);
    setLoadingForm(true);
    setRecommendVisible(false);
    try {
      const [neighbors] = await Promise.all([
        fetchNearbyFarmers(f),
      ]);
      const rankedList = computeIrrigationRanked(f);
      setYieldInfo(null); // omit yield until backend is available
      setRanked(rankedList);
      setFarmers(neighbors);
      setRecommendVisible(true);
      setLastForm(f);
    } catch (e: any) {
      setError(e?.message || "Failed to compute recommendation");
      setRecommendVisible(false);
      setYieldInfo(null);
      setRanked(null);
    } finally {
      setLoadingForm(false);
    }
  };

  // Quick actions -> wire to your alerts endpoints
  const startPumpAlert = async () => {
    setAlertsBusy(true);
    try {
      await fetch(`${API_BASE}/alerts/start_pump`, { method: "POST" });
      window.alert("Start Pump alert sent ✅");
    } catch {
      window.alert("Failed to send Start Pump alert");
    } finally {
      setAlertsBusy(false);
    }
  };
  const lowPressureAlert = async () => {
    setAlertsBusy(true);
    try {
      await fetch(`${API_BASE}/alerts/low_pressure`, { method: "POST" });
      window.alert("Low Pressure alert sent ⚠️");
    } catch {
      window.alert("Failed to send Low Pressure alert");
    } finally {
      setAlertsBusy(false);
    }
  };
  const weatherAlert = async () => {
    setAlertsBusy(true);
    try {
      await fetch(`${API_BASE}/alerts/weather_subscribe`, { method: "POST" });
      window.alert("Weather alerts subscribed 🌧");
    } catch {
      window.alert("Failed to subscribe to Weather alerts");
    } finally {
      setAlertsBusy(false);
    }
  };

  // For a subtle header showing context if we have last form
  const context = useMemo(() => {
    if (!lastForm) return null;
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-green-700 flex items-center">
              <Cloud className="h-6 w-6 mr-2" />
              Irrigation & Weather
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{lastForm.district}, {lastForm.state}</span>
              <span>•</span>
              <span>Crop: {lastForm.crop}</span>
              <span>•</span>
              <span>Year: {lastForm.year}</span>
            </div>
          </div>
          <div className="bg-green-100 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-green-700">Ready</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Calendar className="h-4 w-4 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-800">Soil</span>
            </div>
            <div className="text-sm text-blue-700">
              pH {lastForm.soilPh} • {lastForm.soilTexture.replace("_", " ")} • OC {lastForm.organicCarbon}%
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-3">
            <div className="font-semibold text-orange-800 mb-1">Sensors</div>
            <div className="text-sm text-orange-700">
              Moist {lastForm.soilMoisturePct}% • Temp {lastForm.temperatureC}°C • RH {lastForm.humidityPct}%
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center mb-1">
              <Cloud className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="font-semibold text-yellow-800">Rain (next 2 days)</span>
            </div>
            <div className="text-sm text-yellow-700">
              {lastForm.rainTomorrowMm} mm • {lastForm.rainDayAfterMm} mm
            </div>
          </div>
        </div>
      </div>
    );
  }, [lastForm]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
      {/* Layout with sidebar quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* 1) Soil Analysis Form (required first) */}
          <SoilAnalysisForm onSubmit={onFormSubmit} loading={loadingForm} />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Optional header context once submitted */}
          {context}

          {/* 2) Recommendations (only after submit) */}
          {recommendVisible && ranked && (
            <RankedTable ranked={ranked} yieldInfo={yieldInfo} />
          )}

          {/* 3) Expandables: Energy/Cost + Nearby Farmers + CSV batch */}
          {recommendVisible && (
            <div className="space-y-6">
              <EnergyCostCalculator
                powerKW={lastForm?.powerKW}
                tariffPerKwh={lastForm?.tariffPerKwh}
                hoursPerIrrigation={lastForm?.hoursPerIrrigation}
              />
              <NearbyFarmers farmers={farmers} />
              <CsvBatchUpload />
            </div>
          )}
        </div>

        {/* Sidebar quick actions */}
        <div>
          <QuickActionsToolbar
            onStartPump={startPumpAlert}
            onLowPressure={lowPressureAlert}
            onWeatherAlert={weatherAlert}
            busy={alertsBusy}
          />
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default IrrigationPage;
