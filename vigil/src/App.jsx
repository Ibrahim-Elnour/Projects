import React, { useEffect, useMemo, useState } from 'react';
import { CircleAlert, Crosshair, MapPin, MessageCircle, Navigation, Plus, Send, Shield, X, Bell, CheckCheck, ChevronRight, LogOut } from 'lucide-react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { api } from './api.js';
import { supabase } from './supabase.js';

const CAMPUS_CENTER = [40.00015, -83.01435];
const CATEGORIES = ['Theft', 'Robbery', 'Safety', 'Other'];

function relativeTime(date) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

function MapClickHandler({ picking, onPick }) {
  useMapEvents({
    click(event) {
      if (picking) onPick(event.latlng);
    },
  });
  return null;
}

function RecenterButton({ onClick }) {
  const map = useMap();
  return (
    <button className="map-control" type="button" title="Recenter map" aria-label="Recenter map" onClick={() => { map.flyTo(CAMPUS_CENTER, 16); onClick(); }}>
      <Crosshair size={16} strokeWidth={1.7} />
    </button>
  );
}

function ReportMarker({ report, selected, onSelect }) {
  const icon = useMemo(() => L.divIcon({
    className: 'vigil-marker-wrap',
    html: `<span class="vigil-marker${selected ? ' is-selected' : ''}"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  }), [selected]);
  return <MarkerIcon position={[report.lat, report.lng]} icon={icon} onSelect={() => onSelect(report.id)} />;
}

function MarkerIcon({ position, icon, onSelect }) {
  const map = useMap();
  useEffect(() => {
    const marker = L.marker(position, { icon, keyboard: true, title: 'Campus safety report' }).addTo(map);
    marker.on('click', onSelect);
    return () => marker.remove();
  }, [icon, map, onSelect, position]);
  return null;
}

function ReportCard({ report, selected, onSelect, canResolve, onResolve }) {
  return (
    <article className={`report-card${selected ? ' selected' : ''}`}>
      <button className="report-card-select" type="button" aria-pressed={selected} onClick={() => onSelect(report.id)}>
        <span className="report-card-top">
          <span className="report-category">{report.category}</span>
          <span className="report-time">{relativeTime(report.createdAt)}</span>
        </span>
        <span className="report-title">{report.title}</span>
        <span className="report-location"><MapPin size={13} />{report.location}</span>
        {selected && <span className="report-description">{report.description}</span>}
        {report.status === 'resolved' && <span className="resolved-label">Resolved</span>}
      </button>
      {canResolve && report.status === 'open' && <button className="resolve-button" type="button" onClick={(event) => { event.stopPropagation(); onResolve(report.id); }}>Mark resolved</button>}
    </article>
  );
}

function AuthScreen({ mode, setMode, configured, loading, error, notice, onSubmit }) {
  const signingUp = mode === 'signup';
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Vigil home"><span className="brand-mark"><Shield size={20} strokeWidth={1.8} /></span><span>vigil</span><span className="brand-divider" /><span className="brand-campus">OHIO STATE</span></a>
        <span className="campus-status"><span className="live-dot" />COLUMBUS, OHIO</span>
      </header>
      <main className="auth-main">
        <section className="auth-panel" aria-labelledby="auth-heading">
          <p className="eyebrow">THE OHIO STATE UNIVERSITY <span>·</span> CAMPUS SAFETY</p>
          <h1 id="auth-heading">{signingUp ? 'Join your campus.' : 'Good to see you.'}</h1>
          <p className="auth-intro">{signingUp ? 'Create an account to share reports and stay aware together.' : 'Log in to see what’s happening around campus.'}</p>
          {!configured && <p className="auth-setup" role="status">Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment to connect Vigil.</p>}
          {notice && <p className="auth-notice" role="status">{notice}</p>}
          <form className="auth-form" onSubmit={onSubmit}>
            <label className="field-label" htmlFor="auth-email">Email</label>
            <input id="auth-email" name="email" type="email" autoComplete="email" required placeholder="you@osu.edu" />
            <label className="field-label" htmlFor="auth-password">Password</label>
            <input id="auth-password" name="password" type="password" autoComplete={signingUp ? 'new-password' : 'current-password'} minLength={6} required placeholder="At least 6 characters" />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button auth-submit" type="submit" disabled={!configured || loading}>{loading ? 'Please wait…' : signingUp ? 'Create account' : 'Log in'}<ChevronRight size={16} /></button>
          </form>
          <div className="auth-switch">{signingUp ? 'Already have an account?' : 'New to Vigil?'} <button type="button" onClick={() => setMode(signingUp ? 'login' : 'signup')}>{signingUp ? 'Log in' : 'Create an account'}</button></div>
          <p className="auth-emergency"><CircleAlert size={14} />For emergencies, call <strong>911</strong>.</p>
        </section>
      </main>
      <footer className="site-footer"><span>VIGIL <span className="footer-separator">/</span> OHIO STATE</span><span>Look out for one another.</span></footer>
    </div>
  );
}

function ReportDialog({ draft, setDraft, onClose, onPickLocation, onSubmit, saving, error }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-heading">
        <div className="dialog-heading">
          <div><p className="eyebrow">CAMPUS REPORT</p><h2 id="report-heading">Share what happened.</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close report form"><X size={18} /></button>
        </div>
        <form onSubmit={onSubmit}>
          <label className="field-label" htmlFor="report-title">Title</label>
          <input id="report-title" autoFocus maxLength={90} required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="A short, clear summary" />
          <label className="field-label" htmlFor="report-category">Category</label>
          <select id="report-category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
            {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
          <label className="field-label" htmlFor="report-location">Location</label>
          <div className="location-field">
            <input id="report-location" required maxLength={120} value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="Building, street, or landmark" />
            <button className="pick-button" type="button" onClick={onPickLocation} title="Pick a point on the map"><MapPin size={15} /> Pick on map</button>
          </div>
          {draft.coords && <p className="coords-note">Pinned {draft.coords.lat.toFixed(5)}, {draft.coords.lng.toFixed(5)}</p>}
          <label className="field-label" htmlFor="report-description">What should others know?</label>
          <textarea id="report-description" required maxLength={600} rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Share helpful details. Avoid personal information." />
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-footer"><span>For emergencies, call 911.</span><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Sending…' : 'Submit report'}<ChevronRight size={16} /></button></div>
        </form>
      </section>
    </div>
  );
}

function CommunityPanel({ mode, onClose, onModeChange, messages, setMessages, notifications, setNotifications }) {
  const [messageText, setMessageText] = useState('');
  const [messageError, setMessageError] = useState('');

  async function submitMessage(event) {
    event.preventDefault();
    const text = messageText.trim();
    if (!text) return;
    try {
      const message = await api.sendMessage(text);
      setMessages((current) => [...current, message]);
      setMessageText('');
      setMessageError('');
    } catch {
      setMessageError('Message could not be sent. Try again.');
    }
  }

  async function markRead() {
    try {
      const updated = await api.markNotificationsRead();
      setNotifications(updated);
    } catch {
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    }
  }

  return (
    <>
      <button className="drawer-scrim" type="button" aria-label="Close panel" onClick={onClose} />
      <aside className="community-panel" aria-label={mode === 'chat' ? 'Campus chat' : 'Notifications'}>
        <div className="panel-header">
          <div><p className="eyebrow">OHIO STATE · CAMPUS</p><h2>{mode === 'chat' ? 'Community chat' : 'Notifications'}</h2></div>
          <button className="icon-button" type="button" aria-label="Close panel" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="panel-tabs" role="tablist" aria-label="Community panel">
          <button type="button" role="tab" aria-selected={mode === 'chat'} className={mode === 'chat' ? 'active' : ''} onClick={() => onModeChange('chat')}><MessageCircle size={14} />Chat</button>
          <button type="button" role="tab" aria-selected={mode === 'alerts'} className={mode === 'alerts' ? 'active' : ''} onClick={() => onModeChange('alerts')}><Bell size={14} />Alerts</button>
        </div>
        {mode === 'chat' ? (
          <>
            <div className="chat-context"><span className="live-dot" />Campus community <span>·</span> Be kind and keep it local</div>
            <div className="message-list" aria-live="polite">
              {messages.map((message) => <article className={`chat-message${message.mine ? ' mine' : ''}`} key={message.id}>
                {!message.mine && <span className="message-author">{message.author}</span>}
                <p>{message.text}</p><time>{message.time}</time>
              </article>)}
              {messages.length === 0 && <p className="empty-state">Start a conversation with your campus community.</p>}
            </div>
            <form className="chat-compose" onSubmit={submitMessage}>
              {messageError && <p className="form-error">{messageError}</p>}
              <label className="sr-only" htmlFor="chat-message">Write a message</label>
              <input id="chat-message" maxLength={500} value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Message campus chat" />
              <button className="send-button" type="submit" disabled={!messageText.trim()} aria-label="Send message"><Send size={16} /></button>
            </form>
          </>
        ) : (
          <>
            <div className="notification-tools"><span>{notifications.filter((notification) => !notification.read).length} unread</span><button type="button" onClick={markRead}><CheckCheck size={14} />Mark all read</button></div>
            <div className="notification-list">
              {notifications.map((notification) => <article className={`notification-item${notification.read ? '' : ' unread'}`} key={notification.id}>
                <span className="notification-indicator" /><div><h3>{notification.title}</h3><p>{notification.detail}</p><time>{notification.time}</time></div>
              </article>)}
              {notifications.length === 0 && <p className="empty-state">You’re all caught up.</p>}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('open');
  const [category, setCategory] = useState('All');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [draft, setDraft] = useState({ title: '', category: 'Theft', location: '', description: '', coords: null });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [panel, setPanel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return undefined;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
    }).catch(() => {
      if (!mounted) return;
      setAuthReady(true);
      setAuthError('Could not connect to Supabase. Check your project URL and try again.');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
      setAuthError('');
      setAuthNotice('');
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setReports([]);
      setMessages([]);
      setNotifications([]);
      setDataError('');
      return undefined;
    }
    let mounted = true;
    Promise.all([api.getReports(), api.getMessages(), api.getNotifications()])
      .then(([nextReports, nextMessages, nextNotifications]) => {
        if (!mounted) return;
        setReports(nextReports);
        setMessages(nextMessages);
        setNotifications(nextNotifications);
        setSelectedId(nextReports.find((report) => report.status === 'open')?.id ?? null);
      })
      .catch(() => {
        if (mounted) setDataError('Could not load campus reports. Check your connection and try again.');
      });
    return () => { mounted = false; };
  }, [session?.user?.id]);

  const visibleReports = useMemo(() => reports
    .filter((report) => report.status === view)
    .filter((report) => category === 'All' || report.category === category)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [reports, view, category]);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  function chooseReport(id) {
    setSelectedId(id);
    const report = reports.find((item) => item.id === id);
    if (report) document.getElementById(`report-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function changeView(nextView) {
    setView(nextView);
    setSelectedId(reports.find((report) => report.status === nextView && (category === 'All' || report.category === category))?.id ?? null);
  }

  function startReport() {
    setDraft({ title: '', category: 'Theft', location: '', description: '', coords: null });
    setFormError('');
    setIsReportOpen(true);
  }

  function pickLocation() {
    setIsReportOpen(false);
    setPickingLocation(true);
  }

  function handleMapPick(latlng) {
    const coords = { lat: latlng.lat, lng: latlng.lng };
    setDraft((current) => ({ ...current, coords, location: `Pinned location (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})` }));
    setPickingLocation(false);
    setIsReportOpen(true);
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthNotice('');
    const form = new FormData(event.currentTarget);
    const email = form.get('email')?.toString().trim();
    const password = form.get('password')?.toString();
    try {
      if (!supabase) throw new Error('Supabase is not configured.');
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) setAuthNotice('Check your email to confirm your account, then log in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setAuthError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function logOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch {
      setDataError('Could not log out. Please try again.');
    }
  }

  async function resolveReport(reportId) {
    try {
      const resolved = await api.resolveReport(reportId, session.user.id);
      setReports((current) => current.map((report) => report.id === reportId ? resolved : report));
      setDataError('');
    } catch {
      setDataError('Only the report creator can resolve this report.');
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const report = await api.createReport({
        title: draft.title.trim(), category: draft.category, location: draft.location.trim(), description: draft.description.trim(),
        lat: draft.coords?.lat ?? CAMPUS_CENTER[0], lng: draft.coords?.lng ?? CAMPUS_CENTER[1],
      }, session.user.id);
      setReports((current) => [report, ...current]);
      setView('open');
      setCategory('All');
      setSelectedId(report.id);
      setIsReportOpen(false);
      setDataError('');
      setNotifications(await api.getNotifications());
    } catch {
      setFormError('Your report could not be submitted. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!authReady) {
    return <div className="app-shell"><header className="topbar"><a className="brand" href="#home" aria-label="Vigil home"><span className="brand-mark"><Shield size={20} strokeWidth={1.8} /></span><span>vigil</span><span className="brand-divider" /><span className="brand-campus">OHIO STATE</span></a></header><main className="auth-main"><p className="eyebrow">CONNECTING TO CAMPUS</p></main></div>;
  }

  if (!session?.user) {
    return <AuthScreen mode={authMode} setMode={(nextMode) => { setAuthMode(nextMode); setAuthError(''); setAuthNotice(''); }} configured={Boolean(supabase)} loading={authLoading} error={authError} notice={authNotice} onSubmit={submitAuth} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Vigil home"><span className="brand-mark"><Shield size={20} strokeWidth={1.8} /></span><span>vigil</span><span className="brand-divider" /><span className="brand-campus">OHIO STATE</span></a>
        <div className="topbar-actions">
          <span className="campus-status"><span className="live-dot" />Columbus, Ohio</span>
          <span className="user-email" title={session.user.email}>{session.user.email}</span>
          <button className="header-action logout-button" type="button" onClick={logOut}><LogOut size={16} /><span>Log out</span></button>
          <button className={`header-action${panel === 'chat' ? ' active' : ''}`} type="button" aria-label="Open campus chat" title="Campus chat" onClick={() => setPanel(panel === 'chat' ? null : 'chat')}><MessageCircle size={17} /><span>Chat</span></button>
          <button className={`header-action${panel === 'alerts' ? ' active' : ''}`} type="button" aria-label="Open notifications" title="Notifications" onClick={() => setPanel(panel === 'alerts' ? null : 'alerts')}><Bell size={17} /><span>Alerts</span>{unreadCount > 0 && <i className="unread-count">{unreadCount}</i>}</button>
          <button className="primary-button header-report" type="button" onClick={startReport}><Plus size={16} />Report</button>
        </div>
      </header>

      <main id="home" className="main-content">
        <div className="page-heading">
          <div><p className="eyebrow">THE OHIO STATE UNIVERSITY <span>·</span> COLUMBUS, OH</p><h1>Campus watch</h1></div>
          <p className="heading-note">A little more aware.<br />A little more connected.</p>
        </div>

        <section className="workspace" aria-label="Campus safety reports and map">
          <aside className="feed-panel">
            <div className="feed-heading">
              <div><h2>Reports</h2><span className="report-count">{visibleReports.length} {view === 'open' ? 'active' : 'resolved'}</span></div>
              <button className="icon-button small-report" type="button" onClick={startReport} title="Create a report" aria-label="Create a report"><Plus size={17} /></button>
            </div>
            <div className="view-tabs" role="tablist" aria-label="Report history">
              <button type="button" role="tab" aria-selected={view === 'open'} className={view === 'open' ? 'active' : ''} onClick={() => changeView('open')}>Live reports</button>
              <button type="button" role="tab" aria-selected={view === 'resolved'} className={view === 'resolved' ? 'active' : ''} onClick={() => changeView('resolved')}>History</button>
            </div>
            <div className="category-filters" aria-label="Filter by category">
              {['All', ...CATEGORIES].map((item) => <button type="button" key={item} aria-pressed={category === item} className={category === item ? 'active' : ''} onClick={() => {
                setCategory(item);
                const first = reports.find((report) => report.status === view && (item === 'All' || report.category === item));
                setSelectedId(first?.id ?? null);
              }}>{item}</button>)}
            </div>
            {dataError && <p className="load-error" role="alert">{dataError}</p>}
            <div className="report-list" aria-live="polite">
              {visibleReports.map((report) => <div id={`report-${report.id}`} key={report.id}><ReportCard report={report} selected={selectedId === report.id} onSelect={chooseReport} canResolve={report.userId === session.user.id} onResolve={resolveReport} /></div>)}
              {visibleReports.length === 0 && <div className="empty-reports"><Shield size={21} /><p>{reports.length ? 'No reports in this view.' : 'Loading campus reports…'}</p></div>}
            </div>
            <div className="feed-footer"><CircleAlert size={14} /><span>In an emergency, call <strong>911</strong></span></div>
          </aside>

          <div className={`map-panel${pickingLocation ? ' is-picking' : ''}`}>
            <MapContainer className="campus-map" center={CAMPUS_CENTER} zoom={16} zoomControl={false} scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={20}
              />
              <MapClickHandler picking={pickingLocation} onPick={handleMapPick} />
              {reports.filter((report) => report.status === view && (category === 'All' || report.category === category)).map((report) => <ReportMarker key={report.id} report={report} selected={selectedId === report.id} onSelect={chooseReport} />)}
              <div className="map-controls"><RecenterButton onClick={() => {}} /></div>
            </MapContainer>
            {pickingLocation && <div className="map-pick-banner"><MapPin size={16} /><span>Click anywhere on the map to set the report location</span><button type="button" onClick={() => { setPickingLocation(false); setIsReportOpen(true); }}>Cancel</button></div>}
            <div className="map-caption"><Navigation size={13} /><span>Ohio State University</span><span className="caption-divider" />{visibleReports.length} {view === 'open' ? 'active reports' : 'resolved reports'}</div>
          </div>
        </section>
      </main>

      <footer className="site-footer"><span>VIGIL <span className="footer-separator">/</span> OHIO STATE</span><span>Look out for one another.</span></footer>

      {isReportOpen && <ReportDialog draft={draft} setDraft={setDraft} onClose={() => setIsReportOpen(false)} onPickLocation={pickLocation} onSubmit={submitReport} saving={saving} error={formError} />}
      {panel && <CommunityPanel mode={panel} onClose={() => setPanel(null)} onModeChange={setPanel} messages={messages} setMessages={setMessages} notifications={notifications} setNotifications={setNotifications} />}
    </div>
  );
}
