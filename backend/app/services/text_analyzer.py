import math
import logging
from collections import Counter

import nltk

logger = logging.getLogger(__name__)

AI_CONNECTIVES: dict[str, list[str]] = {
    "it": [
        "inoltre", "in conclusione", "è importante notare che", "in primo luogo",
        "in secondo luogo", "in sintesi", "è fondamentale", "di conseguenza",
        "in definitiva", "è essenziale", "nello specifico", "in particolare",
    ],
    "en": [
        "furthermore", "in conclusion", "it is important to note", "firstly",
        "secondly", "in summary", "it is essential", "consequently",
        "ultimately", "specifically", "in particular", "moreover",
        "additionally", "it is worth noting", "in today's world",
    ],
    "es": [
        "además", "en conclusión", "es importante destacar", "en primer lugar",
        "en segundo lugar", "en resumen", "es fundamental", "por consiguiente",
        "en definitiva", "es esencial", "en particular", "cabe destacar",
    ],
}


def _default_metrics() -> dict:
    return {
        "score": 50,
        "burstiness_score": 50,
        "lexical_diversity": 50,
        "sentence_length_variance": 50,
        "repetition_score": 50,
        "avg_sentence_length": 0.0,
        "unique_word_ratio": 0.0,
    }


def analyze_text(text: str, language: str) -> dict:
    try:
        sentences = nltk.sent_tokenize(text)
    except Exception:
        logger.warning("sent_tokenize failed, splitting on periods")
        sentences = [s.strip() for s in text.split(".") if s.strip()]

    all_tokens = nltk.word_tokenize(text.lower())
    words = [w for w in all_tokens if w.isalnum()]

    if len(sentences) < 2 or len(words) < 20:
        return _default_metrics()

    # Sentence lengths
    sent_lengths: list[int] = []
    for s in sentences:
        try:
            tokens = nltk.word_tokenize(s)
        except Exception:
            tokens = s.split()
        sent_lengths.append(len([t for t in tokens if t.isalnum()]))

    # Filter out empty sentences
    sent_lengths = [l for l in sent_lengths if l > 0]
    if len(sent_lengths) < 2:
        return _default_metrics()

    mean_len = sum(sent_lengths) / len(sent_lengths)

    # 1. BURSTINESS
    variance = sum((l - mean_len) ** 2 for l in sent_lengths) / len(sent_lengths)
    std_dev = math.sqrt(variance)
    cv = std_dev / mean_len if mean_len > 0 else 0
    burstiness = min(100, int(cv * 150))

    # 2. LEXICAL DIVERSITY (Type-Token Ratio)
    if len(words) > 0:
        unique_words = set(words)
        ttr = len(unique_words) / len(words)
        length_factor = min(1.0, 100 / len(words)) * 0.3
        adjusted_ttr = ttr + length_factor
        lexical_diversity = min(100, int(adjusted_ttr * 140))
    else:
        ttr = 0.0
        lexical_diversity = 50

    # 3. SENTENCE LENGTH VARIANCE
    sl_variance = min(100, int(std_dev * 5))

    # 4. REPETITION PATTERNS
    sentence_starters: list[tuple[str, ...]] = []
    for s in sentences:
        try:
            tokens = nltk.word_tokenize(s.lower())
        except Exception:
            tokens = s.lower().split()
        alpha_tokens = [t for t in tokens if t.isalnum()]
        if len(alpha_tokens) >= 2:
            sentence_starters.append(tuple(alpha_tokens[:2]))

    starter_counts = Counter(sentence_starters)
    repeated_starters = sum(1 for count in starter_counts.values() if count > 1)
    repetition_ratio = repeated_starters / max(len(sentences), 1)

    connectives = AI_CONNECTIVES.get(language, AI_CONNECTIVES["en"])
    connective_starts = 0
    for s in sentences:
        s_lower = s.lower().strip()
        for conn in connectives:
            if s_lower.startswith(conn):
                connective_starts += 1
                break
    connective_ratio = connective_starts / max(len(sentences), 1)

    repetition_score = max(0, min(100, int((1 - repetition_ratio - connective_ratio) * 100)))

    # 5. COMPOSITE SCORE
    score = int(
        burstiness * 0.30
        + lexical_diversity * 0.20
        + sl_variance * 0.20
        + repetition_score * 0.30
    )
    score = max(0, min(100, score))

    return {
        "score": score,
        "burstiness_score": burstiness,
        "lexical_diversity": lexical_diversity,
        "sentence_length_variance": sl_variance,
        "repetition_score": repetition_score,
        "avg_sentence_length": round(mean_len, 1),
        "unique_word_ratio": round(ttr, 3),
    }
