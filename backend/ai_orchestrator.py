from dataclasses import dataclass
from typing import Any


@dataclass
class SessionContext:
    session_id: str
    user_id: str
    focus_entity: dict[str, Any] | None
    model_snapshot_ref: str | None
    recent_actions: list[dict[str, Any]]


class ContextManager:
    def __init__(self):
        self._store: dict[str, SessionContext] = {}

    def get_or_create(self, session_id: str, user_id: str, snapshot_ref: str | None) -> SessionContext:
        if session_id not in self._store:
            self._store[session_id] = SessionContext(
                session_id=session_id,
                user_id=user_id,
                focus_entity=None,
                model_snapshot_ref=snapshot_ref,
                recent_actions=[],
            )
        ctx = self._store[session_id]
        ctx.model_snapshot_ref = snapshot_ref
        return ctx

    def set_focus(self, session_id: str, entity_type: str, entity_id: str):
        if session_id in self._store:
            self._store[session_id].focus_entity = {"type": entity_type, "id": entity_id}


@dataclass
class IntentResult:
    intent_type: str
    params: dict[str, Any]


class IntentAnalyzer:
    def analyze(self, message: str) -> IntentResult:
        text = message.lower()
        if any(k in text for k in ["新增", "创建", "create", "update", "修改", "提交"]):
            return IntentResult("WRITE", {})
        if any(k in text for k in ["打开", "进入", "navigate", "go to"]):
            return IntentResult("NAVIGATE", {})
        if any(k in text for k in ["分析", "趋势", "图", "chart", "analyze"]):
            return IntentResult("ANALYZE", {})
        return IntentResult("QUERY", {})


class ProcessStrategyEngine:
    def build_plan(self, intent: IntentResult, snapshot: dict[str, Any]) -> list[dict[str, Any]]:
        # Sprint A: minimal strategy driven by snapshot presence and intent type.
        release = snapshot.get("release_no")
        return [{"step": "intent_route", "intent": intent.intent_type, "snapshot": release}]

