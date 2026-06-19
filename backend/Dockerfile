FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8003
ENV DATA_DIR=/data

WORKDIR /app

COPY main.py /app/main.py

RUN mkdir -p /data

EXPOSE 8003

CMD ["python", "main.py"]
