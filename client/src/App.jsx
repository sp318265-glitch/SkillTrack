import { useCallback, useEffect, useState } from 'react';
import './App.css';

const API_URL = 'https://skilltrack-8m6e.onrender.com';

function getSavedValue(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function getSavedUser() {
  try {
    return JSON.parse(getSavedValue('skillTrackUser') || 'null');
  } catch {
    return null;
  }
}

function statusLabel(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'in-progress') return 'In progress';
  return 'Planned';
}

export default function App() {
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [user, setUser] = useState(getSavedUser);
  const [token, setToken] = useState(() => getSavedValue('skillTrackToken'));
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskMessage, setTaskMessage] = useState('');

  const loadTasks = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Could not load tasks.');
      setTasks(data);
      setTaskMessage('');
    } catch (error) {
      setTaskMessage(error.message);
    }
  }, [token]);

  useEffect(() => {
    if (user) loadTasks();
  }, [user, loadTasks]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    const details =
      mode === 'register' ? form : { email: form.email, password: form.password };

    try {
      const response = await fetch(`${API_URL}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details)
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Something went wrong.');

      sessionStorage.setItem('skillTrackToken', data.token);
      sessionStorage.setItem('skillTrackUser', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function addTask(event) {
    event.preventDefault();
    setTaskMessage('');

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: taskTitle, description: taskDescription })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Could not add task.');

      setTasks((current) => [data, ...current]);
      setTaskTitle('');
      setTaskDescription('');
    } catch (error) {
      setTaskMessage(error.message);
    }
  }

  async function toggleTask(task) {
    const nextStatus = task.status === 'completed' ? 'planned' : 'completed';

    try {
      const response = await fetch(`${API_URL}/tasks/${task._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Could not update task.');

      setTasks((current) =>
        current.map((item) => (item._id === data._id ? data : item))
      );
      setTaskMessage('');
    } catch (error) {
      setTaskMessage(error.message);
    }
  }

  async function deleteTask(taskId) {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Could not delete task.');

      setTasks((current) => current.filter((task) => task._id !== taskId));
      setTaskMessage('');
    } catch (error) {
      setTaskMessage(error.message);
    }
  }

  function logout() {
    sessionStorage.removeItem('skillTrackToken');
    sessionStorage.removeItem('skillTrackUser');
    setToken(null);
    setUser(null);
    setTasks([]);
    setMode('login');
  }

  if (user) {
    const completedCount = tasks.filter((task) => task.status === 'completed').length;

    return (
      <main className="dashboard">
        <header className="topbar">
          <div className="brand"><span className="brand-mark">S</span> SkillTrack</div>
          <button className="text-button" onClick={logout}>Log out</button>
        </header>

        <section className="welcome">
          <p className="eyebrow">YOUR STUDENT CAREER SPACE</p>
          <h1>Welcome, {user.name}.</h1>
          <p>Plan your learning and keep your progress moving.</p>
        </section>

        <section className="task-summary">
          <div><strong>{tasks.length}</strong><span>Total tasks</span></div>
          <div><strong>{completedCount}</strong><span>Completed</span></div>
          <div><strong>{tasks.length - completedCount}</strong><span>In progress</span></div>
        </section>

        <section className="task-layout">
          <form className="task-form" onSubmit={addTask}>
            <p className="eyebrow">MAKE A PLAN</p>
            <h2>Add a learning task</h2>

            <label>
              Task title
              <input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Example: Practice JavaScript arrays"
                maxLength="120"
                required
              />
            </label>

            <label>
              Notes (optional)
              <textarea
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                placeholder="What do you want to finish?"
                rows="4"
              />
            </label>

            {taskMessage && <p className="message">{taskMessage}</p>}

            <button className="submit-button">Add task</button>
          </form>

          <section className="task-list-panel">
            <div className="task-list-heading">
              <div>
                <p className="eyebrow">YOUR PLAN</p>
                <h2>Learning tasks</h2>
              </div>
              <span>{tasks.length} total</span>
            </div>

            {tasks.length === 0 ? (
              <p className="empty-state">No tasks yet. Add your first learning task.</p>
            ) : (
              <div className="task-list">
                {tasks.map((task) => (
                  <article className="task-row" key={task._id}>
                    <div className="task-copy">
                      <span className={`status-badge ${task.status}`}>
                        {statusLabel(task.status)}
                      </span>
                      <h3>{task.title}</h3>
                      {task.description && <p>{task.description}</p>}
                    </div>
                    <div className="task-actions">
                      <button type="button" onClick={() => toggleTask(task)}>
                        {task.status === 'completed' ? 'Reopen' : 'Complete'}
                      </button>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => deleteTask(task._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="intro-panel">
        <div className="brand"><span className="brand-mark">S</span> SkillTrack</div>
        <div className="intro-copy">
          <p className="eyebrow">YOUR NEXT STEP STARTS HERE</p>
          <h1>Make progress<br /><em>you can see.</em></h1>
          <p>Organize your learning goals, skills, and projects in one place.</p>
          <div className="hero-preview">
  <div className="preview-label">DASHBOARD PREVIEW · EXAMPLE</div>
  <div className="preview-head">
    <div>
      <strong>Your learning rhythm</strong>
      <span>Small steps, steady progress</span>
    </div>
    <span className="preview-spark">↗</span>
  </div>
  <div className="preview-chart" aria-hidden="true">
    <i style={{ height: '35%' }} />
    <i style={{ height: '58%' }} />
    <i style={{ height: '45%' }} />
    <i style={{ height: '78%' }} />
    <i style={{ height: '62%' }} />
    <i style={{ height: '92%' }} />
    <i style={{ height: '72%' }} />
  </div>
  <div className="preview-days">
    <span>M</span><span>T</span><span>W</span><span>T</span>
    <span>F</span><span>S</span><span>S</span>
  </div>
  <div className="preview-tags">
    <span>Goals</span><span>Skills</span><span>Projects</span>
  </div>
</div>
        </div>
        <div className="intro-footer">A simple space for your career journey.</div>
      </section>

      <section className="form-panel">
        <div className="form-wrap">
          <p className="eyebrow">{mode === 'register' ? 'GET STARTED' : 'WELCOME BACK'}</p>
          <h2>{mode === 'register' ? 'Create your account' : 'Sign in to SkillTrack'}</h2>
          <p className="form-subtitle">
            {mode === 'register'
              ? 'Start organizing your learning journey.'
              : 'Continue where you left off.'}
          </p>

          <div className="mode-switch">
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => { setMode('login'); setMessage(''); }}
              type="button"
            >
              Sign in
            </button>
            <button
              className={mode === 'register' ? 'active' : ''}
              onClick={() => { setMode('register'); setMessage(''); }}
              type="button"
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label>
                Full name
                <input
                  name="name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Your name"
                  minLength="2"
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="At least 8 characters"
                minLength="8"
                required
              />
            </label>

            {message && <p className="message">{message}</p>}

            <button className="submit-button" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="secure-note">Your account is stored securely in MongoDB.</p>
        </div>
      </section>
    </main>
  );
}