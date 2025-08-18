import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Users,
  Droplets,
  Tractor,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  Phone,
} from "lucide-react";

/** ---------- types ---------- */
type ClusterType = "canal" | "bore" | "tank" | "mixed";
type SessionKind = "sowing" | "irrigation" | "fertilizer" | "harvest";

type Cluster = {
  id: string;
  name: string;
  type: ClusterType;
  centroid: [number, number];
  polygon?: Array<[number, number]>;
  plots: number;
  areaHa: number;
  plannedCrop?: string;
  harvestWindow?: string;
  nextIrrigation?: string;
  quorum: { yes: number; total: number };
  irrigationIcon?: string;
  distanceKm?: number;
  soilSimilarity?: number; // 0..1
  slotsLeft?: number;
};

type JoinPayload = {
  farmer_id: string;
  plot_ids: string[];
  consent_hash: string;
  docs?: File[];
};

type VotePayload = {
  farmer_id: string;
  action: "agree" | "disagree" | "propose";
  reason?: string;
  proposal?: { startDate?: string; endDate?: string; volumePct?: number };
};

/** ---------- mock helpers (replace with your API calls) ---------- */
const mockClusters: Cluster[] = [
  {
    id: "a",
    name: "Cluster A — Canal Zone 1",
    type: "canal",
    centroid: [28.6139, 77.209],
    plots: 12,
    areaHa: 18.5,
    plannedCrop: "Paddy",
    harvestWindow: "Oct 12–14",
    nextIrrigation: "Aug 22, 6 AM",
    quorum: { yes: 7, total: 10 },
    distanceKm: 4.3,
    soilSimilarity: 0.86,
    slotsLeft: 4,
  },
  {
    id: "b",
    name: "Cluster B — Bore Zone 2",
    type: "bore",
    centroid: [26.9124, 75.7873],
    plots: 9,
    areaHa: 11.2,
    plannedCrop: "Maize",
    harvestWindow: "Sep 30–Oct 02",
    nextIrrigation: "Aug 21, 7 AM",
    quorum: { yes: 5, total: 9 },
    distanceKm: 3.2,
    soilSimilarity: 0.72,
    slotsLeft: 3,
  },
  {
    id: "c",
    name: "Cluster C — Tank Zone 3",
    type: "tank",
    centroid: [26.4499, 80.3319],
    plots: 16,
    areaHa: 23.7,
    plannedCrop: "Paddy",
    harvestWindow: "Oct 18–20",
    nextIrrigation: "Aug 23, 6 AM",
    quorum: { yes: 11, total: 16 },
    distanceKm: 7.4,
    soilSimilarity: 0.64,
    slotsLeft: 6,
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiJoinCluster(_clusterId: string, _payload: JoinPayload) {
  await sleep(700);
  return { status: "joined", request_id: "REQ-" + Math.floor(Math.random() * 9999) };
}

async function apiRequestSwitch(_from: string, _to: string, _reason: string) {
  await sleep(600);
  return { status: "pending", request_id: "SW-" + Math.floor(Math.random() * 9999) };
}

async function apiVote(_sessionId: string, _payload: VotePayload) {
  await sleep(500);
  return { status: "ok", quorum_percent: 68 };
}

/** ---------- icons & colors ---------- */
const clusterColor: Record<ClusterType, string> = {
  canal: "#16a34a",
  bore: "#0ea5e9",
  tank: "#f59e0b",
  mixed: "#64748b",
};
const typeLabel: Record<ClusterType, string> = {
  canal: "Canal",
  bore: "Bore",
  tank: "Tank",
  mixed: "Mixed",
};

/** ---------- marker icon fix (Leaflet default) ---------- */
const DefaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

/** ---------- small components ---------- */
const Badge: React.FC<{ children: React.ReactNode; tone?: "green"|"blue"|"amber"|"gray" }> = ({ children, tone="green" }) => (
  <span
    className={
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
      (tone==="green" ? "bg-green-50 text-green-700 border border-green-200" :
      tone==="blue" ? "bg-blue-50 text-blue-700 border border-blue-200" :
      tone==="amber" ? "bg-amber-50 text-amber-700 border border-amber-200" :
      "bg-gray-50 text-gray-700 border border-gray-200")
    }
  >
    {children}
  </span>
);

/** ---------- map click helper (closes popups on outside click) ---------- */
const ClickCloser: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  useMapEvents({
    click: () => onClick(),
  });
  return null;
};

/** ---------- Slide-over shell ---------- */
const SlideOver: React.FC<{ title: string; open: boolean; onClose: () => void; children: React.ReactNode }> = ({ title, open, onClose, children }) => {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black transition-opacity ${open ? "opacity-40" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-xl transform transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        <div className="h-[calc(100%-56px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

/** ---------- Upload Doc Modal ---------- */
const UploadDocModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onUploaded: (files: File[]) => void;
}> = ({ open, onClose, onUploaded }) => {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "hidden"}`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow">
        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold">Upload Documents</h3>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">Required: <b>Bainama / Khatauni / Khasra</b></p>
          <label className="block border-2 border-dashed rounded-lg p-6 text-center text-gray-600 hover:border-green-400 cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="hidden"
            />
            Tap to select files (images or PDF)
          </label>
          {!!files.length && (
            <div className="text-sm text-gray-700">
              {files.map((f) => (
                <div key={f.name} className="truncate">• {f.name}</div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button className="px-4 py-2 rounded border" onClick={onClose}>Cancel</button>
            <button
              className="px-4 py-2 rounded bg-green-600 text-white"
              onClick={() => { onUploaded(files); onClose(); }}
            >
              Upload
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Files stored encrypted, used only for cluster verification. You can revoke any time.
          </div>
        </div>
      </div>
    </div>
  );
};

/** ---------- Join Modal ---------- */
const JoinModal: React.FC<{
  open: boolean;
  onClose: () => void;
  cluster?: Cluster;
  onJoined: () => void;
}> = ({ open, onClose, cluster, onJoined }) => {
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [docs, setDocs] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  if (!cluster) return null;

  const handleConfirm = async () => {
    if (!agree1 || !agree2) return;
    setBusy(true);
    await apiJoinCluster(cluster.id, {
      farmer_id: "me",
      plot_ids: [],
      consent_hash: "hash",
      docs,
    });
    setBusy(false);
    onClose();
    onJoined();
  };

  return (
    <>
      <div className={`fixed inset-0 z-50 ${open ? "" : "hidden"}`}>
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-xl">

          <div className="p-5 border-b flex items-center justify-between">
            <h3 className="font-semibold">Join {cluster.name}</h3>
            <button onClick={onClose}><X /></button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border p-3">
                <div className="font-medium mb-1">Cluster Info</div>
                <div>Plots in cluster: <b>{cluster.plots}</b></div>
                <div>Capacity: <b>{Math.max(cluster.plots + (cluster.slotsLeft ?? 0), cluster.plots)}</b></div>
                <div>Current members: <b>{cluster.quorum.total}</b></div>
                <div>Type: <b>{typeLabel[cluster.type]}</b></div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="font-medium mb-1">Why recommended</div>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Soil match {(cluster.soilSimilarity ?? 0)*100 | 0}%</li>
                  <li>Nearby • {cluster.distanceKm?.toFixed(1)} km</li>
                  <li>{typeLabel[cluster.type]} water source</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={agree1} onChange={(e)=>setAgree1(e.target.checked)} />
                <span>I agree to share my land details & sign this season’s commitment.</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={agree2} onChange={(e)=>setAgree2(e.target.checked)} />
                <span>I confirm I am the owner or authorised.</span>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                className="px-4 py-2 rounded border"
                onClick={() => setUploadOpen(true)}
              >
                Upload Documents
              </button>
              <button
                disabled={!agree1 || !agree2 || busy}
                onClick={handleConfirm}
                className={`px-5 py-2 rounded text-white ${!agree1 || !agree2 ? "bg-green-400/60" : "bg-green-600 hover:bg-green-700"}`}
              >
                {busy ? "Joining..." : "Confirm Join"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <UploadDocModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(f) => setDocs(f)}
      />
    </>
  );
};

/** ---------- Request Switch Modal ---------- */
const RequestSwitchModal: React.FC<{
  open: boolean;
  onClose: () => void;
  currentClusterId?: string;
  clusters: Cluster[];
}> = ({ open, onClose, currentClusterId, clusters }) => {
  const [target, setTarget] = useState<string>("");
  const [reason, setReason] = useState<"better"|"window"|"other">("better");
  const [msg, setMsg] = useState("");
  const [resp, setResp] = useState<string>("");

  useEffect(()=>{ setResp(""); }, [open]);

  const submit = async () => {
    if (!target) return;
    const r = await apiRequestSwitch(currentClusterId || "", target, reason);
    setResp(`Request sent • ID ${r.request_id}. Steward approval pending.`);
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "hidden"}`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-xl">

        <div className="p-5 border-b flex items-center justify-between">
          <h3 className="font-semibold">Request Switch</h3>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid gap-3">
            <label className="text-sm font-medium">Target cluster</label>
            <select
              value={target}
              onChange={(e)=>setTarget(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Select...</option>
              {clusters
                .filter(c => c.id !== currentClusterId)
                .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              }
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Reason</div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={reason==="better"} onChange={()=>setReason("better")} />
                Better irrigation
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={reason==="window"} onChange={()=>setReason("window")} />
                Same crop window
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={reason==="other"} onChange={()=>setReason("other")} />
                Other
              </label>
            </div>
          </div>

          <textarea
            placeholder="Optional message"
            value={msg}
            onChange={(e)=>setMsg(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />

          <div className="flex justify-end">
            <button className="px-4 py-2 rounded bg-green-600 text-white" onClick={submit}>
              Submit
            </button>
          </div>

          {!!resp && <div className="text-sm text-green-700">{resp}</div>}
        </div>
      </div>
    </div>
  );
};

/** ---------- Sowing slide-over (with date pickers + Agree/Disagree/Propose) ---------- */
const SowingSlideOver: React.FC<{
  open: boolean;
  onClose: () => void;
  onVote: (p: VotePayload) => void;
}> = ({ open, onClose, onVote }) => {
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [reason, setReason] = useState<"earlier"|"pump"|"pest">("earlier");

  return (
    <SlideOver title="Sowing Session" open={open} onClose={onClose}>
      <div className="p-4 space-y-6">
        <div>
          <div className="text-sm text-gray-600 mb-2">Progress</div>
          <div className="h-2 rounded bg-gray-100">
            <div className="h-2 bg-green-600 rounded" style={{ width: "50%" }} />
          </div>
          <div className="mt-1 text-xs text-gray-500">Day 4 of 8</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={()=>onVote({farmer_id:"me", action:"agree"})} className="py-2 rounded bg-green-600 text-white">Agree</button>
          <button onClick={()=>onVote({farmer_id:"me", action:"disagree"})} className="py-2 rounded bg-red-600 text-white">Disagree</button>
        </div>

        <div className="border rounded-lg p-3">
          <div className="font-medium mb-2">Propose Change</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Start date</label>
              <input type="date" value={start} onChange={(e)=>setStart(e.target.value)} className="w-full border rounded px-2 py-2" />
            </div>
            <div>
              <label className="text-xs text-gray-600">End date</label>
              <input type="date" value={end} onChange={(e)=>setEnd(e.target.value)} className="w-full border rounded px-2 py-2" />
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="radio" checked={reason==="earlier"} onChange={()=>setReason("earlier")} /> I want earlier sowing</label>
            <label className="flex items-center gap-2"><input type="radio" checked={reason==="pump"} onChange={()=>setReason("pump")} /> My pump not ready</label>
            <label className="flex items-center gap-2"><input type="radio" checked={reason==="pest"} onChange={()=>setReason("pest")} /> Pest outbreak</label>
          </div>
          <button
            onClick={()=>onVote({farmer_id:"me", action:"propose", reason, proposal:{ startDate:start, endDate:end }})}
            className="mt-3 w-full py-2 rounded bg-amber-600 text-white"
          >
            Submit Proposal
          </button>
        </div>
      </div>
    </SlideOver>
  );
};

/** ---------- Irrigation slide-over ---------- */
const IrrigationSlideOver: React.FC<{
  open: boolean;
  onClose: () => void;
  onVote: (p: VotePayload) => void;
}> = ({ open, onClose, onVote }) => {
  const [volumePct, setVolumePct] = useState(50);
  const [reason, setReason] = useState("No Water");
  return (
    <SlideOver title="Irrigation Block" open={open} onClose={onClose}>
      <div className="p-4 space-y-6">
        <div className="text-sm text-gray-600">Per-plot moisture (last 7 days)</div>
        <div className="h-28 bg-gray-100 rounded" />
        <div className="border rounded-lg p-3">
          <div className="font-medium mb-2">Planned Dates (locked where shown)</div>
          <ul className="space-y-2 text-sm">
            {["Aug 20 6:00 AM","Aug 22 6:00 AM","Aug 24 6:00 AM"].map((d,i)=>(
              <li key={i} className="flex items-center justify-between">
                <span>{d}</span>
                <Badge tone="gray">🔒</Badge>
              </li>
            ))}
          </ul>
        </div>

        <div className="border rounded-lg p-3">
          <div className="font-medium">Set Personal Alert</div>
          <button className="mt-2 w-full rounded bg-green-600 text-white py-2">Enable SMS Reminder</button>
        </div>

        <div className="border rounded-lg p-3 space-y-3">
          <div className="font-medium">Request Volume Change</div>
          <input type="range" min={20} max={200} value={volumePct}
                 onChange={(e)=>setVolumePct(+e.target.value)} className="w-full" />
          <div className="text-sm text-gray-600">Volume: {volumePct}%</div>
          <select className="border rounded px-2 py-2 w-full">
            <option>Reason (optional)</option>
            <option>Low soil moisture</option>
            <option>Canal shutdown</option>
          </select>
          <button
            className="w-full rounded bg-blue-600 text-white py-2"
            onClick={()=>onVote({farmer_id:"me", action:"propose", proposal:{ volumePct }})}
          >
            Submit Volume Request
          </button>
        </div>

        <div className="border rounded-lg p-3 space-y-2">
          <div className="font-medium">Report Issue</div>
          <div className="grid grid-cols-2 gap-2">
            {["No Water","Pump Failure","Broken Valve","Field Flood"].map((r)=>(
              <button
                key={r}
                className={`py-2 rounded border ${reason === r ? "border-green-600 text-green-700" : ""}`}
                onClick={()=>setReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="w-full py-2 rounded bg-red-600 text-white">Send Alert to Steward</button>
        </div>
      </div>
    </SlideOver>
  );
};

/** ---------- Quick Actions (toolbar) ---------- */
const QuickActionsToolbar: React.FC<{
  onStartPump: () => void;
  onLowPressure: () => void;
  onWeatherAlert: () => void;
}> = ({ onStartPump, onLowPressure, onWeatherAlert }) => {
  return (
    <div className="sticky top-2 z-10 bg-white/90 backdrop-blur rounded-xl border p-3 flex flex-wrap gap-2">
      <button onClick={onStartPump} className="px-3 py-2 rounded bg-green-600 text-white text-sm">Start Pump Alert</button>
      <button onClick={onLowPressure} className="px-3 py-2 rounded bg-amber-600 text-white text-sm">Low Pressure</button>
      <button onClick={onWeatherAlert} className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Weather Alerts</button>
    </div>
  );
};

/** ---------- Bottom sheet (Nearby clusters) ---------- */
const NearbySheet: React.FC<{
  clusters: Cluster[];
  open: boolean;
  setOpen: (v: boolean) => void;
  onJoin: (c: Cluster) => void;
}> = ({ clusters, open, setOpen, onJoin }) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div
        className={`mx-auto w-full max-w-6xl transition-transform ${
          open ? "translate-y-0" : "translate-y-[70%]"
        }`}
      >
        <div className="mx-3 sm:mx-6 rounded-t-2xl bg-white shadow-xl border">
          <button
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600"
            onClick={() => setOpen(!open)}
          >
            {open ? <ChevronDown /> : <ChevronUp />}
            Nearby Clusters (recommended)
          </button>
          <div className="px-4 pb-4">
            <div className="flex items-center gap-4 py-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" /> Same canal</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Similar soil</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Same crop window</label>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clusters.map((c)=>(
                <div key={c.id} className="rounded-xl border p-4">
                  <div className="font-semibold">{c.name}</div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><MapPin size={14}/> {c.distanceKm?.toFixed(1)} km</span>
                    <span className="flex items-center gap-1"><Users size={14}/> {c.plots} plots • {c.areaHa} ha</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge tone="green"><Droplets size={12} className="mr-1"/> {typeLabel[c.type]}</Badge>
                    <Badge tone="blue">{Math.round((c.soilSimilarity ?? 0)*100)}% soil similarity</Badge>
                    <Badge tone="gray">slots {c.slotsLeft ?? 0}</Badge>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 border rounded py-2">View</button>
                    <button onClick={()=>onJoin(c)} className="flex-1 rounded bg-green-600 text-white py-2">Join</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** ---------- MyCluster right panel (cards) ---------- */
const MyClusterPanel: React.FC<{
  hasCluster: boolean;
  onOpenSowing: () => void;
  onOpenIrrigation: () => void;
}> = ({ hasCluster, onOpenSowing, onOpenIrrigation }) => {
  if (!hasCluster) {
    return (
      <div className="rounded-2xl border bg-white p-4 text-gray-600">
        Join a cluster to see your sessions here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="rounded-2xl border bg-white p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold">Cluster A — Canal Zone 1</div>
          <div className="text-sm text-gray-600">Steward: Rakesh | Quorum 8/11</div>
        </div>
        <button className="inline-flex items-center gap-2 rounded bg-green-50 text-green-700 border border-green-200 px-3 py-1.5">
          <CheckCircle2 size={16}/> Open
        </button>
      </div>

      {/* Sowing card */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center gap-2 font-semibold"><span>🌱</span> Sowing Session</div>
        <div className="mt-2 h-2 bg-gray-100 rounded">
          <div className="h-2 bg-green-600 rounded" style={{width:"50%"}} />
        </div>
        <div className="mt-1 text-xs text-gray-500">Day 4 of 8 (50%) • Paddy — IR-64 • Agreed 7/10</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button className="py-2 rounded bg-green-600 text-white">Agree</button>
          <button className="py-2 rounded bg-red-600 text-white">Disagree</button>
          <button className="py-2 rounded bg-amber-600 text-white" onClick={onOpenSowing}>Propose Change</button>
        </div>
      </div>

      {/* Irrigation card */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center gap-2 font-semibold"><span>💧</span> Irrigation Block</div>
        <div className="text-sm text-gray-600 mt-1">Next watering in 1 day • <b>1800 L/acre</b></div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="py-2 rounded bg-green-600 text-white">Set Alert</button>
          <button className="py-2 rounded bg-blue-600 text-white" onClick={onOpenIrrigation}>View Plan</button>
        </div>
      </div>

      {/* Fertilizer + Harvest (compact) */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold">Fertilizer Window</div>
        <div className="text-sm text-gray-600 mt-1">DAP 50kg/acre • Aug 26–28</div>
        <button className="mt-2 py-2 px-3 rounded border">Agree</button>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Harvest Slot</div>
            <div className="text-sm text-gray-600">Oct 12–14 • Machinery assigned</div>
          </div>
          <button className="inline-flex items-center gap-2 rounded border px-3 py-1.5">
            <Phone size={16}/> Call Steward
          </button>
        </div>
        <button className="mt-3 py-2 px-3 rounded border">Notify me before slot</button>
      </div>
    </div>
  );
};

/** ---------- MAIN PAGE ---------- */
const ClusterFarming: React.FC = () => {
  const [clusters] = useState<Cluster[]>(mockClusters);
  const [selected, setSelected] = useState<Cluster | undefined>();
  const [joinOpen, setJoinOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [nearbyOpen, setNearbyOpen] = useState(true);
  const [hasCluster, setHasCluster] = useState(false);

  // slide-overs
  const [sowingOpen, setSowingOpen] = useState(false);
  const [irrigationOpen, setIrrigationOpen] = useState(false);

  const handleVote = async (payload: VotePayload) => {
    await apiVote("session-x", payload);
    alert("Thanks — your vote recorded.");
  };

  return (
    <Layout>
      <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-6 py-4 space-y-3">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xl font-semibold">
            Village Clusters — <span className="text-gray-700">Your Village</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm rounded-full border px-3 py-1.5">
              <CheckCircle2 className="text-green-600" size={16}/> Sync: <b className="text-green-700">Green</b>
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
              <input placeholder="Search plot no. or farmer name..."
                     className="pl-9 pr-3 py-2 border rounded-full w-[280px] max-w-full" />
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <QuickActionsToolbar
          onStartPump={()=>alert("Pump alert sent")}
          onLowPressure={()=>alert("Low pressure alert")}
          onWeatherAlert={()=>alert("Weather alerts enabled")}
        />
        {/* Main 2-column layout */}
<div className="grid grid-cols-12 gap-4 h-[calc(100vh-160px)]">
  {/* Left: Map */}
  <div className="col-span-7 rounded-2xl border overflow-hidden bg-white">
    <MapContainer
      center={[26.9, 75.8]}
      zoom={6}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {clusters.map((c) => (
        <Marker key={c.id} position={c.centroid}>
          <Popup>
            <div className="w-64 space-y-2">
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-gray-600">
                Crop: {c.plannedCrop} • Harvest: {c.harvestWindow}
              </div>
              <div className="text-sm flex items-center gap-2">
                <Droplets size={14}/> Next irrigation: {c.nextIrrigation}
              </div>
              <div className="text-sm flex items-center gap-2">
                <Users size={14}/> Quorum: {c.quorum.yes}/{c.quorum.total}
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 border rounded py-1">View</button>
                <button
                  className="flex-1 rounded bg-green-600 text-white py-1"
                  onClick={() => { setSelected(c); setJoinOpen(true); }}
                >
                  Join
                </button>
                <button
                  className="flex-1 rounded bg-amber-600 text-white py-1"
                  onClick={() => { setSelected(c); setSwitchOpen(true); }}
                >
                  Switch
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  </div>

  {/* Right: Side panel (scrollable) */}
  <div className="col-span-5 flex flex-col gap-4 overflow-hidden">
    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
      <MyClusterPanel
        hasCluster={hasCluster}
        onOpenSowing={() => setSowingOpen(true)}
        onOpenIrrigation={() => setIrrigationOpen(true)}
      />

      <div className="rounded-2xl border bg-white p-4">
        <div className="font-semibold mb-2">Nearby Clusters</div>
        <div className="flex items-center gap-4 py-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" /> Same canal</label>
          <label className="flex items-center gap-2"><input type="checkbox" /> Similar soil</label>
          <label className="flex items-center gap-2"><input type="checkbox" /> Same crop window</label>
        </div>
        <div className="grid gap-3">
          {clusters.map((c) => (
            <div key={c.id} className="border rounded-lg p-3">
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-gray-600 mb-2">
                {c.distanceKm?.toFixed(1)} km • {c.plots} plots • {c.areaHa} ha
              </div>
              <div className="flex gap-2">
                <button className="flex-1 border rounded py-1">View</button>
                <button
                  className="flex-1 rounded bg-green-600 text-white py-1"
                  onClick={() => { setSelected(c); setJoinOpen(true); }}
                >
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>


        

      

        {/* Bottom sheet */}
        <NearbySheet
          clusters={clusters}
          open={nearbyOpen}
          setOpen={setNearbyOpen}
          onJoin={(c)=>{ setSelected(c); setJoinOpen(true); }}
        />
      </div>

      {/* Modals / Slide overs */}
      <JoinModal open={joinOpen} onClose={()=>setJoinOpen(false)} cluster={selected!} onJoined={()=>{ setHasCluster(true); alert("Joined Cluster — My Cluster unlocked"); }} />
      <RequestSwitchModal open={switchOpen} onClose={()=>setSwitchOpen(false)} currentClusterId={selected?.id} clusters={clusters}/>
      <SowingSlideOver open={sowingOpen} onClose={()=>setSowingOpen(false)} onVote={handleVote}/>
      <IrrigationSlideOver open={irrigationOpen} onClose={()=>setIrrigationOpen(false)} onVote={handleVote}/>
    </Layout>
  );
};

export default ClusterFarming;