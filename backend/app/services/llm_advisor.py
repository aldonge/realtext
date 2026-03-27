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

SYSTEM_PROMPT_TEMPLATE = """You are a writing style analyst. You receive a text and its algorithmic analysis metrics.
Your job: provide 3-5 specific, actionable suggestions to make the text sound more naturally human-written.

CRITICAL RULES:
- Respond ENTIRELY in {language_name} (the language of the text).
- Each suggestion must reference a SPECIFIC sentence or phrase from the text.
- Each suggestion must explain WHY it sounds AI-generated.
- Each suggestion must provide a CONCRETE rewritten alternative.
- Format your response as a JSON array. ONLY output the JSON array, nothing else.

JSON format:
[
  {{
    "paragraph_index": 0,
    "original_excerpt": "exact quote from text",
    "issue": "explanation of the problem in {language_name}",
    "suggestion": "concrete rewrite suggestion in {language_name}",
    "impact": "high|medium|low"
  }}
]
"""

USER_PROMPT_TEMPLATE = """Analyze this text and provide suggestions:

Text: {text}

Algorithmic analysis results:
- Burstiness score: {burstiness}/100 (low = too uniform sentence length, AI-like)
- Lexical diversity: {lexical_diversity}/100 (low = repetitive vocabulary)
- Sentence length variance: {slv}/100 (low = uniform, AI-like)
- Repetition patterns: {repetition_score}/100 (low = many repeated patterns)

The text is in {language_name}. Respond ENTIRELY in {language_name}."""


def _strip_thinking(text: str) -> str:
    return re.sub(r"<think>[\s\S]*?</think>", "", text).strip()


def _parse_json_response(content: str) -> list[dict]:
    cleaned = _strip_thinking(content).strip()
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", cleaned)
    if fence_match:
        cleaned = fence_match.group(1).strip()

    arr_match = re.search(r"\[[\s\S]*\]", cleaned)
    if arr_match:
        cleaned = arr_match.group(0)

    suggestions = json.loads(cleaned)
    if not isinstance(suggestions, list):
        return []

    validated: list[dict] = []
    for item in suggestions:
        if not isinstance(item, dict):
            continue
        impact = item.get("impact", "medium")
        if impact not in ("high", "medium", "low"):
            impact = "medium"
        validated.append({
            "paragraph_index": int(item.get("paragraph_index", 0)),
            "original_excerpt": str(item.get("original_excerpt", "")),
            "issue": str(item.get("issue", "")),
            "suggestion": str(item.get("suggestion", "")),
            "impact": impact,
        })
    return validated


async def get_llm_suggestions(
    text: str,
    language: str,
    metrics: dict,
) -> tuple[list[dict], bool]:
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key or api_key == "sk-or-v1-your-key-here":
        logger.warning("OpenRouter API key not configured")
        return [], False

    language_name = LANGUAGE_NAMES.get(language, "English")
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(language_name=language_name)
    user_prompt = USER_PROMPT_TEMPLATE.format(
        text=text[:5000],
        burstiness=metrics.get("burstiness_score", 50),
        lexical_diversity=metrics.get("lexical_diversity", 50),
        slv=metrics.get("sentence_length_variance", 50),
        repetition_score=metrics.get("repetition_score", 50),
        language_name=language_name,
    )

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
                "temperature": 0.7,
                "max_tokens": 4000,
            }
            async with httpx.AsyncClient(timeout=25.0) as client:
                response = await client.post(
                    OPENROUTER_URL, json=payload, headers=headers
                )

            if response.status_code == 429:
                logger.warning("Rate limited on model %s", model)
                continue

            if response.status_code >= 500:
                logger.warning("Server error %d on model %s", response.status_code, model)
                continue

            if response.status_code != 200:
                logger.warning(
                    "Unexpected status %d on model %s: %s",
                    response.status_code, model, response.text[:200],
                )
                continue

            data = response.json()
            content = data["choices"][0]["message"]["content"]
            suggestions = _parse_json_response(content)

            if suggestions:
                logger.info("Got %d suggestions from %s", len(suggestions), model)
                return suggestions, True

            logger.warning("Empty suggestions from %s", model)

        except httpx.TimeoutException:
            logger.warning("Timeout on model %s", model)
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.warning("Parse error on model %s: %s", model, e)
        except Exception as e:
            logger.warning("Unexpected error on model %s: %s", model, e)

    logger.warning("All LLM models failed, returning empty suggestions")
    return [], False
