FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8003
ENV DATA_DIR=/data
ENV CHARACTER_IMAGES_DIR=/app/imgs/personagens

WORKDIR /app

COPY backend/main.py /app/main.py
COPY imgs/personagens /app/imgs/personagens

RUN mkdir -p /data /app/imgs/personagens

EXPOSE 8003

CMD ["python", "main.py"]
