feather.replace();

// ===== Sample Data =====
const rawCandidates = [
  {id:1,name:"Sarah Johnson",position:"Frontend Developer",experience:5,score:94,skillsMatch:"28/30",status:"shortlisted",photo:"https://i.pravatar.cc/150?img=32"},
  {id:2,name:"Robert Kim",position:"JavaScript Developer",experience:6,score:91,skillsMatch:"29/30",status:"shortlisted",photo:"https://i.pravatar.cc/150?img=5"},
  {id:3,name:"Michael Chen",position:"UI Engineer",experience:4,score:87,skillsMatch:"25/30",status:"consider",photo:"https://i.pravatar.cc/150?img=12"},
  {id:4,name:"Lisa Thompson",position:"UI/UX Developer",experience:4,score:84,skillsMatch:"26/30",status:"consider",photo:"https://i.pravatar.cc/150?img=15"},
  {id:5,name:"David Wilson",position:"React Developer",experience:3,score:76,skillsMatch:"21/30",status:"consider",photo:"https://i.pravatar.cc/150?img=20"},
  {id:6,name:"Emily Rodriguez",position:"Frontend Engineer",experience:2,score:62,skillsMatch:"18/30",status:"rejected",photo:"https://i.pravatar.cc/150?img=7"},
  {id:7,name:"Aisha Patel",position:"Frontend Developer",experience:7,score:96,skillsMatch:"30/30",status:"shortlisted",photo:"https://i.pravatar.cc/150?img=25"},
  {id:8,name:"Carlos Mendes",position:"React Developer",experience:5,score:82,skillsMatch:"24/30",status:"consider",photo:"https://i.pravatar.cc/150?img=11"},
  {id:9,name:"Nina Gupta",position:"UI Engineer",experience:3,score:88,skillsMatch:"26/30",status:"consider",photo:"https://i.pravatar.cc/150?img=18"},
  {id:10,name:"Omar Ali",position:"JavaScript Developer",experience:8,score:98,skillsMatch:"30/30",status:"shortlisted",photo:"https://i.pravatar.cc/150?img=9"},
];

// ===== State =====
let candidates = [...rawCandidates];
let currentPage = 1;
const pageSize = 6;
let filteredCandidates = [];
let shortlistedSet = new Set();

// ===== DOM =====
const cardsArea = document.getElementById('cardsArea');
const positionFilter = document.getElementById('positionFilter');
const scoreFilter = document.getElementById('scoreFilter');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const selectAllCheckbox = document.getElementById('selectAll');
const shortlistCountEl = document.getElementById('shortlistCount');
const exportBtn = document.getElementById('exportBtn');
const downloadSelectedBtn = document.getElementById('downloadSelected');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const prevPage2 = document.getElementById('prevPage2');
const nextPage2 = document.getElementById('nextPage2');
const currentPageEl = document.getElementById('currentPage');
const totalPagesEl = document.getElementById('totalPages');
const startIdxEl = document.getElementById('startIdx');
const endIdxEl = document.getElementById('endIdx');
const totalCountEl = document.getElementById('totalCount');
const detailModal = document.getElementById('detailModal');
const modalName = document.getElementById('modalName');
const modalPosition = document.getElementById('modalPosition');
const modalScore = document.getElementById('modalScore');
const modalSummary = document.getElementById('modalSummary');
const modalDetails = document.getElementById('modalDetails');
const modalDownloadBtn = document.getElementById('modalDownload');
const modalShortlistToggle = document.getElementById('modalShortlistToggle');
const modalClose = document.getElementById('modalClose');
let currentModalCandidate = null;
let atsChartInstance = null;

// ===== Functions =====
function populatePositionFilter() {
  const positions = Array.from(new Set(candidates.map(c=>c.position))).sort();
  positionFilter.innerHTML = '<option value="">All Positions</option>' + positions.map(p=>`<option value="${p}">${p}</option>`).join('');
}

function sortCandidates(list, mode){
  const copy=[...list];
  if(mode==='score_desc') copy.sort((a,b)=>b.score-a.score);
  else if(mode==='score_asc') copy.sort((a,b)=>a.score-b.score);
  else if(mode==='experience_desc') copy.sort((a,b)=>b.experience-a.experience);
  else if(mode==='experience_asc') copy.sort((a,b)=>a.experience-b.experience);
  return copy;
}

function applyFiltersAndSort() {
  let list=[...candidates];
  const q = searchInput.value.trim().toLowerCase();
  if(q) list=list.filter(c=> (c.name+' '+c.position+' '+(c.skillsMatch||'')).toLowerCase().includes(q));
  if(positionFilter.value) list=list.filter(c=>c.position===positionFilter.value);
  if(scoreFilter.value){
    if(scoreFilter.value==='90-100') list=list.filter(c=>c.score>=90);
    else if(scoreFilter.value==='80-89') list=list.filter(c=>c.score>=80 && c.score<=89);
    else if(scoreFilter.value==='70-79') list=list.filter(c=>c.score>=70 && c.score<=79);
    else list=list.filter(c=>c.score<70);
  }
  if(statusFilter.value) list=list.filter(c=>c.status===statusFilter.value);
  list=sortCandidates(list,sortSelect.value);
  filteredCandidates=list;
  currentPage=1;
  renderPage();
}

function renderPage(){
  const total=filteredCandidates.length;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  if(currentPage>totalPages) currentPage=totalPages;
  const start=(currentPage-1)*pageSize;
  const end=Math.min(start+pageSize,total);
  const pageItems=filteredCandidates.slice(start,end);

  currentPageEl.textContent=currentPage;
  totalPagesEl.textContent=totalPages;
  startIdxEl.textContent=total?start+1:0;
  endIdxEl.textContent=total?end:0;
  totalCountEl.textContent=total;

  [prevPage,prevPage2].forEach(b=>b.disabled=currentPage<=1);
  [nextPage,nextPage2].forEach(b=>b.disabled=currentPage>=totalPages);

  cardsArea.innerHTML='';
  const tpl=document.getElementById('cardTemplate');
  pageItems.forEach(c=>{
    const node=tpl.content.cloneNode(true);
    const card=node.querySelector('.card');
    if(shortlistedSet.has(c.id)||c.status==='shortlisted') card.classList.add('shortlisted');
    card.querySelector('.name').textContent=c.name;
    card.querySelector('.position').textContent=c.position;
    card.querySelector('.exp').textContent=c.experience+' years';
    card.querySelector('.skills').textContent=c.skillsMatch||'—';
    const scorePill=card.querySelector('.score-pill');
    scorePill.textContent=c.score+'%';
    if(c.score>=90) scorePill.classList.add('bg-green-100','text-green-800');
    else if(c.score>=80) scorePill.classList.add('bg-blue-100','text-blue-800');
    else if(c.score>=70) scorePill.classList.add('bg-yellow-100','text-yellow-800');
    else scorePill.classList.add('bg-red-100','text-red-800');
    card.querySelector('img').src=c.photo||'https://via.placeholder.com/80';
    card.querySelector('.card-ai-summary').textContent=generateAISummary(c);

    const checkbox=card.querySelector('.shortlistCheckbox');
    checkbox.checked=shortlistedSet.has(c.id)||c.status==='shortlisted';
    checkbox.addEventListener('change',()=>{toggleShortlistById(c.id); if(checkbox.checked) card.classList.add('shortlisted'); else card.classList.remove('shortlisted');});

    card.querySelector('.viewDetail').addEventListener('click',()=>openDetailModal(c.id));
    card.querySelector('.downloadBtn').addEventListener('click',()=>downloadCandidateResume(c));

    cardsArea.appendChild(node);
  });

  updateShortlistCount();
  selectAllCheckbox.checked = pageItems.every(ci=>shortlistedSet.has(ci.id)||ci.status==='shortlisted');
}

function toggleShortlistById(id){if(shortlistedSet.has(id)) shortlistedSet.delete(id);else shortlistedSet.add(id);updateShortlistCount();}
function updateShortlistCount(){shortlistCountEl.textContent=shortlistedSet.size+candidates.filter(c=>c.status==='shortlisted'&&!shortlistedSet.has(c.id)).length;}
function generateAISummary(c){return `${c.name} has ${c.experience} years experience as a ${c.position}. Skills: ${c.skillsMatch||'N/A'}. ATS Score: ${c.score}%. Recommended: ${c.score>=85?'Strong fit':c.score>=70?'Consider':'Needs review'}.`;}

function downloadCandidateResume(c){
  const content=`Resume for ${c.name}\nPosition: ${c.position}\nExperience: ${c.experience} years\nATS Score: ${c.score}%`;
  const blob=new Blob([content],{type:'text/plain'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`${c.name.replace(/\s+/g,'_')}_resume.txt`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function downloadSelectedResumes(){
  const selected = filteredCandidates.filter(c=>shortlistedSet.has(c.id));
  if(!selected.length){alert('No selected candidates to download.'); return;}
  selected.forEach(c=>downloadCandidateResume(c));
}

function exportShortlistedCSV(){
  const shortlisted = candidates.filter(c=>c.status==='shortlisted'||shortlistedSet.has(c.id));
  if(!shortlisted.length){alert('No shortlisted candidates.'); return;}
  const rows=[['Name','Position','Experience','Score','SkillsMatch','Status']];
  shortlisted.forEach(c=>rows.push([c.name,c.position,c.experience,c.score,c.skillsMatch||'',c.status]));
  const csv=rows.map(r=>r.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`shortlisted_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// ===== Detail Modal =====
function openDetailModal(id){
  const c=candidates.find(x=>x.id===id); if(!c)return;
  currentModalCandidate=c;
  modalName.textContent=c.name; modalPosition.textContent=c.position; modalScore.textContent=c.score+'%';
  modalSummary.textContent=generateAISummary(c);
  modalDetails.innerHTML=`<li>Experience: ${c.experience} years</li><li>Skills: ${c.skillsMatch||'—'}</li><li>Status: ${c.status}</li>`;
  modalDownloadBtn.onclick=()=>downloadCandidateResume(c);
  modalShortlistToggle.onclick=()=>{toggleShortlistById(c.id); renderPage();};
  detailModal.classList.remove('hidden'); detailModal.classList.add('flex');
}

modalClose.addEventListener('click',()=>{detailModal.classList.add('hidden'); detailModal.classList.remove('flex'); if(atsChartInstance){atsChartInstance.destroy(); atsChartInstance=null;}});

// ===== Select All Checkbox =====
selectAllCheckbox.addEventListener('change',()=>{
  const start=(currentPage-1)*pageSize;
  const end=Math.min(start+pageSize,filteredCandidates.length);
  const pageItems=filteredCandidates.slice(start,end);
  if(selectAllCheckbox.checked) pageItems.forEach(c=>shortlistedSet.add(c.id));
  else pageItems.forEach(c=>shortlistedSet.delete(c.id));
  renderPage();
});

// ===== Paging =====
function goNext(){currentPage++; renderPage();}
function goPrev(){currentPage--; renderPage();}
nextPage.addEventListener('click',goNext);
nextPage2.addEventListener('click',goNext);
prevPage.addEventListener('click',goPrev);
prevPage2.addEventListener('click',goPrev);

// ===== Filters & Sorting =====
[searchInput,positionFilter,scoreFilter,statusFilter,sortSelect].forEach(el=>el.addEventListener('input',()=>applyFiltersAndSort()));
exportBtn.addEventListener('click',exportShortlistedCSV);
downloadSelectedBtn.addEventListener('click',downloadSelectedResumes);

// ===== Initialize =====
function init(){
  populatePositionFilter();
  applyFiltersAndSort();
  rawCandidates.filter(c=>c.status==='shortlisted').forEach(c=>shortlistedSet.add(c.id));
  updateShortlistCount();
}
init();

// ===== Add Candidate Demo =====
document.getElementById('addCandidates').addEventListener('click',()=>{
  const nextId = candidates.length ? Math.max(...candidates.map(x=>x.id))+1 : 1;
  const sample={id:nextId,name:`New Candidate ${nextId}`,position:"Frontend Developer",experience:Math.floor(Math.random()*7)+1,score:Math.floor(Math.random()*30)+60,skillsMatch:"20/30",status:"consider",photo:`https://i.pravatar.cc/150?img=${(nextId%70)+1}`};
  candidates.push(sample); populatePositionFilter(); applyFiltersAndSort();
});

// ===== Close Modal on ESC or Background Click =====
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!detailModal.classList.contains('hidden')){detailModal.classList.add('hidden'); if(atsChartInstance){atsChartInstance.destroy(); atsChartInstance=null;}}});
detailModal.addEventListener('click',e=>{if(e.target===detailModal){detailModal.classList.add('hidden'); if(atsChartInstance){atsChartInstance.destroy(); atsChartInstance=null;}}});