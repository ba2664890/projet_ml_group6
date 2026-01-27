# Dockerfile pour l'application House Prices Prediction
FROM python:3.9-slim

# Définition du répertoire de travail
WORKDIR /app

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copie des fichiers de requirements et métadonnées
COPY requirements.txt .
COPY setup.py .
COPY README.md .

# Installation des dépendances Python
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copie du code source
COPY src/ ./src/
COPY api/ ./api/
COPY models/ ./models/
COPY data/ ./data/
COPY dashboard/ ./dashboard/

# Installation du package en mode développement
RUN pip install -e .

# Création du répertoire pour les logs
RUN mkdir -p /app/logs

# Exposition du port (Render utilise l'env PORT, on expose 8000 par défaut)
EXPOSE 8000

# Variables d'environnement
ENV PYTHONPATH=/app/src
ENV MODEL_PATH=/app/models/house_prices_model.pkl

# Commande de démarrage (utilisation de sh -c pour interpréter $PORT)
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1