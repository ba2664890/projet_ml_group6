"""
API FastAPI pour la prédiction des prix des maisons.
Laplace Immo - Projet Data Science
"""

from fastapi import FastAPI, HTTPException, status, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
import logging
import sys
import os
from datetime import datetime

# Ajout du chemin src pour importer house_prices
sys.path.append(str(Path(__file__).parent.parent / "src"))
from house_prices.data.preprocessing import FeatureEngineering, get_feature_types

# Configuration du logging structuré
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('logs/api.log') if Path('logs').exists() else logging.NullHandler()
    ]
)
logger = logging.getLogger(__name__)

# Variables d'environnement
ENV = os.getenv('ENV', 'development')
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*').split(',')

# Initialisation de l'application FastAPI
app = FastAPI(
    title="Laplace Immo - House Prices Prediction API",
    description="API de prédiction des prix des maisons pour Laplace Immo",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configuration CORS dynamique
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de logging des requêtes
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    process_time = (datetime.now() - start_time).total_seconds()
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    return response

# Montage des fichiers statiques du dashboard
dashboard_path = Path(__file__).parent.parent / "dashboard"
if dashboard_path.exists():
    app.mount("/dashboard", StaticFiles(directory=str(dashboard_path), html=True), name="dashboard")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Erreur de validation: {exc.errors()}")
    logger.error(f"Payload reçu: {await request.body()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )

# Modèles Pydantic pour la validation des données
class HouseFeatures(BaseModel):
    """Modèle pour les features d'une maison."""
    model_config = {"populate_by_name": True}

    MSSubClass: int = Field(..., description="Type de construction")
    MSZoning: str = Field(..., description="Zone de construction")
    LotFrontage: Optional[float] = Field(None, description="Largeur du terrain")
    LotArea: int = Field(..., description="Surface du terrain")
    Street: str = Field(..., description="Type de rue")
    Alley: Optional[str] = Field(None, description="Type d'allée")
    LotShape: str = Field(..., description="Forme du terrain")
    LandContour: str = Field(..., description="Contour du terrain")
    Utilities: str = Field(..., description="Services publics")
    LotConfig: str = Field(..., description="Configuration du terrain")
    LandSlope: str = Field(..., description="Pente du terrain")
    Neighborhood: str = Field(..., description="Quartier")
    Condition1: str = Field(..., description="Condition 1")
    Condition2: str = Field(..., description="Condition 2")
    BldgType: str = Field(..., description="Type de bâtiment")
    HouseStyle: str = Field(..., description="Style de maison")
    OverallQual: int = Field(..., ge=1, le=10, description="Qualité globale")
    OverallCond: int = Field(..., ge=1, le=10, description="Condition globale")
    YearBuilt: int = Field(..., description="Année de construction")
    YearRemodAdd: int = Field(..., description="Année de rénovation")
    RoofStyle: str = Field(..., description="Style de toit")
    RoofMatl: str = Field(..., description="Matériau du toit")
    Exterior1st: str = Field(..., description="Revêtement extérieur 1")
    Exterior2nd: str = Field(..., description="Revêtement extérieur 2")
    MasVnrType: Optional[str] = Field(None, description="Type de parement")
    MasVnrArea: Optional[float] = Field(None, description="Surface du parement")
    ExterQual: str = Field(..., description="Qualité extérieure")
    ExterCond: str = Field(..., description="Condition extérieure")
    Foundation: str = Field(..., description="Fondation")
    BsmtQual: Optional[str] = Field(None, description="Qualité du sous-sol")
    BsmtCond: Optional[str] = Field(None, description="Condition du sous-sol")
    BsmtExposure: Optional[str] = Field(None, description="Exposition du sous-sol")
    BsmtFinType1: Optional[str] = Field(None, description="Type de finition 1")
    BsmtFinSF1: Optional[float] = Field(None, description="Surface finie 1")
    BsmtFinType2: Optional[str] = Field(None, description="Type de finition 2")
    BsmtFinSF2: Optional[float] = Field(None, description="Surface finie 2")
    BsmtUnfSF: Optional[float] = Field(None, description="Surface non finie")
    TotalBsmtSF: Optional[float] = Field(None, description="Surface totale sous-sol")
    Heating: str = Field(..., description="Chauffage")
    HeatingQC: str = Field(..., description="Qualité du chauffage")
    CentralAir: str = Field(..., description="Climatisation centrale")
    Electrical: Optional[str] = Field(None, description="Système électrique")
    first_flr_sf: int = Field(..., alias="1stFlrSF", description="Surface premier étage")
    second_flr_sf: int = Field(..., alias="2ndFlrSF", description="Surface deuxième étage")
    LowQualFinSF: int = Field(..., description="Surface finie de basse qualité")
    GrLivArea: int = Field(..., description="Surface habitable au-dessus du sol")
    BsmtFullBath: Optional[float] = Field(None, description="Salles de bain complètes sous-sol")
    BsmtHalfBath: Optional[float] = Field(None, description="Demi-salles de bain sous-sol")
    FullBath: int = Field(..., description="Salles de bain complètes")
    HalfBath: int = Field(..., description="Demi-salles de bain")
    BedroomAbvGr: int = Field(..., description="Chambres au-dessus du sol")
    KitchenAbvGr: int = Field(..., description="Cuisines au-dessus du sol")
    KitchenQual: str = Field(..., description="Qualité de la cuisine")
    TotRmsAbvGrd: int = Field(..., description="Nombre total de pièces")
    Functional: str = Field(..., description="Fonctionnalité")
    Fireplaces: int = Field(..., description="Cheminées")
    FireplaceQu: Optional[str] = Field(None, description="Qualité de la cheminée")
    GarageType: Optional[str] = Field(None, description="Type de garage")
    GarageYrBlt: Optional[float] = Field(None, description="Année construction garage")
    GarageFinish: Optional[str] = Field(None, description="Finition garage")
    GarageCars: Optional[float] = Field(None, description="Capacité garage (voitures)")
    GarageArea: Optional[float] = Field(None, description="Surface garage")
    GarageQual: Optional[str] = Field(None, description="Qualité garage")
    GarageCond: Optional[str] = Field(None, description="Condition garage")
    PavedDrive: str = Field(..., description="Allée pavée")
    WoodDeckSF: int = Field(..., description="Surface terrasse bois")
    OpenPorchSF: int = Field(..., description="Surface porche ouvert")
    EnclosedPorch: int = Field(..., description="Surface porche fermé")
    three_season_porch: int = Field(..., alias="3SsnPorch", description="Surface porche 3 saisons")
    ScreenPorch: int = Field(..., description="Surface porche moustiquaire")
    PoolArea: int = Field(..., description="Surface piscine")
    PoolQC: Optional[str] = Field(None, description="Qualité piscine")
    Fence: Optional[str] = Field(None, description="Clôture")
    MiscFeature: Optional[str] = Field(None, description="Feature divers")
    MiscVal: int = Field(..., description="Valeur features divers")
    MoSold: int = Field(..., ge=1, le=12, description="Mois de vente")
    YrSold: int = Field(..., description="Année de vente")
    SaleType: str = Field(..., description="Type de vente")
    SaleCondition: str = Field(..., description="Condition de vente")


class PredictionResponse(BaseModel):
    """Réponse de prédiction."""
    predicted_price: float = Field(..., description="Prix prédit")
    model_version: str = Field(..., description="Version du modèle")
    confidence_score: Optional[float] = Field(None, description="Score de confiance")


class HealthResponse(BaseModel):
    """Réponse de health check."""
    status: str
    model_loaded: bool
    model_version: str


# Chargement du modèle au démarrage
model = None
preprocessor = None
MODEL_PATH = Path(__file__).parent.parent / "models" / "house_prices_model.pkl"

def load_model():
    """Charge le modèle et le préprocesseur."""
    global model, preprocessor
    try:
        if MODEL_PATH.exists():
            model_data = joblib.load(MODEL_PATH)
            model = model_data['model']
            preprocessor = model_data['preprocessor']
            logger.info("Modèle chargé avec succès")
        else:
            logger.error(f"Modèle non trouvé: {MODEL_PATH}")
            model = None
            preprocessor = None
    except Exception as e:
        logger.error(f"Erreur lors du chargement du modèle: {e}")
        model = None
        preprocessor = None

# Chemin des données
DATA_PATH = Path(__file__).parent.parent / "data" / "raw" / "train.csv"
_train_data_cache = None

def get_train_data():
    """Charge et cache les données d'entraînement."""
    global _train_data_cache
    if _train_data_cache is None:
        if DATA_PATH.exists():
            _train_data_cache = pd.read_csv(DATA_PATH)
        else:
            logger.warning(f"Fichier de données non trouvé: {DATA_PATH}")
    return _train_data_cache

# Charger le modèle au démarrage
load_model()


@app.on_event("startup")
async def startup_event():
    """Événement de démarrage de l'application."""
    logger.info("API House Prices Prediction démarrée")
    load_model()


@app.get("/", response_model=Dict[str, str])
async def root():
    """Endpoint racine."""
    return {
        "message": "Bienvenue sur l'API Laplace Immo - House Prices Prediction",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check de l'API."""
    return HealthResponse(
        status="healthy" if model is not None else "unhealthy",
        model_loaded=model is not None,
        model_version="1.0.0"
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict(house_features: HouseFeatures):
    """
    Endpoint de prédiction du prix d'une maison.
    
    Args:
        house_features: Features de la maison
        
    Returns:
        Prix prédit et informations associées
    """
    logger.info(f"Requête de prédiction reçue: {house_features}")
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modèle non disponible"
        )
    
    try:
        # Conversion en dictionnaire
        features_dict = house_features.dict(by_alias=True)
        
        # Création du DataFrame
        df = pd.DataFrame([features_dict])

        # Identification correcte des colonnes numériques vs catégorielles
        # via le modèle Pydantic pour éviter les erreurs de type sur 1 seule ligne
        numeric_cols = []
        categorical_cols = []
        
        for field_name, field_info in HouseFeatures.model_fields.items():
            actual_col = field_info.alias or field_name
            if actual_col not in df.columns:
                continue
                
            field_type = field_info.annotation
            # Regarder si c'est un type de base numérique ou un Optional de numérique
            is_numeric = False
            if field_type in (int, float):
                is_numeric = True
            else:
                # Gérer Optional[int], Union[int, None], etc.
                args = getattr(field_type, "__args__", None)
                if args and any(t in (int, float) for t in args):
                    is_numeric = True
            
            if is_numeric:
                numeric_cols.append(actual_col)
            else:
                categorical_cols.append(actual_col)

        # Forcer le typage numérique (convertit None/NaN proprement)
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Application du Feature Engineering
        fe = FeatureEngineering()
        df = fe.transform(df)
        
        # S'assurer que les features catégorielles (y compris les nouvelles) sont des strings
        # On recalcule les types car FE a pu ajouter des colonnes
        _, final_cat_cols, _ = get_feature_types(df)
        df[final_cat_cols] = df[final_cat_cols].astype(str)
        
        # Application du prétraitement
        features_processed = preprocessor.transform(df)
        
        # Prédiction
        predicted_price = model.predict(features_processed)[0]
        
        # Calcul d'un score de confiance basique
        # Ici, on utilise la distance par rapport aux données d'entraînement
        confidence_score = 0.85  # À améliorer avec une vraie métrique
        
        return PredictionResponse(
            predicted_price=float(predicted_price),
            model_version="1.0.0",
            confidence_score=confidence_score
        )
        
    except Exception as e:
        logger.error(f"Erreur lors de la prédiction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la prédiction: {str(e)}"
        )


@app.post("/predict/batch")
async def predict_batch(houses: list[HouseFeatures]):
    """
    Prédiction en batch pour plusieurs maisons.
    
    Args:
        houses: Liste des features des maisons
        
    Returns:
        Liste des prix prédits
    """
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modèle non disponible"
        )
    
    try:
        # Conversion en liste de dictionnaires
        features_list = [house.dict(by_alias=True) for house in houses]
        
        # Création du DataFrame
        df = pd.DataFrame(features_list)
        
        # Application du Feature Engineering
        fe = FeatureEngineering()
        df = fe.transform(df)
        
        # Conversion des colonnes catégorielles en string
        _, cat_features, _ = get_feature_types(df)
        df[cat_features] = df[cat_features].astype(str)
        
        # Application du prétraitement
        features_processed = preprocessor.transform(df)
        
        # Prédictions
        predicted_prices = model.predict(features_processed)
        
        return {
            "predictions": [
                {
                    "predicted_price": float(price),
                    "model_version": "1.0.0"
                }
                for price in predicted_prices
            ]
        }
        
    except Exception as e:
        logger.error(f"Erreur lors des prédictions batch: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors des prédictions: {str(e)}"
        )


@app.get("/api/stats/overview")
async def get_stats_overview():
    """Retourne des statistiques globales sur le dataset."""
    df = get_train_data()
    if df is None:
        raise HTTPException(status_code=404, detail="Données non disponibles")
    
    return {
        "total_properties": len(df),
        "avg_price": float(df['SalePrice'].mean()),
        "median_price": float(df['SalePrice'].median()),
        "min_price": float(df['SalePrice'].min()),
        "max_price": float(df['SalePrice'].max()),
        "price_std": float(df['SalePrice'].std())
    }

@app.get("/api/stats/neighborhoods")
async def get_neighborhood_stats():
    """Retourne les prix moyens par quartier."""
    df = get_train_data()
    if df is None:
        raise HTTPException(status_code=404, detail="Données non disponibles")
    
    nb_stats = df.groupby('Neighborhood')['SalePrice'].agg(['mean', 'median', 'count']).reset_index()
    nb_stats = nb_stats.rename(columns={'mean': 'avg_price', 'median': 'median_price', 'count': 'property_count'})
    return nb_stats.to_dict(orient='records')

@app.get("/api/stats/price-distribution")
async def get_price_distribution(bins: int = 20):
    """Retourne la distribution des prix pour un histogramme."""
    df = get_train_data()
    if df is None:
        raise HTTPException(status_code=404, detail="Données non disponibles")
    
    counts, bin_edges = np.histogram(df['SalePrice'], bins=bins)
    return {
        "labels": [f"{int(bin_edges[i]/1000)}k-{int(bin_edges[i+1]/1000)}k" for i in range(len(counts))],
        "values": counts.tolist()
    }

@app.get("/model/info")
async def model_info():
    """Informations sur le modèle."""
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Modèle non disponible"
        )
    
    try:
        # Informations sur le modèle
        model_type = type(model).__name__
        
        # Pour RandomForest et GradientBoosting, on peut récupérer l'importance des features
        feature_importance = None
        if hasattr(model, 'feature_importances_'):
            # Note: Dans une vraie application, on aurait les noms des features
            feature_importance = model.feature_importances_.tolist()
        
        return {
            "model_type": model_type,
            "model_version": "1.0.0",
            "feature_importance": feature_importance,
            "parameters": model.get_params()
        }
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des infos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )