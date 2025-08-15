OS := $(shell uname 2>/dev/null || echo Windows_NT)
ifeq ($(OS),Windows_NT)
  PYTHON := .venv/\Scripts/\python.exe
  PIP := .venv/\Scripts/\pip.exe
else
  PYTHON := .venv/bin/python
  PIP := .venv/bin/pip
endif

.PHONY: venv install test clean

venv:
	python -m venv .venv
	$(PYTHON) -m pip install -U pip
	@echo "Installing dependencies"
	@if command -v uv >/dev/null 2>&1; then \
	  uv pip install -e .[dev,train]; \
	else \
	  $(PIP) install -e .[dev,train]; \
	fi

install:
	$(PIP) install -e .[dev]

test:
	$(PYTHON) -m pytest -q

clean:
	rm -rf .venv artifacts __pycache__ */__pycache__ .pytest_cache

