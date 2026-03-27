import os
import json
import re
import logging

import httpx

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

FREE_MODELS = [
    "nvidia/nemotron-3-super-120b-a12b:free",
]

LANGUAGE_NAMES: dict[str, str] = {
    "it": "Italian",
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "pt": "Portuguese",
}

SYSTEM_PROMPT_TEMPLATE = """You are an expert writing humanizer. You rewrite AI-generated text to sound naturally human-written.

CRITICAL RULES:
- Respond ENTIRELY in {language_name}.
- Keep the original meaning and information intact.
- Make it sound like a real person wrote it: vary sentence length, use casual transitions, add minor imperfections.
- Remove AI-typical patterns: "furthermore", "it is important to note", "in conclusion", overly formal connectives.
- Break uniform sentence structures. Mix short punchy sentences with longer flowing ones.
- Use contractions, colloquial expressions, and natural phrasing.
- Output ONLY a JSON object with this exact format, nothing else:

{{
  "humanized_text": "the rewritten text in {language_name}",
  "changes_made": ["change 1 description in {language_name}", "change 2 description in {language_name}"]
}}
"""

USER_PROMPT_TEMPLATE = """Rewrite this text to sound naturally human-written. Keep the same meaning but make it sound like a real person wrote it.

Text to humanize:
{text}

The text is in {language_name}. Respond ENTIRELY in {language_name}."""


def _strip_thinking(text: str) -> str:
    return re.sub(r"<think>[\s\S]*?</think>", "", text).strip()


def _parse_response(content: str) -> dict | None:
    cleaned = _strip_thinking(content).strip()
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fence_match:
        cleaned = fence_match.group(1).strip()

    obj_match = re.search(r"\{[\s\S]*\}", cleaned)
    if obj_match:
        cleaned = obj_match.group(0)

    try:
        data = json.loads(cleaned)
        if isinstance(data, dict) and "humanized_text" in data:
            changes = data.get("changes_made", [])
            if not isinstance(changes, list):
                changes = []
            return {
                "humanized_text": str(data["humanized_text"]),
                "changes_made": [str(c) for c in changes[:10]],
            }
    except (json.JSONDecodeError, KeyError):
        pass
    return None


async def humanize_text(text: str, language: str) -> tuple[dict | None, bool]:
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key or api_key == "sk-or-v1-your-key-here":
        logger.warning("OpenRouter API key not configured")
        return None, False

    language_name = LANGUAGE_NAMES.get(language, "English")
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(language_name=language_name)
    user_prompt = USER_PROMPT_TEMPLATE.format(text=text[:5000], language_name=language_name)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://realtext.org",
        "X-Title": "RealText",
    }

    for model in FREE_MODELS:
        try:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.8,
                "max_tokens": 4096,
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(OPENROUTER_URL, json=payload, headers=headers)

            if response.status_code in (429, 500, 502, 503):
                logger.warning("Error %d on model %s", response.status_code, model)
                continue

            if response.status_code != 200:
                logger.warning("Status %d on model %s", response.status_code, model)
                continue

            data = response.json()
            content = data["choices"][0]["message"]["content"]
            parsed = _parse_response(content)

            if parsed:
                logger.info("Humanized with model %s", model)
                return parsed, True

            logger.warning("Failed to parse response from %s", model)

        except httpx.TimeoutException:
            logger.warning("Timeout on model %s", model)
        except Exception as e:
            logger.warning("Error on model %s: %s", model, e)

    return None, False
