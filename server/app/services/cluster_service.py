#!/usr/bin/env python3
"""
Clustering Service: prepares features, fits models (KMeans/DBSCAN), evaluates metrics,
persists artifacts, and exposes helpers to query runs.
"""
from __future__ import annotations

import os
import json
import time
import uuid
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans, DBSCAN
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
import joblib

<<<<<<< HEAD
from services.data_access import load_climate_features, load_yield_table, IDENTIFIER_COLUMNS
from services.cache import SimpleCache
=======
from app.services.data_access import load_climate_features, load_yield_table, IDENTIFIER_COLUMNS
from app.services.cache import SimpleCache
>>>>>>> a4a1021 (Initial commit with changes)

try:
	import umap  # type: ignore
	UMAP_AVAILABLE = True
except Exception:
	UMAP_AVAILABLE = False


@dataclass
class RunArtifacts:
	model: Any
	scaler: Optional[StandardScaler]
	projector: Optional[Any]
	features: List[str]
	identifiers: List[str]
	X: np.ndarray
	labels: np.ndarray
	assignments: pd.DataFrame
	config: Dict[str, Any]
	metrics: Dict[str, Any]
	created_at: float
	algo: str


class ClusterService:
	"""Service to manage clustering runs and artifacts."""

	def __init__(self, artifacts_dir: Optional[str] = None) -> None:
		self.artifacts_root = os.getenv("ARTIFACTS_DIR", artifacts_dir or "artifacts")
		self.cluster_root = os.path.join(self.artifacts_root, "cluster")
		os.makedirs(self.cluster_root, exist_ok=True)
		self.cache = SimpleCache(maxsize=8)
		self.max_page = int(os.getenv("MAX_ASSIGNMENT_PAGE_SIZE", "1000"))

	def _run_dir(self, run_id: str) -> str:
		path = os.path.join(self.cluster_root, run_id)
		os.makedirs(path, exist_ok=True)
		return path

	def _prepare_features(self,
						 preset: str,
						 features_include: Optional[List[str]] = None,
						 features_exclude: Optional[List[str]] = None,
						 filters: Optional[Dict[str, Any]] = None) -> Tuple[pd.DataFrame, List[str]]:
		"""Load and prepare features and return (df_with_ids_and_features, feature_columns)."""
		filters = filters or {}
		year_min = filters.get("year_min")
		year_max = filters.get("year_max")
		crop = filters.get("crop")
		state = filters.get("state")
		district = filters.get("district")

		if preset.lower() == "climate":
			df = load_climate_features(year_min, year_max, state, district)
		elif preset.lower() == "yield":
			yields = load_yield_table(crop=crop, year_min=year_min, year_max=year_max)
			if yields.empty:
				raise ValueError("No yield data available for the specified filters. Provide crop/year range.")
			# Use yield as the feature
			df = yields.rename(columns={"yield_kg_ha": "YIELD_KG_HA"})
		else:  # climate_yield
			climate = load_climate_features(year_min, year_max, state, district)
			yields = load_yield_table(crop=crop, year_min=year_min, year_max=year_max)
			if climate.empty or yields.empty:
				raise ValueError("Insufficient data for climate_yield preset. Check climate and yield sources.")
			df = pd.merge(climate, yields[[*IDENTIFIER_COLUMNS, "yield_kg_ha"]], on=IDENTIFIER_COLUMNS, how="inner")
			df = df.rename(columns={"yield_kg_ha": "YIELD_KG_HA"})

		# Select numeric features
		numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
		for idc in IDENTIFIER_COLUMNS:
			if idc in numeric_cols:
				numeric_cols.remove(idc)

		# Apply include/exclude
		if features_include:
			numeric_cols = [c for c in numeric_cols if c in set(features_include)]
		if features_exclude:
			numeric_cols = [c for c in numeric_cols if c not in set(features_exclude)]

		# Drop columns with > 40% missing
		missing_frac = df[numeric_cols].isna().mean()
		keep_cols = [c for c in numeric_cols if missing_frac.get(c, 0) <= 0.40]
		features = keep_cols
		if not features:
			raise ValueError("No usable features after filtering. Adjust preset or include/exclude lists.")

		return df[IDENTIFIER_COLUMNS + features].copy(), features

	def _impute_and_scale(self, X_df: pd.DataFrame, standardize: bool) -> Tuple[np.ndarray, Optional[StandardScaler], Dict[str, float]]:
		"""Median impute and optional standardize (z-score). Returns (X, scaler, medians)."""
		medians: Dict[str, float] = {c: float(X_df[c].median()) for c in X_df.columns}
		X_filled = X_df.fillna(medians)
		if standardize:
			scaler = StandardScaler()
			Xs = scaler.fit_transform(X_filled.values)
			return Xs.astype(np.float32), scaler, medians
		else:
			return X_filled.values.astype(np.float32), None, medians

	def _project_2d(self, X: np.ndarray, method: str) -> Tuple[Optional[np.ndarray], Optional[Any]]:
		method = (method or "none").lower()
		if method == "pca":
			pca = PCA(n_components=2, random_state=42)
			coords = pca.fit_transform(X)
			return coords.astype(np.float32), pca
		elif method == "umap" and UMAP_AVAILABLE:
			um = umap.UMAP(n_components=2, random_state=42)
			coords = um.fit_transform(X)
			return coords.astype(np.float32), um
		else:
			return None, None

	def _evaluate(self, algo: str, model: Any, X: np.ndarray, labels: np.ndarray) -> Dict[str, Any]:
		metrics: Dict[str, Any] = {}
		if algo == "kmeans":
			metrics["inertia"] = float(getattr(model, "inertia_", np.nan))
			# Silhouette only if at least 2 clusters and > 2 samples
			unique = np.unique(labels)
			if len(unique) > 1 and X.shape[0] > len(unique):
				try:
					metrics["silhouette_score"] = float(silhouette_score(X, labels))
				except Exception:
					metrics["silhouette_score"] = None
		elif algo == "dbscan":
			unique = np.unique(labels)
			n_clusters = int(np.sum(unique != -1))
			noise_ratio = float(np.mean(labels == -1)) if labels.size else 0.0
			metrics.update({"n_clusters": n_clusters, "noise_ratio": noise_ratio})
			if n_clusters > 1:
				try:
					metrics["silhouette_score"] = float(silhouette_score(X[labels != -1], labels[labels != -1]))
				except Exception:
					metrics["silhouette_score"] = None
		return metrics

	def create_run(self,
				 algo: str = "kmeans",
				 k: int = 5,
				 preset: str = "climate_yield",
				 features_include: Optional[List[str]] = None,
				 features_exclude: Optional[List[str]] = None,
				 filters: Optional[Dict[str, Any]] = None,
				 standardize: bool = True,
				 reduce_to_2d: str = "pca",
				 random_state: int = 42,
				 max_iter: int = 300,
				 eps: float = 0.5,
				 min_samples: int = 5) -> Dict[str, Any]:
		"""Create a clustering run, persist artifacts, and return summary info."""
		algo = (algo or "kmeans").lower()
		if algo == "kmeans" and k < 2:
			raise ValueError("k must be >= 2 for kmeans")
		if algo not in ("kmeans", "dbscan"):
			raise ValueError("Unsupported algo. Use 'kmeans' or 'dbscan'.")

		df_raw, features = self._prepare_features(preset, features_include, features_exclude, filters)
		X_df = df_raw[features]
		X, scaler, medians = self._impute_and_scale(X_df, standardize)

		# Fit model
		if algo == "kmeans":
			model = KMeans(n_clusters=k, n_init=10, random_state=random_state, max_iter=max_iter)
			labels = model.fit_predict(X)
		elif algo == "dbscan":
			model = DBSCAN(eps=eps, min_samples=min_samples)
			labels = model.fit_predict(X)

		coords, projector = self._project_2d(X, reduce_to_2d)
		metrics = self._evaluate(algo, model, X, labels)

		# Prepare assignments
		assign_df = df_raw[IDENTIFIER_COLUMNS].copy()
		assign_df["cluster"] = labels.astype(int)
		if coords is not None:
			assign_df["x"] = coords[:, 0]
			assign_df["y"] = coords[:, 1]

		# Persist artifacts
		run_id = str(uuid.uuid4())
		created_at = time.time()
		rdir = self._run_dir(run_id)
		joblib.dump(model, os.path.join(rdir, "model.joblib"))
		if scaler is not None:
			joblib.dump(scaler, os.path.join(rdir, "scaler.joblib"))
		if projector is not None:
			joblib.dump(projector, os.path.join(rdir, "projector.joblib"))
		# Save matrix and assignments
		np.save(os.path.join(rdir, "X.npy"), X)
		assign_df.to_csv(os.path.join(rdir, "assignments.csv"), index=False)
		with open(os.path.join(rdir, "features.json"), "w", encoding="utf-8") as f:
			json.dump({"feature_columns": features, "identifiers": IDENTIFIER_COLUMNS, "preset": preset, "medians": medians}, f)
		config = {
			"algo": algo,
			"k": k,
			"preset": preset,
			"features_include": features_include or [],
			"features_exclude": features_exclude or [],
			"filters": filters or {},
			"standardize": standardize,
			"reduce_to_2d": reduce_to_2d,
			"random_state": random_state,
			"max_iter": max_iter,
			"eps": eps,
			"min_samples": min_samples,
			"created_at": created_at,
		}
		with open(os.path.join(rdir, "config.json"), "w", encoding="utf-8") as f:
			json.dump(config, f)
		with open(os.path.join(rdir, "metrics.json"), "w", encoding="utf-8") as f:
			json.dump(metrics, f)

		artifacts = RunArtifacts(
			model=model,
			scaler=scaler,
			projector=projector,
			features=features,
			identifiers=IDENTIFIER_COLUMNS,
			X=X,
			labels=labels,
			assignments=assign_df,
			config=config,
			metrics=metrics,
			created_at=created_at,
			algo=algo,
		)
		self.cache.set(run_id, {
			"artifacts": artifacts,
			"dir": rdir,
		})

		return {
			"run_id": run_id,
			"n_samples": int(X.shape[0]),
			"n_features": int(X.shape[1]),
			"algo": algo,
			"metrics": metrics,
		}

	def _load_run(self, run_id: str) -> RunArtifacts:
		cached = self.cache.get(run_id)
		if cached:
			return cached["artifacts"]  # type: ignore
		rdir = self._run_dir(run_id)
		# Load parts
		model = joblib.load(os.path.join(rdir, "model.joblib"))
		scaler = None
		if os.path.exists(os.path.join(rdir, "scaler.joblib")):
			scaler = joblib.load(os.path.join(rdir, "scaler.joblib"))
		projector = None
		if os.path.exists(os.path.join(rdir, "projector.joblib")):
			projector = joblib.load(os.path.join(rdir, "projector.joblib"))
		with open(os.path.join(rdir, "features.json"), "r", encoding="utf-8") as f:
			fdata = json.load(f)
		features = fdata.get("feature_columns", [])
		assign_df = pd.read_csv(os.path.join(rdir, "assignments.csv"))
		X = np.load(os.path.join(rdir, "X.npy"))
		with open(os.path.join(rdir, "config.json"), "r", encoding="utf-8") as f:
			config = json.load(f)
		with open(os.path.join(rdir, "metrics.json"), "r", encoding="utf-8") as f:
			metrics = json.load(f)
		created_at = float(config.get("created_at", time.time()))
		algo = config.get("algo", "kmeans")
		artifacts = RunArtifacts(model=model, scaler=scaler, projector=projector, features=features,
			identifiers=IDENTIFIER_COLUMNS, X=X, labels=assign_df["cluster"].values.astype(int), assignments=assign_df,
			config=config, metrics=metrics, created_at=created_at, algo=algo)
		self.cache.set(run_id, {"artifacts": artifacts, "dir": rdir})
		return artifacts

	def list_runs(self) -> List[Dict[str, Any]]:
		rows: List[Dict[str, Any]] = []
		if not os.path.exists(self.cluster_root):
			return rows
		for run_id in sorted(os.listdir(self.cluster_root)):
			rdir = os.path.join(self.cluster_root, run_id)
			if not os.path.isdir(rdir):
				continue
			try:
				with open(os.path.join(rdir, "config.json"), "r", encoding="utf-8") as f:
					config = json.load(f)
				with open(os.path.join(rdir, "metrics.json"), "r", encoding="utf-8") as f:
					metrics = json.load(f)
				rows.append({
					"run_id": run_id,
					"created_at": config.get("created_at"),
					"algo": config.get("algo"),
					"k": config.get("k"),
					"preset": config.get("preset"),
					"metrics": metrics,
				})
			except Exception:
				continue
		return rows

	def get_run(self, run_id: str) -> Dict[str, Any]:
		art = self._load_run(run_id)
		return {
			"run_id": run_id,
			"created_at": art.created_at,
			"algo": art.algo,
			"config": art.config,
			"metrics": art.metrics,
			"features": art.features,
			"identifiers": art.identifiers,
			"n_samples": int(art.X.shape[0]),
			"n_features": int(art.X.shape[1]),
		}

	def get_assignments(self, run_id: str, offset: int = 0, limit: int = 500) -> Dict[str, Any]:
		limit = max(1, min(limit, self.max_page))
		art = self._load_run(run_id)
		df = art.assignments
		total = len(df)
		view = df.iloc[offset: offset + limit].copy()
		return {
			"total": int(total),
			"offset": int(offset),
			"limit": int(limit),
			"rows": view.to_dict(orient="records"),
		}

	def get_centroids(self, run_id: str) -> Dict[str, Any]:
		art = self._load_run(run_id)
		if art.algo == "kmeans":
			centers = getattr(art.model, "cluster_centers_", None)
			if centers is None:
				raise ValueError("No cluster centers available.")
			centroids = []
			for i, vec in enumerate(centers):
				vals = {feat: float(vec[j]) for j, feat in enumerate(art.features)}
				# top features by absolute loading
				top = sorted([(feat, abs(val)) for feat, val in vals.items()], key=lambda x: x[1], reverse=True)[:5]
				centroids.append({"cluster": i, "values": vals, "top_features": [t[0] for t in top]})
			return {"centroids": centroids, "note": "Centroids in standardized feature space if scaler was used."}
		else:
			# For DBSCAN, compute per-cluster means excluding noise
			labels = art.labels
			mask = labels != -1
			clusters = np.unique(labels[mask])
			profiles: List[Dict[str, Any]] = []
			for c in clusters:
				idx = np.where(labels == c)[0]
				if idx.size == 0:
					continue
				means = art.X[idx].mean(axis=0)
				vals = {feat: float(means[j]) for j, feat in enumerate(art.features)}
				profiles.append({"cluster": int(c), "count": int(idx.size), "means": vals})
			return {"profiles": profiles}

	def get_summary(self, run_id: str) -> Dict[str, Any]:
		art = self._load_run(run_id)
		labels = art.labels
		unique = sorted(set(int(x) for x in np.unique(labels) if x != -1)) if art.algo == "dbscan" else sorted(set(int(x) for x in np.unique(labels)))
		stats: Dict[str, Any] = {}
		for c in unique:
			idx = np.where(labels == c)[0]
			if idx.size == 0:
				continue
			Xc = art.X[idx]
			stats[str(c)] = {
				"count": int(idx.size),
				"mean": {f: float(Xc[:, j].mean()) for j, f in enumerate(art.features)},
				"std": {f: float(Xc[:, j].std()) for j, f in enumerate(art.features)},
				"min": {f: float(Xc[:, j].min()) for j, f in enumerate(art.features)},
				"max": {f: float(Xc[:, j].max()) for j, f in enumerate(art.features)},
			}
		return {"summary": stats}

	def transform(self, run_id: str, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
		art = self._load_run(run_id)
		# Build DataFrame in the same feature order
		df = pd.DataFrame(rows)
		missing = [c for c in art.features if c not in df.columns]
		for c in missing:
			df[c] = np.nan
		X_df = df[art.features]
		# Median impute using training medians from features.json
		with open(os.path.join(self._run_dir(run_id), "features.json"), "r", encoding="utf-8") as f:
			fdata = json.load(f)
		medians: Dict[str, float] = fdata.get("medians", {})
		X_imputed = X_df.copy()
		for c in art.features:
			val = medians.get(c)
			if val is not None:
				X_imputed[c] = X_imputed[c].fillna(val)
			else:
				X_imputed[c] = X_imputed[c].fillna(X_imputed[c].median())
		X = X_imputed.values.astype(np.float32)
		if art.scaler is not None:
			X = art.scaler.transform(X)
		# Predict labels
		if art.algo == "kmeans":
			labels = art.model.predict(X).astype(int)
		else:
			# DBSCAN has no predict; return -1 (noise)
			labels = np.full(shape=(X.shape[0],), fill_value=-1, dtype=int)
		# Project if projector exists
		xy = None
		if art.projector is not None:
			try:
				xy = art.projector.transform(X)
			except Exception:
				xy = None
		return {
			"labels": labels.tolist(),
			"coords": xy.tolist() if xy is not None else None,
		}
