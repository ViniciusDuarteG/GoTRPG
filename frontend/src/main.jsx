import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, BookOpen, Copy, Dices, Download, Eraser, Eye, Grid3X3, Heart, Image as ImageIcon, Layers3, LogOut, Map as MapIcon, Minus, Pencil, Plus, Redo2, Save, ScrollText, Search, Shield, Skull, Sun, Swords, Sword, Trash2, Undo2, Upload, User, Users, X } from 'lucide-react';
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

const enemyPresets = [
  {
    name: 'Assassino',
    category: 'Humanoide',
    threat: 'Perigosa',
    combat_defense: 6,
    health: 9,
    armor: 2,
    movement: 4,
    attack: 'Estilete 4D',
    damage: '3',
    abilities: 'Perfurante 2; especialista em furtividade e lâminas curtas.',
    notes: 'Matador contratado para emboscadas e infiltração.',
    source: 'Livro Básico, p. 268'
  },
  {
    name: 'Bandido',
    category: 'Humanoide',
    threat: 'Comum',
    combat_defense: 4,
    health: 6,
    armor: 5,
    movement: 3,
    attack: 'Machado 3D+1B',
    damage: '3',
    abilities: 'Adaptável; furtivo e habituado aos ermos.',
    notes: 'Serve como bandoleiro, saqueador ou fora da lei.',
    source: 'Livro Básico, p. 268'
  },
  {
    name: 'Cavaleiro Errante',
    category: 'Humanoide',
    threat: 'Perigosa',
    combat_defense: 8,
    health: 12,
    armor: 5,
    movement: 3,
    attack: 'Espada Longa 4D+1B / Lança de Guerra 4D',
    damage: '4 / 7',
    abilities: 'Escudo grande defensivo; combate montado.',
    notes: 'Guerreiro sem terras que vende sua espada.',
    source: 'Livro Básico, p. 268'
  },
  {
    name: 'Guarda',
    category: 'Humanoide',
    threat: 'Comum',
    combat_defense: 6,
    health: 9,
    armor: 5,
    movement: 3,
    attack: 'Alabarda 4D',
    damage: '7',
    abilities: 'Treinado com armas de haste e atento ao ambiente.',
    notes: 'Miliciano, sentinela ou soldado de infantaria.',
    source: 'Livro Básico, p. 268–269'
  },
  {
    name: 'Saqueador do Povo Livre',
    category: 'Humanoide',
    threat: 'Comum',
    combat_defense: 6,
    health: 9,
    armor: 2,
    movement: 4,
    attack: 'Lança de pedra 4D+1B',
    damage: '4',
    abilities: 'Sobrevivência no frio; emboscada nos ermos.',
    notes: 'Versão genérica das tribos independentes além da Muralha.',
    source: 'Guia de Campanha, cap. O Norte — Os Selvagens'
  },
  {
    name: 'Saqueador Homem de Ferro',
    category: 'Humanoide',
    threat: 'Perigosa',
    combat_defense: 7,
    health: 12,
    armor: 5,
    movement: 3,
    attack: 'Machado de Batalha 4D+1B',
    damage: '5',
    abilities: 'Abordagem, intimidação e experiência naval.',
    notes: 'Combatente acostumado à pilhagem costeira.',
    source: 'Guia de Campanha, cap. As Ilhas de Ferro'
  },
  {
    name: 'Guerreiro do Clã da Montanha',
    category: 'Humanoide',
    threat: 'Comum',
    combat_defense: 6,
    health: 12,
    armor: 2,
    movement: 4,
    attack: 'Machado 4D+1B',
    damage: '4',
    abilities: 'Escalada, emboscada e resistência nas montanhas.',
    notes: 'Inspirado nos Corvos de Pedra, Homens Queimados e Orelhas Negras.',
    source: 'Guia de Campanha, cap. O Vale — Clãs da Montanha'
  },
  {
    name: 'Guerreiro Dothraki',
    category: 'Humanoide',
    threat: 'Perigosa',
    combat_defense: 9,
    health: 12,
    armor: 0,
    movement: 5,
    attack: 'Arakh 5D+1B',
    damage: '5',
    abilities: 'Cavalaria veloz; ataque montado e intimidação.',
    notes: 'Guerreiro nômade do Mar Dothraki.',
    source: 'Guia de Campanha, cap. Além de Westeros — Os Dothraki'
  },
  {
    name: 'Cão de Guerra',
    category: 'Animal',
    threat: 'Baixa',
    combat_defense: 11,
    health: 9,
    armor: 0,
    movement: 8,
    attack: 'Mordida 3D',
    damage: '3',
    abilities: 'Rastrear 2B; correr, nadar e saltar.',
    notes: 'Também representa uma matilha selvagem.',
    source: 'Livro Básico, p. 270'
  },
  {
    name: 'Gato Sombrio',
    category: 'Animal',
    threat: 'Perigosa',
    combat_defense: 13,
    health: 9,
    armor: 0,
    movement: 8,
    attack: 'Garras 4D',
    damage: '5',
    abilities: 'Poderosa; carga em salto; furtividade ampliada à noite.',
    notes: 'Grande felino das montanhas de Westeros.',
    source: 'Livro Básico, p. 271'
  },
  {
    name: 'Javali',
    category: 'Animal',
    threat: 'Comum',
    combat_defense: 9,
    health: 9,
    armor: 1,
    movement: 6,
    attack: 'Presas 3D+1B',
    damage: '4',
    abilities: 'Cruel, poderosa e feroz.',
    notes: 'Agressivo quando provocado.',
    source: 'Livro Básico, p. 271'
  },
  {
    name: 'Lagarto-Leão',
    category: 'Animal',
    threat: 'Perigosa',
    combat_defense: 10,
    health: 12,
    armor: 3,
    movement: 6,
    attack: 'Mordida 3D',
    damage: '6',
    abilities: 'Agarrar; nadador excelente; pode sofrer ferimentos.',
    notes: 'Predador dos pântanos e correntes lentas.',
    source: 'Livro Básico, p. 272'
  },
  {
    name: 'Lobo',
    category: 'Animal',
    threat: 'Comum',
    combat_defense: 11,
    health: 9,
    armor: 0,
    movement: 6,
    attack: 'Mordida 3D',
    damage: '3',
    abilities: 'Derrubar; caçar e rastrear.',
    notes: 'Pode representar cães de areia de Dorne.',
    source: 'Livro Básico, p. 272'
  },
  {
    name: 'Lobo Atroz',
    category: 'Animal',
    threat: 'Mortal',
    combat_defense: 11,
    health: 12,
    armor: 1,
    movement: 8,
    attack: 'Mordida 4D',
    damage: '5',
    abilities: 'Cruel, poderosa, carga em salto e derrubar.',
    notes: 'Predador raro ao sul da Muralha.',
    source: 'Livro Básico, p. 272'
  },
  {
    name: 'Mamute',
    category: 'Animal',
    threat: 'Mortal',
    combat_defense: 7,
    health: 18,
    armor: 10,
    movement: 4,
    attack: 'Presas 3D',
    damage: '10',
    abilities: 'Atordoante; armadura natural; feroz.',
    notes: 'Enorme montaria e animal de carga dos gigantes.',
    source: 'Livro Básico, p. 272'
  },
  {
    name: 'Urso',
    category: 'Animal',
    threat: 'Mortal',
    combat_defense: 9,
    health: 15,
    armor: 2,
    movement: 5,
    attack: 'Garras 4D / Mordida 4D',
    damage: '8 / 5',
    abilities: 'Cruel, lenta, poderosa, perfurante 1 e agarrar.',
    notes: 'Inclui ursos brancos do extremo norte.',
    source: 'Livro Básico, p. 272–273'
  },
  {
    name: 'Gigante',
    category: 'Sobrenatural',
    threat: 'Mortal',
    combat_defense: 8,
    health: 15,
    armor: 4,
    movement: 4,
    attack: 'Porrete 5D+1B',
    damage: '6',
    abilities: 'Estilhaçador 2, lento e nascido no frio.',
    notes: 'Habitante colossal das terras além da Muralha.',
    source: 'Livro Básico, p. 273'
  },
  {
    name: 'Caminhante Branco',
    category: 'Sobrenatural',
    threat: 'Lendária',
    combat_defense: 15,
    health: 12,
    armor: 8,
    movement: 5,
    attack: 'Espada Sobrenatural 7D+3B',
    damage: '4',
    abilities: 'Cruel, estilhaçadora 1, perfurante 4, aura de frio, cria carniçais, furtivo na neve.',
    notes: 'O Outro é vulnerável a fogo e vidro dracônico.',
    source: 'Livro Básico, p. 273–274'
  },
  {
    name: 'Carniçal Humano',
    category: 'Morto-vivo',
    threat: 'Perigosa',
    combat_defense: 4,
    health: 9,
    armor: 0,
    movement: 3,
    attack: 'Garras 2D',
    damage: '3',
    abilities: 'Agarrar; continua lutando mesmo após dano mortal.',
    notes: 'Cadáver reanimado e leal aos Outros.',
    source: 'Livro Básico, p. 274'
  }
];

const blankEnemy = {
  name: '',
  category: 'Humanoide',
  threat: 'Comum',
  combat_defense: 6,
  health: 9,
  armor: 0,
  movement: 3,
  attack: 'Ataque',
  damage: '1',
  abilities: '',
  notes: '',
  source: 'Personalizado'
};

const mapTerrains = [
  { id: 'grass', label: 'Grama', color: '#425536', atlas: [0, 0] },
  { id: 'forest', label: 'Floresta', color: '#293526', atlas: [1, 0] },
  { id: 'dirt', label: 'Terra', color: '#715943', atlas: [2, 0] },
  { id: 'stone', label: 'Calçamento', color: '#555956', atlas: [3, 0] },
  { id: 'sand', label: 'Areia', color: '#b9a27c', atlas: [0, 1] },
  { id: 'water', label: 'Água', color: '#456d75', atlas: [1, 1] },
  { id: 'snow', label: 'Neve', color: '#cbd2d1', atlas: [2, 1] },
  { id: 'mud', label: 'Lama', color: '#493b32', atlas: [3, 1] },
  { id: 'wood', label: 'Assoalho', color: '#604a38', atlas: [0, 2] },
  { id: 'lava', label: 'Queimado', color: '#402b27', atlas: [1, 2] },
  { id: 'flagstone', label: 'Lajes', color: '#565a57', atlas: [2, 2] },
  { id: 'mossstone', label: 'Pedra musgosa', color: '#4e5645', atlas: [3, 2] }
];

const mapObjects = [
  { id: 'tree', label: 'Árvore', atlas: 'objects', position: [0, 0] },
  { id: 'pine', label: 'Pinheiro', atlas: 'objects', position: [1, 0] },
  { id: 'bush', label: 'Arbusto', atlas: 'objects', position: [2, 0] },
  { id: 'rock', label: 'Rocha', atlas: 'objects', position: [3, 0] },
  { id: 'house', label: 'Casa', atlas: 'objects', position: [0, 1] },
  { id: 'tower', label: 'Torre', atlas: 'objects', position: [1, 1] },
  { id: 'camp', label: 'Tenda', atlas: 'objects', position: [2, 1] },
  { id: 'fire', label: 'Fogueira', atlas: 'objects', position: [3, 1] },
  { id: 'chest', label: 'Baú', atlas: 'objects', position: [0, 2] },
  { id: 'barrel', label: 'Barril', atlas: 'objects', position: [1, 2] },
  { id: 'table', label: 'Mesa', atlas: 'objects', position: [2, 2] },
  { id: 'ruins', label: 'Ruínas', atlas: 'objects', position: [3, 2] },
  { id: 'door', label: 'Porta', atlas: 'objects', position: [0, 3] },
  { id: 'stairs', label: 'Escada', atlas: 'objects', position: [1, 3] },
  { id: 'bridge', label: 'Ponte', atlas: 'objects', position: [2, 3] },
  { id: 'well', label: 'Poço', atlas: 'objects', position: [3, 3] },
  { id: 'wood_wall_h', label: 'Madeira — reta', atlas: 'walls', position: [0, 0], wall: true },
  { id: 'wood_wall_v', label: 'Madeira — vertical', atlas: 'walls', position: [1, 0], wall: true },
  { id: 'wood_wall_corner', label: 'Madeira — canto', atlas: 'walls', position: [2, 0], wall: true },
  { id: 'wood_wall_t', label: 'Madeira — junção', atlas: 'walls', position: [3, 0], wall: true },
  { id: 'stone_wall_h', label: 'Pedra — reta', atlas: 'walls', position: [0, 1], wall: true },
  { id: 'stone_wall_v', label: 'Pedra — vertical', atlas: 'walls', position: [1, 1], wall: true },
  { id: 'stone_wall_corner', label: 'Pedra — canto', atlas: 'walls', position: [2, 1], wall: true },
  { id: 'stone_wall_t', label: 'Pedra — junção', atlas: 'walls', position: [3, 1], wall: true },
  { id: 'masonry_wall_h', label: 'Alvenaria — reta', atlas: 'walls', position: [0, 2], wall: true },
  { id: 'masonry_wall_v', label: 'Alvenaria — vertical', atlas: 'walls', position: [1, 2], wall: true },
  { id: 'masonry_wall_corner', label: 'Alvenaria — canto', atlas: 'walls', position: [2, 2], wall: true },
  { id: 'masonry_wall_t', label: 'Alvenaria — junção', atlas: 'walls', position: [3, 2], wall: true },
  { id: 'stone_arch', label: 'Arco de pedra', atlas: 'walls', position: [0, 3], wall: true },
  { id: 'wood_gate', label: 'Portão', atlas: 'walls', position: [1, 3], wall: true },
  { id: 'stone_pillar', label: 'Pilar', atlas: 'walls', position: [2, 3], wall: true },
  { id: 'wood_fence', label: 'Cerca', atlas: 'walls', position: [3, 3], wall: true },
  { id: 'wall', label: 'Muralha antiga', atlas: 'walls', position: [0, 1], wall: true }
];

const mapTerrainColors = Object.fromEntries(mapTerrains.map((terrain) => [terrain.id, terrain.color]));
const mapObjectById = Object.fromEntries(mapObjects.map((object) => [object.id, object]));
const mapAssetPaths = {
  terrain: '/map-assets/medieval-terrain.png',
  objects: '/map-assets/medieval-objects.png',
  walls: '/map-assets/medieval-walls.png'
};

function mapSpriteStyle(objectName) {
  const object = mapObjectById[objectName];
  if (!object) return {};
  const [column, row] = object.position;
  return {
    backgroundImage: `url("${mapAssetPaths[object.atlas]}")`,
    backgroundPosition: `${column * 100 / 3}% ${row * 100 / 3}%`
  };
}

function mapBrightnessColor(value) {
  const brightness = Math.min(115, Math.max(20, Number(value) || 100));
  if (brightness < 100) return `rgba(0, 0, 0, ${(100 - brightness) / 100 * .64})`;
  if (brightness > 100) return `rgba(255, 245, 220, ${(brightness - 100) / 100 * .32})`;
  return 'transparent';
}

function newMapDraft(name = 'Novo mapa') {
  const width = 24;
  const height = 14;
  return {
    name,
    width,
    height,
    tiles: Array(width * height).fill('grass'),
    objects: {},
    grid_visible: false,
    time_of_day: 'day',
    brightness: 100
  };
}

function buildMapTemplate(template) {
  const width = 24;
  const height = 14;
  const tiles = Array(width * height).fill(template.base || 'grass');
  const objects = {};
  const indexAt = (x, y) => y * width + x;
  const terrain = (x, y, value) => {
    if (x >= 0 && x < width && y >= 0 && y < height) tiles[indexAt(x, y)] = value;
  };
  const object = (x, y, value) => {
    if (x >= 0 && x < width && y >= 0 && y < height) objects[indexAt(x, y)] = value;
  };
  const rect = (x1, y1, x2, y2, value) => {
    for (let y = y1; y <= y2; y += 1) {
      for (let x = x1; x <= x2; x += 1) terrain(x, y, value);
    }
  };

  if (template.id === 'village') {
    rect(0, 6, 23, 7, 'dirt');
    rect(10, 0, 12, 13, 'dirt');
    [[3, 3], [7, 10], [16, 3], [19, 10]].forEach(([x, y]) => object(x, y, 'house'));
    [[2, 2], [5, 1], [20, 2], [22, 5], [2, 11], [15, 11], [21, 12]].forEach(([x, y]) => object(x, y, 'tree'));
    object(11, 6, 'well');
    object(14, 8, 'camp');
    object(15, 8, 'fire');
    for (let x = 5; x <= 8; x += 1) object(x, 4, 'wood_fence');
  } else if (template.id === 'ruined_keep') {
    rect(4, 2, 19, 11, 'flagstone');
    rect(6, 4, 17, 9, 'mossstone');
    for (let x = 4; x <= 19; x += 1) {
      object(x, 2, 'stone_wall_h');
      object(x, 11, 'stone_wall_h');
    }
    for (let y = 3; y <= 10; y += 1) {
      object(4, y, 'stone_wall_v');
      object(19, y, 'stone_wall_v');
    }
    [[4, 2], [19, 2], [4, 11], [19, 11]].forEach(([x, y]) => object(x, y, 'stone_pillar'));
    object(11, 11, 'stone_arch');
    object(8, 6, 'ruins');
    object(15, 7, 'ruins');
    object(12, 5, 'stairs');
  } else if (template.id === 'forest_camp') {
    tiles.fill('forest');
    rect(7, 4, 17, 10, 'grass');
    rect(9, 6, 15, 9, 'dirt');
    for (let x = 1; x < 23; x += 3) {
      object(x, 1 + (x * 3) % 11, x % 2 ? 'pine' : 'tree');
    }
    [[8, 5], [16, 5], [8, 10], [17, 9]].forEach(([x, y]) => object(x, y, 'bush'));
    object(11, 7, 'camp');
    object(14, 7, 'camp');
    object(12, 8, 'fire');
    object(15, 9, 'barrel');
  } else if (template.id === 'river_crossing') {
    for (let y = 0; y < height; y += 1) {
      terrain(10, y, 'sand');
      terrain(11, y, 'water');
      terrain(12, y, 'water');
      terrain(13, y, 'sand');
    }
    rect(0, 6, 23, 7, 'dirt');
    object(11, 6, 'bridge');
    object(12, 6, 'bridge');
    [[3, 2], [7, 4], [17, 2], [21, 5], [4, 11], [18, 11], [22, 9]].forEach(([x, y]) => object(x, y, 'tree'));
    object(8, 5, 'rock');
    object(15, 8, 'rock');
  }

  return {
    name: template.name,
    width,
    height,
    tiles,
    objects,
    grid_visible: false,
    time_of_day: template.time || 'day',
    brightness: template.brightness || 100
  };
}

const mapTemplates = [
  { id: 'village', name: 'Aldeia na Encruzilhada', description: 'Casas, poço, estrada e cercas.', base: 'grass', preview: 'dirt', time: 'dawn', brightness: 82 },
  { id: 'ruined_keep', name: 'Fortaleza em Ruínas', description: 'Muralhas, pátio e pedras antigas.', base: 'grass', preview: 'flagstone', time: 'dusk', brightness: 66 },
  { id: 'forest_camp', name: 'Acampamento na Floresta', description: 'Clareira, tendas e fogueira.', base: 'forest', preview: 'forest', time: 'night', brightness: 42 },
  { id: 'river_crossing', name: 'Travessia do Rio', description: 'Estrada, margens e ponte de madeira.', base: 'grass', preview: 'water', time: 'day', brightness: 100 }
];

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
    if (/^\/campaigns\/[^/]+\/map$/.test(route)) return <CampaignBoard go={go} id={route.split('/')[2]} />;
    if (/^\/campaigns\/[^/]+\/maps$/.test(route)) return <CampaignMaps go={go} id={route.split('/')[2]} />;
    if (/^\/campaigns\/[^/]+\/enemies$/.test(route)) return <CampaignEnemies go={go} id={route.split('/')[2]} />;
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

const mapAssetCache = {};

function loadMapAsset(key) {
  if (!mapAssetCache[key]) {
    mapAssetCache[key] = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Não foi possível carregar ${mapAssetPaths[key]}`));
      image.src = mapAssetPaths[key];
    });
  }
  return mapAssetCache[key];
}

async function renderCreatedMap(map) {
  const [terrainAtlas, objectAtlas, wallAtlas] = await Promise.all([
    loadMapAsset('terrain'),
    loadMapAsset('objects'),
    loadMapAsset('walls')
  ]);
  const cellSize = Math.max(28, Math.min(64, Math.floor(1600 / map.width), Math.floor(1000 / map.height)));
  const canvas = document.createElement('canvas');
  canvas.width = map.width * cellSize;
  canvas.height = map.height * cellSize;
  const context = canvas.getContext('2d');
  const terrainSourceWidth = terrainAtlas.naturalWidth / 4;
  const terrainSourceHeight = terrainAtlas.naturalHeight / 3;

  map.tiles.forEach((terrain, index) => {
    const x = (index % map.width) * cellSize;
    const y = Math.floor(index / map.width) * cellSize;
    const terrainData = mapTerrains.find((item) => item.id === terrain) || mapTerrains[0];
    const [column, row] = terrainData.atlas;
    context.fillStyle = mapTerrainColors[terrainData.id] || mapTerrainColors.grass;
    context.fillRect(x, y, cellSize, cellSize);
    context.drawImage(
      terrainAtlas,
      column * terrainSourceWidth,
      row * terrainSourceHeight,
      terrainSourceWidth,
      terrainSourceHeight,
      x,
      y,
      cellSize,
      cellSize
    );
  });

  Object.entries(map.objects || {}).forEach(([rawIndex, objectName]) => {
    const object = mapObjectById[objectName];
    if (!object) return;
    const index = Number(rawIndex);
    const x = (index % map.width) * cellSize;
    const y = Math.floor(index / map.width) * cellSize;
    const source = object.atlas === 'walls' ? wallAtlas : objectAtlas;
    const sourceWidth = source.naturalWidth / 4;
    const sourceHeight = source.naturalHeight / 4;
    const [column, row] = object.position;
    const overscan = object.wall ? cellSize * .07 : 0;
    context.drawImage(
      source,
      column * sourceWidth,
      row * sourceHeight,
      sourceWidth,
      sourceHeight,
      x - overscan,
      y - overscan,
      cellSize + overscan * 2,
      cellSize + overscan * 2
    );
  });

  if (map.grid_visible) {
    context.strokeStyle = 'rgba(31, 20, 12, .34)';
    context.lineWidth = 1;
    for (let x = 0; x <= map.width; x += 1) {
      context.beginPath();
      context.moveTo(x * cellSize, 0);
      context.lineTo(x * cellSize, canvas.height);
      context.stroke();
    }
    for (let y = 0; y <= map.height; y += 1) {
      context.beginPath();
      context.moveTo(0, y * cellSize);
      context.lineTo(canvas.width, y * cellSize);
      context.stroke();
    }
  }

  const timeTints = {
    dawn: 'rgba(255, 139, 72, .15)',
    day: 'rgba(255, 255, 255, 0)',
    dusk: 'rgba(75, 39, 91, .24)',
    night: 'rgba(8, 24, 53, .42)'
  };
  context.fillStyle = timeTints[map.time_of_day] || timeTints.day;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const brightness = Math.min(115, Math.max(20, Number(map.brightness) || 100));
  if (brightness < 100) {
    context.fillStyle = `rgba(0, 0, 0, ${(100 - brightness) / 100 * .64})`;
    context.fillRect(0, 0, canvas.width, canvas.height);
  } else if (brightness > 100) {
    context.fillStyle = `rgba(255, 245, 220, ${(brightness - 100) / 100 * .32})`;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const fireStrength = { dawn: .42, day: .24, dusk: .62, night: .88 }[map.time_of_day] || .24;
  context.save();
  context.globalCompositeOperation = 'screen';
  Object.entries(map.objects || {}).forEach(([rawIndex, objectName]) => {
    if (objectName !== 'fire') return;
    const index = Number(rawIndex);
    const centerX = (index % map.width) * cellSize + cellSize / 2;
    const centerY = Math.floor(index / map.width) * cellSize + cellSize / 2;
    const radius = cellSize * 2;
    const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    glow.addColorStop(0, `rgba(255, 239, 179, ${fireStrength})`);
    glow.addColorStop(.24, `rgba(255, 186, 64, ${fireStrength * .72})`);
    glow.addColorStop(.58, `rgba(218, 91, 25, ${fireStrength * .34})`);
    glow.addColorStop(1, 'rgba(180, 55, 10, 0)');
    context.fillStyle = glow;
    context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
  });
  context.restore();
  return canvas.toDataURL('image/webp', .9);
}

function CampaignMaps({ go, id }) {
  const paintingRef = useRef(false);
  const editVersionRef = useRef(0);
  const [campaign, setCampaign] = useState(null);
  const [maps, setMaps] = useState([]);
  const [currentMap, setCurrentMap] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState('terrain');
  const [selectedTool, setSelectedTool] = useState('grass');
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [painting, setPainting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([request(`/campaigns/${id}`), request(`/campaigns/${id}/maps`)])
      .then(([campaignData, mapData]) => {
        setCampaign(campaignData);
        setMaps(mapData);
        if (mapData.length) setCurrentMap({ ...mapData[0], tiles: [...mapData[0].tiles], objects: { ...mapData[0].objects } });
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    const stopPainting = () => {
      paintingRef.current = false;
      setPainting(false);
    };
    addEventListener('pointerup', stopPainting);
    addEventListener('pointercancel', stopPainting);
    return () => {
      removeEventListener('pointerup', stopPainting);
      removeEventListener('pointercancel', stopPainting);
    };
  }, []);

  function snapshot(map) {
    return {
      name: map.name,
      width: map.width,
      height: map.height,
      tiles: [...map.tiles],
      objects: { ...map.objects },
      grid_visible: map.grid_visible,
      time_of_day: map.time_of_day,
      brightness: map.brightness
    };
  }

  function markDirty() {
    editVersionRef.current += 1;
    setDirty(true);
    setSaveStatus('Alterações pendentes');
  }

  function pushHistory() {
    if (!currentMap) return;
    setUndoStack((current) => [...current, snapshot(currentMap)].slice(-40));
    setRedoStack([]);
  }

  function applySnapshot(mapSnapshot) {
    setCurrentMap((current) => ({ ...current, ...mapSnapshot, tiles: [...mapSnapshot.tiles], objects: { ...mapSnapshot.objects } }));
    markDirty();
  }

  function undo() {
    if (!undoStack.length || !currentMap) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((current) => [...current, snapshot(currentMap)].slice(-40));
    setUndoStack((current) => current.slice(0, -1));
    applySnapshot(previous);
  }

  function redo() {
    if (!redoStack.length || !currentMap) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((current) => [...current, snapshot(currentMap)].slice(-40));
    setRedoStack((current) => current.slice(0, -1));
    applySnapshot(next);
  }

  function paintCell(index) {
    if (!campaign?.is_owner) return;
    setCurrentMap((current) => {
      if (!current) return current;
      if (selectedLayer === 'terrain') {
        const terrain = selectedTool === 'erase' ? 'grass' : selectedTool;
        if (current.tiles[index] === terrain) return current;
        const tiles = [...current.tiles];
        tiles[index] = terrain;
        return { ...current, tiles };
      }
      const objects = { ...current.objects };
      if (selectedTool === 'erase') {
        if (!(index in objects)) return current;
        delete objects[index];
      } else {
        if (objects[index] === selectedTool) return current;
        objects[index] = selectedTool;
      }
      return { ...current, objects };
    });
    markDirty();
  }

  function startPainting(event, index) {
    if (!campaign?.is_owner) return;
    event.preventDefault();
    pushHistory();
    paintingRef.current = true;
    setPainting(true);
    paintCell(index);
  }

  function continuePainting(index) {
    if (paintingRef.current) paintCell(index);
  }

  async function saveCurrent(showMessage = true) {
    if (!currentMap?.id || !campaign?.is_owner) return currentMap;
    const version = editVersionRef.current;
    if (showMessage) setSaveStatus('Salvando...');
    try {
      const saved = await request(`/campaigns/${id}/maps/${currentMap.id}`, {
        method: 'PUT',
        body: JSON.stringify(currentMap)
      });
      setMaps((current) => current.map((map) => map.id === saved.id ? saved : map));
      if (version === editVersionRef.current) {
        setDirty(false);
        setSaveStatus('Salvo');
      }
      return saved;
    } catch (err) {
      setError(err.message);
      setSaveStatus('Erro ao salvar');
      return null;
    }
  }

  useEffect(() => {
    if (!dirty || !currentMap?.id || !campaign?.is_owner || painting) return undefined;
    const timer = setTimeout(() => saveCurrent(false), 1400);
    return () => clearTimeout(timer);
  }, [dirty, currentMap, campaign?.is_owner, painting]);

  async function createMap() {
    setError('');
    try {
      const created = await request(`/campaigns/${id}/maps`, {
        method: 'POST',
        body: JSON.stringify(newMapDraft(`Mapa ${maps.length + 1}`))
      });
      setMaps((current) => [created, ...current]);
      setCurrentMap({ ...created, tiles: [...created.tiles], objects: { ...created.objects } });
      setUndoStack([]);
      setRedoStack([]);
      setDirty(false);
      setSaveStatus('Salvo');
    } catch (err) {
      setError(err.message);
    }
  }

  async function createFromTemplate(template) {
    setError('');
    setSaveStatus('Criando mapa...');
    try {
      const created = await request(`/campaigns/${id}/maps`, {
        method: 'POST',
        body: JSON.stringify(buildMapTemplate(template))
      });
      setMaps((current) => [created, ...current]);
      setCurrentMap({ ...created, tiles: [...created.tiles], objects: { ...created.objects } });
      setUndoStack([]);
      setRedoStack([]);
      setDirty(false);
      setSaveStatus('Mapa pronto para editar');
    } catch (err) {
      setError(err.message);
      setSaveStatus('');
    }
  }

  async function selectMap(map) {
    if (dirty) await saveCurrent(false);
    setCurrentMap({ ...map, tiles: [...map.tiles], objects: { ...map.objects } });
    setUndoStack([]);
    setRedoStack([]);
    setDirty(false);
    setSaveStatus('');
  }

  async function deleteMap(map) {
    if (!confirm(`Excluir o mapa ${map.name}?`)) return;
    setError('');
    try {
      await request(`/campaigns/${id}/maps/${map.id}`, { method: 'DELETE' });
      const remaining = maps.filter((item) => item.id !== map.id);
      setMaps(remaining);
      if (currentMap?.id === map.id) {
        setCurrentMap(remaining.length ? { ...remaining[0], tiles: [...remaining[0].tiles], objects: { ...remaining[0].objects } } : null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function resizeMap(width, height) {
    if (!currentMap || (width === currentMap.width && height === currentMap.height)) return;
    pushHistory();
    const tiles = Array(width * height).fill('grass');
    const objects = {};
    for (let y = 0; y < Math.min(height, currentMap.height); y += 1) {
      for (let x = 0; x < Math.min(width, currentMap.width); x += 1) {
        const oldIndex = y * currentMap.width + x;
        const newIndex = y * width + x;
        tiles[newIndex] = currentMap.tiles[oldIndex];
        if (currentMap.objects[oldIndex]) objects[newIndex] = currentMap.objects[oldIndex];
      }
    }
    setCurrentMap((current) => ({ ...current, width, height, tiles, objects }));
    markDirty();
  }

  function fillTerrain() {
    if (!currentMap || selectedLayer !== 'terrain' || selectedTool === 'erase') return;
    pushHistory();
    setCurrentMap((current) => ({ ...current, tiles: Array(current.width * current.height).fill(selectedTool) }));
    markDirty();
  }

  function clearObjects() {
    if (!currentMap || !Object.keys(currentMap.objects).length) return;
    pushHistory();
    setCurrentMap((current) => ({ ...current, objects: {} }));
    markDirty();
  }

  async function exportMap() {
    if (!currentMap) return;
    setSaveStatus('Renderizando...');
    try {
      const link = document.createElement('a');
      link.href = await renderCreatedMap(currentMap);
      link.download = `${currentMap.name.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-') || 'mapa'}.webp`;
      link.click();
      setSaveStatus(dirty ? 'Alterações pendentes' : 'Salvo');
    } catch (err) {
      setError(err.message);
      setSaveStatus('Erro ao exportar');
    }
  }

  async function useAtTable() {
    if (!currentMap) return;
    setSaveStatus('Preparando mesa...');
    const saved = dirty ? await saveCurrent(false) : currentMap;
    if (!saved) return;
    try {
      const mapImage = await renderCreatedMap({ ...currentMap, ...saved });
      await request(`/campaigns/${id}/board`, {
        method: 'PUT',
        body: JSON.stringify({ map_image: mapImage })
      });
      go(`/campaigns/${id}/map`);
    } catch (err) {
      setError(err.message);
      setSaveStatus('Erro ao enviar');
    }
  }

  if (!campaign && !error) return <main className="centerPage">Abrindo o ateliê de mapas...</main>;

  return (
    <main className="mapCreatorPage">
      <div className="mapCreatorHeader">
        <div>
          <button className="backButton" onClick={() => go(`/campaigns/${id}`)}><ArrowLeft size={18} />Campanha</button>
          <p className="kicker">Ateliê cartográfico</p>
          <h1>Criar mapas</h1>
        </div>
        <div className="rowActions">
          <button onClick={() => go(`/campaigns/${id}/map`)}><MapIcon size={18} />Mesa de jogo</button>
          {campaign?.is_owner && currentMap && (
            <>
              <button onClick={exportMap}><Download size={18} />Exportar</button>
              <button onClick={() => saveCurrent()}><Save size={18} />Salvar</button>
              <button className="primary" onClick={useAtTable}><MapIcon size={18} />Usar na mesa</button>
            </>
          )}
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="mapCreatorLayout">
        <aside className="savedMapsPanel">
          <div className="savedMapsTitle">
            <div>
              <h2>Mapas</h2>
              <span>{maps.length} salvos</span>
            </div>
            {campaign?.is_owner && <button className="primary" onClick={createMap}><Plus size={17} /></button>}
          </div>
          <div className="savedMapList">
            {maps.map((map) => (
              <div className={`savedMapItem${currentMap?.id === map.id ? ' active' : ''}`} key={map.id}>
                <button onClick={() => selectMap(map)}>
                  <i className={`terrain-${map.tiles?.[0] || 'grass'}`} />
                  <span><strong>{map.name}</strong><small>{map.width} × {map.height}</small></span>
                </button>
                {campaign?.is_owner && <button className="mapDeleteButton" onClick={() => deleteMap(map)}><Trash2 size={15} /></button>}
              </div>
            ))}
            {!maps.length && <p className="mapEmptyList">Crie o primeiro mapa.</p>}
          </div>
          {campaign?.is_owner && (
            <div className="mapTemplateSection">
              <div className="mapTemplateTitle">
                <span>Mapas prontos</span>
                <small>Cópias totalmente editáveis</small>
              </div>
              <div className="mapTemplateList">
                {mapTemplates.map((template) => (
                  <button key={template.id} onClick={() => createFromTemplate(template)}>
                    <i className={`terrain-${template.preview}`} />
                    <span>
                      <strong>{template.name}</strong>
                      <small>{template.description}</small>
                    </span>
                    <Plus size={15} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="mapEditorPanel">
          {!currentMap && (
            <div className="emptyMapEditor">
              <MapIcon size={54} />
              <h2>Nenhum mapa criado</h2>
              {campaign?.is_owner && <button className="primary" onClick={createMap}><Plus size={18} />Criar primeiro mapa</button>}
            </div>
          )}
          {currentMap && (
            <>
              <div className="mapDocumentBar">
                <input
                  className="mapNameInput"
                  value={currentMap.name}
                  readOnly={!campaign?.is_owner}
                  onChange={(event) => {
                    setCurrentMap((current) => ({ ...current, name: event.target.value }));
                    markDirty();
                  }}
                />
                <div className="mapHistoryButtons">
                  <button disabled={!undoStack.length || !campaign?.is_owner} onClick={undo} title="Desfazer"><Undo2 size={18} /></button>
                  <button disabled={!redoStack.length || !campaign?.is_owner} onClick={redo} title="Refazer"><Redo2 size={18} /></button>
                  <span>{saveStatus || (dirty ? 'Alterações pendentes' : 'Salvo')}</span>
                </div>
              </div>

              <div className="mapEditorToolbar">
                <div className="layerTabs">
                  <button
                    className={selectedLayer === 'terrain' ? 'active' : ''}
                    onClick={() => {
                      setSelectedLayer('terrain');
                      setSelectedTool('grass');
                    }}
                  ><Layers3 size={17} />Terreno</button>
                  <button
                    className={selectedLayer === 'objects' ? 'active' : ''}
                    onClick={() => {
                      setSelectedLayer('objects');
                      setSelectedTool('tree');
                    }}
                  ><Layers3 size={17} />Objetos</button>
                </div>
                <div className="mapViewTools">
                  <label className="mapTimeSelect"><Sun size={15} />Horário
                    <select
                      disabled={!campaign?.is_owner}
                      value={currentMap.time_of_day || 'day'}
                      onChange={(event) => {
                        const time = event.target.value;
                        const defaults = { dawn: 82, day: 100, dusk: 66, night: 38 };
                        pushHistory();
                        setCurrentMap((current) => ({ ...current, time_of_day: time, brightness: defaults[time] }));
                        markDirty();
                      }}
                    >
                      <option value="dawn">Amanhecer</option>
                      <option value="day">Dia</option>
                      <option value="dusk">Entardecer</option>
                      <option value="night">Noite</option>
                    </select>
                  </label>
                  <label className="mapBrightness">Claridade
                    <input
                      type="range"
                      min="20"
                      max="115"
                      value={currentMap.brightness ?? 100}
                      disabled={!campaign?.is_owner}
                      onPointerDown={pushHistory}
                      onChange={(event) => {
                        setCurrentMap((current) => ({ ...current, brightness: Number(event.target.value) }));
                        markDirty();
                      }}
                    />
                    <b>{currentMap.brightness ?? 100}%</b>
                  </label>
                  <label>Colunas
                    <select disabled={!campaign?.is_owner} value={currentMap.width} onChange={(event) => resizeMap(Number(event.target.value), currentMap.height)}>
                      {[16, 20, 24, 28, 32, 36, 40].map((value) => <option key={value}>{value}</option>)}
                    </select>
                  </label>
                  <label>Linhas
                    <select disabled={!campaign?.is_owner} value={currentMap.height} onChange={(event) => resizeMap(currentMap.width, Number(event.target.value))}>
                      {[10, 12, 14, 16, 18, 22, 26, 30].map((value) => <option key={value}>{value}</option>)}
                    </select>
                  </label>
                  <button
                    className={currentMap.grid_visible ? 'active' : ''}
                    disabled={!campaign?.is_owner}
                    onClick={() => {
                      pushHistory();
                      setCurrentMap((current) => ({ ...current, grid_visible: !current.grid_visible }));
                      markDirty();
                    }}
                    title="Exibir grade"
                  ><Grid3X3 size={18} /></button>
                  <button onClick={() => setZoom((value) => Math.max(.65, value - .15))}><Minus size={17} /></button>
                  <span>{Math.round(zoom * 100)}%</span>
                  <button onClick={() => setZoom((value) => Math.min(1.55, value + .15))}><Plus size={17} /></button>
                </div>
              </div>

              {campaign?.is_owner && (
                <div className="mapPalette">
                  {(selectedLayer === 'terrain' ? mapTerrains : mapObjects).map((tool) => (
                    <button
                      key={tool.id}
                      className={selectedTool === tool.id ? 'active' : ''}
                      onClick={() => setSelectedTool(tool.id)}
                      title={tool.label}
                    >
                      {selectedLayer === 'terrain'
                        ? <i className={`terrain-${tool.id}`} />
                        : <span className={`mapObjectThumb${tool.wall ? ' wallSprite' : ''}`} style={mapSpriteStyle(tool.id)} />}
                      <small>{tool.label}</small>
                    </button>
                  ))}
                  <button className={selectedTool === 'erase' ? 'active' : ''} onClick={() => setSelectedTool('erase')}>
                    <Eraser size={22} /><small>Borracha</small>
                  </button>
                  {selectedLayer === 'terrain'
                    ? <button className="paletteAction" disabled={selectedTool === 'erase'} onClick={fillTerrain}>Preencher</button>
                    : <button className="paletteAction" onClick={clearObjects}>Limpar</button>}
                </div>
              )}

              <div className="mapCanvasViewport">
                <div
                  className={`mapCanvas${currentMap.grid_visible ? ' showGrid' : ''}`}
                  style={{
                    gridTemplateColumns: `repeat(${currentMap.width}, ${Math.round(42 * zoom)}px)`,
                    gridAutoRows: `${Math.round(42 * zoom)}px`
                  }}
                >
                  {currentMap.tiles.map((terrain, index) => (
                    <button
                      type="button"
                      aria-label={`Célula ${index + 1}`}
                      className={`mapCell terrain-${terrain}`}
                      key={index}
                      onPointerDown={(event) => startPainting(event, index)}
                      onPointerEnter={() => continuePainting(index)}
                    >
                      {currentMap.objects[index] && (
                        <span
                          className={`mapObjectSprite${mapObjectById[currentMap.objects[index]]?.wall ? ' wallSprite' : ''}`}
                          style={mapSpriteStyle(currentMap.objects[index])}
                        />
                      )}
                    </button>
                  ))}
                  <div className={`mapLighting mapLighting-${currentMap.time_of_day || 'day'}`} />
                  <div
                    className="mapBrightnessOverlay"
                    style={{ background: mapBrightnessColor(currentMap.brightness) }}
                  />
                  {Object.entries(currentMap.objects || {})
                    .filter(([, objectName]) => objectName === 'fire')
                    .map(([rawIndex]) => {
                      const index = Number(rawIndex);
                      const cellPixels = Math.round(42 * zoom);
                      return (
                        <div
                          className={`mapFireGlow mapFireGlow-${currentMap.time_of_day || 'day'}`}
                          key={`fire-glow-${rawIndex}`}
                          style={{
                            width: `${cellPixels * 4}px`,
                            height: `${cellPixels * 4}px`,
                            left: `${((index % currentMap.width) - 1.5) * cellPixels}px`,
                            top: `${(Math.floor(index / currentMap.width) - 1.5) * cellPixels}px`
                          }}
                        />
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function CampaignEnemies({ go, id }) {
  const [campaign, setCampaign] = useState(null);
  const [enemies, setEnemies] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [form, setForm] = useState(blankEnemy);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const loadEnemies = () => request(`/campaigns/${id}/enemies`).then(setEnemies);

  useEffect(() => {
    Promise.all([request(`/campaigns/${id}`), request(`/campaigns/${id}/enemies`)])
      .then(([campaignData, enemyData]) => {
        setCampaign(campaignData);
        setEnemies(enemyData);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const filteredPresets = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return enemyPresets.filter((enemy) => (
      (category === 'Todos' || enemy.category === category)
      && (!term || `${enemy.name} ${enemy.notes}`.toLocaleLowerCase('pt-BR').includes(term))
    ));
  }, [search, category]);

  async function addPreset(preset) {
    setBusy(preset.name);
    setError('');
    try {
      const created = await request(`/campaigns/${id}/enemies`, {
        method: 'POST',
        body: JSON.stringify({ ...preset, current_health: preset.health })
      });
      setEnemies((current) => [created, ...current]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  function openCustomForm() {
    setEditingId(null);
    setForm({ ...blankEnemy });
    setShowForm(true);
  }

  function editEnemy(enemy) {
    setEditingId(enemy.id);
    setForm({
      name: enemy.name,
      category: enemy.category,
      threat: enemy.threat,
      combat_defense: enemy.combat_defense,
      health: enemy.health,
      armor: enemy.armor,
      movement: enemy.movement,
      attack: enemy.attack,
      damage: enemy.damage,
      abilities: enemy.abilities,
      notes: enemy.notes,
      source: enemy.source
    });
    setShowForm(true);
    scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveEnemy(event) {
    event.preventDefault();
    setBusy('form');
    setError('');
    try {
      const saved = await request(
        editingId ? `/campaigns/${id}/enemies/${editingId}` : `/campaigns/${id}/enemies`,
        {
          method: editingId ? 'PUT' : 'POST',
          body: JSON.stringify(form)
        }
      );
      setEnemies((current) => (
        editingId
          ? current.map((enemy) => enemy.id === saved.id ? saved : enemy)
          : [saved, ...current]
      ));
      setShowForm(false);
      setEditingId(null);
      setForm({ ...blankEnemy });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  async function changeHealth(enemy, delta) {
    const current_health = Math.min(enemy.health, Math.max(0, enemy.current_health + delta));
    if (current_health === enemy.current_health) return;
    setEnemies((current) => current.map((item) => item.id === enemy.id ? { ...item, current_health } : item));
    try {
      const saved = await request(`/campaigns/${id}/enemies/${enemy.id}`, {
        method: 'PUT',
        body: JSON.stringify({ current_health })
      });
      setEnemies((current) => current.map((item) => item.id === saved.id ? saved : item));
    } catch (err) {
      setError(err.message);
      loadEnemies().catch(() => {});
    }
  }

  async function removeEnemy(enemy) {
    if (!confirm(`Remover ${enemy.name} da campanha?`)) return;
    setError('');
    try {
      await request(`/campaigns/${id}/enemies/${enemy.id}`, { method: 'DELETE' });
      setEnemies((current) => current.filter((item) => item.id !== enemy.id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!campaign && !error) return <main className="centerPage">Carregando inimigos...</main>;

  return (
    <main className="enemyPage">
      <div className="enemyPageHeader">
        <div>
          <button className="backButton" onClick={() => go(`/campaigns/${id}`)}>
            <ArrowLeft size={18} />Campanha
          </button>
          <p className="kicker">Bestiário da campanha</p>
          <h1>{campaign?.name}</h1>
        </div>
        <div className="rowActions">
          <button onClick={() => go(`/campaigns/${id}/map`)}><MapIcon size={18} />Mesa de jogo</button>
          <button onClick={() => go(`/campaigns/${id}/maps`)}><Layers3 size={18} />Criar mapas</button>
          {campaign?.is_owner && (
            <button className="primary" onClick={openCustomForm}><Plus size={18} />Inimigo personalizado</button>
          )}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {showForm && campaign?.is_owner && (
        <form className="enemyForm" onSubmit={saveEnemy}>
          <div className="formHeader">
            <div>
              <p className="kicker">{editingId ? 'Editar ficha' : 'Nova ficha'}</p>
              <h2>{editingId ? 'Editar inimigo' : 'Inimigo personalizado'}</h2>
            </div>
            <button type="button" onClick={() => setShowForm(false)}><X size={18} />Fechar</button>
          </div>
          <div className="enemyFormGrid">
            <Field label="Nome" value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <label>
              Categoria
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {['Humanoide', 'Animal', 'Sobrenatural', 'Morto-vivo'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Ameaça
              <select value={form.threat} onChange={(event) => setForm({ ...form, threat: event.target.value })}>
                {['Baixa', 'Comum', 'Perigosa', 'Mortal', 'Lendária'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <Field label="Defesa em Combate" type="number" value={form.combat_defense} onChange={(combat_defense) => setForm({ ...form, combat_defense })} />
            <Field label="Saúde" type="number" value={form.health} onChange={(health) => setForm({ ...form, health })} />
            <Field label="Armadura" type="number" value={form.armor} onChange={(armor) => setForm({ ...form, armor })} />
            <Field label="Movimento" type="number" value={form.movement} onChange={(movement) => setForm({ ...form, movement })} />
            <Field label="Ataque" value={form.attack} onChange={(attack) => setForm({ ...form, attack })} />
            <Field label="Dano" value={form.damage} onChange={(damage) => setForm({ ...form, damage })} />
          </div>
          <div className="enemyTextFields">
            <TextField label="Habilidades especiais" value={form.abilities} onChange={(abilities) => setForm({ ...form, abilities })} />
            <TextField label="Notas" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} />
          </div>
          <button className="primary" type="submit" disabled={busy === 'form'}>
            <Save size={18} />{busy === 'form' ? 'Salvando...' : 'Salvar inimigo'}
          </button>
        </form>
      )}

      <div className="enemyLayout">
        <section className="enemyLibrary">
          <div className="sectionHeading">
            <div>
              <h2>Inimigos pré-prontos</h2>
              <p>Fichas resumidas dos livros para inclusão rápida.</p>
            </div>
            <span>{filteredPresets.length} opções</span>
          </div>
          <div className="enemyFilters">
            <label className="searchField">
              <Search size={18} />
              <input placeholder="Buscar inimigo" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {['Todos', 'Humanoide', 'Animal', 'Sobrenatural', 'Morto-vivo'].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="presetGrid">
            {filteredPresets.map((enemy) => (
              <article className="presetCard" key={enemy.name}>
                <div className="enemyCardTitle">
                  <span className={`enemyIcon ${enemy.category.toLocaleLowerCase('pt-BR').replace('-', '')}`}><Skull size={20} /></span>
                  <div>
                    <h3>{enemy.name}</h3>
                    <span>{enemy.category} · {enemy.threat}</span>
                  </div>
                </div>
                <div className="enemyStats">
                  <span><b>{enemy.combat_defense}</b>Defesa</span>
                  <span><b>{enemy.health}</b>Saúde</span>
                  <span><b>{enemy.armor}</b>Armadura</span>
                  <span><b>{enemy.movement}</b>Mov.</span>
                </div>
                <p><strong>{enemy.attack}</strong> · dano {enemy.damage}</p>
                <small>{enemy.source}</small>
                {campaign?.is_owner && (
                  <button className="primary" disabled={busy === enemy.name} onClick={() => addPreset(enemy)}>
                    <Plus size={17} />{busy === enemy.name ? 'Incluindo...' : 'Incluir na campanha'}
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>

        <aside className="campaignEnemyList">
          <div className="sectionHeading">
            <div>
              <h2>Na campanha</h2>
              <p>{enemies.length} inimigos ativos</p>
            </div>
          </div>
          <div className="activeEnemies">
            {enemies.map((enemy) => {
              const healthPercent = Math.round((enemy.current_health / enemy.health) * 100);
              return (
                <article className="activeEnemyCard" key={enemy.id}>
                  <div className="enemyCardTitle">
                    <span className="enemyIcon hostile"><Skull size={20} /></span>
                    <div>
                      <h3>{enemy.name}</h3>
                      <span>{enemy.category} · {enemy.threat}</span>
                    </div>
                  </div>
                  <div className="enemyHealth">
                    <div><Heart size={15} /><span>Saúde</span><strong>{enemy.current_health}/{enemy.health}</strong></div>
                    <div className="healthTrack"><i style={{ width: `${healthPercent}%` }} /></div>
                    {campaign?.is_owner && (
                      <div className="healthControls">
                        <button onClick={() => changeHealth(enemy, -1)}><Minus size={15} /></button>
                        <button onClick={() => changeHealth(enemy, 1)}><Plus size={15} /></button>
                      </div>
                    )}
                  </div>
                  <div className="activeEnemyStats">
                    <span>Defesa <b>{enemy.combat_defense}</b></span>
                    <span>VA <b>{enemy.armor}</b></span>
                    <span>Mov. <b>{enemy.movement}</b></span>
                  </div>
                  <p><strong>{enemy.attack}</strong> · dano {enemy.damage}</p>
                  {enemy.abilities && <small>{enemy.abilities}</small>}
                  {campaign?.is_owner && (
                    <div className="rowActions">
                      <button onClick={() => editEnemy(enemy)}><Pencil size={16} />Editar</button>
                      <button className="danger" onClick={() => removeEnemy(enemy)}><Trash2 size={16} />Remover</button>
                    </div>
                  )}
                </article>
              );
            })}
            {!enemies.length && (
              <div className="emptyEnemies">
                <Skull size={36} />
                <p>Nenhum inimigo incluído.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function prepareMapImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Escolha uma imagem válida.'));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error('A imagem deve ter no máximo 15 MB.'));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 1920 / image.width, 1080 / image.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL('image/webp', 0.84);
      if (dataUrl.length > 4_400_000) {
        reject(new Error('O mapa ficou muito grande. Use uma imagem menor.'));
        return;
      }
      resolve(dataUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível abrir essa imagem.'));
    };
    image.src = objectUrl;
  });
}

function CampaignBoard({ go, id }) {
  const boardRef = useRef(null);
  const draggingRef = useRef(null);
  const [campaign, setCampaign] = useState(null);
  const [enemies, setEnemies] = useState([]);
  const [mapImage, setMapImage] = useState('');
  const [positions, setPositions] = useState({});
  const [rolls, setRolls] = useState([]);
  const [sides, setSides] = useState(20);
  const [quantity, setQuantity] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [rollFace, setRollFace] = useState(20);
  const [lastRoll, setLastRoll] = useState(null);
  const [savingMap, setSavingMap] = useState(false);
  const [error, setError] = useState('');

  function applyBoard(data, includePositions = true) {
    setMapImage(data.map_image || '');
    setRolls(data.rolls || []);
    if (includePositions) {
      setPositions(data.token_positions || {});
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      request(`/campaigns/${id}`),
      request(`/campaigns/${id}/board`),
      request(`/campaigns/${id}/enemies`)
    ])
      .then(([campaignData, boardData, enemyData]) => {
        if (!active) return;
        setCampaign(campaignData);
        setEnemies(enemyData);
        applyBoard(boardData);
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      Promise.all([request(`/campaigns/${id}/board`), request(`/campaigns/${id}/enemies`)])
        .then(([boardData, enemyData]) => {
          applyBoard(boardData, !draggingRef.current);
          setEnemies(enemyData);
        })
        .catch(() => {});
    }, 3500);
    return () => clearInterval(interval);
  }, [id]);

  function defaultPosition(index) {
    return {
      x: 12 + (index % 6) * 15,
      y: 18 + Math.floor(index / 6) * 20
    };
  }

  function canMove(character) {
    return campaign?.is_owner || character.user_id === campaign?.current_user_id;
  }

  function positionFromPointer(event) {
    const rect = boardRef.current.getBoundingClientRect();
    return {
      x: Math.min(96, Math.max(4, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(94, Math.max(6, ((event.clientY - rect.top) / rect.height) * 100))
    };
  }

  function startTokenDrag(event, tokenId, movable) {
    if (!movable) return;
    event.preventDefault();
    draggingRef.current = { id: String(tokenId), pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveToken(event, tokenId) {
    const drag = draggingRef.current;
    if (!drag || drag.id !== String(tokenId) || drag.pointerId !== event.pointerId) return;
    const position = positionFromPointer(event);
    setPositions((current) => ({ ...current, [tokenId]: position }));
  }

  async function endTokenDrag(event, tokenId) {
    const drag = draggingRef.current;
    if (!drag || drag.id !== String(tokenId) || drag.pointerId !== event.pointerId) return;
    const position = positionFromPointer(event);
    draggingRef.current = null;
    setPositions((current) => ({ ...current, [tokenId]: position }));
    try {
      const saved = await request(`/campaigns/${id}/board`, {
        method: 'PUT',
        body: JSON.stringify({ token_positions: { [tokenId]: position } })
      });
      setPositions(saved.token_positions || {});
    } catch (err) {
      setError(err.message);
    }
  }

  async function uploadMap(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setSavingMap(true);
    try {
      const preparedImage = await prepareMapImage(file);
      const saved = await request(`/campaigns/${id}/board`, {
        method: 'PUT',
        body: JSON.stringify({ map_image: preparedImage })
      });
      setMapImage(saved.map_image || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingMap(false);
    }
  }

  async function removeMap() {
    if (!confirm('Remover o mapa atual?')) return;
    setError('');
    try {
      await request(`/campaigns/${id}/board`, {
        method: 'PUT',
        body: JSON.stringify({ map_image: '' })
      });
      setMapImage('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function rollDice() {
    if (rolling) return;
    setError('');
    setRolling(true);
    const ticker = setInterval(() => setRollFace(Math.floor(Math.random() * sides) + 1), 65);
    try {
      const [result] = await Promise.all([
        request(`/campaigns/${id}/rolls`, {
          method: 'POST',
          body: JSON.stringify({ sides, quantity })
        }),
        new Promise((resolve) => setTimeout(resolve, 750))
      ]);
      setRollFace(result.total);
      setLastRoll(result);
      setRolls((current) => [result, ...current.filter((roll) => roll.id !== result.id)].slice(0, 30));
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(ticker);
      setRolling(false);
    }
  }

  if (!campaign && !error) return <main className="centerPage">Preparando a mesa...</main>;

  return (
    <main className="battlePage">
      <div className="battleHeader">
        <div>
          <button className="backButton" onClick={() => go(`/campaigns/${id}`)}>
            <ArrowLeft size={18} />Campanha
          </button>
          <p className="kicker">Mesa de jogo</p>
          <h1>{campaign?.name || 'Mapa da campanha'}</h1>
        </div>
        {campaign?.is_owner && (
          <div className="mapActions">
            <button onClick={() => go(`/campaigns/${id}/maps`)}><Layers3 size={18} />Criar mapas</button>
            <button onClick={() => go(`/campaigns/${id}/enemies`)}><Skull size={18} />Inimigos</button>
            <label className="uploadButton">
              <Upload size={18} />
              {savingMap ? 'Enviando...' : 'Subir mapa'}
              <input type="file" accept="image/*" disabled={savingMap} onChange={uploadMap} />
            </label>
            {mapImage && <button onClick={removeMap}><X size={18} />Remover mapa</button>}
          </div>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      <div className="battleLayout">
        <section className="mapPanel">
          <div
            ref={boardRef}
            className={`battleMap${mapImage ? ' hasMap' : ''}`}
            style={mapImage ? { backgroundImage: `linear-gradient(rgba(18, 11, 8, .08), rgba(18, 11, 8, .2)), url("${mapImage}")` } : undefined}
          >
            {!mapImage && (
              <div className="emptyMap">
                <MapIcon size={52} />
                <strong>Suba um mapa para começar</strong>
                <span>Os marcadores já podem ser movimentados livremente.</span>
              </div>
            )}
            {campaign?.characters.map((character, index) => {
              const tokenId = String(character.id);
              const position = positions[tokenId] || defaultPosition(index);
              const movable = canMove(character);
              return (
                <button
                  type="button"
                  key={character.id}
                  className={`characterToken${movable ? ' movable' : ''}`}
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  title={`${character.name}${movable ? ' — arraste para mover' : ''}`}
                  onPointerDown={(event) => startTokenDrag(event, tokenId, movable)}
                  onPointerMove={(event) => moveToken(event, tokenId)}
                  onPointerUp={(event) => endTokenDrag(event, tokenId)}
                  onPointerCancel={(event) => endTokenDrag(event, tokenId)}
                >
                  <span className="tokenPortrait">
                    {character.data?.imagem
                      ? <img src={character.data.imagem} alt="" draggable="false" />
                      : <span>{character.name.slice(0, 2).toUpperCase()}</span>}
                  </span>
                  <span className="tokenName">{character.name}</span>
                </button>
              );
            })}
            {enemies.map((enemy, index) => {
              const tokenId = `enemy:${enemy.id}`;
              const position = positions[tokenId] || defaultPosition((campaign?.characters.length || 0) + index);
              return (
                <button
                  type="button"
                  key={tokenId}
                  className={`characterToken enemyToken${campaign?.is_owner ? ' movable' : ''}`}
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  title={`${enemy.name} — ${enemy.current_health}/${enemy.health} de Saúde`}
                  onPointerDown={(event) => startTokenDrag(event, tokenId, campaign?.is_owner)}
                  onPointerMove={(event) => moveToken(event, tokenId)}
                  onPointerUp={(event) => endTokenDrag(event, tokenId)}
                  onPointerCancel={(event) => endTokenDrag(event, tokenId)}
                >
                  <span className="tokenPortrait"><Skull size={27} /></span>
                  <span className="tokenName">{enemy.name}</span>
                  <span className="tokenHealth">{enemy.current_health}/{enemy.health}</span>
                </button>
              );
            })}
          </div>
          <div className="tokenLegend">
            <span><i className="legendDot yours" />Movimentável</span>
            <span><i className="legendDot others" />Somente visualização</span>
            <span><i className="legendDot enemy" />Inimigo</span>
            <small>Arraste livremente para qualquer ponto do mapa.</small>
          </div>
        </section>

        <aside className="dicePanel">
          <div className="diceTitle">
            <Dices size={25} />
            <div>
              <h2>Dados</h2>
              <span>Escolha e role</span>
            </div>
          </div>

          <div className="diceTypes">
            {[4, 6, 8, 10, 12, 20, 100].map((die) => (
              <button
                type="button"
                key={die}
                className={sides === die ? 'active' : ''}
                onClick={() => {
                  setSides(die);
                  setRollFace(die);
                }}
              >
                d{die}
              </button>
            ))}
          </div>

          <div className="diceQuantity">
            <span>Quantidade</span>
            <div>
              <button onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={16} /></button>
              <strong>{quantity}</strong>
              <button onClick={() => setQuantity((value) => Math.min(20, value + 1))}><Plus size={16} /></button>
            </div>
          </div>

          <div className={`rollingDie${rolling ? ' rolling' : ''}`}>
            <span>{rollFace}</span>
          </div>
          {lastRoll && !rolling && (
            <p className="lastRoll">
              <strong>{lastRoll.total}</strong>
              <span>{lastRoll.notation}: {lastRoll.results.join(' + ')}</span>
            </p>
          )}
          <button className="primary rollButton" disabled={rolling} onClick={rollDice}>
            <Dices size={20} />{rolling ? 'Rolando...' : `Rolar ${quantity}d${sides}`}
          </button>

          <div className="rollHistory">
            <h3>Histórico da mesa</h3>
            {rolls.map((roll) => (
              <div className="rollEntry" key={roll.id}>
                <div>
                  <strong>{roll.username}</strong>
                  <span>{roll.notation} · {roll.results.join(', ')}</span>
                </div>
                <b>{roll.total}</b>
              </div>
            ))}
            {!rolls.length && <small>Nenhuma rolagem ainda.</small>}
          </div>
        </aside>
      </div>
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
              <button className="primary" onClick={() => go(`/campaigns/${id}/map`)}>
                <MapIcon size={18} />Mesa de jogo
              </button>
              <button onClick={() => go(`/campaigns/${id}/enemies`)}>
                <Skull size={18} />Inimigos
              </button>
              <button onClick={() => go(`/campaigns/${id}/maps`)}>
                <Layers3 size={18} />Criar mapas
              </button>
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
