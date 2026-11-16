// Runs pure-pursuit's app.py (2020) in Pyodide, off the main thread. app.py
// draws with matplotlib in an endless loop; here a stand-in matplotlib records
// the car each time the loop calls plt.pause, sends the frames to the page in
// batches, and ends the run when the car finishes the lap or leaves the track.
importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js');

const FAKE_MATPLOTLIB = `
import sys, types, json
import numpy as np
import js
from pyodide.ffi import to_js

sim = {}

class _Stop(Exception):
    pass

class _Line:
    def set_data(self, *args): pass

class _Scatter:
    def set_offsets(self, offset): sim["target"] = [float(offset[0]), float(offset[1])]

class _Axes:
    def plot(self, *args, **kwargs): return [_Line()]
    def add_artist(self, artist): pass
    def scatter(self, *args, **kwargs): return _Scatter()

class _Circle:
    def __init__(self, *args, **kwargs): self.center = (0, 0)
    def set_radius(self, radius): pass

def _pause(_interval):
    car = sim["ns"]["car"]
    x, y, yaw = (float(v) for v in car.state)
    target = sim.get("target") or [x, y]
    frames = sim["frames"]
    frames.append([x, y, yaw, target[0], target[1], float(car.steering_angle)])
    n = len(frames)
    done = ""
    if n > 300 and np.hypot(x - sim["start"][0], y - sim["start"][1]) < 1.5:
        done = "lap"
    elif n >= 2500:
        done = "limit"
    elif n % 10 == 0 and float(np.min(np.hypot(sim["track"][:, 0] - x, sim["track"][:, 1] - y))) > max(8.0, 3 * sim["ns"]["lookahead"]):
        done = "lost"
    if n - sim["sent"] >= 25 or done:
        js.emit(to_js(frames[sim["sent"]:]), done)
        sim["sent"] = n
    if done:
        raise _Stop()

pyplot = types.ModuleType("matplotlib.pyplot")
pyplot.subplots = lambda *args, **kwargs: (None, _Axes())
pyplot.pause = _pause
pyplot.show = lambda *args, **kwargs: None
patches = types.ModuleType("matplotlib.patches")
patches.Circle = _Circle
animation = types.ModuleType("matplotlib.animation")
matplotlib = types.ModuleType("matplotlib")
matplotlib.pyplot, matplotlib.patches, matplotlib.animation = pyplot, patches, animation
sys.modules.update({"matplotlib": matplotlib, "matplotlib.pyplot": pyplot,
                    "matplotlib.patches": patches, "matplotlib.animation": animation})

def run(source, lookahead):
    sim.update(frames=[], sent=0, target=None)
    sim["track"] = np.array(json.load(open("path.json")))
    sim["start"] = sim["track"][0]
    sim["ns"] = {"__name__": "__main__", "LOOKAHEAD": lookahead}
    try:
        exec(compile(source, "app.py", "exec"), sim["ns"])
    except _Stop:
        pass
`;

let python;
let source;

const ready = (async () => {
  python = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/' });
  await python.loadPackage('numpy');
  python.setStdout({ batched: () => {} });   // app.py prints its steering maths every step
  const [app, track] = await Promise.all([fetch('app.py').then(r => r.text()), fetch('path.json').then(r => r.text())]);
  // The only change to app.py: the lookahead distance comes from the page's slider.
  source = app.replace(/^lookahead = 4$/m, 'lookahead = LOOKAHEAD');
  python.FS.writeFile('path.json', track);
  python.runPython(FAKE_MATPLOTLIB);
  postMessage({ type: 'ready', track: JSON.parse(track) });
})().catch(error => postMessage({ type: 'error', message: String(error) }));

onmessage = async ({ data }) => {
  await ready;
  if (data.type !== 'run') return;
  self.emit = (frames, done) => postMessage({ type: 'frames', id: data.id, frames: frames.toJs ? frames.toJs() : frames, done });
  try {
    python.globals.get('run')(source, data.lookahead);
  } catch (error) {
    postMessage({ type: 'error', message: String(error) });
  }
};
