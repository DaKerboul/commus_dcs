# Dockerfile pour le service webhook Flask
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY webhook.py ./
EXPOSE 9000
CMD ["python", "webhook.py"]
