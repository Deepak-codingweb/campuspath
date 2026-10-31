import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  Footprints,
  Info,
  MapPin,
  Navigation,
  Pause,
  Play,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Waypoints,
  Zap,
} from "lucide-react";
import { apiRequest } from "./api";
import "./App.css";

const campusNodes = [
  { name: "Main Gate", x: 82, y: 190, type: "entry" },
  { name: "Administrative Block", x: 250, y: 100, type: "academic" },
  { name: "Parking Area", x: 82, y: 340, type: "facility" },
  { name: "Library", x: 440, y: 100, type: "academic" },
  { name: "Computer Science Department", x: 440, y: 300, type: "academic" },
  { name: "Central Canteen", x: 625, y: 190, type: "facility" },
  { name: "Seminar Hall", x: 625, y: 55, type: "academic" },
  { name: "Science Block", x: 625, y: 340, type: "academic" },
  { name: "Boys Hostel", x: 820, y: 100, type: "hostel" },
  { name: "Girls Hostel", x: 820, y: 285, type: "hostel" },
  { name: "Sports Ground", x: 1010, y: 100, type: "facility" },
  { name: "Auditorium", x: 1010, y: 285, type: "facility" },
];

// Each undirected connection appears exactly once here.
const campusEdges = [
  ["Main Gate", "Administrative Block"],
  ["Main Gate", "Parking Area"],
  ["Administrative Block", "Library"],
  ["Administrative Block", "Computer Science Department"],
  ["Library", "Central Canteen"],
  ["Library", "Seminar Hall"],
  ["Computer Science Department", "Science Block"],
  ["Central Canteen", "Boys Hostel"],
  ["Central Canteen", "Girls Hostel"],
  ["Boys Hostel", "Sports Ground"],
  ["Girls Hostel", "Auditorium"],
  ["Science Block", "Seminar Hall"],
  ["Sports Ground", "Auditorium"],
];

const SPEEDS = [350, 700, 1100];

function edgeKey(a, b) {
  return [a, b].sort().join("::");
}

function CampusMap({ start, destination, result, step }) {
  const pathEdges = useMemo(() => {
    if (step?.action === "complete" && result?.path?.length > 1) {
      return new Set(result.path.slice(1).map((name, index) => edgeKey(result.path[index], name)));
    }
    return new Set((step?.explored_edges || []).map(([a, b]) => edgeKey(a, b)));
  }, [result, step]);
  const visited = new Set(step?.visited || []);
  const positions = Object.fromEntries(campusNodes.map((node) => [node.name, node]));

  return (
    <section className="surface map-section" aria-labelledby="map-title">
      <div className="section-heading">
        <div>
          <div className="section-kicker"><Compass size={14} /> CAMPUS OVERVIEW</div>
          <h2 id="map-title">Explore the campus network</h2>
          <p>Follow the connections between campus locations as BFS searches for a route.</p>
        </div>
        <div className="map-count"><Waypoints size={15} /> {campusNodes.length} locations · {campusEdges.length} connections</div>
      </div>
      <div className="map-viewport">
        <svg className="campus-map" viewBox="0 0 1095 405" role="img" aria-label="Schematic graph of twelve campus locations and their walking connections">
          <defs>
            <pattern id="map-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#dfe8f4" />
            </pattern>
            <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#182e50" floodOpacity=".12" />
            </filter>
          </defs>
          <rect width="1095" height="405" fill="url(#map-grid)" />
          {campusEdges.map(([from, to]) => {
            const a = positions[from];
            const b = positions[to];
            const active = pathEdges.has(edgeKey(from, to));
            return <line key={edgeKey(from, to)} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={`map-edge ${active ? "map-edge-active" : ""}`} />;
          })}
          {campusNodes.map((node) => {
            const isStart = node.name === start;
            const isDestination = node.name === destination;
            const isCurrent = step?.current === node.name;
            const isVisited = visited.has(node.name);
            const isQueued = (step?.queue || []).includes(node.name);
            let cls = "map-node";
            if (isVisited) cls += " map-node-visited";
            if (isQueued) cls += " map-node-queued";
            if (isCurrent) cls += " map-node-current";
            if (isStart) cls += " map-node-start";
            if (isDestination) cls += " map-node-destination";
            return (
              <g key={node.name} className={cls}>
                {isCurrent && <circle cx={node.x} cy={node.y} r="23" className="node-pulse" />}
                <circle cx={node.x} cy={node.y} r="14" className="node-core" filter="url(#node-shadow)" />
                <circle cx={node.x} cy={node.y} r="4" className="node-dot" />
                <text x={node.x} y={node.y + 31} textAnchor="middle" className="map-label">{node.name}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="map-legend">
        <span><i className="legend-dot start-dot" />Start</span>
        <span><i className="legend-dot destination-dot" />Destination</span>
        <span><i className="legend-dot current-dot" />Current node</span>
        <span><i className="legend-dot visited-dot" />Visited</span>
        <span><i className="legend-line" />Explored connection / final route</span>
      </div>
    </section>
  );
}

function QueueChip({ value, index }) {
  return <span className={`queue-chip ${index === 0 ? "queue-front" : ""}`}>{value}</span>;
}

function App() {
  const [locations, setLocations] = useState([]);
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const trace = result?.trace || [];
  const activeStep = trace[activeStepIndex] || null;
  const isLastStep = trace.length > 0 && activeStepIndex >= trace.length - 1;

  useEffect(() => {
    let cancelled = false;
    async function loadCampus() {
      try {
        const [health, data] = await Promise.all([
          apiRequest("/health"),
          apiRequest("/locations"),
        ]);
        if (cancelled) return;
        setApiStatus(health.status === "ok" ? "online" : "offline");
        setLocations(data.locations || []);
        if (data.locations?.length) {
          setStart((current) => current || data.locations[0]);
          setDestination((current) => current || data.locations[1] || data.locations[0]);
        }
      } catch (err) {
        if (cancelled) return;
        setApiStatus("offline");
        setError(err.message);
      }
    }
    loadCampus();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isPlaying || !trace.length) return undefined;
    const timer = window.setTimeout(() => {
      setActiveStepIndex((current) => {
        const next = Math.min(current + 1, trace.length - 1);
        if (next >= trace.length - 1) setIsPlaying(false);
        return next;
      });
    }, SPEEDS[speed]);
    return () => window.clearTimeout(timer);
  }, [activeStepIndex, isPlaying, speed, trace.length]);

  const findRoute = useCallback(async (event) => {
    event?.preventDefault();
    if (!start || !destination) {
      setError("Choose both a starting point and a destination.");
      return;
    }
    setLoading(true);
    setError("");
    setIsPlaying(false);
    setResult(null);
    setActiveStepIndex(0);
    try {
      const data = await apiRequest("/find-route", {
        method: "POST",
        body: JSON.stringify({ start, destination }),
      });
      setResult(data);
      setApiStatus("online");
    } catch (err) {
      setError(err.message);
      if (err.code === "NETWORK_ERROR") setApiStatus("offline");
    } finally {
      setLoading(false);
    }
  }, [start, destination]);

  function resetRoute() {
    setIsPlaying(false);
    setResult(null);
    setActiveStepIndex(0);
    setError("");
  }

  function swapLocations() {
    setStart(destination);
    setDestination(start);
    resetRoute();
  }

  function goToStep(index) {
    setIsPlaying(false);
    setActiveStepIndex(Math.max(0, Math.min(index, trace.length - 1)));
  }

  function togglePlayback() {
    if (!trace.length) return;
    if (isLastStep) {
      setActiveStepIndex(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((playing) => !playing);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CampusPath home">
          <span className="brand-mark"><Navigation size={20} strokeWidth={2.5} /></span>
          <span className="brand-copy"><strong>Campus<span>Path</span></strong><small>SMART CAMPUS NAVIGATION</small></span>
        </a>
        <div className="topbar-right">
          <span className={`api-pill api-${apiStatus}`}><i />{apiStatus === "checking" ? "Connecting" : apiStatus === "online" ? "API connected" : "API unavailable"}</span>
          <a className="top-link" href="#how-it-works">How it works <ArrowRight size={14} /></a>
        </div>
      </header>

      <main id="top" className="page-wrap">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-kicker"><Sparkles size={14} /> FIND THE SMARTER WAY AROUND</div>
            <h1>Your campus,<br /><span>one clear route away.</span></h1>
            <p>Pick any two places. CampusPath uses Breadth-First Search to find the route with the fewest connections and shows you exactly how it gets there.</p>
            <div className="hero-proof">
              <span><ShieldCheck size={15} /> No sign-in required</span>
              <span><Zap size={15} /> Instant route search</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-art-grid" />
            <div className="route-orbit orbit-one" />
            <div className="route-orbit orbit-two" />
            <div className="art-pin pin-a"><MapPin size={21} /></div>
            <div className="art-pin pin-b"><MapPin size={21} /></div>
            <div className="art-path"><span /><span /><span /><span /></div>
            <div className="art-label label-a">START</div>
            <div className="art-label label-b">YOU ARE HERE</div>
          </div>
        </section>

        <section className="quick-stats" aria-label="Campus network summary">
          <div className="quick-stat"><span className="stat-icon"><MapPin size={17} /></span><div><strong>{locations.length || campusNodes.length}</strong><small>Campus locations</small></div></div>
          <div className="quick-stat"><span className="stat-icon"><Waypoints size={17} /></span><div><strong>{campusEdges.length}</strong><small>Walking connections</small></div></div>
          <div className="quick-stat"><span className="stat-icon"><Activity size={17} /></span><div><strong>BFS</strong><small>Route algorithm</small></div></div>
          <div className="quick-stat"><span className="stat-icon"><Clock3 size={17} /></span><div><strong>Live</strong><small>Step visualization</small></div></div>
        </section>

        <section className="planner-layout" aria-label="Route planner">
          <div className="surface planner-card">
            <div className="card-heading">
              <div className="heading-icon"><Route size={19} /></div>
              <div><span className="overline">ROUTE PLANNER</span><h2>Where are you going?</h2></div>
            </div>
            <form onSubmit={findRoute}>
              <label htmlFor="start-location">STARTING POINT</label>
              <div className="select-wrap start-select"><MapPin size={17} /><select id="start-location" value={start} onChange={(event) => { setStart(event.target.value); setResult(null); setError(""); setIsPlaying(false); }} disabled={!locations.length}>
                <option value="">Choose starting location</option>
                {locations.map((location) => <option key={location} value={location}>{location}</option>)}
              </select></div>
              <button type="button" className="swap-button" onClick={swapLocations} disabled={!start || !destination} aria-label="Swap starting point and destination"><ArrowDownUp size={16} /></button>
              <label htmlFor="destination-location">DESTINATION</label>
              <div className="select-wrap destination-select"><Navigation size={17} /><select id="destination-location" value={destination} onChange={(event) => { setDestination(event.target.value); setResult(null); setError(""); setIsPlaying(false); }} disabled={!locations.length}>
                <option value="">Choose destination</option>
                {locations.map((location) => <option key={location} value={location}>{location}</option>)}
              </select></div>
              <button className="primary-button" type="submit" disabled={loading || !locations.length}><Search size={17} />{loading ? "Finding your route…" : "Find shortest route"}<ArrowRight size={17} /></button>
              <button type="button" className="text-button" onClick={resetRoute}><RefreshCw size={14} /> Clear route</button>
            </form>
            {error && <div className="error-banner" role="alert"><CircleHelp size={16} /><span>{error}</span></div>}
            <div className="planner-note"><Info size={15} /><span>BFS finds the fewest edges in this unweighted campus graph. It does not estimate real walking distance or time.</span></div>
          </div>

          <div className="surface result-card" aria-live="polite">
            <div className="card-heading result-heading">
              <div className="heading-icon result-icon"><Footprints size={19} /></div>
              <div><span className="overline">YOUR DIRECTIONS</span><h2>{result ? "Route found" : "Your route will appear here"}</h2></div>
              {result && <span className="success-tag"><Check size={13} /> COMPLETE</span>}
            </div>
            {!result ? (
              <div className="result-placeholder"><div className="placeholder-illustration"><Route size={35} /></div><strong>Ready when you are</strong><p>Select two campus locations and let BFS calculate the shortest connection.</p></div>
            ) : result.path.length ? (
              <>
                <div className="result-metrics">
                  <div><strong>{result.total_edges}</strong><span>Edges in route</span></div>
                  <div><strong>{result.nodes_visited.length}</strong><span>Nodes explored</span></div>
                  <div><strong>{result.trace.length}</strong><span>Algorithm steps</span></div>
                </div>
                <div className="route-endpoints"><span><i className="endpoint-start" />{result.start}</span><ArrowRight size={16} /><span><i className="endpoint-end" />{result.destination}</span></div>
                <div className="path-list" aria-label="Shortest path steps">
                  {result.path.map((location, index) => (
                    <div className="path-step" key={`${location}-${index}`}>
                      <span className={`path-number ${index === 0 ? "path-number-start" : index === result.path.length - 1 ? "path-number-end" : ""}`}>{index === 0 ? "S" : index === result.path.length - 1 ? "D" : index}</span>
                      <strong>{location}</strong>
                      {index < result.path.length - 1 && <span className="path-connector"><ArrowRight size={13} /></span>}
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="result-placeholder"><strong>No route available</strong><p>There is no connected path between these two places in the current campus graph.</p></div>}
          </div>
        </section>

        <CampusMap start={start} destination={destination} result={result} step={activeStep} />

        <section className="surface visualizer-section" aria-labelledby="visualizer-title">
          <div className="section-heading visualizer-heading">
            <div><div className="section-kicker"><Activity size={14} /> ALGORITHM PLAYGROUND</div><h2 id="visualizer-title">See BFS think, step by step</h2><p>Play the search, pause it, or move through each queue operation yourself.</p></div>
            <div className="complexity-badge"><span>TIME COMPLEXITY</span><strong>O(V + E)</strong></div>
          </div>
          {!result ? (
            <div className="visualizer-empty"><div className="placeholder-illustration"><Activity size={29} /></div><div><strong>Run a route search to begin</strong><p>The queue, visited set and current node will update with the actual BFS execution.</p></div></div>
          ) : (
            <>
              <div className="visualizer-toolbar">
                <div className="play-controls">
                  <button type="button" className="play-button" onClick={togglePlayback} aria-label={isPlaying ? "Pause animation" : "Play animation"}>{isPlaying ? <Pause size={16} /> : <Play size={16} />}{isPlaying ? "Pause" : isLastStep ? "Replay" : "Play"}</button>
                  <button type="button" className="icon-control" onClick={() => goToStep(activeStepIndex - 1)} disabled={activeStepIndex === 0} aria-label="Previous step"><ChevronLeft size={18} /></button>
                  <button type="button" className="icon-control" onClick={() => goToStep(activeStepIndex + 1)} disabled={isLastStep} aria-label="Next step"><ChevronRight size={18} /></button>
                  <button type="button" className="icon-control" onClick={() => { setIsPlaying(false); setActiveStepIndex(0); }} aria-label="Restart animation"><RefreshCw size={15} /></button>
                </div>
                <label className="speed-control">SPEED <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value={0}>Fast</option><option value={1}>Normal</option><option value={2}>Slow</option></select></label>
              </div>
              <div className="progress-track"><span style={{ width: `${((activeStepIndex + 1) / trace.length) * 100}%` }} /></div>
              <div className="step-counter">STEP {activeStepIndex + 1} <span>OF {trace.length}</span></div>
              <div className="algorithm-grid">
                <div className="algorithm-box current-box"><div className="algorithm-label">CURRENT ACTION</div><div className="current-action"><span className="action-indicator" />{activeStep?.action?.replaceAll("_", " ") || "Waiting"}</div><p>{activeStep?.message || "Start the animation to inspect the search."}</p><div className="current-node-line"><span>Current node</span><strong>{activeStep?.current || "—"}</strong></div></div>
                <div className="algorithm-box"><div className="algorithm-label">QUEUE <span>FIRST IN, FIRST OUT</span></div><div className="queue-list">{activeStep?.queue?.length ? activeStep.queue.map((item, index) => <QueueChip key={`${item}-${index}`} value={item} index={index} />) : <span className="muted-value">Queue is empty</span>}</div><p className="box-footnote">{activeStep?.queue?.length ? "Front of queue is on the left." : "No locations are waiting to be explored."}</p></div>
                <div className="algorithm-box visited-box"><div className="algorithm-label">VISITED NODES <span>{activeStep?.visited?.length || 0} TOTAL</span></div><div className="visited-list">{(activeStep?.visited || []).map((item) => <span className="visited-chip" key={item}><Check size={11} />{item}</span>)}</div><p className="box-footnote">Visited locations are not added to the queue again.</p></div>
              </div>
              <div className="trace-timeline"><span>INITIALIZE</span>{trace.map((item, index) => <button key={`${item.action}-${index}`} type="button" className={`timeline-step ${index === activeStepIndex ? "timeline-active" : ""} ${index < activeStepIndex ? "timeline-done" : ""}`} onClick={() => goToStep(index)} title={item.message}><i /></button>)}<span>FINISH</span></div>
            </>
          )}
        </section>

        <section className="how-section" id="how-it-works">
          <div className="how-heading"><div className="section-kicker"><Info size={14} /> THE IDEA BEHIND THE ROUTE</div><h2>How does BFS find a shortest path?</h2><p>Breadth-First Search explores an unweighted graph level by level. The first time it reaches the destination, it has found a path with the minimum number of edges.</p></div>
          <div className="how-cards">
            <article className="how-card"><span>01</span><div className="how-card-icon"><Waypoints size={20} /></div><h3>Model the campus</h3><p>Each building is a node. Every direct walkway is an edge connecting two nodes.</p></article>
            <article className="how-card"><span>02</span><div className="how-card-icon"><ArrowRight size={20} /></div><h3>Explore level by level</h3><p>A FIFO queue ensures nearby nodes are explored before nodes farther away.</p></article>
            <article className="how-card"><span>03</span><div className="how-card-icon"><Check size={20} /></div><h3>Reconstruct the route</h3><p>A parent map remembers how each node was discovered, letting us rebuild the path.</p></article>
          </div>
          <div className="note-strip"><Info size={16} /><p><strong>Important:</strong> The current campus graph is a demonstration model. Its connections are illustrative, not verified building coordinates or measured walking paths. For real turn-by-turn navigation, the map and edge data must be replaced with surveyed campus paths and distances.</p></div>
        </section>

        <footer className="footer"><a className="footer-brand" href="#top"><span className="brand-mark"><Navigation size={16} /></span><strong>CampusPath</strong></a><span>Built to make graph algorithms easier to understand.</span><span>React · Flask · Python · BFS</span></footer>
      </main>
    </div>
  );
}

export default App;
