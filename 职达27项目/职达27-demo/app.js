const jobs = window.JOBS;
const state = { view: "jobs", selected: null, queue: new Map(), filters: { q: "", type: "全部", verdict: "全部", city: "全部", sort: "score" } };

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const verdictClass = (v) => v === "直接可投" ? "direct" : v === "修改后可投" ? "revise" : "reject";
const dotColor = (v) => v === "直接可投" ? "#157f63" : v === "修改后可投" ? "#a45c00" : "#b4233c";

// 匹配分五维（与评分权重一致：方向30 / 证据25 / AI实践20 / 数据15 / 行业10）
const DIMS = [
  { key: "direction", label: "岗位方向一致性", weight: "30" },
  { key: "evidence", label: "已有经历证据", weight: "25" },
  { key: "product", label: "产品与AI实践", weight: "20" },
  { key: "data", label: "数据能力", weight: "15" },
  { key: "industry", label: "行业/场景迁移", weight: "10" }
];

function initCities(){
  const cities = [...new Set(jobs.flatMap(j => j.city.split("/")))].sort((a,b)=>a.localeCompare(b,"zh-CN"));
  cities.forEach(city => $("#cityFilter").insertAdjacentHTML("beforeend", `<option>${city}</option>`));
}

function filteredJobs(){
  let list = jobs.filter(j => {
    const q = state.filters.q;
    const haystack = `${j.company}${j.title}${j.family}${j.city}${j.type}${j.verdict}${j.salary}`.toLowerCase();
    return (!q || haystack.includes(q)) &&
      (state.filters.type === "全部" || j.type === state.filters.type) &&
      (state.filters.verdict === "全部" || j.verdict === state.filters.verdict) &&
      (state.filters.city === "全部" || j.city.split("/").includes(state.filters.city));
  });
  if(state.filters.sort === "score") list.sort((a,b)=>b.score-a.score || a.id-b.id);
  if(state.filters.sort === "id") list.sort((a,b)=>a.id-b.id);
  if(state.filters.sort === "company") list.sort((a,b)=>a.company.localeCompare(b.company,"zh-CN"));
  return list;
}

function renderJobs(){
  const list = filteredJobs();
  $("#resultCount").textContent = `${list.length} 个岗位`;
  $("#jobList").innerHTML = list.length ? list.map(j => `
    <button class="job-row" data-id="${j.id}">
      <span class="job-title"><strong>${j.company}｜${j.title}</strong><span>#${String(j.id).padStart(2,"0")} · ${j.family} · ${j.published}</span><em class="verdict ${verdictClass(j.verdict)}">${j.verdict}</em></span>
      <span class="job-meta"><b>${j.type}</b><span>${j.city}</span></span>
      <span class="salary">${j.salary}<small style="display:block;color:#7b8494;margin-top:4px">${j.salaryStatus}</small></span>
      <span class="score"><i style="background:${dotColor(j.verdict)}"></i><b>${j.score}</b></span>
      <span class="chev">›</span>
    </button>`).join("") : `<div class="empty-state"><b>没有命中岗位</b><p>请重置筛选条件后再试。</p></div>`;
  $$(".job-row").forEach(el => el.addEventListener("click", () => openDetail(Number(el.dataset.id))));
}

function openDetail(id){
  const j = jobs.find(x=>x.id===id); state.selected=j;
  const dims = DIMS.map(d => {
    const v = (j.scores && typeof j.scores[d.key] === "number") ? j.scores[d.key] : 0;
    return `<div class="dim-row"><span>${d.label}<small>权重 ${d.weight}%</small></span><b>${v}</b><i><em style="width:${v}%"></em></i></div>`;
  }).join("");
  const aiSteps = `
    <div class="ai-steps">
      <div class="ai-step"><i>1</i><div><b>JD 要求抽取</b><p class="chip-row">${(j.extract || []).map(e => `<span class="chip">${e}</span>`).join("")}</p></div></div>
      <div class="ai-step"><i>2</i><div><b>简历证据召回</b><ul>${j.matched.map(x => `<li>${x}</li>`).join("")}</ul></div></div>
      <div class="ai-step"><i>3</i><div><b>差距 / 风险分析</b><ul>${j.gaps.map(x => `<li>${x}</li>`).join("")}</ul></div></div>
      <div class="ai-step"><i>4</i><div><b>定制建议生成（仅重组真实经历）</b><div class="advice">${j.action}</div></div></div>
    </div>`;
  $("#drawerContent").innerHTML = `
    <span class="company">${j.company} · ${j.type}</span>
    <h2>${j.title}</h2>
    <div class="drawer-score"><strong>${j.score}</strong><span class="${verdictClass(j.verdict)}">${j.verdict}</span><small>简历证据覆盖度，非录用概率</small></div>
    <h3>匹配分拆解<span class="h3-note">加权：方向30% · 证据25% · AI实践20% · 数据15% · 行业10%</span></h3>
    <div class="dims">${dims}</div>
    <h3>AI 推理过程<span class="h3-note">演示链路数据，接入真实大模型为下一阶段</span></h3>
    ${aiSteps}
    <div class="facts">
      <div><span>城市</span><b>${j.city}</b></div><div><span>薪资</span><b>${j.salary}</b></div>
      <div><span>硬门槛</span><b>${j.gate}</b></div><div><span>薪资核验</span><b>${j.salaryStatus}</b></div>
      <div><span>来源类型</span><b>${j.sourceType || "详情页"}</b></div><div><span>核验日期</span><b>${j.verified}</b></div>
    </div>
    <div class="drawer-actions"><a href="${j.source}" target="_blank" rel="noreferrer">查看公开来源 ↗</a>${j.verdict!=="不建议投"?`<button class="action dark" id="drawerAdd">加入投递队列</button>`:""}</div>`;
  if($("#drawerAdd")) $("#drawerAdd").addEventListener("click",()=>{ addToQueue(j); closeDetail(); });
  $("#detailDrawer").classList.add("open"); $("#scrim").classList.add("open"); $("#detailDrawer").setAttribute("aria-hidden","false");
  $("#drawerClose").focus();
}
function closeDetail(){ $("#detailDrawer").classList.remove("open"); $("#scrim").classList.remove("open"); $("#detailDrawer").setAttribute("aria-hidden","true"); }
function toast(message){ const t=$("#toast"); t.textContent=message; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1800); }

function addToQueue(j){ if(!state.queue.has(j.id)) state.queue.set(j.id,{job:j,status:"待确认"}); renderQueue(); toast(`已加入：${j.company}｜${j.title}`); }
function renderQueue(){
  const items=[...state.queue.values()]; $("#queueBadge").textContent=items.length; $("#queueEmpty").style.display=items.length?"none":"block";
  $("#runSimulation").disabled=!items.length; $("#queueList").innerHTML=items.map(({job:j,status})=>`<div class="queue-item" data-id="${j.id}"><div><strong>${j.company}｜${j.title}</strong><span>${j.city} · ${j.verdict} · ${j.salaryStatus}</span></div><span class="queue-status">${status}</span><button class="queue-remove" aria-label="移除">×</button></div>`).join("");
  $$(".queue-remove").forEach(btn=>btn.addEventListener("click",e=>{const id=Number(e.target.closest(".queue-item").dataset.id);state.queue.delete(id);renderQueue();}));
}

function switchView(view){ state.view=view; $$(".view").forEach(v=>v.classList.remove("active")); $$(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===view)); $(`#view-${view}`).classList.add("active"); window.scrollTo(0,0); }

async function simulate(){
  const btn=$("#runSimulation"); btn.disabled=true; const log=$("#logFeed"); log.innerHTML="";
  const entries=[...state.queue.values()];
  for(let index=0;index<entries.length;index++){
    const entry=entries[index], j=entry.job;
    const stages=j.salaryStatus==="待核验"?["证据审阅完成","定制表达已生成","薪资待人工核验，已暂停"]:["证据审阅完成","定制表达已生成","表单字段已映射","模拟提交完成并记录"];
    for(const stage of stages){ entry.status=stage; renderQueue(); log.insertAdjacentHTML("beforeend",`<p class="${stage.includes("完成")?"done":""}">#${String(j.id).padStart(2,"0")} ${j.company}：${stage}</p>`); log.scrollTop=log.scrollHeight; await new Promise(r=>setTimeout(r,120)); }
    if(index>7){ log.insertAdjacentHTML("beforeend",`<p>为便于演示，剩余 ${entries.length-index-1} 个岗位采用相同流程批处理。</p>`); break; }
  }
  log.insertAdjacentHTML("beforeend",`<p class="done">演示结束：未访问任何真实招聘平台。</p>`); btn.disabled=false; toast("模拟投递流程已完成");
}

// ── 初始化 ──
initCities(); renderJobs(); renderQueue();
$$('.nav-item').forEach(n=>n.addEventListener('click',()=>switchView(n.dataset.view)));
$("#drawerClose").addEventListener("click",closeDetail); $("#scrim").addEventListener("click",closeDetail);
document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeDetail(); });
$("#searchInput").addEventListener("input",e=>{state.filters.q=e.target.value.trim().toLowerCase();renderJobs();});
[["#typeFilter","type"],["#verdictFilter","verdict"],["#cityFilter","city"],["#sortFilter","sort"]].forEach(([id,key])=>$(id).addEventListener("change",e=>{state.filters[key]=e.target.value;renderJobs();}));
$("#resetFilters").addEventListener("click",()=>{state.filters={q:"",type:"全部",verdict:"全部",city:"全部",sort:"score"};$("#searchInput").value="";$("#typeFilter").value="全部";$("#verdictFilter").value="全部";$("#cityFilter").value="全部";$("#sortFilter").value="score";renderJobs();});
const eligibleCount = jobs.filter(j=>j.verdict!=="不建议投").length;
$("#addAllEligible").textContent = `加入${eligibleCount}个可投岗位`;
$("#addAllEligible").addEventListener("click",()=>{jobs.filter(j=>j.verdict!=="不建议投").forEach(j=>state.queue.set(j.id,{job:j,status:"待确认"}));renderQueue();toast(`${eligibleCount}个可投岗位已加入队列`);});
$("#clearQueue").addEventListener("click",()=>{state.queue.clear();renderQueue();$("#logFeed").innerHTML="<p>等待开始……</p>";});
$("#runSimulation").addEventListener("click",simulate);
