export interface AnalyzeRequest {
  text: string;
  ui_language: string;
}

export interface HumanizeRequest {
  text: string;
  ui_language: string;
}

export interface MetricsResponse {
  burstiness_score: number;
  lexical_diversity: number;
  sentence_length_variance: number;
  repetition_score: number;
  avg_sentence_length: number;
  unique_word_ratio: number;
}

export interface SuggestionResponse {
  paragraph_index: number;
  original_excerpt: string;
  issue: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

export interface AnalyzeResponse {
  score: number;
  detected_language: string;
  response_language: string;
  metrics: MetricsResponse;
  suggestions: SuggestionResponse[];
  summary: string;
  llm_available: boolean;
}

export interface HumanizeResponse {
  original_text: string;
  humanized_text: string;
  detected_language: string;
  changes_made: string[];
  llm_available: boolean;
}

export type AppMode = 'detect' | 'humanize';
