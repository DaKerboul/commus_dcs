import os
import subprocess
from flask import Flask, request, abort

# Secret directement défini comme chaîne simple (pas encodé)
SECRET = os.environ.get("COMMUS_SECRET", "change_me")
REPO_PATH = "/app"

app = Flask(__name__)

@app.route("/<token>", methods=["GET", "POST"])
def webhook(token):
    # Vérification simple du token dans l'URL
    if token != SECRET:
        print(f"Tentative d'accès refusée")
        abort(403)
    
    print(f"Accès autorisé! Début du déploiement...")
    
    # Pull les dernières modifs
    print("1. Git pull en cours...")
    subprocess.run(["git", "pull"], cwd=REPO_PATH)
    
    # Rebuild le conteneur frontend (plus simple et propre)
    try:
        print("2. Rebuilding et redémarrage du conteneur frontend...")
        # Docker compose build + up pour le service frontend uniquement
        subprocess.run(["docker", "compose", "build", "frontend"], cwd=REPO_PATH)
        subprocess.run(["docker", "compose", "up", "-d", "frontend"], cwd=REPO_PATH)
        print("3. Rebuild terminé avec succès")
    except Exception as e:
        print(f"Erreur lors du rebuild du conteneur frontend : {e}")
    
    return "Déploiement terminé avec succès", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)
