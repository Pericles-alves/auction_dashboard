import { estimate } from './costs.js';
const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(value);
const lots = [
  { id: 1, title: 'Toyota Corolla XEi 2.0', year: 2021, km: 42000, city: 'Campinas', state: 'SP', source: 'Fonte A', bid: 72000, reference: 102300, condition: 'Conservação regular', history: [65000, 69000, 72000] },
  { id: 2, title: 'Toyota Corolla GLi 1.8', year: 2019, km: 28000, city: 'Rio de Janeiro', state: 'RJ', source: 'Fonte B', bid: 58500, reference: 89700, condition: 'Vistoria pendente', history: [52000, 56000, 58500] },
  { id: 3, title: 'Ford Ka SE 1.0', year: 2019, km: 65000, city: 'Sorocaba', state: 'SP', source: 'Fonte C', bid: 22500, reference: 42000, condition: 'Reparos necessários', history: [18000, 21000, 22500] },
  { id: 4, title: 'Volkswagen Polo TSI', year: 2020, km: 74000, city: 'Belo Horizonte', state: 'MG', source: 'Fonte A', bid: 38000, reference: 66500, condition: 'Reparos necessários', history: [32000, 36000, 38000] },
  { id: 5, title: 'Honda Civic EXL 2.0', year: 2022, km: 18000, city: 'Curitiba', state: 'PR', source: 'Fonte B', bid: 88000, reference: 118400, condition: 'Vistoria pendente', history: [82000, 85000, 88000] },
  { id: 6, title: 'Chevrolet Onix LT', year: 2021, km: 51000, city: 'Ribeirão Preto', state: 'SP', source: 'Fonte C', bid: 35000, reference: 63000, condition: 'Conservação regular', history: [29000, 32500, 35000] },
];
let favorites = new Set();
try { const stored = JSON.parse(localStorage.getItem('auctionhub-favorites') || '[]'); if (Array.isArray(stored)) favorites = new Set(stored.filter(id => lots.some(lot => lot.id === id))); } catch {}
const filters = document.querySelector('#filters');
const costForm = document.querySelector('#cost-form');
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const params = new URLSearchParams(location.search);
for (const field of filters.elements) if (field.name && params.has(field.name)) {
  if (field.type === 'checkbox') field.checked = params.get(field.name) === '1';
  else field.value = params.get(field.name);
}
function render() {
  const f = Object.fromEntries(new FormData(filters));
  const query = normalize(f.q || '');
  const rows = lots.filter(l => normalize(`${l.title} ${l.city} ${l.state} ${l.source}`).includes(query) && (!f.state || l.state === f.state) && (!f.source || l.source === f.source) && (!f.max || l.bid <= Number(f.max)) && (!f.favorites || favorites.has(l.id)));
  rows.sort((a, b) => f.sort === 'bid' ? a.bid - b.bid : f.sort === 'year' ? b.year - a.year : (1 - b.bid / b.reference) - (1 - a.bid / a.reference));
  document.querySelector('#lots').innerHTML = rows.map(l => `<tr><td><strong><span class="vehicle-symbol" aria-hidden="true">▱</span>${l.title}</strong><small>${l.year} · ${l.km.toLocaleString('pt-BR')} km · ${l.source}</small></td><td>${l.state}<small>${l.city}</small></td><td><strong>${money(l.bid)}</strong></td><td>${money(l.reference)}</td><td><span class="discount">${((1-l.bid/l.reference)*100).toFixed(1)}%</span></td><td><button class="lot-button" data-detail="${l.id}">Analisar</button> <button class="favorite ${favorites.has(l.id) ? 'saved' : ''}" data-favorite="${l.id}" aria-label="Favoritar ${l.title}" aria-pressed="${favorites.has(l.id)}">${favorites.has(l.id) ? '♥' : '♡'}</button></td></tr>`).join('');
  document.querySelector('#count').textContent = `(${rows.length} resultados)`;
  document.querySelector('#empty').hidden = rows.length !== 0;
  document.querySelector('#stat-favorites').textContent = favorites.size;
  document.querySelector('#all-nav').classList.toggle('active', !f.favorites);
  document.querySelector('#favorites-nav').classList.toggle('active', Boolean(f.favorites));
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(f)) if (value && !(key === 'sort' && value === 'discount')) next.set(key, key === 'favorites' ? '1' : value);
  history.replaceState(null, '', location.pathname + (next.size ? '?' + next : ''));
}
document.querySelector('#stat-count').textContent = lots.length;
document.querySelector('#stat-reference').textContent = money(lots.reduce((sum, l) => sum + l.reference, 0) / lots.length);
filters.addEventListener('input', render);
filters.addEventListener('submit', e => e.preventDefault());
document.querySelector('#reset').addEventListener('click', () => { filters.reset(); render(); });
document.querySelector('#favorites-nav').addEventListener('click', e => { e.preventDefault(); filters.elements.favorites.checked = true; render(); });
document.querySelector('#all-nav').addEventListener('click', e => { e.preventDefault(); filters.elements.favorites.checked = false; render(); });
document.querySelector('#lots').addEventListener('click', e => {
  const favorite = e.target.closest('[data-favorite]');
  if (favorite) {
    const id = Number(favorite.dataset.favorite);
    if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
    try { localStorage.setItem('auctionhub-favorites', JSON.stringify([...favorites])); } catch {}
    render(); return;
  }
  const button = e.target.closest('[data-detail]');
  if (!button) return;
  const lot = lots.find(l => l.id === Number(button.dataset.detail));
  costForm.elements.bid.value = lot.bid;
  costForm.elements.resale.value = lot.reference;
  document.querySelector('#selected').textContent = `${lot.title} · hipótese de revenda = referência fictícia`;
  calculate();
  document.querySelector('#detail-content').innerHTML = `<span class="eyebrow">LOTE DEMONSTRATIVO #${lot.id}</span><h2>${lot.title}</h2><p>${lot.year} · ${lot.km.toLocaleString('pt-BR')} km · ${lot.city}/${lot.state}<br>${lot.condition} · ${lot.source}</p><h3>Observações fictícias</h3><ol>${lot.history.map((bid, i) => `<li>Observação ${i+1}: ${money(bid)}</li>`).join('')}</ol><p>Estes registros não têm fonte real, data de coleta ou resultado confirmado. Não representam um preço final de venda. Lance e referência foram enviados ao simulador; revise as despesas e a hipótese de revenda.</p>`;
  document.querySelector('#detail').showModal();
});
function calculate() {
  const output = document.querySelector('#cost-results');
  if (!costForm.checkValidity()) { output.textContent = 'Preencha todos os campos com valores não negativos.'; return; }
  try {
    const r = estimate(Object.fromEntries([...new FormData(costForm)].map(([key, value]) => [key, Number(value)])));
    output.innerHTML = `<div class="total"><span>Aquisição estimada</span><strong>${money(r.total)}</strong></div><div><span>Resultado após despesas de venda</span><strong>${money(r.profit)}</strong></div><div><span>ROI projetado</span><strong>${r.roi === null ? 'Indefinido' : r.roi.toFixed(1) + '%'}</strong></div><div><span>Lance máximo para o ROI desejado</span><strong>${r.maxBid === null ? 'Inviável' : money(r.maxBid)}</strong></div>`;
  } catch (error) { output.textContent = error.message; }
}
costForm.addEventListener('input', calculate);
costForm.addEventListener('submit', e => e.preventDefault());
render(); calculate();
