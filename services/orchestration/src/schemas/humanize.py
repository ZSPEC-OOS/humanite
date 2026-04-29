from pydantic import BaseModel, field_validator


class HumanizeSettings(BaseModel):
    intensity: int = 5
    tone: str = "balanced"
    domain: str = "general"
    preserve_citations: bool = True

    @field_validator("intensity")
    @classmethod
    def intensity_range(cls, v: int) -> int:
        if not (1 <= v <= 10):
            raise ValueError("Intensity must be between 1 and 10.")
        return v


class HumanizeRequest(BaseModel):
    text: str
    settings: HumanizeSettings = HumanizeSettings()
    async_mode: bool = False
    idempotency_key: str | None = None


class HumanizeOutput(BaseModel):
    text: str
    quality_scores: dict
    watermark: dict
    postprocessor_substitutions: int = 0


class HumanizeResponse(BaseModel):
    job_id: str
    status: str
    output: HumanizeOutput | None = None
    preprocessing_metadata: dict | None = None
    processing_metadata: dict | None = None
    result_url: str | None = None
    warning: str | None = None
