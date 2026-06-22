import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpen, Copy, Eye, Image as ImageIcon, LogOut, Minus, Plus, Save, ScrollText, Shield, Swords, Sword, Trash2, Upload, User, Users, X } from 'lucide-react';
import './styles.css';

const API = import.meta.env.VITE_API_URL || '/api';

const skillLabels = {
  Astucia: 'Astúcia',
  Enganacao: 'Enganação',
  Percepcao: 'Percepção',
  Persuasao: 'Persuasão',
  Sobrevivencia: 'Sobrevivência'
};

const skills = [
  'Agilidade', 'Astucia', 'Atletismo', 'Conhecimento', 'Cura', 'Enganacao',
  'Furtividade', 'Guerra', 'Idioma', 'Ladinagem', 'Lidar com Animais',
  'Luta', 'Percepcao', 'Persuasao', 'Pontaria', 'Sobrevivencia', 'Status',
  'Vigor', 'Vontade'
].sort((a, b) => (skillLabels[a] || a).localeCompare(skillLabels[b] || b, 'pt-BR'));

const skillGradeCosts = {
  1: 50,
  3: 10,
  4: 40,
  5: 70,
  6: 100,
  7: 130
};

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
])).sort((a, b) => a.localeCompare(b, 'pt-BR'));

const armorOptions = [
  { name: 'Roupas', defense: 0, movement: 0 },
  { name: 'Robes', defense: 0, movement: 0 },
  { name: 'Acolchoada', defense: 1, movement: -1 },
  { name: 'Couro Macio', defense: 2, movement: -1 },
  { name: 'Couro Rígido', defense: 3, movement: -1 },
  { name: 'Madeira ou ossos', defense: 4, movement: -2 },
  { name: 'Cota de Anéis', defense: 4, movement: -2 },
  { name: 'Peles', defense: 5, movement: -3 },
  { name: 'Cota de Malha', defense: 5, movement: -3 },
  { name: 'Cota de Escamas', defense: 6, movement: -3 },
  { name: 'Brigantina', defense: 8, movement: -4 },
  { name: 'Meia Armadura', defense: 9, movement: -5 },
  { name: 'Placas', defense: 10, movement: -5 }
].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

const equipmentOptions = [
  { name: 'Broquel', weight: '1,5 kg', price: '1 DO' },
  { name: 'Escudo', weight: '2,5 kg', price: '1 DO' },
  { name: 'Escudo de Corpo', weight: '5 kg', price: '1 DO' },
  { name: 'Escudo Grande', weight: '3 kg', price: '1 DO' },
  { name: 'Robes', weight: '10 kg', price: '1 DO' },
  { name: 'Acolchoada', weight: '5 kg', price: '1 DO' },
  { name: 'Couro Macio', weight: '7,5 kg', price: '2 DO' },
  { name: 'Couro Rígido', weight: '9 kg', price: '2 DO' },
  { name: 'Ossos ou Madeira', weight: '12,5 kg', price: '2 DO' },
  { name: 'Cota de Anéis', weight: '10 kg', price: '3 DO' },
  { name: 'Peles', weight: '12,5 kg', price: '2 DO' },
  { name: 'Cota de Malha', weight: '20 kg', price: '4 DO' },
  { name: 'Couraça', weight: '25 kg', price: '4 DO' },
  { name: 'Cota de Escamas/Moedas', weight: '15 kg', price: '3 DO' },
  { name: 'Talas', weight: '25 kg', price: '5 DO' },
  { name: 'Brigantina', weight: '25 kg', price: '6 DO' },
  { name: 'Meia Armadura', weight: '20 kg', price: '10 DO' },
  { name: 'Placas', weight: '25 kg', price: '50 DO' },
  { name: 'Bolsa de cinto', weight: '', price: '1 DO' },
  { name: 'Corda', weight: '', price: '1 DO' },
  { name: 'Cobertor de inverno', weight: '1,5 kg', price: '2 coroas' },
  { name: 'Corda de cânhamo (15 metros)', weight: '5 kg', price: '5 coroas' },
  { name: 'Corda de seda (15 metros)', weight: '2,5 kg', price: '48 coroas' },
  { name: 'Corrente (3 metros)', weight: '5 kg', price: '24 coroas' },
  { name: 'Equipamento de pescaria', weight: '2 kg', price: '5 coroas' },
  { name: 'Escada (3 metros)', weight: '12,5 kg', price: '1 coroa' },
  { name: 'Espelho de aço', weight: '0,25 kg', price: '24 coroas' },
  { name: 'Estacas de ferro', weight: '', price: '1 DO' },
  { name: 'Ferramentas profissionais comuns', weight: '', price: '1 DO' },
  { name: 'Ferramentas profissionais de especialista', weight: '', price: '1 a 5 DO' },
  { name: 'Fechadura', weight: '0,5 kg', price: '48 coroas' },
  { name: 'Fogo alquímico (frasco)', weight: '0,5 kg', price: '238 coroas' },
  { name: 'Frasco', weight: '1 kg', price: '1 coroa' },
  { name: 'Garrafa de vidro', weight: '1 kg', price: '5 coroas' },
  { name: 'Giz (1 peça)', weight: '—', price: '1 coroa' },
  { name: 'Instrumento musical simples', weight: '', price: '1 DO' },
  { name: 'Jarra', weight: '2 kg', price: '1 coroa' },
  { name: 'Kit de escalada', weight: '6 kg', price: '119 coroas' },
  { name: 'Kit de Meistre', weight: '', price: '1 a 3 DO' },
  { name: 'Kit de primeiros-socorros', weight: '1,5 kg', price: '24 coroas' },
  { name: 'Lâmpada', weight: '0,5 kg', price: '2 coroas' },
  { name: 'Lamparina', weight: '', price: '1 DO' },
  { name: 'Lampião', weight: '', price: '1 DO' },
  { name: 'Lanterna coberta', weight: '1 kg', price: '24 coroas' },
  { name: 'Lanterna furta-fogo', weight: '1 kg', price: '48 coroas' },
  { name: 'Lente de aumento', weight: '—', price: '476 coroas' },
  { name: 'Lente Myresa', weight: '', price: '1 DO' },
  { name: 'Livro', weight: '2,5 kg', price: '119 coroas' },
  { name: 'Luneta', weight: '0,5 kg', price: '4762 coroas' },
  { name: 'Manto', weight: '2 kg', price: '5 coroas' },
  { name: 'Marreta', weight: '5 kg', price: '10 coroas' },
  { name: 'Martelo', weight: '1,5 kg', price: '5 coroas' },
  { name: 'Mochila', weight: '2,5 kg', price: '10 coroas' },
  { name: 'Munição — Flechas (20)', weight: '0,5 kg', price: '5 coroas' },
  { name: 'Munição — Virotes (20)', weight: '0,75 kg', price: '5 coroas' },
  { name: 'Odre', weight: '', price: '1 DO' },
  { name: 'Óleo', weight: '', price: '1 DO' },
  { name: 'Óleo (frasco)', weight: '0,5 kg', price: '1 coroa' },
  { name: 'Olhos Longínquos', weight: '', price: '2 DO' },
  { name: 'Pá', weight: '2,5 kg', price: '10 coroas' },
  { name: 'Panela de ferro', weight: '5 kg', price: '10 coroas' },
  { name: 'Papel (uma folha)', weight: '—', price: '1 coroa' },
  { name: 'Parafina', weight: '—', price: '2 coroas' },
  { name: 'Pavilhão', weight: '', price: '1 DO' },
  { name: 'Pé de cabra', weight: '2,5 kg', price: '10 coroas' },
  { name: 'Pederneira', weight: '', price: '1 DO' },
  { name: 'Pedra de amolar', weight: '—', price: '1 coroa' },
  { name: 'Perfume (frasco)', weight: '—', price: '24 coroas' },
  { name: 'Pergaminho (uma folha)', weight: '—', price: '1 coroa' },
  { name: 'Picareta de minerador', weight: '5 kg', price: '10 coroas' },
  { name: 'Poção de cura', weight: '0,25 kg', price: '238 coroas' },
  { name: 'Porta mapas ou pergaminhos', weight: '0,5 kg', price: '5 coroas' },
  { name: 'Porta virotes', weight: '0,5 kg', price: '5 coroas' },
  { name: 'Pregos de ferro (10)', weight: '2,5 kg', price: '5 coroas' },
  { name: 'Rações de viagem (1 dia)', weight: '1 kg', price: '2 coroas' },
  { name: 'Roldana e polia', weight: '2,5 kg', price: '5 coroas' },
  { name: 'Sabão', weight: '—', price: '1 coroa' },
  { name: 'Saco', weight: '0,25 kg', price: '1 coroa' },
  { name: 'Saco de dormir', weight: '3,5 kg', price: '5 coroas' },
  { name: 'Sachê', weight: '', price: '1 DO' },
  { name: 'Símbolo sagrado — Amuleto', weight: '0,5 kg', price: '24 coroas' },
  { name: 'Símbolo sagrado — Emblema', weight: '—', price: '24 coroas' },
  { name: 'Símbolo sagrado — Relicário', weight: '1 kg', price: '24 coroas' },
  { name: 'Símbolo sagrado — Sinete', weight: '—', price: '24 coroas' },
  { name: 'Símbolo sagrado — Sino', weight: '—', price: '5 coroas' },
  { name: 'Tenda para duas pessoas', weight: '10 kg', price: '10 coroas' },
  { name: 'Tenda de soldado', weight: '', price: '1 DO' },
  { name: 'Tinta preta', weight: '', price: '1 DO' },
  { name: 'Tinta (frasco de 30 ml)', weight: '—', price: '48 coroas' },
  { name: 'Tocha', weight: '0,5 kg', price: '1 coroa' },
  { name: 'Vara (3 metros)', weight: '3,5 kg', price: '1 coroa' },
  { name: 'Vela', weight: '—', price: '1 coroa' },
  { name: 'Veneno básico (frasco)', weight: '—', price: '476 coroas' },
  { name: 'Par de velas', weight: '', price: '1 DO' }
].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

const weaponOptions = [
  { name: 'Bola com Corrente', weight: '4 kg', price: '1 DO', damage: '5 + 1d8' },
  { name: 'Cajado', weight: '2 kg', price: '-', damage: '3 + 1d6' },
  { name: 'Porrete/Bordão', weight: '1,5 kg', price: '1 DO', damage: '2 + 1d4' },
  { name: 'Maça', weight: '5 kg', price: '1 DO', damage: '5 + 1d6' },
  { name: 'Mangual', weight: '6 kg', price: '1 DO', damage: '6 + 1d10' },
  { name: 'Mangual com Cravos', weight: '4 kg', price: '1 DO', damage: '5 + 1d8' },
  { name: 'Marreta', weight: '6,5 kg', price: '1 DO', damage: '7 + 1d12' },
  { name: 'Martelo de Guerra', weight: '4 kg', price: '1 DO', damage: '6 + 1d10' },
  { name: 'Alabarda', weight: '5,5 kg', price: '1 DO', damage: '6 + 1d10' },
  { name: 'Ferramenta de Aldeão', weight: '4,5 kg', price: '1 DO', damage: '4 + 1d6' },
  { name: 'Machado de Haste', weight: '4,5 kg', price: '1 DO', damage: '6 + 1d10' },
  { name: 'Chicote', weight: '1 kg', price: '1 DO', damage: '2 + 1d4' },
  { name: 'Faca', weight: '0,5 kg', price: '1 DO', damage: '3 + 1d4' },
  { name: 'Improvisada', weight: '-', price: '0 DO', damage: '2 + 1d4' },
  { name: 'Manopla', weight: '-', price: '-', damage: '2 + 1d4' },
  { name: 'Punho', weight: '-', price: '0 DO', damage: '1 + 1d4' },
  { name: 'Adaga de Mão Esquerda', weight: '0,5 kg', price: '1 DO', damage: '3 + 1d4' },
  { name: 'Espada Pequena', weight: '1,5 kg', price: '2 DO', damage: '4 + 1d6' },
  { name: 'Lâmina Braavosi', weight: '1,5 kg', price: '4 DO', damage: '5 + 1d8' },
  { name: 'Adaga', weight: '0,5 kg', price: '1 DO', damage: '3 + 1d4' },
  { name: 'Estilete', weight: '0,25 kg', price: '1 DO', damage: '4 + 1d4' },
  { name: 'Punhal', weight: '0,5 kg', price: '1 DO', damage: '3 + 1d4' },
  { name: 'Arakh', weight: '2 kg', price: '3 DO', damage: '5 + 1d8' },
  { name: 'Espada Bastarda', weight: '5 kg', price: '4 DO', damage: '6 + 1d10' },
  { name: 'Espada Longa', weight: '2 kg', price: '3 DO', damage: '5 + 1d8' },
  { name: 'Montante', weight: '7,5 kg', price: '4 DO', damage: '7 + 1d12' },
  { name: 'Lança', weight: '3 kg', price: '1 DO', damage: '4 + 1d6' },
  { name: 'Lança de Guerra', weight: '5 kg', price: '1 DO', damage: '8 + 1d20' },
  { name: 'Lança de Javali', weight: '4,5 kg', price: '1 DO', damage: '6 + 1d10' },
  { name: 'Lança de Sapo', weight: '1,5 kg', price: '1 DO', damage: '4 + 1d6' },
  { name: 'Lança de Torneio', weight: '4 kg', price: '1 DO', damage: '5 + 1d10' },
  { name: 'Pique', weight: '4,5 kg', price: '1 DO', damage: '6 + 1d10' },
  { name: 'Tridente', weight: '2,5 kg', price: '1 DO', damage: '5 + 1d8' },
  { name: 'Bico de Corvo', weight: '3 kg', price: '1 DO', damage: '5 + 1d6' },
  { name: 'Machadinha', weight: '2 kg', price: '1 DO', damage: '3 + 1d6' },
  { name: 'Machado de Batalha', weight: '3,5 kg', price: '1 DO', damage: '5 + 1d8' },
  { name: 'Machado de Lenhador', weight: '3 kg', price: '1 DO', damage: '6 + 1d10' },
  { name: 'Machado Longo', weight: '10 kg', price: '3 DO', damage: '7 + 1d12' },
  { name: 'Picareta', weight: '5 kg', price: '1 DO', damage: '5 + 1d8' },
  { name: 'Arco de Caça', weight: '1,5 kg', price: '1 DO', damage: '4 + 1d6' },
  { name: 'Arco de Curvatura Dupla', weight: '1 kg', price: '3 DO', damage: '5 + 1d8' },
  { name: 'Arco Longo', weight: '1,5 kg', price: '5 DO', damage: '6 + 1d10' },
  { name: 'Munição de arco - 12', weight: '0,5 kg', price: '1 DO', damage: '-' },
  { name: 'Azagaia', weight: '1,5 kg', price: '1 DO', damage: '4 + 1d6' },
  { name: 'Funda', weight: '0,1 kg', price: '-', damage: '3 + 1d4' },
  { name: 'Rede', weight: '2 kg', price: '1 DO', damage: 'Enreda' },
  { name: 'Besta Leve', weight: '3 kg', price: '1 DO', damage: '4 + 1d8' },
  { name: 'Besta Média', weight: '4 kg', price: '2 DO', damage: '5 + 1d10' },
  { name: 'Besta Myresa', weight: '4,5 kg', price: '10 DO', damage: '5 + 1d10' },
  { name: 'Besta Pesada', weight: '4,5 kg', price: '5 DO', damage: '6 + 1d12' },
  { name: 'Munição de besta - 12', weight: '0,5 kg', price: '1 DO', damage: '-' }
].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

const mountOptions = [
  { name: 'Cavalo de Tração', price: '200 DO', movement: 2 },
  { name: 'Corcel de Areia', price: '600 DO', movement: 4 },
  { name: 'Corcel', price: '300 DO', movement: 3 },
  { name: 'Puro-Sangue', price: '1000 DO', movement: 5 },
  { name: 'Garrano', price: '200 DO', movement: 2 },
  { name: 'Mula', price: '100 DO', movement: 1 },
  { name: 'Palafrém', price: '100 DO', movement: 2 },
  { name: 'Pônei', price: '50 DO', movement: 1 },
  { name: 'Cavalo de Batalha', price: '500 DO', movement: 4 },
  { name: 'Carroça', price: '300 DO', movement: 3 },
  { name: 'Carruagem', price: '600 DO', movement: 6 },
  { name: 'Trenó', price: '300 DO', movement: 3 }
].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

const archetypeOptions = [
  'BATEDOR', 'CAVALEIRO ERRANTE', 'CAVALEIRO SAGRADO', 'ESCUDEIRO', 'HERDEIRO',
  'JURADO AOS DEUSES', 'MEISTRE', 'NOBRE', 'SERVO'
];

const archetypes = {
  BATEDOR: {
    skills: {
      Agilidade: ['4', 'Rapidez 1B'],
      Atletismo: ['4', 'Correr 1B'],
      Furtividade: ['4', ''],
      'Lidar com Animais': ['3', ''],
      Luta: ['3', 'Lâminas Curtas 3B'],
      Percepcao: ['3', 'Notar 1B'],
      Pontaria: ['5', 'Arcos 2B'],
      Sobrevivencia: ['3', 'Caçar 1B, Rastrear 1B'],
      Status: ['2', ''],
      Vigor: ['3', '']
    },
    weapons: ['Adaga', 'Arco Longo', 'Espada Pequena'],
    inventory: ['Couro Rígido'],
    armor: 'Couro Rígido'
  },
  'CAVALEIRO ERRANTE': {
    skills: {
      Agilidade: ['4', 'Rapidez 1B'],
      Atletismo: ['4', 'Correr 1B, Força 1B'],
      Guerra: ['3', ''],
      'Lidar com Animais': ['3', 'Cavalgar 1B'],
      Luta: ['5', 'Armas de Contusão 2B, Lanças 2B'],
      Percepcao: ['3', ''],
      Persuasao: ['2', 'Intimidar 2B'],
      Pontaria: ['3', 'Bestas 1B'],
      Status: ['3', ''],
      Vigor: ['4', '']
    },
    weapons: ['Lança de Guerra', 'Mangual'],
    inventory: ['Escudo', 'Meia Armadura'],
    armor: 'Meia Armadura'
  },
  'CAVALEIRO SAGRADO': {
    skills: {
      Agilidade: ['3', ''],
      Atletismo: ['3', 'Força 2B'],
      Guerra: ['3', ''],
      Idioma: ['3', 'Língua Comum'],
      'Lidar com Animais': ['3', 'Cavalgar 1B'],
      Luta: ['5', 'Lâminas Longas 2B, Lanças 1B'],
      Percepcao: ['3', ''],
      Status: ['4', ''],
      Vigor: ['4', '']
    },
    weapons: ['Espada Bastarda', 'Lança de Guerra'],
    inventory: ['Escudo', 'Placas'],
    armor: 'Placas'
  },
  ESCUDEIRO: {
    skills: {
      Agilidade: ['4', 'Rapidez 1B'],
      'Lidar com Animais': ['3', 'Cavalgar 1B'],
      Atletismo: ['3', ''],
      Percepcao: ['4', ''],
      Vigor: ['3', ''],
      Luta: ['3', ''],
      Status: ['3', ''],
      Furtividade: ['3', 'Esgueirar-se 1B'],
      Ladinagem: ['3', 'Roubar 1B']
    },
    weapons: ['Besta Leve', 'Espada Pequena', 'Machadinha', 'Machadinha Arremessada'],
    inventory: ['Broquel', 'Couro Macio'],
    armor: 'Couro Macio'
  },
  HERDEIRO: {
    skills: {
      Astucia: ['3', ''],
      Guerra: ['3', 'Comandar 1B'],
      Idioma: ['3', 'Língua Comum'],
      Luta: ['3', 'Lâminas Longas 1B'],
      'Lidar com Animais': ['2', 'Cavalgar 1B'],
      Persuasao: ['3', ''],
      Pontaria: ['3', 'Arcos 1B'],
      Status: ['6', 'Administração 1B, Criação 1B'],
      Vigor: ['3', ''],
      Vontade: ['3', '']
    },
    weapons: ['Arco de Caça', 'Espada Longa'],
    inventory: ['Escudo', 'Cota de Malha'],
    armor: 'Cota de Malha'
  },
  'JURADO AOS DEUSES': {
    skills: {
      Agilidade: ['3', ''],
      Astucia: ['3', ''],
      Conhecimento: ['3', 'Educação 1B, Pesquisa 1B'],
      Cura: ['3', ''],
      Idioma: ['3', 'Língua Comum'],
      Percepcao: ['3', 'Empatia 1B'],
      Persuasao: ['3', 'Barganha 1B, Charme 1B, Convencer 1B'],
      Status: ['4', ''],
      Vontade: ['5', 'Coordenar 1B, Dedicação 1B']
    },
    weapons: ['Besta Pesada', 'Maça'],
    inventory: ['Escudo Grande', 'Robes'],
    armor: 'Robes'
  },
  MEISTRE: {
    skills: {
      Astucia: ['4', 'Decifrar 1B, Memória 1B'],
      Conhecimento: ['4', 'Educação 2B'],
      Cura: ['3', 'Tratar Doença 1B, Tratar Ferimento 1B'],
      Idioma: ['3', 'Língua Comum, Valyriano Antigo 2'],
      'Lidar com Animais': ['3', ''],
      Persuasao: ['3', 'Convencer 1B'],
      Status: ['4', 'Administração 1B'],
      Vontade: ['3', '']
    },
    weapons: ['Adaga', 'Cajado'],
    inventory: ['Robes'],
    armor: 'Robes'
  },
  NOBRE: {
    skills: {
      Astucia: ['3', 'Memória 1B'],
      Atletismo: ['3', ''],
      Conhecimento: ['3', ''],
      Idioma: ['3', 'Língua Comum'],
      Luta: ['3', 'Lâminas Longas 1B'],
      Percepcao: ['3', 'Notar 1B'],
      Persuasao: ['4', 'Charme 1B, Seduzir 1B'],
      Pontaria: ['3', ''],
      Status: ['5', 'Criação 1B'],
      Vontade: ['3', '']
    },
    weapons: ['Adaga', 'Espada Longa'],
    inventory: ['Escudo', 'Cota de Malha'],
    armor: 'Cota de Malha'
  },
  SERVO: {
    skills: {
      Agilidade: ['4', ''],
      'Lidar com Animais': ['3', ''],
      Atletismo: ['4', 'Correr 1B, Força 1B'],
      Percepcao: ['3', 'Notar 1B'],
      Vigor: ['5', 'Resistência 1B'],
      Luta: ['3', 'Briga 1B, Lanças 1B, Machados 2B'],
      Pontaria: ['3', ''],
      Status: ['3', ''],
      Vontade: ['3', '']
    },
    weapons: ['Adaga', 'Lança', 'Machado de Batalha'],
    inventory: ['Escudo', 'Cota de Anéis'],
    armor: 'Cota de Anéis'
  }
};

const armorAliases = {
  Acholchoada: 'Acolchoada',
  'Couro Rigo': 'Couro Rígido',
  'Cota de aneis': 'Cota de Anéis',
  'Cota de malha': 'Cota de Malha'
};

function armorByName(name) {
  const normalized = armorAliases[name] || name;
  return armorOptions.find((armor) => armor.name === normalized) || armorOptions.find((armor) => armor.name === 'Roupas') || armorOptions[0];
}

function priceInCrowns(price) {
  const text = String(price || '');
  if (!text.includes('DO')) return text;
  return text
    .replace(/\d+(?:[,.]\d+)?/g, (value) => String(Math.floor((Number(value.replace(',', '.')) / 210) * 1000) * 10))
    .replace(/\s*DO\b/g, ' coroas');
}

function withCrowns(item) {
  return { ...item, price: priceInCrowns(item.price) };
}

function findNamedItem(options, name) {
  return options.find((item) => item.name.toLowerCase() === name.toLowerCase()) || { name, weight: '', price: '', damage: '' };
}

function buildArchetypeSkills(archetypeName) {
  const template = archetypes[archetypeName];
  return Object.fromEntries(skills.map((skill) => {
    const [grau, especialidade] = template?.skills?.[skill] || ['2', ''];
    return [skill, { grau, especialidade }];
  }));
}

function applyArchetype(data, archetypeName) {
  const template = archetypes[archetypeName];
  if (!template) return { ...data, arquetipo: archetypeName };
  return withCalculatedDefenses({
    ...data,
    arquetipo: archetypeName,
    habilidades: buildArchetypeSkills(archetypeName),
    armadura: template.armor || data.armadura,
    armasAtaques: template.weapons.map((name) => withCrowns(findNamedItem(weaponOptions, name))),
    inventario: template.inventory.map((name) => ({ ...withCrowns(findNamedItem(equipmentOptions, name)), quantidade: 1 }))
  });
}

function numberValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function skillGrade(data, skill) {
  return numberValue(data.habilidades?.[skill]?.grau);
}

function parseWeight(value) {
  const match = String(value || '').replace(',', '.').match(/\d+(?:\.\d+)?/);
  return match ? numberValue(match[0]) : 0;
}

function normalizeQuantity(value) {
  const quantity = Math.floor(numberValue(value));
  return quantity > 0 ? quantity : 1;
}

function itemWeight(item, useQuantity = false) {
  return parseWeight(item?.weight) * (useQuantity ? normalizeQuantity(item?.quantidade ?? 1) : 1);
}

function listWeight(items, useQuantity = false) {
  return (Array.isArray(items) ? items : []).reduce((total, item) => total + itemWeight(item, useQuantity), 0);
}

function carryLimit(data) {
  return skillGrade(data, 'Atletismo') * 25;
}

function carriedWeight(data) {
  return listWeight(data.inventario, true) + listWeight(data.armasAtaques, false);
}

function formatWeight(value) {
  return String(Number(value.toFixed(2))).replace('.', ',');
}

function calculatedDefenses(data) {
  const armor = armorByName(data.armadura);
  const mountBonus = Array.isArray(data.montarias)
    ? data.montarias.filter((mount) => mount.active).reduce((total, mount) => total + numberValue(mount.movement), 0)
    : 0;
  const movimento = 9 + armor.movement + mountBonus;
  const shieldBonus = data.escudoAtivo ? 2 : 0;
  return {
    intriga: String(skillGrade(data, 'Astucia') + skillGrade(data, 'Percepcao') + skillGrade(data, 'Status')),
    combate: String(skillGrade(data, 'Agilidade') + skillGrade(data, 'Atletismo') + skillGrade(data, 'Percepcao') + armor.movement + shieldBonus),
    saude: String(skillGrade(data, 'Vigor') * 3),
    movimento: String(movimento),
    corrida: String(movimento * 3),
    bonusArmadura: armor.defense,
    bonusEscudo: shieldBonus,
    bonusMontaria: mountBonus,
    penalidadeMovimentoArmadura: armor.movement
  };
}

function withCalculatedDefenses(data) {
  return { ...data, ...calculatedDefenses(data) };
}

const blankCharacter = {
  nome: '', imagem: '', casa: 'Sem Casa', idade: '', sexo: '', jogador: '', descricao: '',
  xp: '', arquetipo: '', nivel: '', destino: '', intriga: '0', combate: '0', armadura: 'Roupas', armas: '',
  armasAtaques: [],
  equipamentos: '', inventario: [], saude: '0', ferimentos: '', lesoes: '', escudoAtivo: false, bonusEscudo: 0, movimento: '9',
  corrida: '27', bonusMontaria: 0, montarias: [], altura: '', peso: '', olhos: '', cabelos: '', marcas: '',
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
    if (!response.ok) throw new Error(data?.detail || 'Erro na requisição');
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
          LeV RPG
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
        <h1>LeV RPG</h1>
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
        <label>Usuário<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
        <label>Senha<input type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit">{mode === 'login' ? 'Entrar' : 'Registrar'}</button>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Não tenho conta' : 'Já tenho conta'}
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
            <div><span>Usuário</span><strong>{profile.username}</strong></div>
            <div><span>Conta criada</span><strong>{createdAt}</strong></div>
            <div><span>Personagens</span><strong>{profile.characters_count}</strong></div>
          </div>
        )}
      </section>
    </main>
  );
}

function Field({ label, value, onChange, type = 'text', readOnly = false }) {
  return <label>{label}<input type={type} readOnly={readOnly} value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>;
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

function SexField({ value, onChange }) {
  return (
    <label>
      Sexo
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecione</option>
        <option value="Masculino">Masculino</option>
        <option value="Feminino">Feminino</option>
      </select>
    </label>
  );
}

function ArchetypeField({ value, onChange, locked }) {
  return (
    <label>
      Arquétipo
      <select value={value || ''} disabled={locked} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecione</option>
        {archetypeOptions.map((archetype) => <option key={archetype} value={archetype}>{archetype}</option>)}
      </select>
    </label>
  );
}

function ArmorField({ value, onChange }) {
  return (
    <label>
      Armadura
      <select value={value || 'Roupas'} onChange={(e) => onChange(e.target.value)}>
        {armorOptions.map((armor) => (
          <option key={armor.name} value={armor.name}>
            {armor.name} / Defesa +{armor.defense} / Movimento {armor.movement}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange }) {
  return <label className="wide">{label}<textarea value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>;
}

function ItemListField({
  title,
  options,
  items,
  onChange,
  showDamage = false,
  useQuantity = false,
  maxWeight = 0,
  otherWeight = 0,
  onWeightError = () => {}
}) {
  const [selected, setSelected] = useState(options[0].name);
  const selectedItem = withCrowns(options.find((item) => item.name === selected) || options[0]);
  const currentItems = Array.isArray(items) ? items : [];

  function commit(nextItems) {
    const nextWeight = otherWeight + listWeight(nextItems, useQuantity);
    if (nextWeight > maxWeight) {
      onWeightError(`Peso excede ${formatWeight(maxWeight)} kg`);
      return;
    }
    onWeightError('');
    onChange(nextItems);
  }

  function addItem() {
    const nextItem = useQuantity ? { ...selectedItem, quantidade: 1 } : selectedItem;
    commit([...currentItems, nextItem]);
  }

  function removeItem(index) {
    onWeightError('');
    onChange(currentItems.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateQuantity(index, value) {
    commit(currentItems.map((item, itemIndex) => (
      itemIndex === index ? { ...item, quantidade: normalizeQuantity(value) } : item
    )));
  }

  return (
    <div className="inventoryField">
      <h2>{title}</h2>
      <div className="inventoryAdd">
        <select value={selected} onChange={(event) => setSelected(event.target.value)}>
          {options.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}{item.weight ? ` / ${item.weight}` : ''} / {priceInCrowns(item.price)}{showDamage ? ` / ${item.damage}` : ''}
            </option>
          ))}
        </select>
        <button type="button" onClick={addItem}><Plus size={18} />Adicionar</button>
      </div>
      <div className="inventoryList">
        {currentItems.map((item, index) => (
          <div className={`inventoryItem${useQuantity ? ' withQuantity' : ''}`} key={`${item.name}-${index}`}>
            <span>{item.name}</span>
            {useQuantity && (
              <input
                className="quantityInput"
                type="number"
                min="1"
                step="1"
                value={normalizeQuantity(item.quantidade)}
                onChange={(event) => updateQuantity(index, event.target.value)}
              />
            )}
            <small>
              {item.weight ? `${item.weight}${useQuantity ? ` x${normalizeQuantity(item.quantidade)} = ${formatWeight(itemWeight(item, true))} kg` : ''} / ` : ''}
              {priceInCrowns(item.price)}{showDamage ? ` / ${item.damage}` : ''}
            </small>
            <button type="button" onClick={() => removeItem(index)}><X size={16} /></button>
          </div>
        ))}
        {!currentItems.length && <p>Nenhum item.</p>}
      </div>
    </div>
  );
}

function MountField({ items, onChange }) {
  const [selected, setSelected] = useState(mountOptions[0].name);
  const selectedItem = mountOptions.find((item) => item.name === selected) || mountOptions[0];
  const mounts = Array.isArray(items) ? items : [];

  function addItem() {
    onChange([...mounts, { ...withCrowns(selectedItem), active: false }]);
  }

  function removeItem(index) {
    onChange(mounts.filter((_, itemIndex) => itemIndex !== index));
  }

  function toggleItem(index) {
    onChange(mounts.map((item, itemIndex) => (
      itemIndex === index ? { ...item, active: !item.active } : item
    )));
  }

  return (
    <div className="inventoryField">
      <h2>Montaria</h2>
      <div className="inventoryAdd">
        <select value={selected} onChange={(event) => setSelected(event.target.value)}>
          {mountOptions.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name} / {priceInCrowns(item.price)} / +{item.movement} m
            </option>
          ))}
        </select>
        <button type="button" onClick={addItem}><Plus size={18} />Adicionar</button>
      </div>
      <div className="inventoryList">
        {mounts.map((item, index) => (
          <div className="inventoryItem mountItem" key={`${item.name}-${index}`}>
            <label className="inlineCheck">
              <input type="checkbox" checked={Boolean(item.active)} onChange={() => toggleItem(index)} />
              <span>{item.name}</span>
            </label>
            <small>{priceInCrowns(item.price)} / +{item.movement} m</small>
            <button type="button" onClick={() => removeItem(index)}><X size={16} /></button>
          </div>
        ))}
        {!mounts.length && <p>Nenhuma montaria.</p>}
      </div>
    </div>
  );
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
        <strong>Imagens disponíveis</strong>
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
        setData(withCalculatedDefenses({
          ...loaded,
          casa: houseOptions.includes(loaded.casa) ? loaded.casa : 'Sem Casa',
          armadura: armorByName(loaded.armadura).name
        }));
        setCanEdit(Boolean(character.can_edit));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const houseValid = houseOptions.includes(data.casa);
  const maxWeight = carryLimit(data);
  const inventoryWeight = listWeight(data.inventario, true);
  const weaponsWeight = listWeight(data.armasAtaques, false);
  const totalWeight = inventoryWeight + weaponsWeight;
  const weightExceeded = totalWeight > maxWeight;

  const set = (key, value) => setData((current) => withCalculatedDefenses({ ...current, [key]: value }));
  const setArmor = (name) => {
    setData((current) => {
      const newArmor = armorByName(name);
      return withCalculatedDefenses({
        ...current,
        armadura: newArmor.name,
        bonusArmadura: newArmor.defense,
        penalidadeMovimentoArmadura: newArmor.movement
      });
    });
  };
  const setSkill = (skill, key, value) => {
    setData((current) => withCalculatedDefenses({
      ...current,
      habilidades: {
        ...current.habilidades,
        [skill]: { ...(current.habilidades?.[skill] || {}), [key]: value }
      }
    }));
  };
  const changeSkillGrade = (skill, change) => {
    setError('');
    setData((current) => {
      const currentGrade = numberValue(current.habilidades?.[skill]?.grau);
      const grade = currentGrade || 0;
      const nextGrade = grade + change;
      if (nextGrade < 1 || nextGrade > 7) return current;

      const cost = change > 0 ? (skillGradeCosts[nextGrade] || 0) : -(skillGradeCosts[grade] || 0);
      const currentXp = numberValue(current.xp);
      if (cost > 0 && currentXp < cost) {
        setError('XP insuficiente');
        return current;
      }

      return withCalculatedDefenses({
        ...current,
        xp: String(currentXp - cost),
        habilidades: {
          ...current.habilidades,
          [skill]: { ...(current.habilidades?.[skill] || {}), grau: String(nextGrade) }
        }
      });
    });
  };
  const setArchetype = (archetypeName) => {
    setData((current) => applyArchetype(current, archetypeName));
  };

  async function save() {
    setError('');
    if (!houseValid) {
      setError('Selecione uma casa válida');
      return;
    }
    if (weightExceeded) {
      setError(`Peso excede ${formatWeight(maxWeight)} kg`);
      return;
    }
    try {
      const characterData = withCalculatedDefenses(data);
      const saved = await request(id ? `/characters/${id}` : '/characters', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify({ data: characterData })
      });
      setData(characterData);
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
            <Field label="Idade" type="number" value={data.idade} onChange={(v) => set('idade', v)} />
            <SexField value={data.sexo} onChange={(v) => set('sexo', v)} />
            <Field label="XP" type="number" value={data.xp} onChange={(v) => set('xp', v)} />
            <ArchetypeField value={data.arquetipo} locked={Boolean(id && data.arquetipo)} onChange={setArchetype} />
          </div>
          <h2>Habilidades</h2>
          <div className="skills">
            {skills.map((skill) => (
              <div className="skillRow" key={skill}>
                <span>{skillLabels[skill] || skill}</span>
                <div className="gradeControl">
                  <button type="button" aria-label={`Diminuir ${skillLabels[skill] || skill}`} disabled={numberValue(data.habilidades?.[skill]?.grau) <= 1} onClick={() => changeSkillGrade(skill, -1)}>
                    <Minus size={16} />
                  </button>
                  <strong>{data.habilidades?.[skill]?.grau || '-'}</strong>
                  <button type="button" aria-label={`Aumentar ${skillLabels[skill] || skill}`} disabled={numberValue(data.habilidades?.[skill]?.grau) >= 7} onClick={() => changeSkillGrade(skill, 1)}>
                    <Plus size={16} />
                  </button>
                </div>
                <input placeholder="Especialidade" value={data.habilidades?.[skill]?.especialidade || ''} onChange={(e) => setSkill(skill, 'especialidade', e.target.value)} />
              </div>
            ))}
          </div>
          <TextField label="Qualidades e defeitos" value={data.destino} onChange={(v) => set('destino', v)} />
        </section>
        <section className="parchment">
          <h2>Conflito</h2>
          <div className="twoCols">
            <Field label="Defesa em Intriga" type="number" readOnly value={data.intriga} onChange={() => {}} />
            <Field label="Defesa em Combate" type="number" readOnly value={data.combate} onChange={() => {}} />
            <Field label="Saúde" type="number" readOnly value={data.saude} onChange={() => {}} />
            <Field label="Ferimentos" value={data.ferimentos} onChange={(v) => set('ferimentos', v)} />
            <Field label="Lesões" value={data.lesoes} onChange={(v) => set('lesoes', v)} />
            <Field label="Movimento" type="number" readOnly value={data.movimento} onChange={() => {}} />
            <Field label="Corrida" type="number" readOnly value={data.corrida} onChange={() => {}} />
            <ArmorField value={data.armadura} onChange={setArmor} />
            <label className="checkField">
              <input type="checkbox" checked={Boolean(data.escudoAtivo)} onChange={(e) => set('escudoAtivo', e.target.checked)} />
              Ativar escudo (+2 Defesa de Combate)
            </label>
          </div>
          <div className={`weightSummary${weightExceeded ? ' overLimit' : ''}`}>
            Peso: {formatWeight(totalWeight)} / {formatWeight(maxWeight)} kg
          </div>
          <ItemListField
            title="Armas e Ataques"
            options={weaponOptions}
            items={data.armasAtaques}
            onChange={(v) => set('armasAtaques', v)}
            showDamage
            maxWeight={maxWeight}
            otherWeight={inventoryWeight}
            onWeightError={setError}
          />
          <ItemListField
            title="Inventário"
            options={equipmentOptions}
            items={data.inventario}
            onChange={(v) => set('inventario', v)}
            useQuantity
            maxWeight={maxWeight}
            otherWeight={weaponsWeight}
            onWeightError={setError}
          />
          <h2>Aparência</h2>
          <div className="twoCols">
            <Field label="Altura" value={data.altura} onChange={(v) => set('altura', v)} />
            <Field label="Peso" value={data.peso} onChange={(v) => set('peso', v)} />
            <Field label="Olhos" value={data.olhos} onChange={(v) => set('olhos', v)} />
            <Field label="Cabelos" value={data.cabelos} onChange={(v) => set('cabelos', v)} />
          </div>
          <TextField label="Marcas de distinção" value={data.marcas} onChange={(v) => set('marcas', v)} />
          <TextField label="Detalhes" value={data.detalhes} onChange={(v) => set('detalhes', v)} />
          <MountField items={data.montarias} onChange={(v) => set('montarias', v)} />
        </section>
        <section className="parchment full">
          <h2>Personalidade e História</h2>
          <div className="twoCols">
            <Field label="Objetivo" value={data.objetivo} onChange={(v) => set('objetivo', v)} />
            <Field label="Motivação" value={data.motivacao} onChange={(v) => set('motivacao', v)} />
            <Field label="Virtude" value={data.virtude} onChange={(v) => set('virtude', v)} />
            <Field label="Vício" value={data.vicio} onChange={(v) => set('vicio', v)} />
          </div>
          <TextField label="Personalidade" value={data.personalidade} onChange={(v) => set('personalidade', v)} />
          <TextField label="História" value={data.historia} onChange={(v) => set('historia', v)} />
          <div className="threeCols">
            <TextField label="Juramentos" value={data.juramentos} onChange={(v) => set('juramentos', v)} />
            <TextField label="Obrigações" value={data.obrigacoes} onChange={(v) => set('obrigacoes', v)} />
            <TextField label="Aliados" value={data.aliados} onChange={(v) => set('aliados', v)} />
            <TextField label="Inimigos" value={data.inimigos} onChange={(v) => set('inimigos', v)} />
            <TextField label="Posses" value={data.posses} onChange={(v) => set('posses', v)} />
            <Field label="Dinheiro (Coroas)" type="number" value={data.dinheiro} onChange={(v) => set('dinheiro', v)} />
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

  async function removeCampaign(campaign) {
    if (!confirm(`Excluir ${campaign.name}?`)) return;
    setError('');
    try {
      await request(`/campaigns/${campaign.id}`, { method: 'DELETE' });
      setCampaigns((current) => current.filter((item) => item.id !== campaign.id));
    } catch (err) {
      setError(err.message);
    }
  }

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
              <p>{campaign.description || 'Sem descrição'}</p>
              <small>{campaign.members_count} membros / {campaign.characters_count} fichas</small>
            </div>
            <div className="rowActions">
              <button onClick={() => go(`/campaigns/${campaign.id}`)}><Eye size={18} />Abrir</button>
              {campaign.is_owner && (
                <button className="danger" onClick={() => removeCampaign(campaign)}><Trash2 size={18} />Excluir</button>
              )}
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
        <TextField label="Descrição" value={form.description} onChange={(description) => setForm({ ...form, description })} />
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
            <p>{campaign.description || 'Sem descrição'}</p>
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

  async function removeCampaign() {
    if (!confirm(`Excluir ${campaign.name}?`)) return;
    setError('');
    try {
      await request(`/campaigns/${id}`, { method: 'DELETE' });
      go('/campaigns');
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
              <p>{campaign.description || 'Sem descrição'}</p>
              <small>Mestre: {campaign.owner_username}</small>
            </div>
            <div className="rowActions">
              <button onClick={copyInvite}><Copy size={18} />Copiar link</button>
              {campaign.is_owner && (
                <button className="danger" onClick={removeCampaign}><Trash2 size={18} />Excluir</button>
              )}
            </div>
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
                  <h2>Diário</h2>
                  <span>Sessão 1</span>
                </div>
              </div>
              {campaign.is_owner ? (
                <>
                  <textarea value={diary} onChange={(event) => setDiary(event.target.value)} />
                  <button className="primary" onClick={saveDiary}><Save size={18} />Salvar diario</button>
                  {diaryStatus && <small>{diaryStatus}</small>}
                </>
              ) : (
                <p className="diaryText">{diary || 'Sem anotações.'}</p>
              )}
            </aside>
          </div>
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
