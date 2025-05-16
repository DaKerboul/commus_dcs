# Dockerfile pour le service webhook Flask
FROM python:3.11-slim
WORKDIR /app
COPY docker/webhook/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY docker/webhook/webhook.py ./
EXPOSE 9000
CMD ["python", "webhook.py"]
