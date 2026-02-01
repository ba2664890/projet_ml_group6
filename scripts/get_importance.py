import joblib
import pandas as pd
import numpy as np
from pathlib import Path

def get_top_features():
    model_path = Path("models/house_prices_model.pkl")
    if not model_path.exists():
        print("Erreur: Modèle non trouvé.")
        return
    
    pipeline = joblib.load(model_path)
    model = pipeline.named_steps['model']
    
    # Pour BayesianRidge, les coefficients sont dans .coef_
    # Mais après OneHotEncoding et Scaling, il faut retrouver les noms
    preprocess = pipeline.named_steps['preprocessing']
    
    # On va simuler un passage de données pour récupérer les noms de colonnes transformées
    # Ou utiliser get_feature_names_out si possible
    try:
        # Récupération des noms après le ColumnTransformer final du pipeline
        column_transformer = preprocess.named_steps['preprocess']
        feature_names = column_transformer.get_feature_names_out()
        
        coefs = model.coef_
        importance = pd.DataFrame({
            'Feature': feature_names,
            'Importance': np.abs(coefs),
            'Coefficient': coefs
        }).sort_values('Importance', ascending=False)
        
        print("\n=== TOP 15 FEATURES (Abs Coef) ===")
        print(importance.head(15).to_string(index=False))
        
        return importance
    except Exception as e:
        print(f"Erreur lors de la récupération des features: {e}")

if __name__ == "__main__":
    get_top_features()
