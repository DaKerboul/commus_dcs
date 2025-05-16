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
    # Rebuild le frontend
    subprocess.run(["npm", "install"], cwd=REPO_PATH)
    subprocess.run(["npm", "run", "docs:build"], cwd=REPO_PATH)
    # Redémarre le conteneur frontend via Docker SDK
    try:
        client = docker.from_env()
        frontend = client.containers.get("vitepress_frontend")
        frontend.restart()
    except Exception as e:
        print(f"Erreur lors du restart du conteneur frontend : {e}")
    return "OK", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000)
