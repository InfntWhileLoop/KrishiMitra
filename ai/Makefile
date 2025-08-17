# =============================================================================
# Agri Assistant NLU - Build System
# =============================================================================
# This Makefile manages the complete build, test, and deployment pipeline for
# the offline NLU system. It handles environment setup, testing, training,
# and model export workflows.
#
# Key Targets:
# - venv: Create Python virtual environment with all dependencies
# - install: Install development dependencies for development
# - test: Run the complete test suite
# - clean: Remove all build artifacts and virtual environment
#
# Dependencies: Python 3.11, pip (or uv for faster dependency resolution)
# =============================================================================

OS := $(shell uname 2>/dev/null || echo Windows_NT)
ifeq ($(OS),Windows_NT)
  PYTHON := .venv\Scripts\python.exe
  PIP := .venv\Scripts\pip.exe
else
  PYTHON := .venv/bin/python
  PIP := .venv/bin/pip
endif

.PHONY: venv install test clean

# Create Python virtual environment and install all dependencies
# This sets up the complete development environment including:
# - Core dependencies (PyTorch, Transformers, etc.)
# - Development tools (pytest, ruff, etc.)
# - Training dependencies (LightGBM, XGBoost, etc.)
venv:
	python -m venv .venv
	$(PYTHON) -m pip install -U pip
	@echo "Installing dependencies"
	@if command -v uv >/dev/null 2>&1; then \
	  uv pip install -e .[dev,train]; \
	else \
	  $(PIP) install -e .[dev,train]; \
	fi

# Install only development dependencies (lighter than full venv)
# Use this for CI/CD or when you only need to run tests
install:
	$(PIP) install -e .[dev]

# Run the complete test suite
# Executes all unit tests, integration tests, and validation checks
# Ensures code quality and functionality across all modules
test:
	$(PYTHON) -m pytest -q

# Clean all build artifacts and temporary files
# Removes virtual environment, model artifacts, cache files, and test outputs
# Use this to start fresh or free up disk space
clean:
	rm -rf .venv artifacts __pycache__ */__pycache__ .pytest_cache

