from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="house-prices-prediction",
    version="1.0.0",
    author="Laplace Immo Data Science Team",
    author_email="data@laplace-immo.fr",
    description="House prices prediction for Laplace Immo",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/laplace-immo/house-prices-prediction",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    python_requires=">=3.9",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=6.2.0",
            "pytest-cov>=2.12.0",
            "flake8>=3.9.0",
            "black>=21.0.0",
            "isort>=5.9.0",
            "jupyterlab>=3.0.0",
            "ipywidgets>=7.6.0",
        ],
        "mlflow": ["mlflow>=1.20.0"],
        "api": ["fastapi>=0.70.0", "uvicorn[standard]>=0.15.0"],
    },
    entry_points={
        "console_scripts": [
            "house-prices-train=house_prices.cli:train_model",
            "house-prices-predict=house_prices.cli:make_predictions",
            "house-prices-serve=api.main:run_server",
        ],
    },
)