import os
import subprocess
import docker
from flask import Flask, request, abort
import hmac
import hashlib

GITHUB_SECRET = os.environ.get("GITHUB_SECRET", "change_me").encode()
REPO_PATH = "/app"

app = Flask(__name__)

def verify_signature(payload, signature):
    mac = hmac.new(GITHUB_SECRET, msg=payload, digestmod=hashlib.sha256)
    expected = f"sha256={mac.hexdigest()}"
    return hmac.compare_digest(expected, signature)

@app.route("/webhook", methods=["POST"])
def webhook():
    signature = request.headers.get("X-Hub-Signature-256")
    if not signature or not verify_signature(request.data, signature):
        abort(403)
    # Pull les dernières modifs
    subprocess.run(["git", "pull"], cwd=REPO_PATH)
    
    # Rebuild le conteneur frontend (plus simple et propre)
    try:
        print("Rebuilding et redémarrage du conteneur frontend...")
        # Docker compose build + up pour le service frontend uniquement
        subprocess.run(["docker", "compose", "build", "frontend"], cwd=REPO_PATH)
        subprocess.run(["docker", "compose", "up", "-d", "frontend"], cwd=REPO_PATH)
        print("Rebuild terminé avec succès")
    except Exception as e:
        print(f"Erreur lors du rebuild du conteneur frontend : {e}")
    
    return "OK", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)
