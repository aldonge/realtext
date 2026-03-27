from typing import Literal

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=50, max_length=10000)
    ui_language: str = Field(default="it", pattern=r"^[a-z]{2}$")


class MetricsResponse(BaseModel):
    burstiness_score: int
    lexical_diversity: int
    sentence_length_variance: int
    repetition_score: int
    avg_sentence_length: float
    unique_word_ratio: float


class SuggestionResponse(BaseModel):
    paragraph_index: int
    original_excerpt: str
    issue: str
    suggestion: str
    impact: Literal["high", "medium", "low"]


class AnalyzeResponse(BaseModel):
    score: int
    detected_language: str
    response_language: str
    metrics: MetricsResponse
    suggestions: list[SuggestionResponse]
    summary: str
    llm_available: bool


class HumanizeRequest(BaseModel):
    text: str = Field(..., min_length=50, max_length=10000)
    ui_language: str = Field(default="it", pattern=r"^[a-z]{2}$")


class HumanizeResponse(BaseModel):
    original_text: str
    humanized_text: str
    detected_language: str
    changes_made: list[str]
    llm_available: bool
