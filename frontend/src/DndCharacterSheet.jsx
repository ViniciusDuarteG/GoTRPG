import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const abilities = [
  ['forca', 'Força', 'FOR'],
  ['destreza', 'Destreza', 'DES'],
  ['constituicao', 'Constituição', 'CON'],
  ['inteligencia', 'Inteligência', 'INT'],
  ['sabedoria', 'Sabedoria', 'SAB'],
  ['carisma', 'Carisma', 'CAR']
];

const skills = [
  ['acrobacia', 'Acrobacia', 'destreza'],
  ['adestrarAnimais', 'Adestrar Animais', 'sabedoria'],
  ['arcanismo', 'Arcanismo', 'inteligencia'],
  ['atletismo', 'Atletismo', 'forca'],
  ['atuacao', 'Atuação', 'carisma'],
  ['enganacao', 'Enganação', 'carisma'],
  ['furtividade', 'Furtividade', 'destreza'],
  ['historia', 'História', 'inteligencia'],
  ['intimidacao', 'Intimidação', 'carisma'],
  ['intuicao', 'Intuição', 'sabedoria'],
  ['investigacao', 'Investigação', 'inteligencia'],
  ['medicina', 'Medicina', 'sabedoria'],
  ['natureza', 'Natureza', 'inteligencia'],
  ['percepcao', 'Percepção', 'sabedoria'],
  ['persuasao', 'Persuasão', 'carisma'],
  ['prestidigitacao', 'Prestidigitação', 'destreza'],
  ['religiao', 'Religião', 'inteligencia'],
  ['sobrevivencia', 'Sobrevivência', 'sabedoria']
];

const classes = ['Bárbaro', 'Bardo', 'Bruxo', 'Clérigo', 'Druida', 'Feiticeiro', 'Guerreiro', 'Ladino', 'Mago', 'Monge', 'Paladino', 'Patrulheiro'];

export function createBlankDndCharacter() {
  return {
    sistema: 'dnd5e', nome: '', imagem: '', jogador: '', classe: '', nivel: '1', especie: '', antecedente: '', alinhamento: '', xp: '0',
    inspiracao: false, atributos: Object.fromEntries(abilities.map(([id]) => [id, 10])),
    salvaguardas: Object.fromEntries(abilities.map(([id]) => [id, false])),
    pericias: Object.fromEntries(skills.map(([id]) => [id, 0])),
    ca: '10', bonusIniciativa: '0', deslocamento: '9', pvMax: '', pvAtual: '', pvTemp: '', dadosVida: '',
    testesMorte: { sucessos: 0, falhas: 0 }, ataques: [],
    proficienciasIdiomas: '', equipamento: '', moedas: { pc: '', pp: '', pe: '', po: '', pl: '' },
    caracteristicas: '', tracos: '', ideais: '', vinculos: '', defeitos: '', aparencia: '', historia: '',
    magia: { habilidade: '', truques: '', magias: '', slots: Object.fromEntries(Array.from({ length: 9 }, (_, index) => [index + 1, { total: '', usados: '' }])) }
  };
}

export function mergeDndCharacter(value = {}) {
  const blank = createBlankDndCharacter();
  return {
    ...blank,
    ...value,
    sistema: 'dnd5e',
    atributos: { ...blank.atributos, ...(value.atributos || {}) },
    salvaguardas: { ...blank.salvaguardas, ...(value.salvaguardas || {}) },
    pericias: { ...blank.pericias, ...(value.pericias || {}) },
    testesMorte: { ...blank.testesMorte, ...(value.testesMorte || {}) },
    moedas: { ...blank.moedas, ...(value.moedas || {}) },
    ataques: Array.isArray(value.ataques) ? value.ataques : [],
    magia: {
      ...blank.magia,
      ...(value.magia || {}),
      slots: { ...blank.magia.slots, ...(value.magia?.slots || {}) }
    }
  };
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function modifier(score) {
  return Math.floor((number(score, 10) - 10) / 2);
}

function proficiency(level) {
  return Math.ceil(Math.min(20, Math.max(1, number(level, 1))) / 4) + 1;
}

function signed(value) {
  return value >= 0 ? `+${value}` : String(value);
}

function InputField({ label, value, onChange, type = 'text', min, max, className = '' }) {
  return <label className={className}>{label}<input type={type} min={min} max={max} value={value ?? ''} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextAreaField({ label, value, onChange, className = '' }) {
  return <label className={className}>{label}<textarea value={value || ''} onChange={(event) => onChange(event.target.value)} /></label>;
}

function DotTrack({ label, value, onChange }) {
  return (
    <div className="dndDotTrack">
      <span>{label}</span>
      {[1, 2, 3].map((item) => (
        <button key={item} type="button" className={number(value) >= item ? 'active' : ''} aria-label={`${label} ${item}`} onClick={() => onChange(number(value) === item ? item - 1 : item)} />
      ))}
    </div>
  );
}

export default function DndCharacterSheet({ data, onChange, ImageField }) {
  const sheet = mergeDndCharacter(data);
  const prof = proficiency(sheet.nivel);
  const set = (key, value) => onChange({ ...sheet, [key]: value });
  const setNested = (group, key, value) => onChange({ ...sheet, [group]: { ...sheet[group], [key]: value } });
  const initiative = modifier(sheet.atributos.destreza) + number(sheet.bonusIniciativa);
  const perceptionRank = number(sheet.pericias.percepcao);
  const passivePerception = 10 + modifier(sheet.atributos.sabedoria) + (prof * perceptionRank);
  const spellAbility = sheet.magia.habilidade;
  const spellModifier = spellAbility ? modifier(sheet.atributos[spellAbility]) : 0;

  function addAttack() {
    set('ataques', [...sheet.ataques, { nome: '', bonus: '', dano: '', tipo: '' }]);
  }

  function updateAttack(index, key, value) {
    set('ataques', sheet.ataques.map((attack, itemIndex) => itemIndex === index ? { ...attack, [key]: value } : attack));
  }

  function removeAttack(index) {
    set('ataques', sheet.ataques.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="dndSheet">
      <section className="parchment dndIdentity full">
        <div className="dndEdition"><span>D&amp;D</span><strong>5e</strong></div>
        <ImageField value={sheet.imagem} onChange={(value) => set('imagem', value)} />
        <div className="dndIdentityFields">
          <InputField label="Nome do personagem" value={sheet.nome} onChange={(value) => set('nome', value)} className="dndCharacterName" />
          <label>Classe<select value={sheet.classe} onChange={(event) => set('classe', event.target.value)}><option value="">Selecione</option>{classes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <InputField label="Nível" type="number" min="1" max="20" value={sheet.nivel} onChange={(value) => set('nivel', value)} />
          <InputField label="Espécie / Raça" value={sheet.especie} onChange={(value) => set('especie', value)} />
          <InputField label="Antecedente" value={sheet.antecedente} onChange={(value) => set('antecedente', value)} />
          <InputField label="Alinhamento" value={sheet.alinhamento} onChange={(value) => set('alinhamento', value)} />
          <InputField label="Jogador" value={sheet.jogador} onChange={(value) => set('jogador', value)} />
          <InputField label="XP" type="number" min="0" value={sheet.xp} onChange={(value) => set('xp', value)} />
        </div>
      </section>

      <section className="parchment">
        <h2>Atributos e Salvaguardas</h2>
        <div className="dndAbilityGrid">
          {abilities.map(([id, label, short]) => {
            const mod = modifier(sheet.atributos[id]);
            return (
              <div className="dndAbility" key={id}>
                <span>{short}</span>
                <strong>{signed(mod)}</strong>
                <input aria-label={`${label} valor`} type="number" min="1" max="30" value={sheet.atributos[id]} onChange={(event) => setNested('atributos', id, event.target.value)} />
                <label title={`Salvaguarda de ${label}`}>
                  <input type="checkbox" checked={Boolean(sheet.salvaguardas[id])} onChange={(event) => setNested('salvaguardas', id, event.target.checked)} />
                  Salv. {signed(mod + (sheet.salvaguardas[id] ? prof : 0))}
                </label>
              </div>
            );
          })}
        </div>
        <div className="dndQuickStats">
          <div><span>Bônus de proficiência</span><strong>{signed(prof)}</strong></div>
          <label className="dndInspiration"><input type="checkbox" checked={Boolean(sheet.inspiracao)} onChange={(event) => set('inspiracao', event.target.checked)} /><span>Inspiração</span></label>
          <div><span>Percepção passiva</span><strong>{passivePerception}</strong></div>
        </div>

        <h2>Perícias</h2>
        <div className="dndSkills">
          {skills.map(([id, label, ability]) => {
            const rank = number(sheet.pericias[id]);
            const total = modifier(sheet.atributos[ability]) + (prof * rank);
            return (
              <label key={id}>
                <select aria-label={`Proficiência em ${label}`} value={rank} onChange={(event) => setNested('pericias', id, number(event.target.value))}>
                  <option value="0">○</option><option value="1">●</option><option value="2">◆</option>
                </select>
                <strong>{signed(total)}</strong><span>{label}</span><small>{abilities.find(([key]) => key === ability)?.[2]}</small>
              </label>
            );
          })}
        </div>
      </section>

      <section className="parchment">
        <h2>Combate e Vitalidade</h2>
        <div className="dndCombatStats">
          <InputField label="Classe de Armadura" type="number" min="0" value={sheet.ca} onChange={(value) => set('ca', value)} />
          <div><span>Iniciativa</span><strong>{signed(initiative)}</strong><InputField label="Bônus extra" type="number" value={sheet.bonusIniciativa} onChange={(value) => set('bonusIniciativa', value)} /></div>
          <InputField label="Deslocamento (m)" type="number" min="0" value={sheet.deslocamento} onChange={(value) => set('deslocamento', value)} />
        </div>
        <div className="threeCols dndHpFields">
          <InputField label="PV máximos" type="number" min="0" value={sheet.pvMax} onChange={(value) => set('pvMax', value)} />
          <InputField label="PV atuais" type="number" min="0" value={sheet.pvAtual} onChange={(value) => set('pvAtual', value)} />
          <InputField label="PV temporários" type="number" min="0" value={sheet.pvTemp} onChange={(value) => set('pvTemp', value)} />
        </div>
        <div className="dndRecovery">
          <InputField label="Dados de vida" value={sheet.dadosVida} onChange={(value) => set('dadosVida', value)} />
          <div className="dndDeathSaves">
            <strong>Testes contra a morte</strong>
            <DotTrack label="Sucessos" value={sheet.testesMorte.sucessos} onChange={(value) => setNested('testesMorte', 'sucessos', value)} />
            <DotTrack label="Falhas" value={sheet.testesMorte.falhas} onChange={(value) => setNested('testesMorte', 'falhas', value)} />
          </div>
        </div>

        <div className="dndSectionHeading"><h2>Ataques</h2><button type="button" onClick={addAttack}><Plus size={16} />Adicionar</button></div>
        <div className="dndAttackTable">
          <div className="dndAttackHeader"><span>Nome</span><span>Bônus</span><span>Dano</span><span>Tipo / notas</span><span /></div>
          {sheet.ataques.map((attack, index) => (
            <div className="dndAttackRow" key={index}>
              <input aria-label="Nome do ataque" value={attack.nome || ''} onChange={(event) => updateAttack(index, 'nome', event.target.value)} />
              <input aria-label="Bônus do ataque" value={attack.bonus || ''} onChange={(event) => updateAttack(index, 'bonus', event.target.value)} />
              <input aria-label="Dano do ataque" value={attack.dano || ''} onChange={(event) => updateAttack(index, 'dano', event.target.value)} />
              <input aria-label="Tipo ou notas do ataque" value={attack.tipo || ''} onChange={(event) => updateAttack(index, 'tipo', event.target.value)} />
              <button type="button" aria-label="Remover ataque" onClick={() => removeAttack(index)}><Trash2 size={16} /></button>
            </div>
          ))}
          {!sheet.ataques.length && <p>Nenhum ataque adicionado.</p>}
        </div>
      </section>

      <section className="parchment">
        <h2>Equipamento e Proficiências</h2>
        <div className="dndCoins">
          {Object.entries({ pc: 'PC', pp: 'PP', pe: 'PE', po: 'PO', pl: 'PL' }).map(([key, label]) => (
            <InputField key={key} label={label} type="number" min="0" value={sheet.moedas[key]} onChange={(value) => setNested('moedas', key, value)} />
          ))}
        </div>
        <TextAreaField label="Equipamento" value={sheet.equipamento} onChange={(value) => set('equipamento', value)} />
        <TextAreaField label="Outras proficiências e idiomas" value={sheet.proficienciasIdiomas} onChange={(value) => set('proficienciasIdiomas', value)} />
        <h2>Características</h2>
        <TextAreaField label="Características e talentos" value={sheet.caracteristicas} onChange={(value) => set('caracteristicas', value)} />
      </section>

      <section className="parchment">
        <h2>Personalidade</h2>
        <TextAreaField label="Traços de personalidade" value={sheet.tracos} onChange={(value) => set('tracos', value)} />
        <TextAreaField label="Ideais" value={sheet.ideais} onChange={(value) => set('ideais', value)} />
        <TextAreaField label="Vínculos" value={sheet.vinculos} onChange={(value) => set('vinculos', value)} />
        <TextAreaField label="Defeitos" value={sheet.defeitos} onChange={(value) => set('defeitos', value)} />
        <TextAreaField label="Aparência" value={sheet.aparencia} onChange={(value) => set('aparencia', value)} />
        <TextAreaField label="História" value={sheet.historia} onChange={(value) => set('historia', value)} />
      </section>

      <section className="parchment full">
        <h2>Conjuração</h2>
        <div className="dndSpellStats">
          <label>Habilidade-chave<select value={spellAbility} onChange={(event) => setNested('magia', 'habilidade', event.target.value)}><option value="">Nenhuma</option>{abilities.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <div><span>CD para evitar magia</span><strong>{spellAbility ? 8 + prof + spellModifier : '—'}</strong></div>
          <div><span>Bônus de ataque mágico</span><strong>{spellAbility ? signed(prof + spellModifier) : '—'}</strong></div>
        </div>
        <div className="dndSpellSlots">
          {Array.from({ length: 9 }, (_, index) => index + 1).map((level) => {
            const slot = sheet.magia.slots[level] || {};
            return <div key={level}><strong>{level}º</strong><InputField label="Total" type="number" min="0" value={slot.total} onChange={(value) => setNested('magia', 'slots', { ...sheet.magia.slots, [level]: { ...slot, total: value } })} /><InputField label="Usados" type="number" min="0" value={slot.usados} onChange={(value) => setNested('magia', 'slots', { ...sheet.magia.slots, [level]: { ...slot, usados: value } })} /></div>;
          })}
        </div>
        <div className="twoCols">
          <TextAreaField label="Truques" value={sheet.magia.truques} onChange={(value) => setNested('magia', 'truques', value)} />
          <TextAreaField label="Magias conhecidas / preparadas" value={sheet.magia.magias} onChange={(value) => setNested('magia', 'magias', value)} />
        </div>
      </section>
    </div>
  );
}
