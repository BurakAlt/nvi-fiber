#!/usr/bin/env python3
"""
Claude Code Telegram Notification Bridge
=========================================
Hook script that intercepts AskUserQuestion and permission prompts,
sends them to Telegram, and forwards responses back to Claude Code.

Supports multiple Claude Code terminals simultaneously.
Each terminal's questions are tagged with instance name.
Uses Telegram reply-to-message for routing answers to correct terminal.

Usage:
    python scripts/claude-telegram-hook.py --setup   # Auto-detect chat_id
    python scripts/claude-telegram-hook.py --test    # Verify connectivity
    (normal mode: called by Claude Code hooks, reads stdin JSON)

Environment variables:
    CLAUDE_INSTANCE  - Instance name shown in Telegram (e.g. OPUS, SONNET)
    TELEGRAM_BOT_TOKEN - Override bot token from config
    TELEGRAM_CHAT_ID   - Override chat_id from config

Zero external dependencies - Python stdlib only.
"""

import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Fix Windows console encoding (stdin + stdout + stderr)
if sys.platform == "win32":
    try:
        sys.stdin.reconfigure(encoding="utf-8")
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ─── CONFIG ─────────────────────────────────────────────────────────

CONFIG_PATH = Path(__file__).parent / "notify-config.json"
REPLIES_DIR = Path(__file__).parent / ".telegram-replies"

DEFAULT_CONFIG = {
    "telegram_token": "",
    "chat_id": "",
    "timeout_seconds": 300,
    "sound_enabled": True,
    "poll_interval": 3,
    "remote_mode": False,
}

INSTANCE_ICONS = {
    "opus": "\U0001f7e3",      # purple circle
    "sonnet": "\U0001f535",    # blue circle
    "haiku": "\U0001f7e2",     # green circle
}


def get_instance_name():
    """Detect Claude instance name from environment."""
    # Explicit instance name
    name = os.environ.get("CLAUDE_INSTANCE", "")
    if name:
        return name.upper()

    # Try model env var
    model = os.environ.get("CLAUDE_MODEL", "")
    if model:
        for key in ("opus", "sonnet", "haiku"):
            if key in model.lower():
                return key.upper()

    return ""


def get_instance_icon(name):
    """Get emoji icon for instance name."""
    for key, icon in INSTANCE_ICONS.items():
        if key in name.lower():
            return icon
    return "\u26aa"  # white circle


def load_config():
    """Load config from notify-config.json with env var overrides."""
    config = dict(DEFAULT_CONFIG)

    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                file_config = json.load(f)
                config.update(file_config)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Config read error: {e}", file=sys.stderr)

    # Env var overrides
    config["telegram_token"] = os.environ.get(
        "TELEGRAM_BOT_TOKEN", config["telegram_token"]
    )
    config["chat_id"] = str(
        os.environ.get("TELEGRAM_CHAT_ID", config["chat_id"])
    )

    return config


def validate_config(config):
    """Check required fields. Returns True if valid, False otherwise."""
    if not config.get("telegram_token"):
        print(
            "ERROR: Telegram token not configured.\n"
            "Create scripts/notify-config.json or set TELEGRAM_BOT_TOKEN env var.\n"
            "Run: python scripts/claude-telegram-hook.py --setup",
            file=sys.stderr,
        )
        return False
    if not config.get("chat_id"):
        print(
            "ERROR: Chat ID not configured.\n"
            "Run: python scripts/claude-telegram-hook.py --setup",
            file=sys.stderr,
        )
        return False
    return True


def save_config(config):
    """Save config to notify-config.json."""
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


# ─── TELEGRAM API ───────────────────────────────────────────────────

def telegram_api(token, method, params=None):
    """Call Telegram Bot API with URL-encoded params. Returns parsed JSON or None."""
    url = f"https://api.telegram.org/bot{token}/{method}"
    data = urllib.parse.urlencode(params or {}).encode("utf-8")

    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, data=data)

    try:
        with urllib.request.urlopen(req, timeout=35, context=ctx) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print("Telegram API: Invalid bot token (401 Unauthorized)", file=sys.stderr)
        else:
            print(f"Telegram API HTTP error: {e.code}", file=sys.stderr)
    except urllib.error.URLError as e:
        print(f"Telegram API network error: {e.reason}", file=sys.stderr)
    except Exception as e:
        print(f"Telegram API error: {e}", file=sys.stderr)

    return None


def telegram_api_json(token, method, payload):
    """Call Telegram Bot API with JSON body (needed for inline_keyboard)."""
    url = f"https://api.telegram.org/bot{token}/{method}"
    body = json.dumps(payload).encode("utf-8")

    ctx = ssl.create_default_context()
    req = urllib.request.Request(
        url, data=body,
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(req, timeout=35, context=ctx) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 401:
            print("Telegram API: Invalid bot token (401 Unauthorized)", file=sys.stderr)
        else:
            print(f"Telegram API HTTP error: {e.code}", file=sys.stderr)
    except urllib.error.URLError as e:
        print(f"Telegram API network error: {e.reason}", file=sys.stderr)
    except Exception as e:
        print(f"Telegram API error: {e}", file=sys.stderr)

    return None


def build_option_keyboard(options):
    """
    Build Telegram inline_keyboard from AskUserQuestion options.
    Each option becomes a button. "Diger" button appended at the end.
    callback_data: "opt:INDEX" for options, "other" for free text.
    """
    keyboard = []
    for i, opt in enumerate(options):
        label = opt.get("label", str(opt)) if isinstance(opt, dict) else str(opt)
        # Telegram button text max 64 bytes — truncate if needed
        if len(label.encode("utf-8")) > 60:
            label = label[:25] + "..."
        keyboard.append([{"text": label, "callback_data": f"opt:{i}"}])

    # "Other" button for free text input
    keyboard.append([{"text": "\u270f\ufe0f Diger (metin yaz)", "callback_data": "other"}])
    return keyboard


def answer_callback_query(token, query_id, text=""):
    """Answer a callback_query to dismiss the loading spinner on button."""
    params = {"callback_query_id": query_id}
    if text:
        params["text"] = text
    telegram_api(token, "answerCallbackQuery", params)


def edit_message_text(config, msg_id, text, remove_keyboard=True):
    """Edit an existing message. Optionally remove inline keyboard."""
    payload = {
        "chat_id": config["chat_id"],
        "message_id": msg_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    if remove_keyboard:
        payload["reply_markup"] = {"inline_keyboard": []}
    return telegram_api_json(config["telegram_token"], "editMessageText", payload)


def send_message(config, text, parse_mode="HTML", force_reply=False, inline_keyboard=None):
    """Send message to Telegram. Returns message_id or None.

    inline_keyboard: list of button rows for InlineKeyboardMarkup.
                     Mutually exclusive with force_reply.
    """
    if inline_keyboard:
        # Use JSON API for inline keyboard
        payload = {
            "chat_id": config["chat_id"],
            "text": text,
            "parse_mode": parse_mode,
            "disable_web_page_preview": True,
            "reply_markup": {"inline_keyboard": inline_keyboard},
        }
        result = telegram_api_json(config["telegram_token"], "sendMessage", payload)
    else:
        params = {
            "chat_id": config["chat_id"],
            "text": text,
            "parse_mode": parse_mode,
            "disable_web_page_preview": "true",
        }
        if force_reply:
            params["reply_markup"] = json.dumps({
                "force_reply": True,
                "selective": True,
                "input_field_placeholder": "Yanit yazin...",
            })
        result = telegram_api(config["telegram_token"], "sendMessage", params)

    if result and result.get("ok"):
        return result["result"]["message_id"]
    return None


def poll_for_reply(config, timeout_seconds, reply_to_msg_id=None):
    """
    Long-poll Telegram for a reply from the configured chat.
    Handles both callback_query (inline button clicks) and text messages.

    Returns (answer_text, was_callback) tuple, or (None, False) on timeout.

    Multi-instance support:
    - callback_query: routed by message_id the button belongs to.
    - text reply: routed by reply_to_message.message_id.
    - Replies to OTHER messages saved to .telegram-replies/ for other terminals.
    """
    token = config["telegram_token"]
    chat_id = str(config["chat_id"])
    deadline = time.time() + timeout_seconds

    # Get current offset (skip old messages)
    initial = telegram_api(token, "getUpdates", {"offset": -1, "limit": 1})
    if initial and initial.get("ok") and initial.get("result"):
        offset = initial["result"][-1]["update_id"] + 1
    else:
        offset = 0

    while time.time() < deadline:
        remaining = deadline - time.time()
        if remaining <= 0:
            break

        # Check for reply file from another instance
        if reply_to_msg_id:
            reply_file = REPLIES_DIR / f"{reply_to_msg_id}.txt"
            if reply_file.exists():
                try:
                    text = reply_file.read_text(encoding="utf-8").strip()
                    reply_file.unlink(missing_ok=True)
                    if text:
                        return (text, False)
                except (IOError, OSError):
                    pass

        poll_timeout = min(30, max(1, int(remaining)))

        result = telegram_api(token, "getUpdates", {
            "offset": offset,
            "limit": 10,
            "timeout": poll_timeout,
        })

        if not result or not result.get("ok"):
            time.sleep(config.get("poll_interval", 3))
            continue

        for update in result.get("result", []):
            offset = update["update_id"] + 1

            # ── Handle callback_query (inline button click) ──
            cbq = update.get("callback_query")
            if cbq:
                cb_chat_id = str(cbq.get("message", {}).get("chat", {}).get("id", ""))
                if cb_chat_id != chat_id:
                    continue

                cb_msg_id = cbq.get("message", {}).get("message_id")
                cb_data = cbq.get("data", "")
                query_id = cbq.get("id", "")

                # Route by message_id
                if reply_to_msg_id and cb_msg_id != reply_to_msg_id:
                    # Button on another terminal's message — save for them
                    REPLIES_DIR.mkdir(parents=True, exist_ok=True)
                    rfile = REPLIES_DIR / f"{cb_msg_id}.txt"
                    try:
                        rfile.write_text(f"cb:{cb_data}", encoding="utf-8")
                    except (IOError, OSError):
                        pass
                    answer_callback_query(token, query_id)
                    continue

                # Our message's button was clicked
                answer_callback_query(token, query_id, "\u2705")
                return (cb_data, True)

            # ── Handle text message ──
            msg = update.get("message", {})
            if str(msg.get("chat", {}).get("id")) != chat_id:
                continue
            if "text" not in msg:
                continue

            text = msg["text"].strip()
            if text.startswith("/"):
                continue

            # Check if reply to specific message
            reply_to = msg.get("reply_to_message", {})
            replied_msg_id = reply_to.get("message_id")

            if reply_to_msg_id and replied_msg_id:
                if replied_msg_id == reply_to_msg_id:
                    return (text, False)
                else:
                    # Reply to ANOTHER terminal's question
                    REPLIES_DIR.mkdir(parents=True, exist_ok=True)
                    rfile = REPLIES_DIR / f"{replied_msg_id}.txt"
                    try:
                        rfile.write_text(text, encoding="utf-8")
                    except (IOError, OSError):
                        pass
                    continue

            # Non-reply message — accept as fallback
            return (text, False)

    return (None, False)


# ─── SOUND ──────────────────────────────────────────────────────────

def play_sound(config):
    """Play system alert sound if enabled."""
    if not config.get("sound_enabled", True):
        return

    try:
        if sys.platform == "win32":
            import winsound
            winsound.MessageBeep(winsound.MB_ICONEXCLAMATION)
        elif sys.platform == "darwin":
            os.system("afplay /System/Library/Sounds/Glass.aiff &")
        else:
            os.system(
                "paplay /usr/share/sounds/freedesktop/stereo/message.oga 2>/dev/null || "
                "aplay /usr/share/sounds/alsa/Front_Center.wav 2>/dev/null &"
            )
    except Exception:
        pass


# ─── MESSAGE FORMATTING ────────────────────────────────────────────

def format_ask_question(tool_input, instance_name="", use_buttons=False):
    """Format AskUserQuestion tool_input for Telegram (HTML).

    use_buttons: if True, omit numbered list and reply instructions
                 (inline keyboard will be attached separately).
    """
    questions = tool_input.get("questions", [])

    # Header with instance name
    if instance_name:
        icon = get_instance_icon(instance_name)
        title = f"{icon} CLAUDE {instance_name}"
    else:
        title = "CLAUDE CODE"

    if not questions:
        return f"<b>{title} — SORU</b>\n\nClaude girdi bekliyor."

    parts = []
    for q in questions:
        question_text = q.get("question", "?")
        options = q.get("options", [])
        header = q.get("header", "")

        parts.append(f"<b>{title} — SORU</b>")
        if header:
            parts.append(f"<i>[{header}]</i>")
        parts.append("")
        parts.append(f"{question_text}")

        if options and not use_buttons:
            # Fallback numbered list (when buttons aren't used)
            parts.append("")
            for i, opt in enumerate(options, 1):
                label = opt.get("label", str(opt)) if isinstance(opt, dict) else str(opt)
                desc = opt.get("description", "") if isinstance(opt, dict) else ""
                line = f"  <b>{i}.</b> {label}"
                if desc:
                    line += f" — <i>{desc}</i>"
                parts.append(line)

        if options and use_buttons:
            # Show descriptions under the question for context
            has_desc = any(
                (opt.get("description") if isinstance(opt, dict) else "")
                for opt in options
            )
            if has_desc:
                parts.append("")
                for opt in options:
                    if not isinstance(opt, dict):
                        continue
                    label = opt.get("label", "")
                    desc = opt.get("description", "")
                    if desc:
                        parts.append(f"\u2022 <b>{label}</b> — <i>{desc}</i>")

        if not use_buttons:
            parts.append("")
            parts.append("<i>Bu mesaji KAYDIRARAK YANITLAYIN</i>")
            parts.append("<i>(numara veya metin yazin)</i>")

    return "\n".join(parts)


def format_permission(hook_input, instance_name=""):
    """Format a permission_prompt notification for Telegram."""
    message = hook_input.get("message", "Claude izin bekliyor.")
    title_text = hook_input.get("title", "")

    if instance_name:
        icon = get_instance_icon(instance_name)
        title = f"{icon} CLAUDE {instance_name} — IZIN"
    else:
        title = "CLAUDE CODE — IZIN"

    parts = [f"<b>{title}</b>"]
    if title_text:
        parts.append(f"<i>{title_text}</i>")
    parts.append("")
    parts.append(message)
    parts.append("")
    parts.append("Terminal'den onaylayin.")

    return "\n".join(parts)


# ─── REPLY PARSING ──────────────────────────────────────────────────

def parse_reply(reply_text, options):
    """
    Map Telegram reply to an option label.
    If user sends a number, map to the corresponding option.
    Otherwise, try to match option labels, then return raw text.
    """
    reply_text = reply_text.strip()

    if options:
        # Try numeric selection
        try:
            idx = int(reply_text) - 1
            if 0 <= idx < len(options):
                opt = options[idx]
                return opt.get("label", str(opt)) if isinstance(opt, dict) else str(opt)
        except ValueError:
            pass

        # Try label match (case-insensitive)
        for opt in options:
            label = opt.get("label", str(opt)) if isinstance(opt, dict) else str(opt)
            if reply_text.lower() == label.lower():
                return label

    return reply_text


# ─── HOOK HANDLERS ──────────────────────────────────────────────────

def handle_ask_user_question(config, hook_input):
    """
    PreToolUse handler for AskUserQuestion.

    remote_mode=false: Send notification + sound, let question appear in terminal.
    remote_mode=true:  Send with inline keyboard buttons, wait for click/reply,
                       inject answer as hook feedback.
    """
    tool_input = hook_input.get("tool_input", {})
    instance_name = get_instance_name()

    # Play sound
    play_sound(config)

    # Collect all options across questions
    questions = tool_input.get("questions", [])
    all_options = []
    for q in questions:
        all_options.extend(q.get("options", []))

    has_options = len(all_options) > 0
    remote = config.get("remote_mode", False)

    if not remote:
        # Local mode: just notify, question appears in terminal normally
        telegram_msg = format_ask_question(tool_input, instance_name, use_buttons=False)
        telegram_msg += "\n\n<i>(Terminal modu \u2014 terminal'den yanit verin)</i>"
        send_message(config, telegram_msg)
        sys.exit(0)

    # Remote mode: send with inline keyboard if options exist
    if has_options:
        telegram_msg = format_ask_question(tool_input, instance_name, use_buttons=True)
        keyboard = build_option_keyboard(all_options)
        msg_id = send_message(config, telegram_msg, inline_keyboard=keyboard)
    else:
        telegram_msg = format_ask_question(tool_input, instance_name, use_buttons=False)
        msg_id = send_message(config, telegram_msg, force_reply=True)

    if not msg_id:
        # Telegram send failed — fall through to terminal
        sys.exit(0)

    # Poll for reply (with reply-to routing for multi-instance)
    timeout = config.get("timeout_seconds", 300)
    reply_text, was_callback = poll_for_reply(config, timeout, reply_to_msg_id=msg_id)

    if reply_text is None:
        # Timeout — remove buttons and notify
        instance_tag = f" ({instance_name})" if instance_name else ""
        if has_options:
            edit_message_text(
                config, msg_id,
                telegram_msg + f"\n\n<i>\u23f0 Timeout{instance_tag}</i>",
            )
        else:
            send_message(config, f"\u23f0 Timeout{instance_tag} \u2014 soru terminal'de gorunecek.")
        sys.exit(0)

    # Process the reply
    if was_callback:
        # Inline button was clicked
        if reply_text == "other":
            # "Diger" button — wait for free text
            edit_message_text(
                config, msg_id,
                telegram_msg + "\n\n<i>\u270f\ufe0f Metin bekleniyor...</i>",
            )
            text_reply, _ = poll_for_reply(config, timeout, reply_to_msg_id=msg_id)
            if text_reply is None:
                instance_tag = f" ({instance_name})" if instance_name else ""
                edit_message_text(
                    config, msg_id,
                    telegram_msg + f"\n\n<i>\u23f0 Timeout{instance_tag}</i>",
                )
                sys.exit(0)
            answer = text_reply
        elif reply_text.startswith("opt:"):
            # Option button — extract label from index
            try:
                idx = int(reply_text.split(":")[1])
                opt = all_options[idx]
                answer = opt.get("label", str(opt)) if isinstance(opt, dict) else str(opt)
            except (ValueError, IndexError):
                answer = reply_text
        else:
            answer = reply_text
    else:
        # Text message reply — parse as before
        answer = parse_reply(reply_text, all_options)

    # Update the original message: remove buttons, show selection
    instance_tag = f" ({instance_name})" if instance_name else ""
    edit_message_text(
        config, msg_id,
        telegram_msg + f"\n\n\u2705 <b>Yanit{instance_tag}:</b> {answer}",
    )

    # Deny the AskUserQuestion and provide answer as feedback
    output = {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": (
                f"User answered via Telegram: {answer}"
            ),
        }
    }
    print(json.dumps(output))
    sys.exit(0)


def handle_notification(config, hook_input):
    """
    Notification handler for permission_prompt.
    One-way: send to Telegram + play sound.
    """
    instance_name = get_instance_name()
    play_sound(config)
    telegram_msg = format_permission(hook_input, instance_name)
    send_message(config, telegram_msg)
    sys.exit(0)


# ─── SETUP & TEST ──────────────────────────────────────────────────

def setup_mode():
    """Interactive setup: detect chat_id from incoming Telegram message."""
    print("=" * 50)
    print("  Claude Code Telegram Hook - Setup")
    print("=" * 50)
    print()

    config = load_config()
    token = config.get("telegram_token", "")

    if not token:
        token = input("Telegram Bot Token girin: ").strip()
        if not token:
            print("ERROR: Token gerekli.")
            sys.exit(1)

    # Verify token
    me = telegram_api(token, "getMe")
    if not me or not me.get("ok"):
        print("ERROR: Gecersiz bot token.")
        sys.exit(1)

    bot_name = me["result"].get("username", "?")
    print(f"  Bot: @{bot_name}")
    print()
    print(f"  Telegram'da @{bot_name} botuna herhangi bir mesaj gonderin...")
    print("  Bekleniyor (120 saniye)...")
    print()

    # Clear old updates
    telegram_api(token, "getUpdates", {"offset": -1, "limit": 1})

    deadline = time.time() + 120
    offset = 0

    # Get initial offset
    initial = telegram_api(token, "getUpdates", {"offset": -1, "limit": 1})
    if initial and initial.get("ok") and initial.get("result"):
        offset = initial["result"][-1]["update_id"] + 1

    while time.time() < deadline:
        remaining = deadline - time.time()
        poll_timeout = min(10, max(1, int(remaining)))

        result = telegram_api(token, "getUpdates", {
            "offset": offset,
            "limit": 10,
            "timeout": poll_timeout,
        })

        if not result or not result.get("ok"):
            continue

        for update in result.get("result", []):
            offset = update["update_id"] + 1
            msg = update.get("message", {})
            chat = msg.get("chat", {})
            chat_id = chat.get("id")

            if chat_id:
                first_name = chat.get("first_name", "")
                last_name = chat.get("last_name", "")
                username = chat.get("username", "")

                print(f"  Chat ID tespit edildi: {chat_id}")
                print(f"  Kullanici: {first_name} {last_name} (@{username})")

                # Save config
                new_config = {
                    "telegram_token": token,
                    "chat_id": str(chat_id),
                    "timeout_seconds": 300,
                    "sound_enabled": True,
                    "poll_interval": 3,
                    "remote_mode": True,
                }
                save_config(new_config)
                print(f"\n  Config kaydedildi: {CONFIG_PATH}")

                # Send confirmation
                send_message(
                    new_config,
                    "<b>Claude Code Hook Baglandi!</b>\n\n"
                    "Claude soru sordugunda buradan bildirim alacaksiniz.\n"
                    "Secenekli sorularda butonlara tiklayarak yanitlayin.\n"
                    "Serbest metin sorularinda mesaji KAYDIRARAK yanitlayin.\n"
                    "Yanitlariniz otomatik olarak Claude'a iletilecek.",
                )
                print("  Onay mesaji gonderildi.")
                print("\n  Setup tamamlandi!")
                return

    print("\n  Timeout: Mesaj alinamadi. Tekrar deneyin.")
    sys.exit(1)


def test_mode():
    """Send test message with inline keyboard and verify communication."""
    print("=" * 50)
    print("  Claude Code Telegram Hook - Test")
    print("=" * 50)
    print()

    instance_name = get_instance_name()
    instance_tag = f" ({instance_name})" if instance_name else ""
    print(f"  Instance: {instance_name or '(tanimlanmadi)'}")
    print()

    config = load_config()
    if not validate_config(config):
        sys.exit(1)

    # Test sound
    print("  [1/3] Ses testi...")
    play_sound(config)
    print("        Ses calindi.")

    # Test send with inline keyboard
    print("  [2/3] Inline keyboard testi...")

    if instance_name:
        icon = get_instance_icon(instance_name)
        title = f"{icon} CLAUDE {instance_name} \u2014 TEST"
    else:
        title = "CLAUDE CODE \u2014 TEST"

    test_options = [
        {"label": "Evet", "description": "Devam et"},
        {"label": "Hayir", "description": "Iptal et"},
        {"label": "Bekle", "description": "Sonra karar ver"},
    ]
    keyboard = build_option_keyboard(test_options)

    test_text = (
        f"<b>{title}</b>\n\n"
        f"Inline keyboard testi{instance_tag}.\n"
        "Asagidaki butonlardan birini tiklayin:"
    )
    msg_id = send_message(config, test_text, inline_keyboard=keyboard)

    if msg_id:
        print(f"        Mesaj gonderildi (ID: {msg_id})")
    else:
        print("        HATA: Mesaj gonderilemedi!")
        sys.exit(1)

    # Test receive (callback or text)
    print("  [3/3] Yanit bekleniyor (30 saniye)...")
    print("        Buton tiklayin veya metin yazin.")
    reply_text, was_callback = poll_for_reply(config, 30, reply_to_msg_id=msg_id)

    if reply_text is not None:
        if was_callback and reply_text.startswith("opt:"):
            try:
                idx = int(reply_text.split(":")[1])
                label = test_options[idx]["label"]
            except (ValueError, IndexError):
                label = reply_text
            print(f"        Buton tiklandi: {label}")
            answer = label
        elif was_callback and reply_text == "other":
            print("        'Diger' tiklandi, metin bekleniyor (15 sn)...")
            edit_message_text(
                config, msg_id,
                test_text + "\n\n<i>\u270f\ufe0f Metin bekleniyor...</i>",
            )
            text_reply, _ = poll_for_reply(config, 15, reply_to_msg_id=msg_id)
            if text_reply:
                print(f"        Metin alindi: {text_reply}")
                answer = text_reply
            else:
                print("        Metin alinamadi.")
                answer = "(timeout)"
        else:
            print(f"        Metin yaniti: {reply_text}")
            answer = reply_text

        edit_message_text(
            config, msg_id,
            test_text + f"\n\n\u2705 <b>Yanit:</b> {answer}",
        )
        print("\n  Cift yonlu iletisim dogrulandi!")
    else:
        edit_message_text(
            config, msg_id,
            test_text + "\n\n<i>\u23f0 Timeout</i>",
        )
        print("        Yanit alinamadi (tek yonlu bildirim calisiyor)")

    print("\n  Test tamamlandi.")


# ─── MAIN ───────────────────────────────────────────────────────────

def main():
    # CLI modes
    if "--setup" in sys.argv:
        setup_mode()
        return

    if "--test" in sys.argv:
        test_mode()
        return

    # Normal hook mode: read stdin JSON
    config = load_config()
    if not validate_config(config):
        sys.exit(0)  # Non-blocking: let Claude proceed

    try:
        raw = sys.stdin.read()
        hook_input = json.loads(raw)
    except (json.JSONDecodeError, IOError) as e:
        print(f"stdin JSON parse error: {e}", file=sys.stderr)
        sys.exit(0)

    event = hook_input.get("hook_event_name", "")
    tool_name = hook_input.get("tool_name", "")

    if event == "PreToolUse" and tool_name == "AskUserQuestion":
        handle_ask_user_question(config, hook_input)
    elif event == "Notification":
        handle_notification(config, hook_input)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
