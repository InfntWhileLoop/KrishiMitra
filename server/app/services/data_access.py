#!/usr/bin/env python3
"""
Data access utilities for clustering API.
Loads climate feature tables and tidy yield tables from CSVs in the project root.
"""

from __future__ import annotations

import os
import re
from typing import Optional, Tuple, List
import pandas as pd

IDENTIFIER_COLUMNS = ["state_norm", "district_norm", "year"]


def _norm_text(value: str) -> str:
	"""Normalize text to create stable join keys: uppercase, trim, remove punctuation, collapse spaces."""
	if value is None or (isinstance(value, float) and pd.isna(value)):
		return ""
	s = str(value).upper().strip()
	s = re.sub(r"[\W_]+", " ", s)  # replace non-alnum with space
	s = re.sub(r"\s+", " ", s).strip()
	return s


def _ensure_identifiers(df: pd.DataFrame, state_col: str, district_col: str, year_col: str) -> pd.DataFrame:
	"""Add normalized identifier columns to the DataFrame."""
	df = df.copy()
	df["state_norm"] = df[state_col].map(_norm_text)
	df["district_norm"] = df[district_col].map(_norm_text)
	df["year"] = pd.to_numeric(df[year_col], errors="coerce").astype("Int64")
	return df


def load_climate_features(year_min: Optional[int] = None,
							 year_max: Optional[int] = None,
							 state: Optional[str] = None,
							 district: Optional[str] = None) -> pd.DataFrame:
	"""
	Load climate features from a merged climate CSV if present, else from sample data.
	Returns a DataFrame with identifiers and numeric climate columns.
	"""
	candidates: List[str] = [
		"main merge (droped _merge==2) (560 dist 1990-2015).csv",
		"sample_climate_data.csv",
	]
	path = next((p for p in candidates if os.path.exists(p)), None)
	if path is None:
		return pd.DataFrame(columns=IDENTIFIER_COLUMNS)

	df = pd.read_csv(path)
	# Heuristically locate id columns
	state_col = next((c for c in df.columns if c.lower().startswith("state")), None)
	dist_col = next((c for c in df.columns if c.lower().startswith("district")), None)
	year_col = next((c for c in df.columns if c.lower() == "year"), None)
	if not all([state_col, dist_col, year_col]):
		return pd.DataFrame(columns=IDENTIFIER_COLUMNS)

	df = _ensure_identifiers(df, state_col, dist_col, year_col)

	# Filter
	if year_min is not None:
		df = df[df["year"] >= year_min]
	if year_max is not None:
		df = df[df["year"] <= year_max]
	if state:
		state_n = _norm_text(state)
		df = df[df["state_norm"] == state_n]
	if district:
		dist_n = _norm_text(district)
		df = df[df["district_norm"] == dist_n]

	# Keep numeric climate-like columns
	numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
	# Remove identifiers from numeric list
	for idc in IDENTIFIER_COLUMNS:
		if idc in numeric_cols:
			numeric_cols.remove(idc)

	# Also heuristically keep columns with certain keywords even if read as numeric already
	keywords = ("TEMP", "RAIN", "PRECIP", "ET", "EVAP", "HUMID")
	selected = [c for c in df.columns if any(k in c.upper() for k in keywords)]
	feature_cols = sorted(set(numeric_cols).union(selected))
	return df[IDENTIFIER_COLUMNS + feature_cols]


def load_yield_table(crop: Optional[str] = None,
					year_min: Optional[int] = None,
					year_max: Optional[int] = None) -> pd.DataFrame:
	"""
	Load tidy yield table from ICRISAT CSV by melting 'YIELD (Kg per ha)' columns.
	Returns columns: state_norm, district_norm, year, crop, yield_kg_ha
	"""
	icrisat_path = "ICRISAT-District Level Data.csv"
	if not os.path.exists(icrisat_path):
		return pd.DataFrame(columns=IDENTIFIER_COLUMNS + ["crop", "yield_kg_ha"])

	df = pd.read_csv(icrisat_path)
	# Detect id columns
	state_col = next((c for c in df.columns if c.lower().startswith("state")), None)
	dist_col = next((c for c in df.columns if c.lower().startswith("district")), None)
	year_col = next((c for c in df.columns if c.lower() == "year"), None)
	if not all([state_col, dist_col, year_col]):
		return pd.DataFrame(columns=IDENTIFIER_COLUMNS + ["crop", "yield_kg_ha"])

	# Identify crop yield columns
	yield_cols = [c for c in df.columns if isinstance(c, str) and c.upper().endswith("YIELD (KG PER HA)")]
	if not yield_cols:
		return pd.DataFrame(columns=IDENTIFIER_COLUMNS + ["crop", "yield_kg_ha"])

	id_keep = [state_col, dist_col, year_col]
	melted = df[id_keep + yield_cols].melt(id_vars=id_keep, var_name="crop_raw", value_name="yield_kg_ha")
	melted = _ensure_identifiers(melted, state_col, dist_col, year_col)

	# Normalize crop names
	def _norm_crop(col_name: str) -> str:
		name = col_name.upper().replace(" YIELD (KG PER HA)", "").strip()
		mapping = {"PADDY": "RICE"}
		return mapping.get(name, name)

	melted["crop"] = melted["crop_raw"].map(_norm_crop)
	melted.drop(columns=["crop_raw"], inplace=True)

	# Sanity filters
	melted = melted[pd.notna(melted["yield_kg_ha"])]
	melted = melted[(melted["yield_kg_ha"] > 0) & (melted["yield_kg_ha"] < 20000)]

	if crop:
		melted = melted[melted["crop"].str.upper() == crop.upper()]
	if year_min is not None:
		melted = melted[melted["year"] >= year_min]
	if year_max is not None:
		melted = melted[melted["year"] <= year_max]

	return melted[[*IDENTIFIER_COLUMNS, "crop", "yield_kg_ha"]]
