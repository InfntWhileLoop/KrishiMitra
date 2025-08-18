#!/usr/bin/env python3
"""
Cache utilities for clustering service.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Any, Dict, Optional


@lru_cache(maxsize=16)
def cached_run_paths(run_id: str) -> str:
	"""Cache the path resolution for a run id (directory path as string)."""
	return run_id  # placeholder identity; actual path handled by cluster_service


class SimpleCache:
	"""A tiny manual cache for loaded runs (models, scalers, features)."""
	def __init__(self, maxsize: int = 8) -> None:
		self.maxsize = maxsize
		self._store: Dict[str, Dict[str, Any]] = {}

	def get(self, key: str) -> Optional[Dict[str, Any]]:
		return self._store.get(key)

	def set(self, key: str, value: Dict[str, Any]) -> None:
		if key in self._store:
			self._store[key] = value
			return
		if len(self._store) >= self.maxsize:
			# pop arbitrary (FIFO-ish) key
			old_key = next(iter(self._store))
			del self._store[old_key]
		self._store[key] = value

	def clear(self) -> None:
		self._store.clear()
