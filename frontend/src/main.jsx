import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, Eye, LogOut, Plus, Save, Shield, Sword, Trash2, User } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || '/api';

const skills = [
  'Agilidade', 'Astucia', 'Atletismo', 'Conhecimento', 'Cura', 'Enganacao',
  'Furtividade', 'Guerra', 'Idioma', 'Ladinagem', 'Lidar com Animais',
  'Luta', 'Percepcao', 'Persuasao', 'Pontaria', 'Sobrevivencia', 'Status',
  'Vigor', 'Vontade'
];

const blankCharacter = {
  nome: '', casa: '', idade: '', sexo: '', jogador: '', descricao: '',
  nivel: 1, destino: '', intriga: '', combate: '', armadura: '', armas: '',
  equipamentos: '', saude: '', ferimentos: '', lesoes: '', movimento: '',
  corrida: '', altura: '', peso: '', olhos: '', cabelos: '', marcas: '',
  detalhes: '', objetivo: '', motivacao: '', virtude: '', vicio: '',
  personalidade: '', historia: '', juramentos: '', obrigacoes: '',
  aliados: '', inimigos: '', posses: '', dinheiro: '', experiencia: '',
  habilidades: Object.fromEntries(skills.map((skill) => [skill, { grau: '', especialidade: '' }]))
};

function request(path, options = {}) {
  const token = localStorage.getItem('gotrpg_token');
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  }).then(async (response) => {
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.detail || 'Erro na requisicao');
    return data;
  });
}

function App() {
  const [route, setRoute] = useState(location.hash.slice(1) || '/');
  const [token, setToken] = useState(localStorage.getItem('gotrpg_token'));

  useEffect(() => {
    const onHash = () => setRoute(location.hash.slice(1) || '/');
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  const go = (path) => {
    location.hash = path;
    setRoute(path);
  };

  const logout = () => {
    localStorage.removeItem('gotrpg_token');
    setToken(null);
    go('/');
  };

  const authed = Boolean(token);
  const page = useMemo(() => {
    if (route === '/') return <Landing go={go} authed={authed} />;
    if (route === '/auth') return <Auth go={go} setToken={setToken} />;
    if (!authed) return <Auth go={go} setToken={setToken} />;
    if (route === '/dashboard') return <Dashboard go={go} />;
    if (route === '/profile') return <Profile />;
    if (route === '/new') return <CharacterForm go={go} />;
    if (route === '/characters') return <Characters go={go} />;
    if (route.startsWith('/characters/')) return <CharacterForm go={go} id={route.split('/')[2]} />;
    return <Dashboard go={go} />;
  }, [route, authed]);

  return (
    <div>
      <header className="topbar">
        <button className="brand" onClick={() => go('/')}>
          <Sword size={24} />
          GoTRPG
        </button>
        <nav>
          {authed && <button onClick={() => go('/profile')}><User size={17} />Perfil</button>}
          {authed && <button onClick={() => go('/dashboard')}>Dashboard</button>}
          {authed && <button onClick={logout}><LogOut size={17} />Sair</button>}
        </nav>
      </header>
      {page}
    </div>
  );
}

function Landing({ go, authed }) {
  return (
    <main className="hero">
      <section className="heroText">
        <p className="kicker">Fichas digitais de RPG medieval</p>
        <h1>Forje personagens, casas e lendas.</h1>
        <p>Um grimorio simples para criar, salvar e evoluir fichas inspiradas em campanhas de intriga, guerra e honra.</p>
        <div className="actions">
          <button className="primary" onClick={() => go(authed ? '/dashboard' : '/auth')}>
            <Shield size={19} />
            Entrar
          </button>
          <button onClick={() => go('/auth')}>Criar conta</button>
        </div>
      </section>
    </main>
  );
}

function Auth({ go, setToken }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await request(`/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        body: JSON.stringify(form)
      });
      localStorage.setItem('gotrpg_token', data.token);
      setToken(data.token);
      go('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="centerPage">
      <form className="authPanel" onSubmit={submit}>
        <Shield size={42} />
        <h1>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h1>
        <label>Usuario<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
        <label>Senha<input type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit">{mode === 'login' ? 'Entrar' : 'Registrar'}</button>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Nao tenho conta' : 'Ja tenho conta'}
        </button>
      </form>
    </main>
  );
}

function Dashboard({ go }) {
  return (
    <main className="dashboard">
      <h1>Sala do Mestre</h1>
      <div className="dashboardActions">
        <button className="bigAction" onClick={() => go('/new')}><Plus />Novo personagem</button>
        <button className="bigAction" onClick={() => go('/characters')}><BookOpen />Ver personagens</button>
      </div>
    </main>
  );
}

function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    request('/me').then(setProfile).catch((err) => setError(err.message));
  }, []);

  const createdAt = profile?.created_at
    ? new Date(profile.created_at * 1000).toLocaleDateString('pt-BR')
    : '-';

  return (
    <main className="centerPage">
      <section className="profilePanel">
        <User size={42} />
        <h1>Perfil</h1>
        {error && <p className="error">{error}</p>}
        {!profile && !error && <p>Carregando...</p>}
        {profile && (
          <div className="profileStats">
            <div><span>Usuario</span><strong>{profile.username}</strong></div>
            <div><span>Conta criada</span><strong>{createdAt}</strong></div>
            <div><span>Personagens</span><strong>{profile.characters_count}</strong></div>
          </div>
        )}
      </section>
    </main>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return <label>{label}<input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>;
}

function TextField({ label, value, onChange }) {
  return <label className="wide">{label}<textarea value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>;
}

function CharacterForm({ go, id }) {
  const [data, setData] = useState(blankCharacter);
  const [loading, setLoading] = useState(Boolean(id));
  const [editing, setEditing] = useState(!id);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    request(`/characters/${id}`)
      .then((character) => setData({ ...blankCharacter, ...character.data }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key, value) => setData((current) => ({ ...current, [key]: value }));
  const setSkill = (skill, key, value) => {
    setData((current) => ({
      ...current,
      habilidades: {
        ...current.habilidades,
        [skill]: { ...(current.habilidades?.[skill] || {}), [key]: value }
      }
    }));
  };

  async function save() {
    setError('');
    try {
      const saved = await request(id ? `/characters/${id}` : '/characters', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify({ data })
      });
      go(`/characters/${saved.id}`);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeCharacter() {
    if (!id || !confirm('Excluir este personagem?')) return;
    setError('');
    try {
      await request(`/characters/${id}`, { method: 'DELETE' });
      go('/characters');
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <main className="centerPage">Carregando...</main>;

  return (
    <main className="formPage">
      <div className="formHeader">
        <h1>{id ? data.nome || 'Personagem' : 'Novo personagem'}</h1>
        <div className="actions">
          {id && <button onClick={() => setEditing(!editing)}>{editing ? 'Visualizar' : 'Alterar ficha'}</button>}
          {id && <button className="danger" onClick={removeCharacter}><Trash2 size={18} />Excluir</button>}
          <button className="primary" onClick={save}><Save size={18} />Salvar</button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <fieldset disabled={!editing} className="sheetGrid">
        <section className="parchment">
          <h2>Identidade</h2>
          <div className="twoCols">
            <Field label="Nome" value={data.nome} onChange={(v) => set('nome', v)} />
            <Field label="Casa" value={data.casa} onChange={(v) => set('casa', v)} />
            <Field label="Idade" value={data.idade} onChange={(v) => set('idade', v)} />
            <Field label="Sexo" value={data.sexo} onChange={(v) => set('sexo', v)} />
            <Field label="Jogador" value={data.jogador} onChange={(v) => set('jogador', v)} />
            <Field label="Nivel" type="number" value={data.nivel} onChange={(v) => set('nivel', v)} />
          </div>
          <TextField label="Descricao / mote" value={data.descricao} onChange={(v) => set('descricao', v)} />
          <h2>Habilidades</h2>
          <div className="skills">
            {skills.map((skill) => (
              <div className="skillRow" key={skill}>
                <span>{skill}</span>
                <input placeholder="Grau" value={data.habilidades?.[skill]?.grau || ''} onChange={(e) => setSkill(skill, 'grau', e.target.value)} />
                <input placeholder="Especialidade" value={data.habilidades?.[skill]?.especialidade || ''} onChange={(e) => setSkill(skill, 'especialidade', e.target.value)} />
              </div>
            ))}
          </div>
          <TextField label="Qualidades e defeitos" value={data.destino} onChange={(v) => set('destino', v)} />
        </section>
        <section className="parchment">
          <h2>Conflito</h2>
          <div className="twoCols">
            <Field label="Defesa em Intriga" value={data.intriga} onChange={(v) => set('intriga', v)} />
            <Field label="Defesa em Combate" value={data.combate} onChange={(v) => set('combate', v)} />
            <Field label="Saude" value={data.saude} onChange={(v) => set('saude', v)} />
            <Field label="Ferimentos" value={data.ferimentos} onChange={(v) => set('ferimentos', v)} />
            <Field label="Lesoes" value={data.lesoes} onChange={(v) => set('lesoes', v)} />
            <Field label="Movimento" value={data.movimento} onChange={(v) => set('movimento', v)} />
            <Field label="Corrida" value={data.corrida} onChange={(v) => set('corrida', v)} />
            <Field label="Armadura" value={data.armadura} onChange={(v) => set('armadura', v)} />
          </div>
          <TextField label="Armas / ataques" value={data.armas} onChange={(v) => set('armas', v)} />
          <TextField label="Equipamento pessoal" value={data.equipamentos} onChange={(v) => set('equipamentos', v)} />
          <h2>Aparencia</h2>
          <div className="twoCols">
            <Field label="Altura" value={data.altura} onChange={(v) => set('altura', v)} />
            <Field label="Peso" value={data.peso} onChange={(v) => set('peso', v)} />
            <Field label="Olhos" value={data.olhos} onChange={(v) => set('olhos', v)} />
            <Field label="Cabelos" value={data.cabelos} onChange={(v) => set('cabelos', v)} />
          </div>
          <TextField label="Marcas de distincao" value={data.marcas} onChange={(v) => set('marcas', v)} />
          <TextField label="Detalhes" value={data.detalhes} onChange={(v) => set('detalhes', v)} />
        </section>
        <section className="parchment full">
          <h2>Personalidade e Historia</h2>
          <div className="twoCols">
            <Field label="Objetivo" value={data.objetivo} onChange={(v) => set('objetivo', v)} />
            <Field label="Motivacao" value={data.motivacao} onChange={(v) => set('motivacao', v)} />
            <Field label="Virtude" value={data.virtude} onChange={(v) => set('virtude', v)} />
            <Field label="Vicio" value={data.vicio} onChange={(v) => set('vicio', v)} />
          </div>
          <TextField label="Personalidade" value={data.personalidade} onChange={(v) => set('personalidade', v)} />
          <TextField label="Historia" value={data.historia} onChange={(v) => set('historia', v)} />
          <div className="threeCols">
            <TextField label="Juramentos" value={data.juramentos} onChange={(v) => set('juramentos', v)} />
            <TextField label="Obrigacoes" value={data.obrigacoes} onChange={(v) => set('obrigacoes', v)} />
            <TextField label="Aliados" value={data.aliados} onChange={(v) => set('aliados', v)} />
            <TextField label="Inimigos" value={data.inimigos} onChange={(v) => set('inimigos', v)} />
            <TextField label="Posses" value={data.posses} onChange={(v) => set('posses', v)} />
            <TextField label="Dinheiro / Experiencia" value={`${data.dinheiro || ''}${data.experiencia ? ` | XP: ${data.experiencia}` : ''}`} onChange={(v) => set('dinheiro', v)} />
          </div>
        </section>
      </fieldset>
    </main>
  );
}

function Characters({ go }) {
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState('');

  const loadCharacters = () => request('/characters').then(setCharacters).catch((err) => setError(err.message));

  useEffect(() => {
    loadCharacters();
  }, []);

  async function removeCharacter(character) {
    if (!confirm(`Excluir ${character.name}?`)) return;
    setError('');
    try {
      await request(`/characters/${character.id}`, { method: 'DELETE' });
      setCharacters((current) => current.filter((item) => item.id !== character.id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="listPage">
      <div className="formHeader">
        <h1>Personagens</h1>
        <button className="primary" onClick={() => go('/new')}><Plus size={18} />Novo</button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="characterList">
        {characters.map((character) => (
          <article key={character.id}>
            <strong>{character.name}</strong>
            <div className="rowActions">
              <button onClick={() => go(`/characters/${character.id}`)}><Eye size={18} />Ver</button>
              <button className="danger" onClick={() => removeCharacter(character)}><Trash2 size={18} />Excluir</button>
            </div>
          </article>
        ))}
        {!characters.length && <p>Nenhum personagem salvo.</p>}
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
