import React, { useState } from 'react';

type CreateRunPayload = {
  algo: 'kmeans' | 'dbscan';
  k?: number;
  preset: 'climate' | 'yield' | 'climate_yield';
  features_include: string[];
  features_exclude: string[];
  filters: Record<string, any>;
  standardize: boolean;
  reduce_to_2d: 'none' | 'pca' | 'umap';
  random_state?: number;
  max_iter?: number;
  eps?: number;
  min_samples?: number;
};

const Cluster: React.FC = () => {
  const [algo, setAlgo] = useState<'kmeans' | 'dbscan'>('kmeans');
  const [k, setK] = useState<number>(3);
  const [preset, setPreset] = useState<'climate' | 'yield' | 'climate_yield'>('climate');
  const [crop, setCrop] = useState<string>('');
  const [yearMin, setYearMin] = useState<string>('2000');
  const [yearMax, setYearMax] = useState<string>('2005');
  const [reduce2d, setReduce2d] = useState<'none' | 'pca' | 'umap'>('pca');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [runId, setRunId] = useState<string>('');
  const [metrics, setMetrics] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);

  const apiBase = '';

  async function createRun() {
    setLoading(true);
    setError('');
    try {
      const payload: CreateRunPayload = {
        algo,
        k: algo === 'kmeans' ? k : undefined,
        preset,
        features_include: [],
        features_exclude: [],
        filters: {
          year_min: yearMin ? Number(yearMin) : undefined,
          year_max: yearMax ? Number(yearMax) : undefined,
          crop: preset !== 'climate' && crop ? crop : undefined,
        },
        standardize: true,
        reduce_to_2d: reduce2d,
        random_state: 42,
        max_iter: 300,
        eps: 0.5,
        min_samples: 5,
      };

      const res = await fetch(`${apiBase}/api/cluster/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Failed to create run');
      }
      const data = await res.json();
      setRunId(data.run_id);
      setMetrics(data.metrics);
      await loadAssignments(data.run_id);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function loadAssignments(id = runId) {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/cluster/runs/${id}/assignments?offset=0&limit=200`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAssignments(data.rows || []);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-green-800 mb-4">Cluster</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm text-green-700 mb-1">Algorithm</label>
          <select className="w-full border rounded p-2" value={algo} onChange={e => setAlgo(e.target.value as any)}>
            <option value="kmeans">KMeans</option>
            <option value="dbscan">DBSCAN</option>
          </select>
        </div>
        {algo === 'kmeans' && (
          <div>
            <label className="block text-sm text-green-700 mb-1">k</label>
            <input className="w-full border rounded p-2" type="number" min={2} value={k} onChange={e => setK(Number(e.target.value))} />
          </div>
        )}
        <div>
          <label className="block text-sm text-green-700 mb-1">Preset</label>
          <select className="w-full border rounded p-2" value={preset} onChange={e => setPreset(e.target.value as any)}>
            <option value="climate">climate</option>
            <option value="yield">yield</option>
            <option value="climate_yield">climate_yield</option>
          </select>
        </div>
        {preset !== 'climate' && (
          <div>
            <label className="block text-sm text-green-700 mb-1">Crop (for yield presets)</label>
            <input className="w-full border rounded p-2" placeholder="RICE" value={crop} onChange={e => setCrop(e.target.value)} />
          </div>
        )}
        <div>
          <label className="block text-sm text-green-700 mb-1">Year min</label>
          <input className="w-full border rounded p-2" value={yearMin} onChange={e => setYearMin(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-green-700 mb-1">Year max</label>
          <input className="w-full border rounded p-2" value={yearMax} onChange={e => setYearMax(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-green-700 mb-1">2D Projection</label>
          <select className="w-full border rounded p-2" value={reduce2d} onChange={e => setReduce2d(e.target.value as any)}>
            <option value="pca">pca</option>
            <option value="umap">umap</option>
            <option value="none">none</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button className="bg-green-600 text-white rounded px-4 py-2" onClick={createRun} disabled={loading}>
          {loading ? 'Running…' : 'Create Run'}
        </button>
        {runId && (
          <>
            <span className="text-sm text-green-800">run_id: {runId}</span>
            <button className="border border-green-600 text-green-700 rounded px-3 py-1" onClick={() => loadAssignments()}>Reload assignments</button>
          </>
        )}
      </div>

      {error && (
        <div className="text-red-600 text-sm mb-3">{error}</div>
      )}

      {metrics && (
        <div className="text-sm text-green-900 mb-3">
          <pre className="whitespace-pre-wrap">{JSON.stringify(metrics, null, 2)}</pre>
        </div>
      )}

      {assignments.length > 0 && (
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-green-100">
              <tr>
                <th className="text-left p-2">state</th>
                <th className="text-left p-2">district</th>
                <th className="text-left p-2">year</th>
                <th className="text-left p-2">cluster</th>
                <th className="text-left p-2">x</th>
                <th className="text-left p-2">y</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((r, i) => (
                <tr key={i} className={i % 2 ? 'bg-white' : 'bg-green-50'}>
                  <td className="p-2">{r.state_norm}</td>
                  <td className="p-2">{r.district_norm}</td>
                  <td className="p-2">{r.year}</td>
                  <td className="p-2">{r.cluster}</td>
                  <td className="p-2">{typeof r.x === 'number' ? r.x.toFixed(3) : ''}</td>
                  <td className="p-2">{typeof r.y === 'number' ? r.y.toFixed(3) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Cluster;
