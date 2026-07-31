from __future__ import annotations

import base64
import hashlib
import hmac
import json
import math
import mimetypes
import os
import re
import secrets
import sqlite3
import struct
import threading
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
WEBSOCKET_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
BOARD_WEBSOCKETS: dict[str, set["Handler"]] = {}
BOARD_WEBSOCKET_LOCK = threading.Lock()
MAP_TERRAINS = {
    "grass", "forest", "dirt", "stone", "sand", "water", "snow", "mud",
    "wood", "lava", "flagstone", "mossstone",
}
MAP_OBJECTS = {
    "tree", "pine", "rock", "bush", "house", "tower", "wall", "door",
    "bridge", "camp", "fire", "chest", "barrel", "table", "ruins", "stairs", "well",
    "wood_wall_h", "wood_wall_v", "wood_wall_corner", "wood_wall_t",
    "stone_wall_h", "stone_wall_v", "stone_wall_corner", "stone_wall_t",
    "masonry_wall_h", "masonry_wall_v", "masonry_wall_corner", "masonry_wall_t",
    "stone_arch", "wood_gate", "stone_pillar", "wood_fence",
    "counter", "corner_counter", "bench", "stool", "throne", "iron_throne",
    "simple_bed", "canopy_bed", "small_rug", "runner_rug", "round_rug",
    "chair", "bookshelf", "cupboard", "weapon_rack", "fireplace",
}
ARMOR_STATS = {
    "Roupas": {"defense": 0, "movement": 0},
    "Robes": {"defense": 0, "movement": 0},
    "Acolchoada": {"defense": 1, "movement": -1},
    "Couro Macio": {"defense": 2, "movement": -1},
    "Couro Rígido": {"defense": 3, "movement": -1},
    "Madeira ou ossos": {"defense": 4, "movement": -2},
    "Cota de Anéis": {"defense": 4, "movement": -2},
    "Peles": {"defense": 5, "movement": -3},
    "Cota de Malha": {"defense": 5, "movement": -3},
    "Cota de Escamas": {"defense": 6, "movement": -3},
    "Brigantina": {"defense": 8, "movement": -4},
    "Meia Armadura": {"defense": 9, "movement": -5},
    "Placas": {"defense": 10, "movement": -5},
}
ARMOR_ALIASES = {
    "Acholchoada": "Acolchoada",
    "Couro Rigo": "Couro Rígido",
    "Cota de aneis": "Cota de Anéis",
    "Cota de malha": "Cota de Malha",
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


def parse_weight(value: object) -> float:
    match = re.search(r"\d+(?:[,.]\d+)?", str(value or ""))
    return float(match.group(0).replace(",", ".")) if match else 0.0


def item_quantity(value: object) -> int:
    try:
        quantity = int(float(value or 1))
    except (TypeError, ValueError):
        quantity = 1
    return max(1, quantity)


def items_weight(items: list[dict], with_quantity: bool = False) -> float:
    total = 0.0
    for item in items:
        quantity = item_quantity(item.get("quantidade")) if with_quantity else 1
        total += parse_weight(item.get("weight")) * quantity
    return total


def clean_character_data(data: object) -> dict | None:
    if not isinstance(data, dict):
        return None
    cleaned = dict(data)
    house = str(cleaned.get("casa", "")).strip()
    if house not in HOUSE_OPTIONS:
        return None
    cleaned["casa"] = house
    armor = str(cleaned.get("armadura") or "Roupas").strip()
    armor = ARMOR_ALIASES.get(armor, armor)
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
    if not isinstance(inventory, list):
        inventory = []
    cleaned_inventory = []
    for item in inventory:
        if not isinstance(item, dict):
            continue
        clean_item = dict(item)
        clean_item["quantidade"] = item_quantity(clean_item.get("quantidade"))
        cleaned_inventory.append(clean_item)
    cleaned["inventario"] = cleaned_inventory
    weapons = cleaned.get("armasAtaques", [])
    if not isinstance(weapons, list):
        weapons = []
    cleaned_weapons = [dict(weapon) for weapon in weapons if isinstance(weapon, dict)]
    cleaned["armasAtaques"] = cleaned_weapons
    if items_weight(cleaned_inventory, True) + items_weight(cleaned_weapons) > grade("Atletismo") * 25:
        return None
    return cleaned


def clean_enemy_data(payload: object, fallback: dict | None = None) -> tuple[str, dict, int] | None:
    if not isinstance(payload, dict):
        return None
    base = dict(fallback or {})
    base.update(payload)
    name = str(base.get("name", "")).strip()[:120]
    if not name:
        return None

    def number(field: str, default: int, minimum: int = 0, maximum: int = 999) -> int:
        try:
            value = int(float(base.get(field, default)))
        except (TypeError, ValueError):
            value = default
        return min(maximum, max(minimum, value))

    health = number("health", 9, 1, 999)
    current_health = number("current_health", health, 0, health)
    data = {
        "category": str(base.get("category", "Humanoide")).strip()[:50] or "Humanoide",
        "threat": str(base.get("threat", "Comum")).strip()[:40] or "Comum",
        "combat_defense": number("combat_defense", 6, 0, 99),
        "health": health,
        "armor": number("armor", 0, 0, 99),
        "movement": number("movement", 3, 0, 99),
        "attack": str(base.get("attack", "Ataque")).strip()[:160],
        "damage": str(base.get("damage", "1")).strip()[:80],
        "abilities": str(base.get("abilities", "")).strip()[:4000],
        "notes": str(base.get("notes", "")).strip()[:4000],
        "source": str(base.get("source", "Personalizado")).strip()[:160] or "Personalizado",
    }
    return name, data, current_health


def clean_campaign_map(payload: object, fallback: dict | None = None) -> tuple[str, int, int, dict] | None:
    if not isinstance(payload, dict):
        return None
    base = dict(fallback or {})
    base.update(payload)
    name = str(base.get("name", "")).strip()[:120]
    if not name:
        return None
    try:
        width = min(40, max(12, int(base.get("width", 24))))
        height = min(30, max(8, int(base.get("height", 14))))
    except (TypeError, ValueError):
        return None
    cell_count = width * height
    tiles = base.get("tiles", [])
    if not isinstance(tiles, list):
        tiles = []
    clean_tiles = [
        str(tiles[index]) if index < len(tiles) and str(tiles[index]) in MAP_TERRAINS else "grass"
        for index in range(cell_count)
    ]
    objects = base.get("objects", {})
    if not isinstance(objects, dict):
        objects = {}
    clean_objects = {}
    for raw_index, raw_object in objects.items():
        try:
            index = int(raw_index)
        except (TypeError, ValueError):
            continue
        object_name = str(raw_object)
        if 0 <= index < cell_count and object_name in MAP_OBJECTS:
            clean_objects[str(index)] = object_name
    object_settings = base.get("object_settings", {})
    if not isinstance(object_settings, dict):
        object_settings = {}
    clean_object_settings = {}
    for raw_index, raw_setting in object_settings.items():
        try:
            index = int(raw_index)
        except (TypeError, ValueError):
            continue
        if str(index) not in clean_objects or not isinstance(raw_setting, dict):
            continue
        try:
            rotation = int(float(raw_setting.get("rotation", 0))) % 360
            scale = min(2.5, max(0.4, float(raw_setting.get("scale", 1))))
            elevation = min(9, max(0, int(float(raw_setting.get("elevation", 0)))))
        except (TypeError, ValueError):
            rotation, scale, elevation = 0, 1.0, 0
        layer = str(raw_setting.get("layer", "objects"))
        if layer not in {"ground", "objects", "roof", "gm"}:
            layer = "objects"
        clean_object_settings[str(index)] = {
            "rotation": rotation,
            "scale": round(scale, 2),
            "elevation": elevation,
            "layer": layer,
        }
    try:
        brightness = min(115, max(20, int(base.get("brightness", 100))))
    except (TypeError, ValueError):
        brightness = 100
    data = {
        "tiles": clean_tiles,
        "objects": clean_objects,
        "object_settings": clean_object_settings,
        "grid_visible": bool(base.get("grid_visible", True)),
        "time_of_day": str(base.get("time_of_day", "day"))
        if str(base.get("time_of_day", "day")) in {"dawn", "day", "dusk", "night"}
        else "day",
        "brightness": brightness,
    }
    return name, width, height, data


def clean_board_state(
    payload: object,
    fallback: dict | None = None,
    valid_token_ids: set[str] | None = None,
) -> dict:
    base = dict(fallback or {})
    if isinstance(payload, dict):
        base.update(payload)

    grid_payload = base.get("grid", {})
    if not isinstance(grid_payload, dict):
        grid_payload = {}
    try:
        grid_width = min(40, max(0, int(grid_payload.get("width", 0))))
        grid_height = min(30, max(0, int(grid_payload.get("height", 0))))
    except (TypeError, ValueError):
        grid_width, grid_height = 0, 0
    grid_count = grid_width * grid_height
    blocked = []
    raw_blocked = grid_payload.get("blocked", [])
    if isinstance(raw_blocked, list) and grid_count:
        for raw_index in raw_blocked[:1200]:
            try:
                index = int(raw_index)
            except (TypeError, ValueError):
                continue
            if 0 <= index < grid_count and index not in blocked:
                blocked.append(index)
    doors = []
    raw_doors = grid_payload.get("doors", [])
    if isinstance(raw_doors, list) and grid_count:
        for raw_door in raw_doors[:200]:
            if not isinstance(raw_door, dict):
                continue
            try:
                index = int(raw_door.get("index"))
            except (TypeError, ValueError):
                continue
            if not 0 <= index < grid_count:
                continue
            door_id = str(raw_door.get("id", f"door-{index}"))[:80] or f"door-{index}"
            if door_id in {door["id"] for door in doors}:
                continue
            doors.append(
                {
                    "id": door_id,
                    "index": index,
                    "open": bool(raw_door.get("open", False)),
                    "label": str(raw_door.get("label", "Porta"))[:80] or "Porta",
                }
            )
    explored = []
    raw_explored = base.get("explored", [])
    if isinstance(raw_explored, list) and grid_count:
        for raw_index in raw_explored[:1200]:
            try:
                index = int(raw_index)
            except (TypeError, ValueError):
                continue
            if 0 <= index < grid_count and index not in explored:
                explored.append(index)

    try:
        vision_radius = min(12, max(1, int(base.get("vision_radius", 5))))
    except (TypeError, ValueError):
        vision_radius = 5
    weather = str(base.get("weather", "clear"))
    if weather not in {"clear", "rain", "snow", "mist", "storm"}:
        weather = "clear"

    lights = []
    raw_lights = base.get("lights", [])
    if isinstance(raw_lights, list):
        for raw_light in raw_lights[:80]:
            if not isinstance(raw_light, dict):
                continue
            try:
                x = min(100, max(0, float(raw_light.get("x", 50))))
                y = min(100, max(0, float(raw_light.get("y", 50))))
                radius = min(12, max(1, float(raw_light.get("radius", 4))))
                intensity = min(1, max(0.1, float(raw_light.get("intensity", 0.75))))
            except (TypeError, ValueError):
                continue
            light_id = str(raw_light.get("id", ""))[:80] or secrets.token_hex(6)
            if light_id in {light["id"] for light in lights}:
                continue
            color = str(raw_light.get("color", "#ffb347"))
            if not re.match(r"^#[0-9a-fA-F]{6}$", color):
                color = "#ffb347"
            lights.append(
                {
                    "id": light_id,
                    "x": round(x, 3),
                    "y": round(y, 3),
                    "radius": round(radius, 2),
                    "intensity": round(intensity, 2),
                    "color": color,
                    "label": str(raw_light.get("label", "Luz"))[:80] or "Luz",
                }
            )

    markers = []
    raw_markers = base.get("markers", [])
    if isinstance(raw_markers, list):
        for raw_marker in raw_markers[:160]:
            if not isinstance(raw_marker, dict):
                continue
            try:
                x = min(100, max(0, float(raw_marker.get("x", 50))))
                y = min(100, max(0, float(raw_marker.get("y", 50))))
            except (TypeError, ValueError):
                continue
            marker_id = str(raw_marker.get("id", ""))[:80] or secrets.token_hex(6)
            if marker_id in {marker["id"] for marker in markers}:
                continue
            marker_type = str(raw_marker.get("type", "trap"))
            if marker_type not in {"trap", "secret", "objective"}:
                marker_type = "secret"
            markers.append(
                {
                    "id": marker_id,
                    "type": marker_type,
                    "x": round(x, 3),
                    "y": round(y, 3),
                    "label": str(raw_marker.get("label", "Marcador"))[:120] or "Marcador",
                    "hidden": bool(raw_marker.get("hidden", True)),
                }
            )

    token_stats = {}
    raw_token_stats = base.get("token_stats", {})
    allowed_conditions = {"caido", "atordoado", "cego", "queimando", "envenenado", "imobilizado", "oculto"}
    if isinstance(raw_token_stats, dict):
        for raw_token_id, raw_stats in list(raw_token_stats.items())[:160]:
            token_id = str(raw_token_id)[:80]
            if (
                not token_id
                or not isinstance(raw_stats, dict)
                or (valid_token_ids is not None and token_id not in valid_token_ids)
            ):
                continue
            try:
                maximum = min(9999, max(1, int(float(raw_stats.get("max_health", 1)))))
                current = min(maximum, max(0, int(float(raw_stats.get("current_health", maximum)))))
            except (TypeError, ValueError):
                continue
            raw_conditions = raw_stats.get("conditions", [])
            conditions = []
            if isinstance(raw_conditions, list):
                conditions = [
                    str(condition)
                    for condition in raw_conditions
                    if str(condition) in allowed_conditions
                ][:12]
            token_stats[token_id] = {
                "current_health": current,
                "max_health": maximum,
                "conditions": list(dict.fromkeys(conditions)),
            }

    combat_payload = base.get("combat", {})
    if not isinstance(combat_payload, dict):
        combat_payload = {}
    order = []
    raw_order = combat_payload.get("order", [])
    if isinstance(raw_order, list):
        for raw_entry in raw_order[:80]:
            if isinstance(raw_entry, dict):
                token_id = str(raw_entry.get("id", ""))[:80]
                try:
                    initiative = min(99, max(-99, int(raw_entry.get("initiative", 0))))
                except (TypeError, ValueError):
                    initiative = 0
            else:
                token_id = str(raw_entry)[:80]
                initiative = 0
            if not token_id or (valid_token_ids is not None and token_id not in valid_token_ids):
                continue
            if token_id not in {entry["id"] for entry in order}:
                order.append({"id": token_id, "initiative": initiative})
    try:
        turn_index = max(0, int(combat_payload.get("turn_index", 0)))
        round_number = min(999, max(1, int(combat_payload.get("round", 1))))
    except (TypeError, ValueError):
        turn_index, round_number = 0, 1
    if order:
        turn_index %= len(order)
    else:
        turn_index = 0

    effect = None
    raw_effect = combat_payload.get("effect")
    if isinstance(raw_effect, dict):
        attacker = str(raw_effect.get("attacker", ""))[:80]
        target = str(raw_effect.get("target", ""))[:80]
        if (
            attacker
            and target
            and (valid_token_ids is None or attacker in valid_token_ids)
            and (valid_token_ids is None or target in valid_token_ids)
        ):
            try:
                effect_total = min(9999, max(0, int(raw_effect.get("total", 0) or 0)))
                effect_defense = min(9999, max(0, int(raw_effect.get("defense", 0) or 0)))
            except (TypeError, ValueError):
                effect_total, effect_defense = 0, 0
            effect = {
                "id": str(raw_effect.get("id", ""))[:80] or str(int(time.time() * 1000)),
                "type": "attack",
                "attacker": attacker,
                "target": target,
                "total": effect_total,
                "defense": effect_defense,
                "success": bool(raw_effect.get("success", False)),
            }

    return {
        "grid": {
            "width": grid_width,
            "height": grid_height,
            "blocked": blocked,
            "doors": doors,
        },
        "physics_enabled": bool(base.get("physics_enabled", True)),
        "fog_enabled": bool(base.get("fog_enabled", False)),
        "vision_radius": vision_radius,
        "explored": explored,
        "weather": weather,
        "lights": lights,
        "markers": markers,
        "token_stats": token_stats,
        "combat": {
            "active": bool(combat_payload.get("active", False)) and bool(order),
            "order": order,
            "turn_index": turn_index,
            "round": round_number,
            "effect": effect,
        },
    }


def board_blocked_cells(board_state: dict) -> set[int]:
    grid = board_state.get("grid", {})
    blocked = {int(index) for index in grid.get("blocked", [])}
    blocked.update(
        int(door["index"])
        for door in grid.get("doors", [])
        if isinstance(door, dict) and not door.get("open")
    )
    return blocked


def board_path_is_blocked(start: dict | None, end: dict, board_state: dict) -> bool:
    if not board_state.get("physics_enabled"):
        return False
    grid = board_state.get("grid", {})
    width = int(grid.get("width", 0))
    height = int(grid.get("height", 0))
    blocked = board_blocked_cells(board_state)
    if not width or not height or not blocked:
        return False

    def cell(position: dict) -> tuple[int, int]:
        return (
            min(width - 1, max(0, int(float(position["x"]) / 100 * width))),
            min(height - 1, max(0, int(float(position["y"]) / 100 * height))),
        )

    end_x, end_y = cell(end)
    if end_y * width + end_x in blocked:
        return True
    if not isinstance(start, dict) or "x" not in start or "y" not in start:
        return False

    x, y = cell(start)
    dx = abs(end_x - x)
    dy = abs(end_y - y)
    step_x = 1 if x < end_x else -1
    step_y = 1 if y < end_y else -1
    error = dx - dy
    first = True
    while True:
        if not first and y * width + x in blocked:
            return True
        if x == end_x and y == end_y:
            break
        first = False
        double_error = error * 2
        if double_error > -dy:
            error -= dy
            x += step_x
        if double_error < dx:
            error += dx
            y += step_y
    return False


def board_visible_cells(
    board_state: dict,
    positions: dict,
    character_ids: set[str],
) -> set[int]:
    grid = board_state.get("grid", {})
    width = int(grid.get("width", 0))
    height = int(grid.get("height", 0))
    if not width or not height:
        return set()
    blocked = board_blocked_cells(board_state)

    def cell(position: dict) -> tuple[int, int]:
        return (
            min(width - 1, max(0, int(float(position["x"]) / 100 * width))),
            min(height - 1, max(0, int(float(position["y"]) / 100 * height))),
        )

    def line_clear(source_x: int, source_y: int, target_x: int, target_y: int) -> bool:
        x, y = source_x, source_y
        dx = abs(target_x - x)
        dy = abs(target_y - y)
        step_x = 1 if x < target_x else -1
        step_y = 1 if y < target_y else -1
        error = dx - dy
        first = True
        while True:
            if not first and (x, y) != (target_x, target_y) and y * width + x in blocked:
                return False
            if (x, y) == (target_x, target_y):
                return True
            first = False
            double_error = error * 2
            if double_error > -dy:
                error -= dy
                x += step_x
            if double_error < dx:
                error += dx
                y += step_y

    sources: list[tuple[dict, float]] = [
        (position, float(board_state.get("vision_radius", 5)))
        for token_id, position in positions.items()
        if token_id in character_ids and isinstance(position, dict)
    ]
    sources.extend(
        (light, float(light.get("radius", 4)))
        for light in board_state.get("lights", [])
        if isinstance(light, dict)
    )
    visible: set[int] = set()
    for position, radius in sources:
        try:
            source_x, source_y = cell(position)
        except (KeyError, TypeError, ValueError):
            continue
        radius_int = int(math.ceil(radius))
        for y in range(max(0, source_y - radius_int), min(height, source_y + radius_int + 1)):
            for x in range(max(0, source_x - radius_int), min(width, source_x + radius_int + 1)):
                if math.hypot(x - source_x, y - source_y) > radius + 0.35:
                    continue
                if line_clear(source_x, source_y, x, y):
                    visible.add(y * width + x)
    return visible


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
                role TEXT NOT NULL DEFAULT 'user',
                auth_version INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL
            )
            """
        )
        user_columns = {
            row["name"]
            for row in conn.execute("PRAGMA table_info(users)").fetchall()
        }
        if "role" not in user_columns:
            conn.execute(
                "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'"
            )
        if "auth_version" not in user_columns:
            conn.execute(
                "ALTER TABLE users ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0"
            )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS app_migrations (
                name TEXT PRIMARY KEY,
                applied_at INTEGER NOT NULL
            )
            """
        )
        promotion = conn.execute(
            "SELECT name FROM app_migrations WHERE name = ?",
            ("promote_viniduarte_superadmin_v1",),
        ).fetchone()
        if not promotion:
            conn.execute(
                "UPDATE users SET role = 'superadmin' WHERE lower(username) = 'viniduarte'"
            )
            conn.execute(
                "INSERT INTO app_migrations (name, applied_at) VALUES (?, ?)",
                ("promote_viniduarte_superadmin_v1", int(time.time())),
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
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS campaign_boards (
                campaign_id INTEGER PRIMARY KEY,
                map_image TEXT NOT NULL DEFAULT '',
                token_positions TEXT NOT NULL DEFAULT '{}',
                board_state TEXT NOT NULL DEFAULT '{}',
                updated_at INTEGER NOT NULL,
                updated_by INTEGER NOT NULL,
                FOREIGN KEY(campaign_id) REFERENCES campaigns(id),
                FOREIGN KEY(updated_by) REFERENCES users(id)
            )
            """
        )
        board_columns = {
            row["name"]
            for row in conn.execute("PRAGMA table_info(campaign_boards)").fetchall()
        }
        if "board_state" not in board_columns:
            conn.execute(
                "ALTER TABLE campaign_boards ADD COLUMN board_state TEXT NOT NULL DEFAULT '{}'"
            )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS campaign_rolls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                notation TEXT NOT NULL,
                results TEXT NOT NULL,
                total INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY(campaign_id) REFERENCES campaigns(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS campaign_enemies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER NOT NULL,
                created_by INTEGER NOT NULL,
                name TEXT NOT NULL,
                data TEXT NOT NULL,
                current_health INTEGER NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY(campaign_id) REFERENCES campaigns(id),
                FOREIGN KEY(created_by) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS campaign_maps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER NOT NULL,
                created_by INTEGER NOT NULL,
                name TEXT NOT NULL,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                data TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY(campaign_id) REFERENCES campaigns(id),
                FOREIGN KEY(created_by) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS campaign_map_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER NOT NULL,
                map_id INTEGER NOT NULL,
                snapshot TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY(campaign_id) REFERENCES campaigns(id),
                FOREIGN KEY(map_id) REFERENCES campaign_maps(id)
            )
            """
        )


def delete_campaign_records(conn: sqlite3.Connection, campaign_id: int | str) -> None:
    conn.execute("DELETE FROM campaign_rolls WHERE campaign_id = ?", (campaign_id,))
    conn.execute("DELETE FROM campaign_boards WHERE campaign_id = ?", (campaign_id,))
    conn.execute("DELETE FROM campaign_enemies WHERE campaign_id = ?", (campaign_id,))
    conn.execute("DELETE FROM campaign_map_versions WHERE campaign_id = ?", (campaign_id,))
    conn.execute("DELETE FROM campaign_maps WHERE campaign_id = ?", (campaign_id,))
    conn.execute("DELETE FROM campaign_diaries WHERE campaign_id = ?", (campaign_id,))
    conn.execute("DELETE FROM campaign_characters WHERE campaign_id = ?", (campaign_id,))
    conn.execute("DELETE FROM campaign_members WHERE campaign_id = ?", (campaign_id,))
    conn.execute("DELETE FROM campaigns WHERE id = ?", (campaign_id,))


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
    with db() as conn:
        user = conn.execute(
            "SELECT auth_version FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    auth_version = int(user["auth_version"]) if user else 0
    payload = json.dumps(
        {
            "sub": user_id,
            "ver": auth_version,
            "exp": int(time.time()) + TOKEN_TTL,
        },
        separators=(",", ":"),
    ).encode()
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
        user_id = int(payload["sub"])
        with db() as conn:
            user = conn.execute(
                "SELECT auth_version FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
        if not user or int(payload.get("ver", 0)) != int(user["auth_version"]):
            return None
        return user_id
    except Exception:
        return None


def websocket_presence(campaign_id: str) -> list[dict]:
    with BOARD_WEBSOCKET_LOCK:
        connections = list(BOARD_WEBSOCKETS.get(str(campaign_id), set()))
    unique = {}
    for connection in connections:
        user_id = getattr(connection, "websocket_user_id", None)
        username = getattr(connection, "websocket_username", "")
        if user_id:
            unique[str(user_id)] = {"user_id": user_id, "username": username}
    return list(unique.values())


def broadcast_board_event(campaign_id: str, payload: dict, exclude: "Handler" | None = None) -> None:
    with BOARD_WEBSOCKET_LOCK:
        connections = list(BOARD_WEBSOCKETS.get(str(campaign_id), set()))
    dead = []
    for connection in connections:
        if connection is exclude:
            continue
        try:
            connection.websocket_send_json(payload)
        except Exception:
            dead.append(connection)
    if dead:
        with BOARD_WEBSOCKET_LOCK:
            room = BOARD_WEBSOCKETS.get(str(campaign_id), set())
            for connection in dead:
                room.discard(connection)


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

    def websocket_send_frame(self, opcode: int, payload: bytes = b"") -> None:
        length = len(payload)
        header = bytearray([0x80 | opcode])
        if length < 126:
            header.append(length)
        elif length < 65536:
            header.append(126)
            header.extend(struct.pack("!H", length))
        else:
            header.append(127)
            header.extend(struct.pack("!Q", length))
        with self.websocket_write_lock:
            self.wfile.write(bytes(header) + payload)
            self.wfile.flush()

    def websocket_send_json(self, payload: dict) -> None:
        self.websocket_send_frame(0x1, json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode())

    def websocket_read_exact(self, length: int) -> bytes:
        data = b""
        while len(data) < length:
            chunk = self.rfile.read(length - len(data))
            if not chunk:
                raise ConnectionError("WebSocket encerrado")
            data += chunk
        return data

    def campaign_websocket(self, path: str) -> None:
        campaign_id = path.strip("/").split("/")[1]
        protocols = [
            protocol.strip()
            for protocol in self.headers.get("Sec-WebSocket-Protocol", "").split(",")
            if protocol.strip()
        ]
        token = protocols[1] if len(protocols) > 1 and protocols[0] == "gotrpg" else ""
        user_id = parse_token(token)
        key = self.headers.get("Sec-WebSocket-Key", "")
        if not user_id or not key or self.headers.get("Upgrade", "").lower() != "websocket":
            return self.send_json(401, {"detail": "WebSocket não autorizado"})
        with db() as conn:
            campaign = self.campaign_access(conn, campaign_id, user_id)
            user = conn.execute("SELECT username FROM users WHERE id = ?", (user_id,)).fetchone()
        if not campaign or not user:
            return self.send_json(404, {"detail": "Campanha não encontrada"})

        accept = base64.b64encode(hashlib.sha1((key + WEBSOCKET_GUID).encode()).digest()).decode()
        self.send_response(101, "Switching Protocols")
        self.send_header("Upgrade", "websocket")
        self.send_header("Connection", "Upgrade")
        self.send_header("Sec-WebSocket-Accept", accept)
        self.send_header("Sec-WebSocket-Protocol", "gotrpg")
        self.end_headers()

        self.websocket_write_lock = threading.Lock()
        self.websocket_user_id = user_id
        self.websocket_username = user["username"]
        self.websocket_campaign_id = str(campaign_id)
        with BOARD_WEBSOCKET_LOCK:
            BOARD_WEBSOCKETS.setdefault(str(campaign_id), set()).add(self)
        broadcast_board_event(
            campaign_id,
            {"type": "presence", "users": websocket_presence(campaign_id)},
        )
        self.websocket_send_json({"type": "connected", "user_id": user_id})

        try:
            while True:
                first, second = self.websocket_read_exact(2)
                opcode = first & 0x0F
                masked = bool(second & 0x80)
                length = second & 0x7F
                if length == 126:
                    length = struct.unpack("!H", self.websocket_read_exact(2))[0]
                elif length == 127:
                    length = struct.unpack("!Q", self.websocket_read_exact(8))[0]
                if length > 65_536:
                    break
                mask = self.websocket_read_exact(4) if masked else b""
                payload = self.websocket_read_exact(length)
                if masked:
                    payload = bytes(byte ^ mask[index % 4] for index, byte in enumerate(payload))
                if opcode == 0x8:
                    self.websocket_send_frame(0x8)
                    break
                if opcode == 0x9:
                    self.websocket_send_frame(0xA, payload)
                    continue
                if opcode != 0x1:
                    continue
                try:
                    message = json.loads(payload.decode())
                except (json.JSONDecodeError, UnicodeDecodeError):
                    continue
                message_type = str(message.get("type", ""))
                if message_type == "ping":
                    self.websocket_send_json({"type": "pong", "at": int(time.time() * 1000)})
                elif message_type in {"cursor", "measure"}:
                    try:
                        x = round(min(100, max(0, float(message.get("x", 0)))), 3)
                        y = round(min(100, max(0, float(message.get("y", 0)))), 3)
                    except (TypeError, ValueError):
                        continue
                    event = {
                        "type": message_type,
                        "user_id": user_id,
                        "username": user["username"],
                        "x": x,
                        "y": y,
                    }
                    if message_type == "measure":
                        event["end_x"] = round(min(100, max(0, float(message.get("end_x", x)))), 3)
                        event["end_y"] = round(min(100, max(0, float(message.get("end_y", y)))), 3)
                        event["tool"] = str(message.get("tool", "ruler"))[:20]
                    broadcast_board_event(campaign_id, event, exclude=self)
        except Exception:
            pass
        finally:
            with BOARD_WEBSOCKET_LOCK:
                BOARD_WEBSOCKETS.get(str(campaign_id), set()).discard(self)
            broadcast_board_event(
                campaign_id,
                {"type": "presence", "users": websocket_presence(campaign_id)},
            )

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
            if path.startswith("/campaigns/") and path.endswith("/rolls"):
                return self.roll_campaign_dice(path)
            if path.startswith("/campaigns/") and path.endswith("/enemies"):
                return self.create_campaign_enemy(path)
            if path.startswith("/campaigns/") and path.endswith("/maps"):
                return self.create_campaign_map(path)
            if path.startswith("/campaigns/") and path.endswith("/characters"):
                return self.add_campaign_character(path)
            self.send_json(404, {"detail": "Rota não encontrada"})
        except json.JSONDecodeError:
            self.send_json(400, {"detail": "JSON inválido"})

    def do_GET(self) -> None:
        init_db()
        path = urlparse(self.path).path
        if path == "/admin/users":
            return self.admin_list_users()
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
        if path.startswith("/campaigns/") and path.endswith("/ws"):
            return self.campaign_websocket(path)
        if path.startswith("/campaigns/") and path.endswith("/board"):
            return self.get_campaign_board(path)
        if path.startswith("/campaigns/") and "/maps/" in path and path.endswith("/versions"):
            return self.list_campaign_map_versions(path)
        if path.startswith("/campaigns/") and path.endswith("/enemies"):
            return self.list_campaign_enemies(path)
        if path.startswith("/campaigns/") and path.endswith("/maps"):
            return self.list_campaign_maps(path)
        if path.startswith("/campaigns/"):
            return self.get_campaign(path)
        self.send_json(404, {"detail": "Rota não encontrada"})

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
            return self.send_json(404, {"detail": "Imagem não encontrada"})
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
            if path.startswith("/admin/users/") and path.endswith("/password"):
                return self.admin_update_user_password(path)
            if path.startswith("/characters/"):
                return self.update_character(path)
            if path.startswith("/campaigns/") and path.endswith("/diary"):
                return self.update_campaign_diary(path)
            if path.startswith("/campaigns/") and path.endswith("/board"):
                return self.update_campaign_board(path)
            if path.startswith("/campaigns/") and "/enemies/" in path:
                return self.update_campaign_enemy(path)
            if path.startswith("/campaigns/") and "/maps/" in path and path.endswith("/restore"):
                return self.restore_campaign_map_version(path)
            if path.startswith("/campaigns/") and "/maps/" in path:
                return self.update_campaign_map(path)
            if path.startswith("/campaigns/"):
                return self.update_campaign(path)
            self.send_json(404, {"detail": "Rota não encontrada"})
        except json.JSONDecodeError:
            self.send_json(400, {"detail": "JSON inválido"})

    def do_DELETE(self) -> None:
        init_db()
        path = urlparse(self.path).path
        if path.startswith("/admin/users/"):
            return self.admin_delete_user(path)
        if path.startswith("/characters/"):
            return self.delete_character(path)
        if path.startswith("/campaigns/") and "/characters/" in path:
            return self.remove_campaign_character(path)
        if path.startswith("/campaigns/") and "/enemies/" in path:
            return self.delete_campaign_enemy(path)
        if path.startswith("/campaigns/") and "/maps/" in path:
            return self.delete_campaign_map(path)
        if path.startswith("/campaigns/"):
            return self.delete_campaign(path)
        self.send_json(404, {"detail": "Rota não encontrada"})

    def register(self) -> None:
        payload = self.read_json()
        username = str(payload.get("username", "")).strip().lower()
        password = str(payload.get("password", ""))
        if len(username) < 3 or len(password) < 8:
            return self.send_json(400, {"detail": "Usuário mínimo 3 e senha mínimo 8"})
        try:
            with db() as conn:
                cursor = conn.execute(
                    "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
                    (username, hash_password(password), int(time.time())),
                )
                user_id = int(cursor.lastrowid)
        except sqlite3.IntegrityError:
            return self.send_json(409, {"detail": "Usuário já existe"})
        self.send_json(200, {"token": create_token(user_id), "username": username})

    def login(self) -> None:
        payload = self.read_json()
        username = str(payload.get("username", "")).strip().lower()
        password = str(payload.get("password", ""))
        with db() as conn:
            user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if not user or not verify_password(password, user["password_hash"]):
            return self.send_json(401, {"detail": "Usuário ou senha inválidos"})
        self.send_json(200, {"token": create_token(int(user["id"])), "username": username})

    def me(self) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        with db() as conn:
            user = conn.execute(
                "SELECT id, username, role, created_at FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
            total = conn.execute(
                "SELECT COUNT(*) AS total FROM characters WHERE user_id = ?",
                (user_id,),
            ).fetchone()
        if not user:
            return self.send_json(404, {"detail": "Usuário não encontrado"})
        self.send_json(
            200,
            {
                "id": user["id"],
                "username": user["username"],
                "role": user["role"],
                "created_at": user["created_at"],
                "characters_count": total["total"],
            },
        )

    def admin_list_users(self) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        with db() as conn:
            if not self.is_superadmin(conn, user_id):
                return self.send_json(403, {"detail": "Acesso exclusivo do superadmin"})
            users = conn.execute(
                """
                SELECT
                    u.id,
                    u.username,
                    u.role,
                    u.created_at,
                    (SELECT COUNT(*) FROM characters ch WHERE ch.user_id = u.id) AS characters_count,
                    (SELECT COUNT(*) FROM campaigns c WHERE c.owner_id = u.id) AS campaigns_count,
                    (SELECT COUNT(*) FROM campaign_members cm WHERE cm.user_id = u.id) AS memberships_count
                FROM users u
                ORDER BY
                    CASE WHEN u.role = 'superadmin' THEN 0 ELSE 1 END,
                    lower(u.username)
                """
            ).fetchall()
        self.send_json(
            200,
            {
                "current_user_id": user_id,
                "users": [dict(user) for user in users],
            },
        )

    def admin_update_user_password(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        try:
            target_id = int(path.strip("/").split("/")[2])
        except (IndexError, TypeError, ValueError):
            return self.send_json(400, {"detail": "Usuário inválido"})
        password = str(self.read_json().get("password", ""))
        if not 8 <= len(password) <= 128:
            return self.send_json(400, {"detail": "A senha deve ter entre 8 e 128 caracteres"})
        with db() as conn:
            if not self.is_superadmin(conn, user_id):
                return self.send_json(403, {"detail": "Acesso exclusivo do superadmin"})
            target = conn.execute(
                "SELECT id, username FROM users WHERE id = ?",
                (target_id,),
            ).fetchone()
            if not target:
                return self.send_json(404, {"detail": "Usuário não encontrado"})
            conn.execute(
                """
                UPDATE users
                SET password_hash = ?, auth_version = auth_version + 1
                WHERE id = ?
                """,
                (hash_password(password), target_id),
            )
        self.send_json(
            200,
            {
                "id": target_id,
                "username": target["username"],
                "password_updated": True,
                "sessions_revoked": True,
            },
        )

    def admin_delete_user(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        try:
            target_id = int(path.strip("/").split("/")[2])
        except (IndexError, TypeError, ValueError):
            return self.send_json(400, {"detail": "Usuário inválido"})
        with db() as conn:
            if not self.is_superadmin(conn, user_id):
                return self.send_json(403, {"detail": "Acesso exclusivo do superadmin"})
            target = conn.execute(
                "SELECT id, username, role FROM users WHERE id = ?",
                (target_id,),
            ).fetchone()
            if not target:
                return self.send_json(404, {"detail": "Usuário não encontrado"})
            if target_id == user_id or target["role"] == "superadmin":
                return self.send_json(400, {"detail": "O superadmin principal não pode ser excluído"})

            owned_campaigns = [
                row["id"]
                for row in conn.execute(
                    "SELECT id FROM campaigns WHERE owner_id = ?",
                    (target_id,),
                ).fetchall()
            ]
            for campaign_id in owned_campaigns:
                delete_campaign_records(conn, campaign_id)

            conn.execute(
                """
                UPDATE campaign_boards
                SET updated_by = (
                    SELECT owner_id FROM campaigns
                    WHERE campaigns.id = campaign_boards.campaign_id
                )
                WHERE updated_by = ?
                """,
                (target_id,),
            )
            conn.execute(
                """
                UPDATE campaign_enemies
                SET created_by = (
                    SELECT owner_id FROM campaigns
                    WHERE campaigns.id = campaign_enemies.campaign_id
                )
                WHERE created_by = ?
                """,
                (target_id,),
            )
            conn.execute(
                """
                UPDATE campaign_maps
                SET created_by = (
                    SELECT owner_id FROM campaigns
                    WHERE campaigns.id = campaign_maps.campaign_id
                )
                WHERE created_by = ?
                """,
                (target_id,),
            )
            conn.execute(
                """
                UPDATE campaign_characters
                SET added_by = (
                    SELECT owner_id FROM campaigns
                    WHERE campaigns.id = campaign_characters.campaign_id
                )
                WHERE added_by = ?
                """,
                (target_id,),
            )
            conn.execute(
                """
                DELETE FROM campaign_characters
                WHERE character_id IN (
                    SELECT id FROM characters WHERE user_id = ?
                )
                """,
                (target_id,),
            )
            conn.execute("DELETE FROM campaign_rolls WHERE user_id = ?", (target_id,))
            conn.execute("DELETE FROM campaign_members WHERE user_id = ?", (target_id,))
            conn.execute("DELETE FROM characters WHERE user_id = ?", (target_id,))
            conn.execute("DELETE FROM users WHERE id = ?", (target_id,))
        self.send_json(
            200,
            {
                "id": target_id,
                "username": target["username"],
                "deleted": True,
                "deleted_campaigns": len(owned_campaigns),
            },
        )

    def list_characters(self) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        with db() as conn:
            if self.is_superadmin(conn, user_id):
                rows = conn.execute(
                    """
                    SELECT ch.id, ch.name, ch.updated_at, u.username AS owner_username
                    FROM characters ch
                    JOIN users u ON u.id = ch.user_id
                    ORDER BY ch.updated_at DESC
                    """
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT id, name, updated_at FROM characters WHERE user_id = ? ORDER BY updated_at DESC",
                    (user_id,),
                ).fetchall()
        self.send_json(200, [dict(row) for row in rows])

    def create_character(self) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        data = clean_character_data(self.read_json().get("data", {}))
        if data is None:
            return self.send_json(400, {"detail": "Dados inválidos ou peso excedido"})
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
            return self.send_json(401, {"detail": "Login necessário"})
        character_id = path.rsplit("/", 1)[-1]
        with db() as conn:
            superadmin = self.is_superadmin(conn, user_id)
            if superadmin:
                row = conn.execute(
                    "SELECT * FROM characters WHERE id = ?",
                    (character_id,),
                ).fetchone()
            else:
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
            return self.send_json(404, {"detail": "Personagem não encontrado"})
        self.send_json(
            200,
            {
                "id": row["id"],
                "name": row["name"],
                "user_id": row["user_id"],
                "can_edit": superadmin or row["user_id"] == user_id,
                "data": json.loads(row["data"]),
            },
        )

    def update_character(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        character_id = path.rsplit("/", 1)[-1]
        data = clean_character_data(self.read_json().get("data", {}))
        if data is None:
            return self.send_json(400, {"detail": "Dados inválidos ou peso excedido"})
        name = str(data.get("nome") or "Sem nome").strip()[:120]
        with db() as conn:
            superadmin = self.is_superadmin(conn, user_id)
            row = conn.execute(
                "SELECT data FROM characters WHERE id = ? AND (? OR user_id = ?)",
                (character_id, superadmin, user_id),
            ).fetchone()
            if not row:
                return self.send_json(404, {"detail": "Personagem não encontrado"})
            current_data = json.loads(row["data"])
            current_archetype = str(current_data.get("arquetipo") or "").strip()
            if current_archetype:
                data["arquetipo"] = current_archetype
            cursor = conn.execute(
                "UPDATE characters SET name = ?, data = ?, updated_at = ? WHERE id = ? AND (? OR user_id = ?)",
                (
                    name,
                    json.dumps(data, ensure_ascii=False),
                    int(time.time()),
                    character_id,
                    superadmin,
                    user_id,
                ),
            )
        if cursor.rowcount == 0:
            return self.send_json(404, {"detail": "Personagem não encontrado"})
        self.send_json(200, {"id": int(character_id), "name": name})

    def delete_character(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        character_id = path.rsplit("/", 1)[-1]
        with db() as conn:
            superadmin = self.is_superadmin(conn, user_id)
            cursor = conn.execute(
                "DELETE FROM characters WHERE id = ? AND (? OR user_id = ?)",
                (character_id, superadmin, user_id),
            )
        if cursor.rowcount == 0:
            return self.send_json(404, {"detail": "Personagem não encontrado"})
        self.send_json(200, {"deleted": True})

    def is_superadmin(self, conn: sqlite3.Connection, user_id: int) -> bool:
        user = conn.execute(
            "SELECT role FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        return bool(user and user["role"] == "superadmin")

    def campaign_manage_access(
        self,
        conn: sqlite3.Connection,
        campaign_id: str,
        user_id: int,
    ) -> sqlite3.Row | None:
        campaign = conn.execute(
            "SELECT * FROM campaigns WHERE id = ?",
            (campaign_id,),
        ).fetchone()
        if campaign and (
            campaign["owner_id"] == user_id
            or self.is_superadmin(conn, user_id)
        ):
            return campaign
        return None

    def campaign_access(self, conn: sqlite3.Connection, campaign_id: str, user_id: int) -> sqlite3.Row | None:
        if self.is_superadmin(conn, user_id):
            return conn.execute(
                """
                SELECT c.*, u.username AS owner_username
                FROM campaigns c
                JOIN users u ON u.id = c.owner_id
                WHERE c.id = ?
                """,
                (campaign_id,),
            ).fetchone()
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

    def enemy_json(self, row: sqlite3.Row) -> dict:
        try:
            data = json.loads(row["data"])
        except (json.JSONDecodeError, TypeError):
            data = {}
        return {
            "id": row["id"],
            "campaign_id": row["campaign_id"],
            "name": row["name"],
            "current_health": row["current_health"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            **data,
        }

    def map_json(self, row: sqlite3.Row) -> dict:
        try:
            data = json.loads(row["data"])
        except (json.JSONDecodeError, TypeError):
            data = {}
        return {
            "id": row["id"],
            "campaign_id": row["campaign_id"],
            "name": row["name"],
            "width": row["width"],
            "height": row["height"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            **data,
        }

    def list_campaigns(self) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        with db() as conn:
            superadmin = self.is_superadmin(conn, user_id)
            if superadmin:
                rows = conn.execute(
                    """
                    SELECT c.id, c.name, c.description, c.invite_code, c.owner_id, c.updated_at,
                           u.username AS owner_username,
                           COUNT(DISTINCT cm.user_id) AS members_count,
                           COUNT(DISTINCT cc.character_id) AS characters_count
                    FROM campaigns c
                    JOIN users u ON u.id = c.owner_id
                    LEFT JOIN campaign_members cm ON cm.campaign_id = c.id
                    LEFT JOIN campaign_characters cc ON cc.campaign_id = c.id
                    GROUP BY c.id
                    ORDER BY c.updated_at DESC
                    """
                ).fetchall()
            else:
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
        campaigns = [dict(row) for row in rows]
        for campaign in campaigns:
            campaign["is_owner"] = superadmin or campaign["owner_id"] == user_id
        self.send_json(200, campaigns)

    def create_campaign(self) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        payload = self.read_json()
        name = str(payload.get("name", "")).strip()[:120]
        description = str(payload.get("description", "")).strip()[:2000]
        if not name:
            return self.send_json(400, {"detail": "Nome obrigatório"})
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
            return self.send_json(401, {"detail": "Login necessário"})
        campaign_id = path.strip("/").split("/")[1]
        with db() as conn:
            campaign = self.campaign_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(404, {"detail": "Campanha não encontrada"})
            can_manage = (
                campaign["owner_id"] == user_id
                or self.is_superadmin(conn, user_id)
            )
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
                "is_owner": can_manage,
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

    def list_campaign_enemies(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        campaign_id = path.strip("/").split("/")[1]
        with db() as conn:
            campaign = self.campaign_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(404, {"detail": "Campanha não encontrada"})
            rows = conn.execute(
                """
                SELECT id, campaign_id, name, data, current_health, created_at, updated_at
                FROM campaign_enemies
                WHERE campaign_id = ?
                ORDER BY updated_at DESC, id DESC
                """,
                (campaign_id,),
            ).fetchall()
        self.send_json(200, [self.enemy_json(row) for row in rows])

    def create_campaign_enemy(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        campaign_id = path.strip("/").split("/")[1]
        cleaned = clean_enemy_data(self.read_json())
        if not cleaned:
            return self.send_json(400, {"detail": "Dados do inimigo inválidos"})
        name, data, current_health = cleaned
        now = int(time.time())
        with db() as conn:
            campaign = self.campaign_manage_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(403, {"detail": "Apenas o mestre cria inimigos"})
            cursor = conn.execute(
                """
                INSERT INTO campaign_enemies
                    (campaign_id, created_by, name, data, current_health, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (campaign_id, user_id, name, json.dumps(data, ensure_ascii=False), current_health, now, now),
            )
            enemy_id = int(cursor.lastrowid)
            row = conn.execute(
                """
                SELECT id, campaign_id, name, data, current_health, created_at, updated_at
                FROM campaign_enemies
                WHERE id = ?
                """,
                (enemy_id,),
            ).fetchone()
        broadcast_board_event(campaign_id, {"type": "enemies_updated"})
        self.send_json(200, self.enemy_json(row))

    def update_campaign_enemy(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        parts = path.strip("/").split("/")
        campaign_id, enemy_id = parts[1], parts[3]
        payload = self.read_json()
        now = int(time.time())
        with db() as conn:
            campaign = self.campaign_manage_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(403, {"detail": "Apenas o mestre altera inimigos"})
            existing = conn.execute(
                """
                SELECT id, campaign_id, name, data, current_health, created_at, updated_at
                FROM campaign_enemies
                WHERE id = ? AND campaign_id = ?
                """,
                (enemy_id, campaign_id),
            ).fetchone()
            if not existing:
                return self.send_json(404, {"detail": "Inimigo não encontrado"})
            try:
                fallback_data = json.loads(existing["data"])
            except (json.JSONDecodeError, TypeError):
                fallback_data = {}
            fallback = {
                "name": existing["name"],
                "current_health": existing["current_health"],
                **fallback_data,
            }
            cleaned = clean_enemy_data(payload, fallback)
            if not cleaned:
                return self.send_json(400, {"detail": "Dados do inimigo inválidos"})
            name, data, current_health = cleaned
            conn.execute(
                """
                UPDATE campaign_enemies
                SET name = ?, data = ?, current_health = ?, updated_at = ?
                WHERE id = ? AND campaign_id = ?
                """,
                (name, json.dumps(data, ensure_ascii=False), current_health, now, enemy_id, campaign_id),
            )
            row = conn.execute(
                """
                SELECT id, campaign_id, name, data, current_health, created_at, updated_at
                FROM campaign_enemies
                WHERE id = ?
                """,
                (enemy_id,),
            ).fetchone()
        broadcast_board_event(campaign_id, {"type": "enemies_updated"})
        self.send_json(200, self.enemy_json(row))

    def delete_campaign_enemy(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        parts = path.strip("/").split("/")
        campaign_id, enemy_id = parts[1], parts[3]
        with db() as conn:
            campaign = self.campaign_manage_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(403, {"detail": "Apenas o mestre remove inimigos"})
            cursor = conn.execute(
                "DELETE FROM campaign_enemies WHERE id = ? AND campaign_id = ?",
                (enemy_id, campaign_id),
            )
            board = conn.execute(
                "SELECT token_positions FROM campaign_boards WHERE campaign_id = ?",
                (campaign_id,),
            ).fetchone()
            if board:
                try:
                    positions = json.loads(board["token_positions"])
                except (json.JSONDecodeError, TypeError):
                    positions = {}
                positions.pop(f"enemy:{enemy_id}", None)
                conn.execute(
                    "UPDATE campaign_boards SET token_positions = ? WHERE campaign_id = ?",
                    (json.dumps(positions, separators=(",", ":")), campaign_id),
                )
        if cursor.rowcount == 0:
            return self.send_json(404, {"detail": "Inimigo não encontrado"})
        broadcast_board_event(campaign_id, {"type": "enemies_updated"})
        self.send_json(200, {"deleted": True})

    def list_campaign_maps(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        campaign_id = path.strip("/").split("/")[1]
        with db() as conn:
            campaign = self.campaign_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(404, {"detail": "Campanha não encontrada"})
            rows = conn.execute(
                """
                SELECT id, campaign_id, name, width, height, data, created_at, updated_at
                FROM campaign_maps
                WHERE campaign_id = ?
                ORDER BY updated_at DESC, id DESC
                """,
                (campaign_id,),
            ).fetchall()
        self.send_json(200, [self.map_json(row) for row in rows])

    def create_campaign_map(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        campaign_id = path.strip("/").split("/")[1]
        cleaned = clean_campaign_map(self.read_json())
        if not cleaned:
            return self.send_json(400, {"detail": "Dados do mapa inválidos"})
        name, width, height, data = cleaned
        now = int(time.time())
        with db() as conn:
            campaign = self.campaign_manage_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(403, {"detail": "Apenas o mestre cria mapas"})
            cursor = conn.execute(
                """
                INSERT INTO campaign_maps
                    (campaign_id, created_by, name, width, height, data, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    campaign_id,
                    user_id,
                    name,
                    width,
                    height,
                    json.dumps(data, ensure_ascii=False, separators=(",", ":")),
                    now,
                    now,
                ),
            )
            map_id = int(cursor.lastrowid)
            row = conn.execute(
                """
                SELECT id, campaign_id, name, width, height, data, created_at, updated_at
                FROM campaign_maps
                WHERE id = ?
                """,
                (map_id,),
            ).fetchone()
        self.send_json(200, self.map_json(row))

    def update_campaign_map(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        parts = path.strip("/").split("/")
        campaign_id, map_id = parts[1], parts[3]
        payload = self.read_json()
        now = int(time.time())
        with db() as conn:
            campaign = self.campaign_manage_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(403, {"detail": "Apenas o mestre altera mapas"})
            existing = conn.execute(
                """
                SELECT id, campaign_id, name, width, height, data, created_at, updated_at
                FROM campaign_maps
                WHERE id = ? AND campaign_id = ?
                """,
                (map_id, campaign_id),
            ).fetchone()
            if not existing:
                return self.send_json(404, {"detail": "Mapa não encontrado"})
            try:
                fallback_data = json.loads(existing["data"])
            except (json.JSONDecodeError, TypeError):
                fallback_data = {}
            fallback = {
                "name": existing["name"],
                "width": existing["width"],
                "height": existing["height"],
                **fallback_data,
            }
            cleaned = clean_campaign_map(payload, fallback)
            if not cleaned:
                return self.send_json(400, {"detail": "Dados do mapa inválidos"})
            name, width, height, data = cleaned
            snapshot = json.dumps(
                {
                    "name": existing["name"],
                    "width": existing["width"],
                    "height": existing["height"],
                    **fallback_data,
                },
                ensure_ascii=False,
                separators=(",", ":"),
            )
            latest_version = conn.execute(
                """
                SELECT snapshot FROM campaign_map_versions
                WHERE campaign_id = ? AND map_id = ?
                ORDER BY id DESC LIMIT 1
                """,
                (campaign_id, map_id),
            ).fetchone()
            if not latest_version or latest_version["snapshot"] != snapshot:
                conn.execute(
                    """
                    INSERT INTO campaign_map_versions (campaign_id, map_id, snapshot, created_at)
                    VALUES (?, ?, ?, ?)
                    """,
                    (campaign_id, map_id, snapshot, now),
                )
                conn.execute(
                    """
                    DELETE FROM campaign_map_versions
                    WHERE map_id = ? AND id NOT IN (
                        SELECT id FROM campaign_map_versions
                        WHERE map_id = ? ORDER BY id DESC LIMIT 30
                    )
                    """,
                    (map_id, map_id),
                )
            conn.execute(
                """
                UPDATE campaign_maps
                SET name = ?, width = ?, height = ?, data = ?, updated_at = ?
                WHERE id = ? AND campaign_id = ?
                """,
                (
                    name,
                    width,
                    height,
                    json.dumps(data, ensure_ascii=False, separators=(",", ":")),
                    now,
                    map_id,
                    campaign_id,
                ),
            )
            row = conn.execute(
                """
                SELECT id, campaign_id, name, width, height, data, created_at, updated_at
                FROM campaign_maps
                WHERE id = ?
                """,
                (map_id,),
            ).fetchone()
        self.send_json(200, self.map_json(row))

    def list_campaign_map_versions(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        parts = path.strip("/").split("/")
        campaign_id, map_id = parts[1], parts[3]
        with db() as conn:
            campaign = self.campaign_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(404, {"detail": "Campanha não encontrada"})
            rows = conn.execute(
                """
                SELECT id, snapshot, created_at
                FROM campaign_map_versions
                WHERE campaign_id = ? AND map_id = ?
                ORDER BY id DESC LIMIT 30
                """,
                (campaign_id, map_id),
            ).fetchall()
        versions = []
        for row in rows:
            try:
                snapshot = json.loads(row["snapshot"])
            except (json.JSONDecodeError, TypeError):
                snapshot = {}
            versions.append(
                {
                    "id": row["id"],
                    "created_at": row["created_at"],
                    "name": snapshot.get("name", "Mapa"),
                    "width": snapshot.get("width", 0),
                    "height": snapshot.get("height", 0),
                }
            )
        self.send_json(200, versions)

    def restore_campaign_map_version(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        parts = path.strip("/").split("/")
        campaign_id, map_id = parts[1], parts[3]
        try:
            version_id = int(self.read_json().get("version_id"))
        except (TypeError, ValueError):
            return self.send_json(400, {"detail": "Versão inválida"})
        now = int(time.time())
        with db() as conn:
            campaign = self.campaign_manage_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(403, {"detail": "Apenas o mestre restaura mapas"})
            current = conn.execute(
                """
                SELECT id, name, width, height, data, created_at
                FROM campaign_maps WHERE id = ? AND campaign_id = ?
                """,
                (map_id, campaign_id),
            ).fetchone()
            version = conn.execute(
                """
                SELECT snapshot FROM campaign_map_versions
                WHERE id = ? AND map_id = ? AND campaign_id = ?
                """,
                (version_id, map_id, campaign_id),
            ).fetchone()
            if not current or not version:
                return self.send_json(404, {"detail": "Versão não encontrada"})
            try:
                target = json.loads(version["snapshot"])
                current_data = json.loads(current["data"])
            except (json.JSONDecodeError, TypeError):
                return self.send_json(400, {"detail": "Versão corrompida"})
            cleaned = clean_campaign_map(target)
            if not cleaned:
                return self.send_json(400, {"detail": "Versão inválida"})
            name, width, height, data = cleaned
            current_snapshot = json.dumps(
                {
                    "name": current["name"],
                    "width": current["width"],
                    "height": current["height"],
                    **current_data,
                },
                ensure_ascii=False,
                separators=(",", ":"),
            )
            conn.execute(
                """
                INSERT INTO campaign_map_versions (campaign_id, map_id, snapshot, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (campaign_id, map_id, current_snapshot, now),
            )
            conn.execute(
                """
                DELETE FROM campaign_map_versions
                WHERE map_id = ? AND id NOT IN (
                    SELECT id FROM campaign_map_versions
                    WHERE map_id = ? ORDER BY id DESC LIMIT 30
                )
                """,
                (map_id, map_id),
            )
            conn.execute(
                """
                UPDATE campaign_maps SET name = ?, width = ?, height = ?, data = ?, updated_at = ?
                WHERE id = ? AND campaign_id = ?
                """,
                (
                    name,
                    width,
                    height,
                    json.dumps(data, ensure_ascii=False, separators=(",", ":")),
                    now,
                    map_id,
                    campaign_id,
                ),
            )
            row = conn.execute(
                """
                SELECT id, campaign_id, name, width, height, data, created_at, updated_at
                FROM campaign_maps WHERE id = ?
                """,
                (map_id,),
            ).fetchone()
        self.send_json(200, self.map_json(row))

    def delete_campaign_map(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        parts = path.strip("/").split("/")
        campaign_id, map_id = parts[1], parts[3]
        with db() as conn:
            campaign = self.campaign_manage_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(403, {"detail": "Apenas o mestre remove mapas"})
            conn.execute(
                "DELETE FROM campaign_map_versions WHERE map_id = ? AND campaign_id = ?",
                (map_id, campaign_id),
            )
            cursor = conn.execute(
                "DELETE FROM campaign_maps WHERE id = ? AND campaign_id = ?",
                (map_id, campaign_id),
            )
        if cursor.rowcount == 0:
            return self.send_json(404, {"detail": "Mapa não encontrado"})
        self.send_json(200, {"deleted": True})

    def get_campaign_board(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        campaign_id = path.strip("/").split("/")[1]
        with db() as conn:
            campaign = self.campaign_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(404, {"detail": "Campanha não encontrada"})
            board = conn.execute(
                """
                SELECT map_image, token_positions, board_state, updated_at
                FROM campaign_boards
                WHERE campaign_id = ?
                """,
                (campaign_id,),
            ).fetchone()
            rolls = conn.execute(
                """
                SELECT cr.id, cr.notation, cr.results, cr.total, cr.created_at, u.username
                FROM campaign_rolls cr
                JOIN users u ON u.id = cr.user_id
                WHERE cr.campaign_id = ?
                ORDER BY cr.id DESC
                LIMIT 30
                """,
                (campaign_id,),
            ).fetchall()
        try:
            token_positions = json.loads(board["token_positions"]) if board else {}
        except (json.JSONDecodeError, TypeError):
            token_positions = {}
        try:
            board_state = clean_board_state(json.loads(board["board_state"])) if board else clean_board_state({})
        except (json.JSONDecodeError, TypeError):
            board_state = clean_board_state({})
        map_image = board["map_image"] if board else ""
        if map_image and (
            not board_state["grid"]["width"]
            or not board_state["grid"]["height"]
        ):
            board_state["grid"]["width"] = 24
            board_state["grid"]["height"] = 14
        self.send_json(
            200,
            {
                "map_image": map_image,
                "token_positions": token_positions,
                "board_state": board_state,
                "updated_at": board["updated_at"] if board else None,
                "rolls": [
                    {
                        "id": row["id"],
                        "notation": row["notation"],
                        "results": json.loads(row["results"]),
                        "total": row["total"],
                        "created_at": row["created_at"],
                        "username": row["username"],
                    }
                    for row in rolls
                ],
            },
        )

    def update_campaign_board(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        campaign_id = path.strip("/").split("/")[1]
        payload = self.read_json()
        now = int(time.time())
        with db() as conn:
            campaign = self.campaign_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(404, {"detail": "Campanha não encontrada"})
            is_owner = (
                campaign["owner_id"] == user_id
                or self.is_superadmin(conn, user_id)
            )
            current = conn.execute(
                "SELECT map_image, token_positions, board_state FROM campaign_boards WHERE campaign_id = ?",
                (campaign_id,),
            ).fetchone()
            map_image = current["map_image"] if current else ""
            try:
                positions = json.loads(current["token_positions"]) if current else {}
            except (json.JSONDecodeError, TypeError):
                positions = {}
            try:
                current_board_state = (
                    clean_board_state(json.loads(current["board_state"])) if current else clean_board_state({})
                )
            except (json.JSONDecodeError, TypeError):
                current_board_state = clean_board_state({})

            character_rows = conn.execute(
                """
                SELECT ch.id, ch.user_id
                FROM campaign_characters cc
                JOIN characters ch ON ch.id = cc.character_id
                WHERE cc.campaign_id = ?
                """,
                (campaign_id,),
            ).fetchall()
            character_owners = {str(row["id"]): row["user_id"] for row in character_rows}
            enemy_ids = {
                f"enemy:{row['id']}"
                for row in conn.execute(
                    "SELECT id FROM campaign_enemies WHERE campaign_id = ?",
                    (campaign_id,),
                ).fetchall()
            }
            valid_token_ids = set(character_owners) | enemy_ids
            board_state = clean_board_state(
                payload.get("board_state", {}),
                current_board_state,
                valid_token_ids,
            )
            if "board_state" in payload and not is_owner:
                return self.send_json(403, {"detail": "Apenas o mestre altera as regras da mesa"})

            if "map_image" in payload:
                if not is_owner:
                    return self.send_json(403, {"detail": "Apenas o mestre altera o mapa"})
                candidate = str(payload.get("map_image") or "")
                if len(candidate) > 4_500_000:
                    return self.send_json(413, {"detail": "Mapa muito grande"})
                if candidate and not re.match(r"^data:image/(?:png|jpeg|webp);base64,", candidate):
                    return self.send_json(400, {"detail": "Formato de mapa inválido"})
                map_image = candidate

            if map_image and (
                not board_state["grid"]["width"]
                or not board_state["grid"]["height"]
            ):
                board_state["grid"]["width"] = 24
                board_state["grid"]["height"] = 14

            submitted_positions = payload.get("token_positions")
            if isinstance(submitted_positions, dict):
                for character_id, position in submitted_positions.items():
                    character_id = str(character_id)
                    is_enemy = character_id in enemy_ids
                    if character_id not in character_owners and not is_enemy:
                        continue
                    if not is_owner and (is_enemy or character_owners[character_id] != user_id):
                        continue
                    if not isinstance(position, dict):
                        continue
                    try:
                        x = float(position.get("x"))
                        y = float(position.get("y"))
                    except (TypeError, ValueError):
                        continue
                    if not math.isfinite(x) or not math.isfinite(y):
                        continue
                    candidate = {
                        "x": round(min(100, max(0, x)), 3),
                        "y": round(min(100, max(0, y)), 3),
                    }
                    if board_path_is_blocked(positions.get(character_id), candidate, board_state):
                        continue
                    grid = board_state.get("grid", {})
                    grid_width = int(grid.get("width", 0))
                    grid_height = int(grid.get("height", 0))
                    if board_state.get("physics_enabled") and grid_width and grid_height:
                        candidate_cell = (
                            min(grid_width - 1, int(candidate["x"] / 100 * grid_width)),
                            min(grid_height - 1, int(candidate["y"] / 100 * grid_height)),
                        )
                        occupied = False
                        for other_id, other_position in positions.items():
                            if other_id == character_id or not isinstance(other_position, dict):
                                continue
                            try:
                                other_cell = (
                                    min(grid_width - 1, int(float(other_position["x"]) / 100 * grid_width)),
                                    min(grid_height - 1, int(float(other_position["y"]) / 100 * grid_height)),
                                )
                            except (KeyError, TypeError, ValueError):
                                continue
                            if other_cell == candidate_cell:
                                occupied = True
                                break
                        if occupied:
                            continue
                    positions[character_id] = candidate

            if board_state.get("fog_enabled"):
                explored = set(board_state.get("explored", []))
                explored.update(
                    board_visible_cells(
                        board_state,
                        positions,
                        set(character_owners),
                    )
                )
                board_state["explored"] = sorted(explored)[:1200]

            encoded_positions = json.dumps(positions, separators=(",", ":"))
            encoded_board_state = json.dumps(board_state, separators=(",", ":"))
            cursor = conn.execute(
                """
                UPDATE campaign_boards
                SET map_image = ?, token_positions = ?, board_state = ?, updated_at = ?, updated_by = ?
                WHERE campaign_id = ?
                """,
                (map_image, encoded_positions, encoded_board_state, now, user_id, campaign_id),
            )
            if cursor.rowcount == 0:
                conn.execute(
                    """
                    INSERT INTO campaign_boards
                        (campaign_id, map_image, token_positions, board_state, updated_at, updated_by)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (campaign_id, map_image, encoded_positions, encoded_board_state, now, user_id),
                )
        broadcast_board_event(
            campaign_id,
            {
                "type": "board_updated",
                "updated_at": now,
                "updated_by": user_id,
            },
        )
        self.send_json(
            200,
            {
                "map_image": map_image,
                "token_positions": positions,
                "board_state": board_state,
                "updated_at": now,
            },
        )

    def roll_campaign_dice(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        campaign_id = path.strip("/").split("/")[1]
        payload = self.read_json()
        try:
            sides = int(payload.get("sides"))
            quantity = int(payload.get("quantity", 1))
        except (TypeError, ValueError):
            return self.send_json(400, {"detail": "Dados inválidos"})
        if sides not in {4, 6, 8, 10, 12, 20, 100} or not 1 <= quantity <= 20:
            return self.send_json(400, {"detail": "Dados inválidos"})
        results = [secrets.randbelow(sides) + 1 for _ in range(quantity)]
        total = sum(results)
        notation = f"{quantity}d{sides}"
        now = int(time.time())
        with db() as conn:
            campaign = self.campaign_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(404, {"detail": "Campanha não encontrada"})
            username = conn.execute("SELECT username FROM users WHERE id = ?", (user_id,)).fetchone()["username"]
            cursor = conn.execute(
                """
                INSERT INTO campaign_rolls
                    (campaign_id, user_id, notation, results, total, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (campaign_id, user_id, notation, json.dumps(results), total, now),
            )
            conn.execute(
                """
                DELETE FROM campaign_rolls
                WHERE campaign_id = ? AND id NOT IN (
                    SELECT id FROM campaign_rolls
                    WHERE campaign_id = ?
                    ORDER BY id DESC
                    LIMIT 50
                )
                """,
                (campaign_id, campaign_id),
            )
        response = {
            "id": cursor.lastrowid,
            "notation": notation,
            "results": results,
            "total": total,
            "created_at": now,
            "username": username,
        }
        broadcast_board_event(campaign_id, {"type": "dice_roll", "roll": response})
        self.send_json(200, response)

    def update_campaign_diary(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        campaign_id = path.strip("/").split("/")[1]
        content = str(self.read_json().get("content", ""))[:12000]
        now = int(time.time())
        with db() as conn:
            campaign = self.campaign_manage_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(404, {"detail": "Campanha não encontrada"})
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
            return self.send_json(401, {"detail": "Login necessário"})
        campaign_id = path.strip("/").split("/")[1]
        payload = self.read_json()
        name = str(payload.get("name", "")).strip()[:120]
        description = str(payload.get("description", "")).strip()[:2000]
        if not name:
            return self.send_json(400, {"detail": "Nome obrigatório"})
        with db() as conn:
            campaign = self.campaign_manage_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(404, {"detail": "Campanha não encontrada"})
            cursor = conn.execute(
                "UPDATE campaigns SET name = ?, description = ?, updated_at = ? WHERE id = ?",
                (name, description, int(time.time()), campaign_id),
            )
        if cursor.rowcount == 0:
            return self.send_json(404, {"detail": "Campanha não encontrada"})
        self.send_json(200, {"id": int(campaign_id), "name": name})

    def delete_campaign(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        campaign_id = path.strip("/").split("/")[1]
        with db() as conn:
            campaign = self.campaign_manage_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(404, {"detail": "Campanha não encontrada"})
            delete_campaign_records(conn, campaign_id)
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
            return self.send_json(404, {"detail": "Convite inválido"})
        self.send_json(200, dict(campaign))

    def join_campaign(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        code = path.rsplit("/", 1)[-1]
        with db() as conn:
            campaign = conn.execute("SELECT id FROM campaigns WHERE invite_code = ?", (code,)).fetchone()
            if not campaign:
                return self.send_json(404, {"detail": "Convite inválido"})
            conn.execute(
                "INSERT OR IGNORE INTO campaign_members (campaign_id, user_id, joined_at) VALUES (?, ?, ?)",
                (campaign["id"], user_id, int(time.time())),
            )
        self.send_json(200, {"id": campaign["id"], "joined": True})

    def add_campaign_character(self, path: str) -> None:
        user_id = self.user_id()
        if not user_id:
            return self.send_json(401, {"detail": "Login necessário"})
        campaign_id = path.strip("/").split("/")[1]
        character_id = str(self.read_json().get("character_id", ""))
        with db() as conn:
            campaign = self.campaign_access(conn, campaign_id, user_id)
            superadmin = self.is_superadmin(conn, user_id)
            character = conn.execute(
                "SELECT id FROM characters WHERE id = ? AND (? OR user_id = ?)",
                (character_id, superadmin, user_id),
            ).fetchone()
            if not campaign:
                return self.send_json(404, {"detail": "Campanha não encontrada"})
            if not character:
                return self.send_json(404, {"detail": "Personagem não encontrado"})
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
            return self.send_json(401, {"detail": "Login necessário"})
        parts = path.strip("/").split("/")
        campaign_id, character_id = parts[1], parts[3]
        with db() as conn:
            campaign = self.campaign_access(conn, campaign_id, user_id)
            if not campaign:
                return self.send_json(404, {"detail": "Campanha não encontrada"})
            if self.campaign_manage_access(conn, campaign_id, user_id):
                cursor = conn.execute(
                    "DELETE FROM campaign_characters WHERE campaign_id = ? AND character_id = ?",
                    (campaign_id, character_id),
                )
            else:
                cursor = conn.execute(
                    """
                    DELETE FROM campaign_characters
                    WHERE campaign_id = ? AND character_id = ? AND added_by = ?
                    """,
                    (campaign_id, character_id, user_id),
                )
        if cursor.rowcount == 0:
            return self.send_json(404, {"detail": "Ficha não encontrada na campanha"})
        self.send_json(200, {"deleted": True})


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", "8003"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Backend em http://0.0.0.0:{port}")
    server.serve_forever()
