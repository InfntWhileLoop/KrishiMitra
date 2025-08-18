#!/usr/bin/env python3
"""Setup script for Crop Yield Predictor package."""

from setuptools import setup, find_packages

# Read README for long description
with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

# Read requirements
with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="crop-yield-predictor",
    version="0.1.0",
    author="ML Engineer",
    author_email="ml@example.com",
    description="Production-ready ML system for agricultural yield prediction",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/example/crop-yield-predictor",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Scientific/Engineering :: Information Analysis",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=22.0.0",
            "ruff>=0.1.0",
            "jupyter>=1.0.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "crop-yield-train=crop_yield_predictor.cli:train_model",
            "crop-yield-predict=crop_yield_predictor.cli:predict_yield_cli",
            "crop-yield=crop_yield_predictor.cli:cli",
        ],
    },
    include_package_data=True,
    zip_safe=False,
)
