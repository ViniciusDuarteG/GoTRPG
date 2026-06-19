import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, Copy, Eye, Image as ImageIcon, LogOut, Plus, Save, ScrollText, Shield, Swords, Sword, Trash2, Upload, User, Users, X } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || '/api';

const skills = [
  'Agilidade', 'Astucia', 'Atletismo', 'Conhecimento', 'Cura', 'Enganacao',
  'Furtividade', 'Guerra', 'Idioma', 'Ladinagem', 'Lidar com Animais',
  'Luta', 'Percepcao', 'Persuasao', 'Pontaria', 'Sobrevivencia', 'Status',
  'Vigor', 'Vontade'
];

const houseOptions = Array.from(new Set([
  'Sem Casa', 'Povo Livre', 'Casa Stark', 'Casa Lannister', 'Casa Targaryen',
  'Casa Baratheon', 'Casa Greyjoy', 'Casa Tyrell', 'Casa Martell', 'Casa Tully',
  'Casa Arryn', 'Casa Bolton', 'Casa Frey', 'Casa Mormont', 'Casa Karstark',
  'Casa Umber', 'Casa Reed', 'Casa Glover', 'Casa Manderly', 'Casa Dustin',
  'Casa Ryswell', 'Casa Hornwood', 'Casa Cerwyn', 'Casa Tallhart', 'Casa Cassel',
  'Casa Poole', 'Casa Flint', 'Casa Locke', 'Casa Blackwood', 'Casa Bracken',
  'Casa Mallister', 'Casa Piper', 'Casa Vance', 'Casa Darry', 'Casa Mooton',
  'Casa Whent', 'Casa Smallwood', 'Casa Ryger', 'Casa Roote', 'Casa Royce',
  'Casa Baelish', 'Casa Waynwood', 'Casa Corbray', 'Casa Grafton', 'Casa Hunter',
  'Casa Redfort', 'Casa Belmore', 'Casa Templeton', 'Casa Lynderly',
  'Casa Velaryon', 'Casa Celtigar', 'Casa Massey', 'Casa Stokeworth',
  'Casa Rosby', 'Casa Hayford', 'Casa Darklyn', 'Casa Rykker', 'Casa Staunton',
  'Casa Sunglass', 'Casa Clegane', 'Casa Payne', 'Casa Lefford',
  'Casa Crakehall', 'Casa Marbrand', 'Casa Brax', 'Casa Westerling',
  'Casa Swyft', 'Casa Farman', 'Casa Banefort', 'Casa Reyne', 'Casa Tarbeck',
  'Casa Dondarrion', 'Casa Caron', 'Casa Swann', 'Casa Selmy', 'Casa Tarth',
  'Casa Penrose', 'Casa Estermont', 'Casa Connington', 'Casa Morrigen',
  'Casa Wylde', 'Casa Trant', 'Casa Fell', 'Casa Buckler', 'Casa Florent',
  'Casa Hightower', 'Casa Redwyne', 'Casa Tarly', 'Casa Rowan', 'Casa Oakheart',
  'Casa Fossoway', 'Casa Beesbury', 'Casa Cuy', 'Casa Merryweather',
  'Casa Mullendore', 'Casa Caswell', 'Casa Crane', 'Casa Peake',
  'Casa Ambrose', 'Casa Ashford', 'Casa Dayne', 'Casa Yronwood', 'Casa Uller',
  'Casa Fowler', 'Casa Blackmont', 'Casa Jordayne', 'Casa Allyrion',
  'Casa Manwoody', 'Casa Toland', 'Casa Gargalen', 'Casa Qorgyle',
  'Casa Harlaw', 'Casa Goodbrother', 'Casa Drumm', 'Casa Farwynd',
  'Casa Blacktyde', 'Casa Botley', 'Casa Merlyn', 'Casa Sunderly',
  'Casa Volmark', 'Casa Tawney', 'Casa Kenning', 'Casa Blackfyre',
  'Casa Strong', 'Casa Mudd', 'Casa Durrandon', 'Casa Hoare',
  'Casa Gardener', 'Casa Justman', 'Casa Lothston', 'Casa Harroway',
  'Casa Toyne', 'Casa Cole'
]));

const blankCharacter = {
  nome: '', imagem: '', casa: 'Sem Casa', idade: '', sexo: '', jogador: '', descricao: '',
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
    if (route.startsWith('/campaigns/join/')) return <JoinCampaign go={go} code={route.split('/')[3]} authed={authed} />;
    if (!authed) return <Auth go={go} setToken={setToken} />;
    if (route === '/dashboard') return <Dashboard go={go} />;
    if (route === '/profile') return <Profile />;
    if (route === '/new') return <CharacterForm go={go} />;
    if (route === '/characters') return <Characters go={go} />;
    if (route.startsWith('/characters/')) return <CharacterForm go={go} id={route.split('/')[2]} />;
    if (route === '/campaigns') return <Campaigns go={go} />;
    if (route === '/campaigns/new') return <CampaignForm go={go} />;
    if (route.startsWith('/campaigns/')) return <CampaignDetail go={go} id={route.split('/')[2]} />;
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
          {authed && <button onClick={() => go('/campaigns')}><Swords size={17} />Campanhas</button>}
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
      const pendingRoute = localStorage.getItem('gotrpg_pending_route');
      localStorage.removeItem('gotrpg_pending_route');
      go(pendingRoute || '/dashboard');
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
        <button className="bigAction" onClick={() => go('/campaigns/new')}><Swords />Nova campanha</button>
        <button className="bigAction" onClick={() => go('/campaigns')}><Users />Ver campanhas</button>
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

function HouseField({ value, onChange }) {
  return (
    <label>
      Casa
      <select required value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>Selecione uma casa</option>
        {houseOptions.map((house) => <option key={house} value={house}>{house}</option>)}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange }) {
  return <label className="wide">{label}<textarea value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>;
}

function ImageField({ value, onChange }) {
  const [availableImages, setAvailableImages] = useState([]);

  useEffect(() => {
    request('/character-images')
      .then((images) => setAvailableImages(images.map((image) => ({
        ...image,
        src: `${API}/character-images/${encodeURIComponent(image.file)}`
      }))))
      .catch(() => setAvailableImages([]));
  }, []);

  function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ''));
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  return (
    <div className="imageField">
      <div className="imagePreview">
        {value ? <img src={value} alt="Imagem do personagem" /> : <ImageIcon size={44} />}
      </div>
      <div className="imagePicker">
        <div className="imageActions">
          <label className="uploadButton">
            <Upload size={18} />
            Carregar imagem
            <input type="file" accept="image/*" onChange={upload} />
          </label>
          {value && <button type="button" onClick={() => onChange('')}><X size={18} />Remover</button>}
        </div>
        <strong>Imagens disponiveis</strong>
        <div className="availableImages">
          {availableImages.map((image) => (
            <button type="button" key={image.src} onClick={() => onChange(image.src)} title={image.name}>
              <img src={image.src} alt={image.name} />
            </button>
          ))}
          {!availableImages.length && <span>Nenhuma imagem.</span>}
        </div>
      </div>
    </div>
  );
}

function CharacterForm({ go, id }) {
  const [data, setData] = useState(blankCharacter);
  const [loading, setLoading] = useState(Boolean(id));
  const [editing, setEditing] = useState(!id);
  const [canEdit, setCanEdit] = useState(!id);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    request(`/characters/${id}`)
      .then((character) => {
        const loaded = { ...blankCharacter, ...character.data };
        setData({ ...loaded, casa: houseOptions.includes(loaded.casa) ? loaded.casa : 'Sem Casa' });
        setCanEdit(Boolean(character.can_edit));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const houseValid = houseOptions.includes(data.casa);

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
    if (!houseValid) {
      setError('Selecione uma casa valida');
      return;
    }
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
          {id && canEdit && <button onClick={() => setEditing(!editing)}>{editing ? 'Visualizar' : 'Alterar ficha'}</button>}
          {id && canEdit && <button className="danger" onClick={removeCharacter}><Trash2 size={18} />Excluir</button>}
          {canEdit && <button className="primary" disabled={!houseValid} onClick={save}><Save size={18} />Salvar</button>}
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <fieldset disabled={!editing || !canEdit} className="sheetGrid">
        <section className="parchment">
          <h2>Identidade</h2>
          <ImageField value={data.imagem} onChange={(v) => set('imagem', v)} />
          <div className="twoCols">
            <Field label="Nome" value={data.nome} onChange={(v) => set('nome', v)} />
            <HouseField value={data.casa} onChange={(v) => set('casa', v)} />
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

function Campaigns({ go }) {
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    request('/campaigns').then(setCampaigns).catch((err) => setError(err.message));
  }, []);

  return (
    <main className="listPage">
      <div className="formHeader">
        <h1>Campanhas</h1>
        <button className="primary" onClick={() => go('/campaigns/new')}><Plus size={18} />Nova</button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="characterList">
        {campaigns.map((campaign) => (
          <article key={campaign.id}>
            <div>
              <strong>{campaign.name}</strong>
              <p>{campaign.description || 'Sem descricao'}</p>
              <small>{campaign.members_count} membros / {campaign.characters_count} fichas</small>
            </div>
            <div className="rowActions">
              <button onClick={() => go(`/campaigns/${campaign.id}`)}><Eye size={18} />Abrir</button>
            </div>
          </article>
        ))}
        {!campaigns.length && <p>Nenhuma campanha.</p>}
      </div>
    </main>
  );
}

function CampaignForm({ go }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const campaign = await request('/campaigns', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      go(`/campaigns/${campaign.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="centerPage">
      <form className="authPanel campaignForm" onSubmit={submit}>
        <Swords size={42} />
        <h1>Nova campanha</h1>
        <Field label="Nome" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <TextField label="Descricao" value={form.description} onChange={(description) => setForm({ ...form, description })} />
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit"><Save size={18} />Criar</button>
      </form>
    </main>
  );
}

function JoinCampaign({ go, code, authed }) {
  const [campaign, setCampaign] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    request(`/campaigns/invite/${code}`).then(setCampaign).catch((err) => setError(err.message));
  }, [code]);

  async function join() {
    if (!authed) {
      localStorage.setItem('gotrpg_pending_route', `/campaigns/join/${code}`);
      go('/auth');
      return;
    }
    setError('');
    try {
      const result = await request(`/campaigns/join/${code}`, { method: 'POST' });
      go(`/campaigns/${result.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="centerPage">
      <section className="profilePanel">
        <Users size={42} />
        <h1>Entrar na campanha</h1>
        {error && <p className="error">{error}</p>}
        {!campaign && !error && <p>Carregando...</p>}
        {campaign && (
          <>
            <h2>{campaign.name}</h2>
            <p>{campaign.description || 'Sem descricao'}</p>
            <small>Mestre: {campaign.owner_username}</small>
            <button className="primary" onClick={join}>{authed ? 'Entrar' : 'Login para entrar'}</button>
          </>
        )}
      </section>
    </main>
  );
}

function CampaignDetail({ go, id }) {
  const [campaign, setCampaign] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selected, setSelected] = useState('');
  const [diary, setDiary] = useState('');
  const [diaryStatus, setDiaryStatus] = useState('');
  const [error, setError] = useState('');

  const loadCampaign = () => request(`/campaigns/${id}`)
    .then((data) => {
      setCampaign(data);
      setDiary(data.diary?.content || '');
    })
    .catch((err) => setError(err.message));

  useEffect(() => {
    loadCampaign();
    request('/characters').then(setCharacters).catch(() => {});
  }, [id]);

  const inviteLink = `${location.origin}${location.pathname}#/campaigns/join/${campaign?.invite_code || ''}`;
  const availableCharacters = characters.filter((character) => !campaign?.characters.some((item) => item.id === character.id));

  async function addCharacter() {
    if (!selected) return;
    setError('');
    try {
      await request(`/campaigns/${id}/characters`, {
        method: 'POST',
        body: JSON.stringify({ character_id: selected })
      });
      setSelected('');
      loadCampaign();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeCharacter(characterId) {
    setError('');
    try {
      await request(`/campaigns/${id}/characters/${characterId}`, { method: 'DELETE' });
      loadCampaign();
    } catch (err) {
      setError(err.message);
    }
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteLink);
  }

  async function saveDiary() {
    setError('');
    setDiaryStatus('');
    try {
      const saved = await request(`/campaigns/${id}/diary`, {
        method: 'PUT',
        body: JSON.stringify({ content: diary })
      });
      setCampaign((current) => current ? { ...current, diary: saved } : current);
      setDiaryStatus('Salvo');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!campaign && !error) return <main className="centerPage">Carregando...</main>;

  return (
    <main className="listPage">
      {error && <p className="error">{error}</p>}
      {campaign && (
        <>
          <div className="formHeader">
            <div>
              <h1>{campaign.name}</h1>
              <p>{campaign.description || 'Sem descricao'}</p>
              <small>Mestre: {campaign.owner_username}</small>
            </div>
            <button onClick={copyInvite}><Copy size={18} />Copiar link</button>
          </div>

          <div className="campaignLayout">
            <div>
              <section className="panelBlock">
                <h2>Adicionar ficha</h2>
                <div className="inlineForm">
                  <select value={selected} onChange={(event) => setSelected(event.target.value)}>
                    <option value="">Escolha um personagem</option>
                    {availableCharacters.map((character) => (
                      <option key={character.id} value={character.id}>{character.name}</option>
                    ))}
                  </select>
                  <button className="primary" onClick={addCharacter}><Plus size={18} />Adicionar</button>
                </div>
              </section>

              <section className="panelBlock">
                <h2>Fichas da campanha</h2>
                <div className="characterList">
                  {campaign.characters.map((character) => (
                    <article key={character.id}>
                      <div>
                        <strong>{character.name}</strong>
                        <p>{character.data?.casa || 'Sem casa'} / jogador: {character.data?.jogador || character.owner_username}</p>
                        <small>Dono: {character.owner_username}</small>
                      </div>
                      <div className="rowActions">
                        <button onClick={() => go(`/characters/${character.id}`)}><Eye size={18} />Ver</button>
                        {(campaign.is_owner || character.user_id === campaign.current_user_id) && (
                          <button className="danger" onClick={() => removeCharacter(character.id)}><Trash2 size={18} />Remover</button>
                        )}
                      </div>
                    </article>
                  ))}
                  {!campaign.characters.length && <p>Nenhuma ficha adicionada.</p>}
                </div>
              </section>

              <section className="panelBlock">
                <h2>Membros</h2>
                <div className="memberGrid">
                  {campaign.members.map((member) => <span key={member.id}>{member.username}</span>)}
                </div>
              </section>
            </div>

            <aside className="diaryTab">
              <div className="diaryTitle">
                <ScrollText size={22} />
                <div>
                  <h2>Diario</h2>
                  <span>Sessao 1</span>
                </div>
              </div>
              {campaign.is_owner ? (
                <>
                  <textarea value={diary} onChange={(event) => setDiary(event.target.value)} />
                  <button className="primary" onClick={saveDiary}><Save size={18} />Salvar diario</button>
                  {diaryStatus && <small>{diaryStatus}</small>}
                </>
              ) : (
                <p className="diaryText">{diary || 'Sem anotacoes.'}</p>
              )}
            </aside>
          </div>
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
