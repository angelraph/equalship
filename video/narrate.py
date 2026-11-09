"""Generate one narration clip per scene with a Microsoft neural voice (edge-tts).

Usage: python video/narrate.py
Writes video/out/audio/<scene>.mp3
"""

import asyncio
import json
import pathlib

import edge_tts

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "out" / "audio"


async def main() -> None:
    cfg = json.loads((ROOT / "scenes.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    for scene in cfg["scenes"]:
        target = OUT / f"{scene['id']}.mp3"
        tts = edge_tts.Communicate(scene["text"], cfg["voice"], rate=cfg.get("rate", "+0%"))
        await tts.save(str(target))
        print(f"{scene['id']}: {target.stat().st_size} bytes")


if __name__ == "__main__":
    asyncio.run(main())
