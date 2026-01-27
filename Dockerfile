# Dockerfile pour l'application House Prices Prediction
FROM python:3.9-slim

# Définition du répertoire de travail
WORKDIR /app

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copie des fichiers de requirements
COPY requirements.txt .
COPY setup.py .

# Installation des dépendances Python
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copie du code source
COPY src/ ./src/
COPY api/ ./api/
COPY models/ ./models/

# Installation du package en mode développement
RUN pip install -e .

# Création du répertoire pour les logs
RUN mkdir -p /app/logs

# Exposition du port
EXPOSE 8000

# Variables d'environnement
ENV PYTHONPATH=/app/src
ENV MODEL_PATH=/app/models/house_prices_model.pkl

# Commande de démarrage
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1