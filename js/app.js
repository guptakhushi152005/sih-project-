/**
 * AGriVyn - Main Application Controller
 * Handles Navigation, State Management, UI Interactivity, and Chat Engine
 */

const AppState = {
  role: 'landing', // 'farmer' | 'buyer' | 'landing'
  currentView: 'landing',
  previousView: 'farmer-home',
  lang: 'en',
  activeOrderStage: 1,
  currentScanCrop: 'onion',
  selectedProduce: null,
  selectedBuyerOffer: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  initChatHistory();
});

// Navigation Router
function navigateTo(viewName) {
  const views = [
    'view-landing',
    'view-farmer-home',
    'view-crop-health',
    'view-crop-listing',
    'view-market-prices',
    'view-smart-recommendation',
    'view-find-buyers',
    'view-weather',
    'view-my-orders',
    'view-farmer-profile',
    'view-buyer-dashboard',
    'view-buyer-requirements',
    'view-buyer-profile',
    'view-direct-chat'
  ];

  views.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  const target = document.getElementById('view-' + viewName);
  if (target) {
    target.classList.remove('hidden');
    if (viewName !== 'direct-chat') {
      AppState.previousView = viewName;
    }
    AppState.currentView = viewName;
  }

  // Handle Bottom Nav Visibility
  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) {
    if (viewName === 'landing' || viewName === 'direct-chat') {
      bottomNav.classList.add('hidden');
    } else {
      bottomNav.classList.remove('hidden');
    }
  }

  updateNavHighlights(viewName);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => {
    if (window.lucide) lucide.createIcons();
  }, 50);
}

// Persona / Role Switching
function switchPersona(role) {
  AppState.role = role;
  const farmerNav = document.getElementById('nav-farmer-items');
  const buyerNav = document.getElementById('nav-buyer-items');
  const farmerBtn = document.getElementById('persona-farmer-btn');
  const buyerBtn = document.getElementById('persona-buyer-btn');

  if (role === 'farmer') {
    if (farmerNav) farmerNav.classList.remove('hidden');
    if (buyerNav) buyerNav.classList.add('hidden');
    if (farmerBtn) farmerBtn.className = 'px-2.5 py-1 rounded-md text-xs font-medium transition-all bg-emerald-600 text-white shadow-sm flex items-center space-x-1';
    if (buyerBtn) buyerBtn.className = 'px-2.5 py-1 rounded-md text-xs font-medium transition-all text-slate-300 hover:text-white flex items-center space-x-1';
    navigateTo('farmer-home');
    showToast('Switched to Farmer Mode: Ramesh (Meerut)');
  } else if (role === 'buyer') {
    if (farmerNav) farmerNav.classList.add('hidden');
    if (buyerNav) buyerNav.classList.remove('hidden');
    if (buyerBtn) buyerBtn.className = 'px-2.5 py-1 rounded-md text-xs font-medium transition-all bg-emerald-600 text-white shadow-sm flex items-center space-x-1';
    if (farmerBtn) farmerBtn.className = 'px-2.5 py-1 rounded-md text-xs font-medium transition-all text-slate-300 hover:text-white flex items-center space-x-1';
    navigateTo('buyer-dashboard');
    showToast('Switched to Buyer Portal: Sharma Agro Wholesalers');
  }
}

function loginAs(role) {
  switchPersona(role);
}

function updateNavHighlights(viewName) {
  document.querySelectorAll('.nav-item-btn').forEach(btn => {
    btn.classList.remove('text-emerald-700', 'font-bold');
    btn.classList.add('text-slate-500');
  });

  const highlightMap = {
    'farmer-home': 'nav-btn-home',
    'crop-listing': 'nav-btn-crops',
    'find-buyers': 'nav-btn-buyers',
    'my-orders': 'nav-btn-orders',
    'farmer-profile': 'nav-btn-profile',
    'buyer-dashboard': 'nav-btn-buyer-home',
    'buyer-requirements': 'nav-btn-buyer-req',
    'buyer-profile': 'nav-btn-buyer-profile'
  };

  const activeId = highlightMap[viewName];
  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) {
      el.classList.remove('text-slate-500');
      el.classList.add('text-emerald-700', 'font-bold');
    }
  }
}

// AI Crop Health Scanner
function selectScanSample(type) {
  AppState.currentScanCrop = type;
  document.querySelectorAll('.sample-btn').forEach(b => {
    b.classList.remove('border-2', 'border-emerald-600', 'bg-emerald-50');
    b.classList.add('border', 'border-slate-200', 'bg-slate-50');
  });
  
  const activeBtn = document.getElementById('sample-btn-' + type);
  if (activeBtn) {
    activeBtn.classList.add('border-2', 'border-emerald-600', 'bg-emerald-50');
  }

  const visual = document.getElementById('scan-crop-visual');
  const cropData = AGRI_DATA.diseaseDatabase[type] || AGRI_DATA.diseaseDatabase.onion;
  if (visual) {
    visual.innerHTML = `
      <div class="w-20 h-20 mx-auto rounded-2xl bg-amber-950/80 border border-amber-600/40 flex items-center justify-center text-4xl shadow-inner mb-2">
        ${cropData.visualIcon}
      </div>
      <span class="text-xs font-semibold text-emerald-400 block" id="scan-crop-name">${cropData.crop} Specimen</span>
      <span class="text-[10px] text-slate-400">Captured in Field #3 - Meerut</span>
    `;
  }
}

function executeAIScan() {
  const laser = document.getElementById('scan-laser-line');
  const loader = document.getElementById('scan-overlay-loading');
  const btn = document.getElementById('run-ai-scan-btn');

  if (laser) laser.classList.remove('hidden');
  if (loader) loader.classList.remove('hidden');
  if (btn) {
    btn.disabled = true;
    btn.classList.add('opacity-50');
  }

  CropHealthService.diagnose(AppState.currentScanCrop).then(res => {
    if (laser) laser.classList.add('hidden');
    if (loader) loader.classList.add('hidden');
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-50');
    }

    renderScanResults(res);
    showToast('AI Crop Diagnostic Scan Completed with ' + res.confidence + '% Confidence');
    if (window.lucide) lucide.createIcons();
  });
}

function renderScanResults(res) {
  const resCrop = document.getElementById('res-crop');
  const resCondition = document.getElementById('res-condition');
  const resSeverity = document.getElementById('res-severity');
  const resArea = document.getElementById('res-area');
  const resRec = document.getElementById('res-recommendation');
  const resConf = document.getElementById('res-confidence-badge');

  if (resCrop) resCrop.innerText = res.crop;
  if (resCondition) {
    resCondition.innerText = res.condition;
    resCondition.className = 'font-bold text-sm ' + res.badgeClass;
  }
  if (resSeverity) {
    resSeverity.innerHTML = `<i data-lucide="alert-triangle" class="w-3 h-3 mr-1 text-amber-600"></i> ${res.severity}`;
  }
  if (resArea) resArea.innerText = res.affectedArea;
  if (resConf) resConf.innerText = 'Confidence: ' + res.confidence + '%';
  if (resRec) resRec.innerText = '"' + res.recommendation + '"';
}

// Market Price Filters & Analytics
function updateMarketPriceView() {
  const cropSelect = document.getElementById('market-filter-crop');
  const crop = cropSelect ? cropSelect.value : 'Wheat';
  const subtitle = document.getElementById('trend-subtitle');
  const insight = document.getElementById('ai-price-insight-text');

  const trendData = MarketPriceService.getPriceTrend(crop);

  if (subtitle) subtitle.innerText = `${crop} in Meerut & Neighboring Mandis`;
  if (insight) insight.innerText = `"${trendData.insight}"`;
  showToast(`Updated market price trends for ${crop}`);
}

function resetMarketFilters() {
  const crop = document.getElementById('market-filter-crop');
  if (crop) crop.value = 'Wheat';
  updateMarketPriceView();
}

// Crop Listing Form
function handleCropListing(e) {
  e.preventDefault();
  const crop = document.getElementById('listing-crop-name').value;
  const qty = document.getElementById('listing-qty').value;
  const unit = document.getElementById('listing-unit').value;
  const grade = document.getElementById('listing-grade').value;
  const price = document.getElementById('listing-price').value;

  const container = document.getElementById('farmer-listings-container');
  if (container) {
    const newCard = document.createElement('div');
    newCard.className = 'bg-white rounded-2xl p-4 border border-slate-200 shadow-sm relative animate-in fade-in slide-in-from-top-4 duration-300';
    newCard.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-2.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">🌱</div>
          <div>
            <h4 class="text-sm font-bold text-slate-900">${crop}</h4>
            <p class="text-xs text-slate-500">${qty} ${unit} • ${grade} • Meerut Cluster</p>
          </div>
        </div>
        <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>
      </div>
      <div class="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
        <div class="bg-slate-50 p-2 rounded-lg">
          <span class="text-[10px] text-slate-500">Matched Buyers:</span>
          <p class="font-bold text-slate-800 text-sm flex items-center text-emerald-700"><i data-lucide="users" class="w-3.5 h-3.5 mr-1"></i> 3 Verified</p>
        </div>
        <div class="bg-slate-50 p-2 rounded-lg">
          <span class="text-[10px] text-slate-500">Your Target Price:</span>
          <p class="font-extrabold text-emerald-700 text-sm">₹${price} / ${unit}</p>
        </div>
      </div>
      <div class="mt-3 flex items-center space-x-2">
        <button onclick="navigateTo('find-buyers')" class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition text-center shadow-sm">View Matched Buyers</button>
      </div>
    `;
    container.prepend(newCard);
  }

  showToast(`Success! ${crop} (${qty} ${unit}) listed on AGriVyn marketplace.`);
  if (window.lucide) lucide.createIcons();
}

// Buyer Produce Details & Inspection Modal (Fixes wrong redirect issue)
function openProduceDetailsModal(farmer, crop, qty, grade, health, price, loc, field) {
  AppState.selectedProduce = { farmer, crop, qty, grade, health, price, loc, field };

  document.getElementById('prod-modal-crop').innerText = crop;
  document.getElementById('prod-modal-farmer').innerText = `Farmer: ${farmer} • ${loc}`;
  document.getElementById('prod-modal-qty').innerText = qty;
  document.getElementById('prod-modal-grade').innerText = grade;
  document.getElementById('prod-modal-health').innerText = health;
  document.getElementById('prod-modal-price').innerText = price;
  document.getElementById('prod-modal-loc').innerText = `${field}, ${loc}`;

  openModal('modal-produce-details');
}

function startChatFromProduceModal() {
  closeModal('modal-produce-details');
  const partner = AppState.selectedProduce ? AppState.selectedProduce.farmer : 'Ramesh Kumar (Farmer)';
  openChatView(partner);
}

function sendPurchaseOrderDirect() {
  closeModal('modal-produce-details');
  const partner = AppState.selectedProduce ? AppState.selectedProduce.farmer : 'Ramesh Kumar';
  showToast(`Purchase order locked for ${partner}! Agreement generated in My Orders.`);
  navigateTo('my-orders');
}

// Direct Negotiation Chat Engine
function initChatHistory() {
  const box = document.getElementById('chat-messages-box');
  if (!box) return;
  box.innerHTML = '';
  AGRI_DATA.initialChat.forEach(msg => {
    appendChatMessage(msg.text, msg.sender, msg.time);
  });
}

function openChatView(partnerName) {
  const partnerLabel = document.getElementById('chat-partner-name');
  if (partnerLabel) partnerLabel.innerText = partnerName || 'Ramesh Kumar (Farmer)';
  navigateTo('direct-chat');
}

function exitChatView() {
  if (AppState.role === 'buyer') {
    navigateTo('buyer-dashboard');
  } else {
    navigateTo('farmer-home');
  }
}

function acceptDealInChat() {
  showToast('Deal locked at ₹2,550/Qtl! Order status set to "Accepted by Buyer"');
  advanceDemoOrderStatus();
}

function sendQuickReply(msg) {
  const sender = AppState.role === 'buyer' ? 'buyer' : 'farmer';
  appendChatMessage(msg, sender);
}

function handleSendMessage(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input-text');
  const text = input ? input.value.trim() : '';
  if (!text) return;

  const sender = AppState.role === 'buyer' ? 'buyer' : 'farmer';
  appendChatMessage(text, sender);
  if (input) input.value = '';
}

function appendChatMessage(text, sender, customTime) {
  const box = document.getElementById('chat-messages-box');
  if (!box) return;
  const msgDiv = document.createElement('div');
  const time = customTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (sender === 'buyer') {
    msgDiv.className = 'flex items-start justify-end space-x-2 animate-in fade-in duration-200';
    msgDiv.innerHTML = `
      <div class="bg-emerald-600 text-white p-2.5 rounded-2xl rounded-tr-none shadow-sm max-w-[80%] space-y-1">
        <p class="font-medium">${text}</p>
        <span class="text-[9px] text-emerald-200 block text-right">${time}</span>
      </div>
      <div class="w-6 h-6 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center text-[9px] font-bold shrink-0">B</div>
    `;
  } else {
    msgDiv.className = 'flex items-start space-x-2 animate-in fade-in duration-200';
    msgDiv.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">R</div>
      <div class="bg-white p-2.5 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm max-w-[80%] space-y-1">
        <p class="text-slate-800 font-medium">${text}</p>
        <span class="text-[9px] text-slate-400 block text-right">${time}</span>
      </div>
    `;
  }

  box.appendChild(msgDiv);
  box.scrollTop = box.scrollHeight;
  if (window.lucide) lucide.createIcons();
}

// Send Offer Modal (Farmer Side)
function openSendOfferModal(buyerName, crop, qty, price) {
  document.getElementById('modal-offer-buyer-name').innerText = `Buyer: ${buyerName}`;
  document.getElementById('modal-offer-crop').innerText = crop;
  document.getElementById('modal-offer-qty').innerText = `${qty} Quintal`;
  document.getElementById('modal-input-offer-price').value = price;
  document.getElementById('modal-offer-total-calc').innerText = `₹${(price * qty).toLocaleString('en-IN')}`;

  AppState.selectedBuyerOffer = { name: buyerName, crop, qty, price };
  openModal('modal-send-offer');
}

function recalcModalTotal() {
  const price = parseFloat(document.getElementById('modal-input-offer-price').value) || 0;
  document.getElementById('modal-offer-total-calc').innerText = `₹${(price * 10).toLocaleString('en-IN')}`;
}

function submitFarmerOffer() {
  const price = document.getElementById('modal-input-offer-price').value;
  const buyerName = AppState.selectedBuyerOffer ? AppState.selectedBuyerOffer.name : 'Buyer B (Sharma Agro)';
  
  closeModal('modal-send-offer');
  showToast(`Offer of ₹${price}/Qtl sent to ${buyerName}! Status: Offer Sent`);
  navigateTo('my-orders');
}

// Order Milestones Progression (Judge Demo Interaction)
function advanceDemoOrderStatus() {
  const res = TradeService.advanceStatus('ORD1234');
  const stage = res.order.stage;
  const badge = document.getElementById('order-status-badge');
  const dot1 = document.getElementById('step-1-dot');
  const dot2 = document.getElementById('step-2-dot');
  const dot3 = document.getElementById('step-3-dot');
  const dot4 = document.getElementById('step-4-dot');

  [dot1, dot2, dot3, dot4].forEach(d => {
    if (d) d.className = 'w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold';
  });

  if (stage === 1) {
    badge.innerText = 'Offer Sent';
    badge.className = 'bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full';
    if (dot1) dot1.className = 'w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-emerald-100';
  } else if (stage === 2) {
    badge.innerText = 'Accepted by Buyer';
    badge.className = 'bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full';
    if (dot1) dot1.className = 'w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold';
    if (dot2) dot2.className = 'w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-emerald-100';
    showToast('Stage 2: Buyer accepted offer! Dispatch scheduled.');
  } else if (stage === 3) {
    badge.innerText = 'In Transit';
    badge.className = 'bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full';
    if (dot1) dot1.className = 'w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold';
    if (dot2) dot2.className = 'w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold';
    if (dot3) dot3.className = 'w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-purple-100';
    showToast('Stage 3: Produce loaded in mini-truck (UP-15-AB-4819).');
  } else if (stage === 4) {
    badge.innerText = 'Completed & Paid';
    badge.className = 'bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full';
    [dot1, dot2, dot3, dot4].forEach(d => {
      if (d) d.className = 'w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold';
    });
    if (dot4) dot4.classList.add('ring-4', 'ring-emerald-100');
    showToast('Stage 4: Produce delivered and verified! Payment credited via DBT.');
  }
}

// Buyer actions
function sendBuyerPurchaseOffer(farmer, crop, qty, price) {
  showToast(`Purchase offer locked for ${farmer} for ${qty} Qtl ${crop} at ₹${price}/Qtl!`);
  openChatView(`${farmer} (Farmer)`);
}

function handlePostRequirement(e) {
  e.preventDefault();
  showToast('Requirement posted! Matched with local farmers.');
  navigateTo('buyer-dashboard');
}

// Modal System
function openModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove('hidden');
    m.classList.add('flex');
  }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add('hidden');
    m.classList.remove('flex');
  }
}

function showReportModal() {
  openModal('modal-ai-report');
}

// Viewport / Display Toggle
function toggleViewport(mode) {
  const container = document.getElementById('app-container');
  const phoneBtn = document.getElementById('view-phone-btn');
  const desktopBtn = document.getElementById('view-desktop-btn');

  if (mode === 'phone') {
    if (container) container.className = 'max-w-md mx-auto min-h-[calc(100vh-45px)] bg-slate-50 transition-all duration-300 relative pb-20 shadow-xl overflow-x-hidden border-x border-slate-200';
    if (phoneBtn) phoneBtn.className = 'p-1 rounded bg-slate-700 text-white';
    if (desktopBtn) desktopBtn.className = 'p-1 rounded text-slate-400 hover:text-white';
  } else {
    if (container) container.className = 'max-w-4xl mx-auto min-h-[calc(100vh-45px)] bg-slate-50 transition-all duration-300 relative pb-20 shadow-xl overflow-x-hidden border-x border-slate-200';
    if (desktopBtn) desktopBtn.className = 'p-1 rounded bg-slate-700 text-white';
    if (phoneBtn) phoneBtn.className = 'p-1 rounded text-slate-400 hover:text-white';
  }
}

// Comprehensive Bilingual Language System (English <-> Hindi)
function toggleLanguage() {
  const newLang = AppState.lang === 'en' ? 'hi' : 'en';
  setLanguage(newLang);
}

function setLanguage(lang) {
  AppState.lang = lang;
  const label = document.getElementById('lang-label');
  if (label) {
    label.innerText = lang === 'hi' ? 'हिन्दी (Active)' : 'EN | हिन्दी';
  }

  applyTranslations(lang);
  showToast(lang === 'hi' ? 'भाषा सफलतापूर्वक हिन्दी में बदली गई' : 'Language switched to English');
}

function applyTranslations(lang) {
  const dict = typeof AGRI_TRANSLATIONS !== 'undefined' ? AGRI_TRANSLATIONS : {};
  const revDict = typeof AGRI_REV_TRANSLATIONS !== 'undefined' ? AGRI_REV_TRANSLATIONS : {};

  // 1. Walk through all text nodes in the DOM
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: function(node) {
      if (!node.parentElement) return NodeFilter.FILTER_REJECT;
      const tag = node.parentElement.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'SVG' || tag === 'PATH') {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  }, false);

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.textContent.trim();
    if (!text) continue;

    if (lang === 'hi') {
      if (!node._origText) node._origText = node.textContent;
      if (dict[text]) {
        node.textContent = node.textContent.replace(text, dict[text]);
      }
    } else {
      if (node._origText) {
        node.textContent = node._origText;
      } else if (revDict[text]) {
        node.textContent = node.textContent.replace(text, revDict[text]);
      }
    }
  }

  // 2. Translate input placeholders
  document.querySelectorAll('input, textarea').forEach(el => {
    const ph = el.placeholder ? el.placeholder.trim() : '';
    if (lang === 'hi') {
      if (!el._origPh) el._origPh = el.placeholder;
      if (dict[ph]) el.placeholder = dict[ph];
    } else {
      if (el._origPh) el.placeholder = el._origPh;
    }
  });

  // 3. Update dynamic greeting
  const greeting = document.getElementById('farmer-name-greeting');
  if (greeting) {
    greeting.innerText = lang === 'hi' ? 'नमस्ते, रमेश 👋' : 'Hello, Ramesh 👋';
  }
}

// Toast System
function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;
  msgEl.innerText = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-4');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 3500);
}
