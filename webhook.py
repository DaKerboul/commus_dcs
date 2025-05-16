import os
import subprocess
import logging
from flask import Flask, request, abort

# Configuration des logs
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('webhook')

# Secret directement défini comme chaîne simple (pas encodé)
SECRET = os.environ.get("COMMUS_SECRET", "change_me")
REPO_PATH = "/app"

app = Flask(__name__)

@app.route("/", defaults={"token": None})
@app.route("/<token>", methods=["GET", "POST"])
def webhook(token):
    # Vérification simple du token dans l'URL
    if token != SECRET:
        logger.warning(f"Tentative d'accès refusée. Token invalide.")
        abort(403)
    
    logger.info(f"Accès autorisé! Début du déploiement...")
    
    # Pull les dernières modifs
    logger.info("1. Git pull en cours...")
    try:
        result = subprocess.run(["git", "pull"], cwd=REPO_PATH, 
                              capture_output=True, text=True, check=True)
        logger.info(f"Git pull: {result.stdout}")
    except subprocess.SubprocessError as e:
        logger.error(f"Erreur lors du git pull: {str(e)}")
        return f"Erreur lors du git pull: {str(e)}", 500
    
    # Rebuild le conteneur frontend
    try:
        logger.info("2. Rebuilding conteneur frontend...")
        # Docker compose build pour le service frontend uniquement
        build_result = subprocess.run(["docker", "compose", "build", "frontend"], 
                                    cwd=REPO_PATH, capture_output=True, text=True, check=True)
        logger.info(f"Build: {build_result.stdout}")
        
        # Docker compose up pour le service frontend
        up_result = subprocess.run(["docker", "compose", "up", "-d", "frontend"], 
                                 cwd=REPO_PATH, capture_output=True, text=True, check=True)
        logger.info(f"Up: {up_result.stdout}")
        
        logger.info("3. Rebuild terminé avec succès")
    except subprocess.SubprocessError as e:
        logger.error(f"Erreur lors du rebuild: {str(e)}")
        return f"Erreur lors du rebuild: {str(e)}", 500
    except Exception as e:
        logger.error(f"Erreur inattendue: {str(e)}")
        return f"Erreur inattendue: {str(e)}", 500
    
    return "Déploiement terminé avec succès", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)
