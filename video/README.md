# How the demo film is made

The demo film is generated from this repository. No screen recorder, no editor.

1. **Script.** [`scenes.json`](scenes.json) holds every scene: its kind (title, statement or page), what it shows, and the narration.
2. **Narration.** [`narrate.py`](narrate.py) reads each scene with a Microsoft neural voice through `edge-tts`.
3. **Screenshots.** [`capture.mjs`](capture.mjs) drives headless Chrome over the DevTools Protocol, waits for live prices and contract numbers to load, and takes a tall 1920 pixel wide screenshot of every page.
4. **Frames.** [`film.html`](film.html) draws each frame on a canvas: the animated logo intro, statement cards, the pages inside a browser frame with a slow scroll, a caption chip, burned in subtitles and a progress bar.
5. **Encoding.** [`record.mjs`](record.mjs) renders every frame at 30 frames per second, pipes them into ffmpeg, lays each narration clip at its exact start time, and writes an H.264 MP4, SRT captions and a transcript.

Rendering frame by frame instead of recording the screen means no dropped frames and the same result on any machine.

```bash
pip install edge-tts imageio-ffmpeg
python video/narrate.py
node video/capture.mjs https://equalship.vercel.app
node video/record.mjs
```

Output goes to `video/out/`.
