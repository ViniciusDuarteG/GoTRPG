from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
#

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("DATA_DIR", BASE_DIR))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "gotrpg.db"
SECRET_KEY = os.environ.get("GOTRPG_SECRET_KEY") or secrets.token_hex(32)
TOKEN_TTL = 60 * 60 * 24 * 7
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at INTEGER NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS characters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(32)
    iterations = 310_000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    return "$".join(
        [
            "pbkdf2_sha256",
            str(iterations),
            base64.b64encode(salt).decode(),
            base64.b64encode(digest).decode(),
        ]
    )


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iteration_text, salt_text, digest_text = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        salt = base64.b64decode(salt_text)
        expected = base64.b64decode(digest_text)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, int(iteration_text))
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def sign(payload: bytes) -> str:
    return b64url(hmac.new(SECRET_KEY.encode(), payload, hashlib.sha256).digest())


def create_token(user_id: int) -> str:
    payload = json.dumps({"sub": user_id, "exp": int(time.time()) + TOKEN_TTL}, separators=(",", ":")).encode()
    payload_text = b64url(payload)
    return f"{payload_text}.{sign(payload_text.encode())}"


def parse_token(token: str) -> int | None:
    try:
        payload_text, signature = token.split(".", 1)
        if not hmac.compare_digest(signature, sign(payload_text.encode())):
            return None
        padded = payload_text + "=" * (-len(payload_text) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded.encode()))
        if payload["exp"] < int(time.time()):
            return None
        return int(payload["sub"])
    except Exception:
        return None


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        return

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def send_json(self, status: int, payload: object) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length).decode())

    def user_id(self) -> int | None:
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None
        return parse_token(auth.removeprefix("Bearer ").strip())

    def do_POST(self) -> None:
        init_db()
        path = urlparse(self.path).path
        try:
            if path == "/auth/register":
                return self.register()
            if path == "/auth/login":
                return self.login()
            if path == "/characters":
                return self.create_character()
            self.send_json(404, {"detail": "Rota nao encontrada"})
        except json.JSONDecodeError:
            self.send_json(400, {"detail": "JSON invalido"})

    def do_GET(self) -> None:
        init_db()
        path = urlparse(self.path).path
        if path == "/me":
            return self.me()
        if path == "/characters":
            return self.list_characters()
        if path.startswith("/characters/"):
            return self.get_character(path)
        self.send_json(404, {"detail": "Rota nao encontrada"})

    def do_PUT(self) -> None:
        init_db()
        path = urlparse(self.path).path
        try:
            if path.startswith("/characters/"):
                return self.update_character(path)
            self.send_json(404, {"detail": "Rota nao encontrada"})
        except json.JSONDecodeError:
            self.send_json(400, {"detail": "JSON invalido"})

    def do_DELETE(self) -> None:
        init_db()
        path = urlparse(self.path).path
        if path.startswith("/characters/"):
            return self.delete_character(path)
        self.send_json(404, {"detail": "Rota nao encontrada"})

    def register(self) -> None:
        payload = self.read_json()
        username = str(payload.get("username", "")).strip().lower()
        password = str(payload.get("password", ""))
        if len(username) < 3 or len(password) < 8:
            return self.send_json(400, {"detail": "Usuario minimo 3 e senha minimo 8"})
        try:
            with db() as conn:
                cursor = conn.execute(
                    "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
                    (username, hash_password(password), int(time.time())),
                )
                user_id = int(cursor.lastrowid)
        except sqlite3.IntegrityError:
            return self.send_json(409, {"detail": "Usuario ja existe"})
        self.send_json(200, {"token": create_token(user_id), "username": username})

    def login(self) -> None:
        payload = self.read_json()
        username = str(payload.get("username", "")).strip().lower()
        password = str(payload.get("password", ""))
        with db() as conn:
            user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if not user or not verify_password(password, user["password_hash"]):
            return self.send_json(401, {"detail": "Usuario ou senha invalidos"})
        self.send_json(200, {"token": create_token(int(user["id"])), "username": username})

    def me(self) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        with db() as conn:
            user = conn.execute(
                "SELECT id, username, created_at FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
            total = conn.execute(
                "SELECT COUNT(*) AS total FROM characters WHERE user_id = ?",
                (user_id,),
            ).fetchone()
        if not user:
            return self.send_json(404, {"detail": "Usuario nao encontrado"})
        self.send_json(
            200,
            {
                "id": user["id"],
                "username": user["username"],
                "created_at": user["created_at"],
                "characters_count": total["total"],
            },
        )

    def list_characters(self) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        with db() as conn:
            rows = conn.execute(
                "SELECT id, name, updated_at FROM characters WHERE user_id = ? ORDER BY updated_at DESC",
                (user_id,),
            ).fetchall()
        self.send_json(200, [dict(row) for row in rows])

    def create_character(self) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        data = self.read_json().get("data", {})
        name = str(data.get("nome") or "Sem nome").strip()[:120]
        now = int(time.time())
        with db() as conn:
            cursor = conn.execute(
                "INSERT INTO characters (user_id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                (user_id, name, json.dumps(data, ensure_ascii=False), now, now),
            )
            character_id = int(cursor.lastrowid)
        self.send_json(200, {"id": character_id, "name": name})

    def get_character(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        character_id = path.rsplit("/", 1)[-1]
        with db() as conn:
            row = conn.execute(
                "SELECT * FROM characters WHERE id = ? AND user_id = ?",
                (character_id, user_id),
            ).fetchone()
        if not row:
            return self.send_json(404, {"detail": "Personagem nao encontrado"})
        self.send_json(200, {"id": row["id"], "name": row["name"], "data": json.loads(row["data"])})

    def update_character(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        character_id = path.rsplit("/", 1)[-1]
        data = self.read_json().get("data", {})
        name = str(data.get("nome") or "Sem nome").strip()[:120]
        with db() as conn:
            cursor = conn.execute(
                "UPDATE characters SET name = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?",
                (name, json.dumps(data, ensure_ascii=False), int(time.time()), character_id, user_id),
            )
        if cursor.rowcount == 0:
            return self.send_json(404, {"detail": "Personagem nao encontrado"})
        self.send_json(200, {"id": int(character_id), "name": name})

    def delete_character(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        character_id = path.rsplit("/", 1)[-1]
        with db() as conn:
            cursor = conn.execute(
                "DELETE FROM characters WHERE id = ? AND user_id = ?",
                (character_id, user_id),
            )
        if cursor.rowcount == 0:
            return self.send_json(404, {"detail": "Personagem nao encontrado"})
        self.send_json(200, {"deleted": True})


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", "8003"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Backend em http://0.0.0.0:{port}")
    server.serve_forever()
