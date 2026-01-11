import React, { useEffect, useState } from "react";
import { login, listIncidents, createIncident } from "./api";

export default function App() {
  const [token, setToken] = useState("");
  const [incidents, setIncidents] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function refresh() {
    const data = await listIncidents({ page: 1, page_size: 10 });
    setIncidents(data.items);
  }

  useEffect(() => { refresh(); }, []);
import React, { useEffect, useState } from "react";
import { login, listIncidents, createIncident } from "./api";

export default function App() {
  const [token, setToken] = useState("");
  const [incidents, setIncidents] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function refresh() {
    const data = await listIncidents({ page: 1, page_size: 10 });
    setIncidents(data.items);
  }

  useEffect(() => { refresh(); }, []);

  async function onLogin(e) {
    e.preventDefault();
    const data = await login(email, password);
    setToken(data.access_token);
  }

  async function onCreate() {
    if (!token) return alert("Login first");
    await createIncident(token, {
      title: "Power outage on Main St",
      description: "Multiple houses lost power after a transformer failure",
      severity: "high",
      latitude: 38.6270,
      longitude: -90.1994
    });
    await refresh();
  }

  return (
    <div style={{maxWidth: 900, margin: "40px auto", fontFamily: "system-ui"}}>
      <h1>Incident Platform</h1>

      <section style={{display: "flex", gap: 8, alignItems: "center"}}>
        <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={onLogin}>Login</button>
        <button onClick={onCreate}>Create sample incident</button>
      </section>

      <h2 style={{marginTop: 24}}>Recent incidents</h2>
      <ul>
        {incidents.map(i => (
          <li key={i.id}>
            <strong>{i.title}</strong> — {i.severity} — {i.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { login, listIncidents, createIncident } from "./api";

export default function App() {
  const [token, setToken] = useState("");
  const [incidents, setIncidents] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function refresh() {
    const data = await listIncidents({ page: 1, page_size: 10 });
    setIncidents(data.items);
  }

  useEffect(() => { refresh(); }, []);

  async function onLogin(e) {
    e.preventDefault();
    const data = await login(email, password);
    setToken(data.access_token);
  }

  async function onCreate() {
    if (!token) return alert("Login first");
    await createIncident(token, {
      title: "Power outage on Main St",
      description: "Multiple houses lost power after a transformer failure",
      severity: "high",
      latitude: 38.6270,
      longitude: -90.1994
    });
    await refresh();
  }

  return (
    <div style={{maxWidth: 900, margin: "40px auto", fontFamily: "system-ui"}}>
      <h1>Incident Platform</h1>

      <section style={{display: "flex", gap: 8, alignItems: "center"}}>
        <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={onLogin}>Login</button>
        <button onClick={onCreate}>Create sample incident</button>
      </section>

      <h2 style={{marginTop: 24}}>Recent incidents</h2>
      <ul>
        {incidents.map(i => (
          <li key={i.id}>
            <strong>{i.title}</strong> — {i.severity} — {i.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

  async function onLogin(e) {
    e.preventDefault();
    const data = await login(email, password);
    setToken(data.access_token);
  }

  async function onCreate() {
    if (!token) return alert("Login first");
    await createIncident(token, {
      title: "Power outage on Main St",
      description: "Multiple houses lost power after a transformer failure",
      severity: "high",
      latitude: 38.6270,
      longitude: -90.1994
    });
    await refresh();
  }

  return (
    <div style={{maxWidth: 900, margin: "40px auto", fontFamily: "system-ui"}}>
      <h1>Incident Platform</h1>

      <section style={{display: "flex", gap: 8, alignItems: "center"}}>
        <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={onLogin}>Login</button>
        <button onClick={onCreate}>Create sample incident</button>
      </section>

      <h2 style={{marginTop: 24}}>Recent incidents</h2>
      <ul>
        {incidents.map(i => (
          <li key={i.id}>
            <strong>{i.title}</strong> — {i.severity} — {i.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
