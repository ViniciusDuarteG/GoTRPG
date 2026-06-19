from __future__ import annotations

import base64
import hashlib
import hmac
import json
import mimetypes
import os
import secrets
import sqlite3
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse
#

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("DATA_DIR", BASE_DIR))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "gotrpg.db"
CHARACTER_IMAGES_DIR = Path(os.environ.get("CHARACTER_IMAGES_DIR", BASE_DIR.parent / "imgs" / "personagens"))
SECRET_KEY = os.environ.get("GOTRPG_SECRET_KEY") or secrets.token_hex(32)
TOKEN_TTL = 60 * 60 * 24 * 7
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
ARMOR_STATS = {
    "Roupas": {"defense": 0, "movement": 0},
    "Robes": {"defense": 0, "movement": 0},
    "Acholchoada": {"defense": 1, "movement": -1},
    "Couro Macio": {"defense": 2, "movement": -1},
    "Couro Rigo": {"defense": 3, "movement": -1},
    "Madeira ou ossos": {"defense": 4, "movement": -2},
    "Cota de aneis": {"defense": 4, "movement": -2},
    "Peles": {"defense": 5, "movement": -3},
    "Cota de malha": {"defense": 5, "movement": -3},
    "Cota de Escamas": {"defense": 6, "movement": -3},
    "Brigantina": {"defense": 8, "movement": -4},
    "Meia Armadura": {"defense": 9, "movement": -5},
    "Placas": {"defense": 10, "movement": -5},
}
HOUSE_OPTIONS = set(
    """
Sem Casa
Povo Livre
Casa Stark
Casa Lannister
Casa Targaryen
Casa Baratheon
Casa Greyjoy
Casa Tyrell
Casa Martell
Casa Tully
Casa Arryn
Casa Bolton
Casa Frey
Casa Mormont
Casa Karstark
Casa Umber
Casa Reed
Casa Glover
Casa Manderly
Casa Dustin
Casa Ryswell
Casa Hornwood
Casa Cerwyn
Casa Tallhart
Casa Cassel
Casa Poole
Casa Flint
Casa Locke
Casa Blackwood
Casa Bracken
Casa Mallister
Casa Piper
Casa Vance
Casa Darry
Casa Mooton
Casa Whent
Casa Smallwood
Casa Ryger
Casa Roote
Casa Royce
Casa Baelish
Casa Waynwood
Casa Corbray
Casa Grafton
Casa Hunter
Casa Redfort
Casa Belmore
Casa Templeton
Casa Lynderly
Casa Velaryon
Casa Celtigar
Casa Massey
Casa Stokeworth
Casa Rosby
Casa Hayford
Casa Darklyn
Casa Rykker
Casa Staunton
Casa Sunglass
Casa Clegane
Casa Payne
Casa Lefford
Casa Crakehall
Casa Marbrand
Casa Brax
Casa Westerling
Casa Swyft
Casa Farman
Casa Banefort
Casa Reyne
Casa Tarbeck
Casa Dondarrion
Casa Caron
Casa Swann
Casa Selmy
Casa Tarth
Casa Penrose
Casa Estermont
Casa Connington
Casa Morrigen
Casa Wylde
Casa Trant
Casa Fell
Casa Buckler
Casa Florent
Casa Hightower
Casa Redwyne
Casa Tarly
Casa Rowan
Casa Oakheart
Casa Fossoway
Casa Beesbury
Casa Cuy
Casa Merryweather
Casa Mullendore
Casa Caswell
Casa Crane
Casa Peake
Casa Ambrose
Casa Ashford
Casa Dayne
Casa Yronwood
Casa Uller
Casa Fowler
Casa Blackmont
Casa Jordayne
Casa Allyrion
Casa Manwoody
Casa Toland
Casa Gargalen
Casa Qorgyle
Casa Harlaw
Casa Goodbrother
Casa Drumm
Casa Farwynd
Casa Blacktyde
Casa Botley
Casa Merlyn
Casa Sunderly
Casa Volmark
Casa Tawney
Casa Kenning
Casa Blackfyre
Casa Strong
Casa Mudd
Casa Durrandon
Casa Hoare
Casa Gardener
Casa Justman
Casa Lothston
Casa Harroway
Casa Toyne
Casa Cole
""".strip().splitlines()
)


def clean_character_data(data: object) -> dict | None:
    if not isinstance(data, dict):
        return None
    cleaned = dict(data)
    house = str(cleaned.get("casa", "")).strip()
    if house not in HOUSE_OPTIONS:
        return None
    cleaned["casa"] = house
    armor = str(cleaned.get("armadura") or "Roupas").strip()
    if armor not in ARMOR_STATS:
        return None
    cleaned["armadura"] = armor
    cleaned["bonusArmadura"] = ARMOR_STATS[armor]["defense"]
    cleaned["penalidadeMovimentoArmadura"] = ARMOR_STATS[armor]["movement"]
    habilidades = cleaned.get("habilidades", {})
    if not isinstance(habilidades, dict):
        habilidades = {}

    def grade(name: str) -> int:
        value = habilidades.get(name, {})
        if not isinstance(value, dict):
            return 0
        try:
            return int(value.get("grau") or 0)
        except (TypeError, ValueError):
            return 0

    cleaned["intriga"] = str(grade("Astucia") + grade("Percepcao") + grade("Status"))
    shield_bonus = 2 if bool(cleaned.get("escudoAtivo")) else 0
    cleaned["escudoAtivo"] = bool(cleaned.get("escudoAtivo"))
    cleaned["bonusEscudo"] = shield_bonus
    cleaned["combate"] = str(
        grade("Agilidade") + grade("Atletismo") + grade("Percepcao") + ARMOR_STATS[armor]["movement"] + shield_bonus
    )
    cleaned["saude"] = str(grade("Vigor") * 3)
    mounts = cleaned.get("montarias", [])
    if not isinstance(mounts, list):
        mounts = []
    mount_bonus = 0
    clean_mounts = []
    for mount in mounts:
        if not isinstance(mount, dict):
            continue
        try:
            bonus = int(mount.get("movement") or 0)
        except (TypeError, ValueError):
            bonus = 0
        active = bool(mount.get("active"))
        if active:
            mount_bonus += bonus
        clean_mounts.append(
            {
                "name": str(mount.get("name", ""))[:120],
                "price": str(mount.get("price", ""))[:40],
                "movement": bonus,
                "active": active,
            }
        )
    cleaned["montarias"] = clean_mounts
    cleaned["bonusMontaria"] = mount_bonus
    movement = 9 + ARMOR_STATS[armor]["movement"] + mount_bonus
    cleaned["movimento"] = str(movement)
    cleaned["corrida"] = str(movement * 3)
    inventory = cleaned.get("inventario", [])
    cleaned["inventario"] = inventory if isinstance(inventory, list) else []
    weapons = cleaned.get("armasAtaques", [])
    cleaned["armasAtaques"] = weapons if isinstance(weapons, list) else []
    return cleaned


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
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS campaigns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                invite_code TEXT NOT NULL UNIQUE,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY(owner_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS campaign_members (
                campaign_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                joined_at INTEGER NOT NULL,
                PRIMARY KEY (campaign_id, user_id),
                FOREIGN KEY(campaign_id) REFERENCES campaigns(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS campaign_characters (
                campaign_id INTEGER NOT NULL,
                character_id INTEGER NOT NULL,
                added_by INTEGER NOT NULL,
                added_at INTEGER NOT NULL,
                PRIMARY KEY (campaign_id, character_id),
                FOREIGN KEY(campaign_id) REFERENCES campaigns(id),
                FOREIGN KEY(character_id) REFERENCES characters(id),
                FOREIGN KEY(added_by) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS campaign_diaries (
                campaign_id INTEGER NOT NULL,
                session_number INTEGER NOT NULL,
                content TEXT NOT NULL,
                updated_at INTEGER NOT NULL,
                PRIMARY KEY (campaign_id, session_number),
                FOREIGN KEY(campaign_id) REFERENCES campaigns(id)
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
            if path == "/campaigns":
                return self.create_campaign()
            if path.startswith("/campaigns/join/"):
                return self.join_campaign(path)
            if path.startswith("/campaigns/") and path.endswith("/characters"):
                return self.add_campaign_character(path)
            self.send_json(404, {"detail": "Rota nao encontrada"})
        except json.JSONDecodeError:
            self.send_json(400, {"detail": "JSON invalido"})

    def do_GET(self) -> None:
        init_db()
        path = urlparse(self.path).path
        if path == "/character-images":
            return self.list_character_images()
        if path.startswith("/character-images/"):
            return self.get_character_image(path)
        if path == "/me":
            return self.me()
        if path == "/characters":
            return self.list_characters()
        if path.startswith("/characters/"):
            return self.get_character(path)
        if path == "/campaigns":
            return self.list_campaigns()
        if path.startswith("/campaigns/invite/"):
            return self.get_campaign_invite(path)
        if path.startswith("/campaigns/"):
            return self.get_campaign(path)
        self.send_json(404, {"detail": "Rota nao encontrada"})

    def list_character_images(self) -> None:
        if not CHARACTER_IMAGES_DIR.exists():
            return self.send_json(200, [])
        images = [
            {"name": file.stem, "file": file.name}
            for file in sorted(CHARACTER_IMAGES_DIR.iterdir())
            if file.is_file() and file.suffix.lower() in IMAGE_EXTENSIONS
        ]
        self.send_json(200, images)

    def get_character_image(self, path: str) -> None:
        filename = Path(unquote(path.rsplit("/", 1)[-1])).name
        image_path = CHARACTER_IMAGES_DIR / filename
        if not image_path.is_file() or image_path.suffix.lower() not in IMAGE_EXTENSIONS:
            return self.send_json(404, {"detail": "Imagem nao encontrada"})
        content = image_path.read_bytes()
        content_type = mimetypes.guess_type(image_path.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_PUT(self) -> None:
        init_db()
        path = urlparse(self.path).path
        try:
            if path.startswith("/characters/"):
                return self.update_character(path)
            if path.startswith("/campaigns/") and path.endswith("/diary"):
                return self.update_campaign_diary(path)
            if path.startswith("/campaigns/"):
                return self.update_campaign(path)
            self.send_json(404, {"detail": "Rota nao encontrada"})
        except json.JSONDecodeError:
            self.send_json(400, {"detail": "JSON invalido"})

    def do_DELETE(self) -> None:
        init_db()
        path = urlparse(self.path).path
        if path.startswith("/characters/"):
            return self.delete_character(path)
        if path.startswith("/campaigns/") and "/characters/" in path:
            return self.remove_campaign_character(path)
        if path.startswith("/campaigns/"):
            return self.delete_campaign(path)
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
        data = clean_character_data(self.read_json().get("data", {}))
        if data is None:
            return self.send_json(400, {"detail": "Casa ou armadura invalida"})
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
                """
                SELECT DISTINCT ch.*
                FROM characters ch
                LEFT JOIN campaign_characters cc ON cc.character_id = ch.id
                LEFT JOIN campaign_members cm ON cm.campaign_id = cc.campaign_id AND cm.user_id = ?
                WHERE ch.id = ? AND (ch.user_id = ? OR cm.user_id IS NOT NULL)
                """,
                (user_id, character_id, user_id),
            ).fetchone()
        if not row:
            return self.send_json(404, {"detail": "Personagem nao encontrado"})
        self.send_json(
            200,
            {
                "id": row["id"],
                "name": row["name"],
                "user_id": row["user_id"],
                "can_edit": row["user_id"] == user_id,
                "data": json.loads(row["data"]),
            },
        )

    def update_character(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        character_id = path.rsplit("/", 1)[-1]
        data = clean_character_data(self.read_json().get("data", {}))
        if data is None:
            return self.send_json(400, {"detail": "Casa ou armadura invalida"})
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

    def campaign_access(self, conn: sqlite3.Connection, campaign_id: str, user_id: int) -> sqlite3.Row | None:
        return conn.execute(
            """
            SELECT c.*, u.username AS owner_username
            FROM campaigns c
            JOIN users u ON u.id = c.owner_id
            LEFT JOIN campaign_members cm ON cm.campaign_id = c.id AND cm.user_id = ?
            WHERE c.id = ? AND (c.owner_id = ? OR cm.user_id IS NOT NULL)
            """,
            (user_id, campaign_id, user_id),
        ).fetchone()

    def list_campaigns(self) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        with db() as conn:
            rows = conn.execute(
                """
                SELECT c.id, c.name, c.description, c.invite_code, c.owner_id, c.updated_at,
                       u.username AS owner_username,
                       COUNT(DISTINCT cm.user_id) AS members_count,
                       COUNT(DISTINCT cc.character_id) AS characters_count
                FROM campaigns c
                JOIN users u ON u.id = c.owner_id
                LEFT JOIN campaign_members own ON own.campaign_id = c.id AND own.user_id = ?
                LEFT JOIN campaign_members cm ON cm.campaign_id = c.id
                LEFT JOIN campaign_characters cc ON cc.campaign_id = c.id
                WHERE c.owner_id = ? OR own.user_id IS NOT NULL
                GROUP BY c.id
                ORDER BY c.updated_at DESC
                """,
                (user_id, user_id),
            ).fetchall()
        self.send_json(200, [dict(row) for row in rows])

    def create_campaign(self) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        payload = self.read_json()
        name = str(payload.get("name", "")).strip()[:120]
        description = str(payload.get("description", "")).strip()[:2000]
        if not name:
            return self.send_json(400, {"detail": "Nome obrigatorio"})
        now = int(time.time())
        with db() as conn:
            cursor = conn.execute(
                """
                INSERT INTO campaigns (owner_id, name, description, invite_code, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (user_id, name, description, secrets.token_urlsafe(12), now, now),
            )
            campaign_id = int(cursor.lastrowid)
            conn.execute(
                "INSERT INTO campaign_members (campaign_id, user_id, joined_at) VALUES (?, ?, ?)",
                (campaign_id, user_id, now),
            )
        self.send_json(200, {"id": campaign_id, "name": name})

    def get_campaign(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        campaign_id = path.strip("/").split("/")[1]
        with db() as conn:
            campaign = self.campaign_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(404, {"detail": "Campanha nao encontrada"})
            members = conn.execute(
                """
                SELECT u.id, u.username, cm.joined_at
                FROM campaign_members cm
                JOIN users u ON u.id = cm.user_id
                WHERE cm.campaign_id = ?
                ORDER BY cm.joined_at
                """,
                (campaign_id,),
            ).fetchall()
            characters = conn.execute(
                """
                SELECT ch.id, ch.name, ch.data, ch.user_id, u.username AS owner_username, cc.added_at
                FROM campaign_characters cc
                JOIN characters ch ON ch.id = cc.character_id
                JOIN users u ON u.id = ch.user_id
                WHERE cc.campaign_id = ?
                ORDER BY cc.added_at DESC
                """,
                (campaign_id,),
            ).fetchall()
            diary = conn.execute(
                """
                SELECT content, updated_at
                FROM campaign_diaries
                WHERE campaign_id = ? AND session_number = 1
                """,
                (campaign_id,),
            ).fetchone()
        self.send_json(
            200,
            {
                "id": campaign["id"],
                "name": campaign["name"],
                "description": campaign["description"],
                "invite_code": campaign["invite_code"],
                "owner_id": campaign["owner_id"],
                "owner_username": campaign["owner_username"],
                "is_owner": campaign["owner_id"] == user_id,
                "current_user_id": user_id,
                "diary": {
                    "session_number": 1,
                    "content": diary["content"] if diary else "",
                    "updated_at": diary["updated_at"] if diary else None,
                },
                "members": [dict(row) for row in members],
                "characters": [
                    {
                        "id": row["id"],
                        "name": row["name"],
                        "user_id": row["user_id"],
                        "owner_username": row["owner_username"],
                        "added_at": row["added_at"],
                        "data": json.loads(row["data"]),
                    }
                    for row in characters
                ],
            },
        )

    def update_campaign_diary(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        campaign_id = path.strip("/").split("/")[1]
        content = str(self.read_json().get("content", ""))[:12000]
        now = int(time.time())
        with db() as conn:
            campaign = conn.execute(
                "SELECT id FROM campaigns WHERE id = ? AND owner_id = ?",
                (campaign_id, user_id),
            ).fetchone()
            if not campaign:
                return self.send_json(404, {"detail": "Campanha nao encontrada"})
            cursor = conn.execute(
                """
                UPDATE campaign_diaries
                SET content = ?, updated_at = ?
                WHERE campaign_id = ? AND session_number = 1
                """,
                (content, now, campaign_id),
            )
            if cursor.rowcount == 0:
                conn.execute(
                    """
                    INSERT INTO campaign_diaries (campaign_id, session_number, content, updated_at)
                    VALUES (?, 1, ?, ?)
                    """,
                    (campaign_id, content, now),
                )
            conn.execute("UPDATE campaigns SET updated_at = ? WHERE id = ?", (now, campaign_id))
        self.send_json(200, {"session_number": 1, "content": content, "updated_at": now})

    def update_campaign(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        campaign_id = path.strip("/").split("/")[1]
        payload = self.read_json()
        name = str(payload.get("name", "")).strip()[:120]
        description = str(payload.get("description", "")).strip()[:2000]
        if not name:
            return self.send_json(400, {"detail": "Nome obrigatorio"})
        with db() as conn:
            cursor = conn.execute(
                "UPDATE campaigns SET name = ?, description = ?, updated_at = ? WHERE id = ? AND owner_id = ?",
                (name, description, int(time.time()), campaign_id, user_id),
            )
        if cursor.rowcount == 0:
            return self.send_json(404, {"detail": "Campanha nao encontrada"})
        self.send_json(200, {"id": int(campaign_id), "name": name})

    def delete_campaign(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        campaign_id = path.strip("/").split("/")[1]
        with db() as conn:
            campaign = conn.execute(
                "SELECT id FROM campaigns WHERE id = ? AND owner_id = ?",
                (campaign_id, user_id),
            ).fetchone()
            if not campaign:
                return self.send_json(404, {"detail": "Campanha nao encontrada"})
            conn.execute("DELETE FROM campaign_diaries WHERE campaign_id = ?", (campaign_id,))
            conn.execute("DELETE FROM campaign_characters WHERE campaign_id = ?", (campaign_id,))
            conn.execute("DELETE FROM campaign_members WHERE campaign_id = ?", (campaign_id,))
            conn.execute("DELETE FROM campaigns WHERE id = ?", (campaign_id,))
        self.send_json(200, {"deleted": True})

    def get_campaign_invite(self, path: str) -> None:
        code = path.rsplit("/", 1)[-1]
        with db() as conn:
            campaign = conn.execute(
                """
                SELECT c.id, c.name, c.description, u.username AS owner_username
                FROM campaigns c
                JOIN users u ON u.id = c.owner_id
                WHERE c.invite_code = ?
                """,
                (code,),
            ).fetchone()
        if not campaign:
            return self.send_json(404, {"detail": "Convite invalido"})
        self.send_json(200, dict(campaign))

    def join_campaign(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        code = path.rsplit("/", 1)[-1]
        with db() as conn:
            campaign = conn.execute("SELECT id FROM campaigns WHERE invite_code = ?", (code,)).fetchone()
            if not campaign:
                return self.send_json(404, {"detail": "Convite invalido"})
            conn.execute(
                "INSERT OR IGNORE INTO campaign_members (campaign_id, user_id, joined_at) VALUES (?, ?, ?)",
                (campaign["id"], user_id, int(time.time())),
            )
        self.send_json(200, {"id": campaign["id"], "joined": True})

    def add_campaign_character(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        campaign_id = path.strip("/").split("/")[1]
        character_id = str(self.read_json().get("character_id", ""))
        with db() as conn:
            campaign = self.campaign_access(conn, campaign_id, user_id)
            character = conn.execute(
                "SELECT id FROM characters WHERE id = ? AND user_id = ?",
                (character_id, user_id),
            ).fetchone()
            if not campaign:
                return self.send_json(404, {"detail": "Campanha nao encontrada"})
            if not character:
                return self.send_json(404, {"detail": "Personagem nao encontrado"})
            conn.execute(
                """
                INSERT OR IGNORE INTO campaign_characters (campaign_id, character_id, added_by, added_at)
                VALUES (?, ?, ?, ?)
                """,
                (campaign_id, character_id, user_id, int(time.time())),
            )
            conn.execute("UPDATE campaigns SET updated_at = ? WHERE id = ?", (int(time.time()), campaign_id))
        self.send_json(200, {"added": True})

    def remove_campaign_character(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessario"})
        parts = path.strip("/").split("/")
        campaign_id, character_id = parts[1], parts[3]
        with db() as conn:
            campaign = self.campaign_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(404, {"detail": "Campanha nao encontrada"})
            cursor = conn.execute(
                """
                DELETE FROM campaign_characters
                WHERE campaign_id = ? AND character_id = ? AND (
                    added_by = ? OR EXISTS (
                        SELECT 1 FROM campaigns WHERE id = ? AND owner_id = ?
                    )
                )
                """,
                (campaign_id, character_id, user_id, campaign_id, user_id),
            )
        if cursor.rowcount == 0:
            return self.send_json(404, {"detail": "Ficha nao encontrada na campanha"})
        self.send_json(200, {"deleted": True})


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", "8003"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Backend em http://0.0.0.0:{port}")
    server.serve_forever()
