/* game.js - upgraded Cross-Zero
   Features:
   - Click or keyboard (Enter/Space) to mark
   - WebAudio generated sounds (no external files needed)
   - Scoreboard persisted in localStorage
   - Win highlight, draw detection, animations
*/

const winPatterns = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

const boardEl = document.getElementById('board');
const cells = Array.from(document.querySelectorAll('.cell'));
const statusEl = document.getElementById('status');

const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const scoreDEl = document.getElementById('scoreD');

const btnNew = document.getElementById('btnNew');
const btnReset = document.getElementById('btnReset');

let board = ["","","","","","","","",""];
let current = 'X';
let active = true;

// Scores in localStorage
let scores = { X:0, O:0, D:0 };
const STORAGE_KEY = 'cxz_scores_v1';

function loadScores(){
  try{
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(s && typeof s === 'object'){ scores = s; }
  }catch(e){}
  renderScores();
}
function saveScores(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(scores)); }
function renderScores(){
  scoreXEl.innerText = scores.X;
  scoreOEl.innerText = scores.O;
  scoreDEl.innerText = scores.D;
}

// --- SOUND using WebAudio (simple synth sounds) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function beep(freq=440, type='sine', dur=0.06, vol=0.08){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  setTimeout(()=>{ try{o.stop()}catch(e){} }, dur*1000 + 10);
}

// different sounds
function playPlace(player){
  if(audioCtx.state === 'suspended') audioCtx.resume();
  if(player === 'X') beep(360,'square',0.09,0.09);
  else beep(620,'sine',0.08,0.08);
}
function playWin(){
  if(audioCtx.state === 'suspended') audioCtx.resume();
  beep(960,'sawtooth',0.16,0.11);
  setTimeout(()=>beep(740,'sine',0.12,0.09), 140);
}
function playDraw(){ beep(420,'triangle',0.12,0.06); }
function playReset(){ beep(180,'sine',0.12,0.06); }

// --- game logic ---
function updateStatus(text){ statusEl.innerText = text; }

function markCell(index){
  if(!active) return;
  if(board[index] !== "") return;

  board[index] = current;
  const cell = cells[index];
  cell.classList.add(current.toLowerCase());
  cell.textContent = current;
  cell.classList.add('pop');
  playPlace(current);

  // check winner
  const winner = checkWinner();
  if(winner){
    active = false;
    highlightWin(winner.pattern);
    updateStatus(`${winner.player} Wins!`);
    scores[winner.player] += 1;
    saveScores(); renderScores(); playWin();
    return;
  }

  // draw?
  if(!board.includes("")){
    active = false;
    updateStatus('Game Draw!');
    scores.D += 1; saveScores(); renderScores(); playDraw();
    return;
  }

  // switch player
  current = current === 'X' ? 'O' : 'X';
  updateStatus(`Player ${current}'s turn`);
}

function checkWinner(){
  for(const p of winPatterns){
    const [a,b,c] = p;
    if(board[a] && board[a] === board[b] && board[a] === board[c]){
      return { player: board[a], pattern: p };
    }
  }
  return null;
}

function highlightWin(pattern){
  pattern.forEach(i => cells[i].classList.add('win'));
  // pulsate the winning cells
  let t = 0;
  const id = setInterval(()=>{
    t++;
    pattern.forEach(i => cells[i].style.transform = `scale(${1 + Math.sin(t*0.4)*0.015})`);
    if(t>28){ clearInterval(id); pattern.forEach(i=>cells[i].style.transform=''); }
  },40)
}

// reset board but keep scores
function newGame(){
  board = ["","","","","","","","",""];
  active = true; current = 'X';
  cells.forEach(c => { c.textContent=''; c.classList.remove('x','o','win'); c.style.transform=''; });
  updateStatus(`Player ${current}'s turn`);
  playReset();
}

// reset scores and board
function resetScores(){
  scores = { X:0, O:0, D:0 };
  saveScores(); renderScores();
  newGame();
  updateStatus("Scores reset — New Game");
  playReset();
}

// --- event wiring ---
cells.forEach((cell, idx) => {
  cell.addEventListener('click', () => markCell(idx));
  cell.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); markCell(idx); }
  });
});

// Buttons
btnNew.addEventListener('click', newGame);
btnReset.addEventListener('click', resetScores);

// keyboard: R for new, C for clear scores
document.addEventListener('keydown', (e) => {
  if(e.key.toLowerCase() === 'r') newGame();
  if(e.key.toLowerCase() === 'c') resetScores();
});

// on load
loadScores();
newGame();
