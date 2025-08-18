#!/usr/bin/env python3
"""
Cluster API Router
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from services.cluster_service import ClusterService

router = APIRouter()
service = ClusterService()


class ClusterFilters(BaseModel):
	year_min: Optional[int] = None
	year_max: Optional[int] = None
	crop: Optional[str] = None
	state: Optional[str] = None
	district: Optional[str] = None


class CreateRunRequest(BaseModel):
	algo: str = Field("kmeans", description="Clustering algorithm: kmeans | dbscan")
	k: int = Field(5, ge=2, description="Number of clusters for KMeans")
	preset: str = Field("climate_yield", description="Feature preset: climate | yield | climate_yield")
	features_include: List[str] = Field(default_factory=list)
	features_exclude: List[str] = Field(default_factory=list)
	filters: ClusterFilters = Field(default_factory=ClusterFilters)
	standardize: bool = True
	reduce_to_2d: str = Field("pca", description="none | pca | umap")
	# Algo params
	random_state: int = 42
	max_iter: int = 300
	eps: float = 0.5
	min_samples: int = 5


class RunInfo(BaseModel):
	run_id: str
	created_at: float
	algo: str
	preset: Optional[str] = None
	k: Optional[int] = None
	metrics: Dict[str, Any]
	n_samples: Optional[int] = None
	n_features: Optional[int] = None


class AssignmentItem(BaseModel):
	state_norm: str
	district_norm: str
	year: int
	cluster: int
	x: Optional[float] = None
	y: Optional[float] = None


class TransformRequest(BaseModel):
	rows: List[Dict[str, Any]]


class TransformResult(BaseModel):
	labels: List[int]
	coords: Optional[List[List[float]]] = None


@router.post("/runs", response_model=RunInfo)
async def create_run(req: CreateRunRequest) -> Any:
	try:
		res = service.create_run(
			algo=req.algo,
			k=req.k,
			preset=req.preset,
			features_include=req.features_include,
			features_exclude=req.features_exclude,
			filters=req.filters.model_dump(exclude_none=True),
			standardize=req.standardize,
			reduce_to_2d=req.reduce_to_2d,
			random_state=req.random_state,
			max_iter=req.max_iter,
			eps=req.eps,
			min_samples=req.min_samples,
		)
		# augment with creation info
		info = service.get_run(res["run_id"])  # type: ignore
		return RunInfo(
			run_id=res["run_id"],
			created_at=info["created_at"],
			algo=res["algo"],
			preset=req.preset,
			k=req.k if req.algo.lower() == "kmeans" else None,
			metrics=res["metrics"],
			n_samples=res["n_samples"],
			n_features=res["n_features"],
		)
	except ValueError as ve:
		raise HTTPException(status_code=400, detail=str(ve))
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to create run: {e}")


@router.get("/runs")
async def list_runs() -> Any:
	return service.list_runs()


@router.get("/runs/{run_id}", response_model=RunInfo)
async def get_run(run_id: str) -> Any:
	try:
		info = service.get_run(run_id)
		return RunInfo(
			run_id=run_id,
			created_at=info["created_at"],
			algo=info["algo"],
			preset=info["config"].get("preset"),
			k=info["config"].get("k"),
			metrics=info["metrics"],
			n_samples=info["n_samples"],
			n_features=info["n_features"],
		)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Unknown run_id")
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to load run: {e}")


@router.get("/runs/{run_id}/assignments")
async def get_assignments(run_id: str, offset: int = 0, limit: int = 500) -> Any:
	try:
		return service.get_assignments(run_id, offset=offset, limit=limit)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Unknown run_id")
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to load assignments: {e}")


@router.get("/runs/{run_id}/centroids")
async def get_centroids(run_id: str) -> Any:
	try:
		return service.get_centroids(run_id)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Unknown run_id")
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to compute centroids: {e}")


@router.get("/runs/{run_id}/summary")
async def get_summary(run_id: str) -> Any:
	try:
		return service.get_summary(run_id)
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Unknown run_id")
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Failed to compute summary: {e}")


@router.post("/runs/{run_id}/transform", response_model=TransformResult)
async def transform(run_id: str, req: TransformRequest) -> Any:
	try:
		res = service.transform(run_id, req.rows)
		return TransformResult(labels=res["labels"], coords=res.get("coords"))
	except FileNotFoundError:
		raise HTTPException(status_code=404, detail="Unknown run_id")
	except Exception as e:
		raise HTTPException(status_code=422, detail=f"Transform failed: {e}")
