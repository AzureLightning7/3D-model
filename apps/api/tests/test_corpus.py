"""Cross-language corpus test.

The same JSON fixture is consumed by:
  - this Python test, via `apply_all` on the domain models
  - (planned) a Vitest test on the web side, via `applyAll` in TypeScript

Both implementations must produce byte-identical `expected` scenes. If you
change the reducer in one language, this test will fail until you update both.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from pydantic import TypeAdapter

from app.contexts.scene.application.edit_reducer import apply_all
from app.contexts.scene.domain.scene_graph import EditOp, Scene

CORPUS = Path(__file__).parent / "fixtures" / "scene_ops" / "corpus.json"

_op_adapter: TypeAdapter[EditOp] = TypeAdapter(EditOp)


def _load_cases() -> list[dict]:
    return json.loads(CORPUS.read_text(encoding="utf-8"))["fixtures"]


@pytest.mark.parametrize("case", _load_cases(), ids=lambda c: c["name"])
def test_corpus_case(case: dict) -> None:
    initial = Scene.model_validate(case["initial"])
    ops = [_op_adapter.validate_python(o) for o in case["ops"]]
    expected = Scene.model_validate(case["expected"])
    actual = apply_all(initial, ops)
    # Compare via canonical JSON to surface any drift cleanly.
    a = actual.model_dump(by_alias=True, mode="json")
    e = expected.model_dump(by_alias=True, mode="json")
    assert a == e, f"Mismatch in {case['name']}:\n  expected={e}\n  actual={a}"
