(function(){
  var mount = document.querySelector('[data-form-mount]');
  if(!mount) return;

  // Strip styling from Webflow wrapper containers
  var p = mount.parentElement;
  var depth = 0;
  while(p && p.tagName !== 'BODY' && depth < 6){
    p.style.maxWidth = 'none';
    p.style.width = '100%';
    p.style.background = 'transparent';
    p.style.backgroundColor = 'transparent';
    p.style.boxShadow = 'none';
    p.style.border = 'none';
    p.style.borderRadius = '0';
    p.style.padding = '0';
    p.style.margin = '0 auto';
    p = p.parentElement;
    depth++;
  }

  var PRICES = {
    freight: { under:140, over:251, packaging:50 }
  };

  var PRODUCTS = [
    { section: 'Dyner', collapsible:true, items: [
      { id:'d-baby',            label:'Babydyne',    size:'65×80',                         price:580  },
      { id:'d-barne-80',        label:'Barnedyne',   size:'80×100',                        price:660  },
      { id:'d-barne-100',       label:'Barnedyne',   size:'100×140',                       price:750  },
      { id:'d-enkel-140-200-v', label:'Enkeltdyne',  size:'140×200 — Vinterdyne',          price:1400 },
      { id:'d-enkel-140-200-s', label:'Enkeltdyne',  size:'140×200 — Sommerdyne',          price:1800 },
      { id:'d-enkel-140-220-v', label:'Enkeltdyne',  size:'140×220 — Vinterdyne',          price:1400 },
      { id:'d-enkel-140-220-s', label:'Enkeltdyne',  size:'140×220 — Sommerdyne',          price:1800 },
      { id:'d-enkel-140-250-v', label:'Enkeltdyne',  size:'140×250 — Vinterdyne',          price:1600 },
      { id:'d-enkel-140-250-s', label:'Enkeltdyne',  size:'140×250 — Sommerdyne',          price:1800 },
      { id:'d-dobbel-200-v',    label:'Dobbeltdyne', size:'200×220 — Vinterdyne',          price:2000 },
      { id:'d-dobbel-200-s',    label:'Dobbeltdyne', size:'200×220 — Sommerdyne',          price:2500 },
      { id:'d-dobbel-240-v',    label:'Dobbeltdyne', size:'240×220 — Vinterdyne',          price:2600 },
      { id:'d-dobbel-240-s',    label:'Dobbeltdyne', size:'240×220 — Sommerdyne',          price:2800 }
    ]},
    { section: 'Puter', collapsible:true, items: [
      { id:'p-5070',  label:'Pute', size:'50×70 (std)',  price:420 },
      { id:'p-6080',  label:'Pute', size:'60×80',        price:480 },
      { id:'p-4060',  label:'Pute', size:'40×60',        price:415 },
      { id:'p-70100', label:'Pute', size:'70×100',       price:720 },
      { id:'p-8080',  label:'Pute', size:'80×80',        price:635 },
      { id:'p-4550',  label:'Pute', size:'45×50',        price:345 },
      { id:'p-3540',  label:'Pute', size:'35×40 (baby)', price:310 }
    ]},
    { section: 'Tilleggstjenester', items: [
      { id:'t-etterfyll-dyne',  label:'Rens av dun i dyne for bruk som etterfyll',      size:'Per dyne',       price:420 },
      { id:'t-etterfyll-barne', label:'Rens av dun i barnedyne for bruk som etterfyll', size:'Per barnedyne',  price:210 }
    ]}
  ];

  var state = {
    step: 1,
    quantities: {},
    sameBack: true,
    returnQuantities: {},
    contactMe: false,
    customer: {}
  };
  PRODUCTS.forEach(function(s){ s.items.forEach(function(it){ state.quantities[it.id]=0; state.returnQuantities[it.id]=0; }); });

  function fmt(n){ return n.toLocaleString('nb-NO'); }
  function totalItems(q){ var n=0; for(var k in q){ n+=q[k]; } return n; }

  function calcTotal(){
    var items = state.sameBack ? state.quantities : state.returnQuantities;
    if(state.contactMe) return { lines:[], total:0, count:0 };
    var lines=[], total=0, count=0;
    PRODUCTS.forEach(function(s){
      s.items.forEach(function(it){
        var q = items[it.id] || 0;
        if(q>0){
          var sub = it.price * q;
          lines.push({ label: q+' × '+it.label+' '+it.size, price: sub });
          total += sub; count += q;
        }
      });
    });
    var heavy = count > 2;
    var fIn  = heavy ? PRICES.freight.over : PRICES.freight.under;
    var fOut = heavy ? PRICES.freight.over : PRICES.freight.under;
    lines.push({ label:'Frakt inn (est.)',  price:fIn });
    lines.push({ label:'Frakt ut (est.)',   price:fOut });
    lines.push({ label:'Emballasje',        price:PRICES.freight.packaging });
    total += fIn + fOut + PRICES.freight.packaging;
    return { lines:lines, total:total, count:count };
  }

  function renderProductRow(it, dir){
    var q = (dir==='i' ? state.quantities : state.returnQuantities)[it.id];
    return ''
      + '<div class="dr-row" data-row="'+dir+'-'+it.id+'">'
      +   '<div class="dr-row-info">'
      +     '<div class="dr-row-label">'+it.label+'</div>'
      +     '<div class="dr-row-size">'+it.size+'</div>'
      +   '</div>'
      +   '<div class="dr-row-price">'+fmt(it.price)+' kr</div>'
      +   '<div class="dr-counter">'
      +     '<button class="dr-btn" data-action="dec" data-id="'+it.id+'" data-dir="'+dir+'">−</button>'
      +     '<span class="dr-qty" data-qty="'+dir+'-'+it.id+'">'+q+'</span>'
      +     '<button class="dr-btn" data-action="inc" data-id="'+it.id+'" data-dir="'+dir+'">+</button>'
      +   '</div>'
      + '</div>';
  }

  function countSelected(s, dir){
    var bucket = dir==='i' ? state.quantities : state.returnQuantities;
    var n = 0;
    s.items.forEach(function(it){ n += bucket[it.id] || 0; });
    return n;
  }

  function renderSection(s, dir){
    var rows = s.items.map(function(it){ return renderProductRow(it, dir); }).join('');
    if(!s.collapsible){
      return '<div class="dr-section"><h3 class="dr-section-title">'+s.section+'</h3>'+rows+'</div>';
    }
    var selected = countSelected(s, dir);
    var badge = selected>0 ? '<span class="dr-section-badge">'+selected+' valgt</span>' : '';
    return ''
      + '<div class="dr-section dr-section-collapsible" data-section="'+dir+'-'+s.section+'">'
      +   '<button type="button" class="dr-section-toggle" data-toggle="'+dir+'-'+s.section+'">'
      +     '<span class="dr-section-title-row"><span class="dr-section-title">'+s.section+'</span>'+badge+'</span>'
      +     '<span class="dr-section-chevron">›</span>'
      +   '</button>'
      +   '<div class="dr-section-body" data-body="'+dir+'-'+s.section+'" style="display:none">'+rows+'</div>'
      + '</div>';
  }

  function renderStep1(){
    var grid = PRODUCTS.map(function(s){ return renderSection(s,'i'); }).join('');
    return ''
      + '<div class="dr-step" data-step="1">'
      +   '<div class="dr-card">'
      +     '<h2 class="dr-heading">Hva sender du inn?</h2>'
      +     '<p class="dr-sub">Velg produktene du ønsker renset og nytt trekk på. Prisene er estimater — endelig pris settes etter vurdering.</p>'
      +     grid
      +     '<div class="dr-info">Hvert oppdrag inkluderer alltid rens av dun og nytt trekk. Størrelsen kan endres uten ekstra kostnad.</div>'
      +   '</div>'
      + '</div>';
  }

  function renderStep2(){
    var grid = PRODUCTS.map(function(s){ return renderSection(s,'u'); }).join('');
    return ''
      + '<div class="dr-step" data-step="2" style="display:none">'
      +   '<div class="dr-card">'
      +     '<h2 class="dr-heading">Hva ønsker du tilbake?</h2>'
      +     '<p class="dr-sub">Antallet trenger ikke matche det du sender inn.</p>'
      +     '<div class="dr-options">'
      +       '<label class="dr-opt"><input type="radio" name="oc" value="same" checked><span><strong>Samme som jeg sender inn</strong></span></label>'
      +       '<label class="dr-opt"><input type="radio" name="oc" value="custom"><span><strong>Noe annet</strong> — jeg velger selv</span></label>'
      +       '<label class="dr-opt"><input type="radio" name="oc" value="contact"><span><strong>Kontakt meg</strong> — vi ringer og avklarer</span></label>'
      +     '</div>'
      +     '<div class="dr-return" data-return style="display:none">'+grid+'</div>'
      +   '</div>'
      + '</div>';
  }

  function renderStep3(){
    return ''
      + '<div class="dr-step" data-step="3" style="display:none">'
      +   '<div class="dr-card">'
      +     '<h2 class="dr-heading">Dine opplysninger</h2>'
      +     '<p class="dr-sub">Vi bruker dette for å kontakte deg og sende pakken tilbake.</p>'
      +     '<div class="dr-form">'
      +       '<input type="text"  name="navn"    placeholder="Navn" />'
      +       '<input type="email" name="epost"   placeholder="E-post" />'
      +       '<input type="tel"   name="telefon" placeholder="Telefon" />'
      +       '<input type="text"  name="adresse" placeholder="Adresse" />'
      +       '<div class="dr-form-row">'
      +         '<input type="text" name="postnr" placeholder="Postnr" style="width:140px" />'
      +         '<input type="text" name="sted"   placeholder="Sted" style="flex:1" />'
      +       '</div>'
      +     '</div>'
      +     '<div class="dr-notice">'
      +       '<div class="dr-notice-title">Viktig å vite</div>'
      +       '<p>1. Dunet kan trenge etterfyll — prisen kan bli noe høyere<br>'
      +       '2. Tilstanden kan gjøre at dynen kun egner seg til puter<br>'
      +       '3. I sjeldne tilfeller kan oppdraget ikke gjennomføres</p>'
      +       '<p class="dr-notice-strong">Vi vurderer innholdet før vi fastsetter endelig pris. Du betaler først etter at du har godkjent prisen — ingen overraskelser.</p>'
      +     '</div>'
      +     '<label class="dr-check"><input type="checkbox" name="forbehold"><span>Jeg har lest og forstått forbeholdene</span></label>'
      +   '</div>'
      + '</div>';
  }

  function renderSidebar(){
    var calc = calcTotal();
    var html = '<div class="dr-summary-card">';
    html += '<div class="dr-summary-title">Din bestilling</div>';

    if(state.contactMe){
      html += '<div class="dr-summary-note">Vi ringer deg når pakken er mottatt og anbefaler hva som passer best.</div>';
    } else if(calc.count === 0){
      html += '<div class="dr-summary-empty">Ingen produkter lagt til enda.</div>';
    } else {
      html += '<div class="dr-summary-lines">';
      calc.lines.forEach(function(l){
        html += '<div class="dr-summary-line"><span>'+l.label+'</span><span>'+fmt(l.price)+' kr</span></div>';
      });
      html += '</div>';
      html += '<div class="dr-summary-total"><span>Estimert totalpris</span><span>'+fmt(calc.total)+' kr</span></div>';
      html += '<div class="dr-summary-hint">Endelig pris settes etter vurdering. Du betaler ingenting før du har godkjent.</div>';
    }

    html += '<div class="dr-summary-nav">';
    if(state.step < 3){
      html += '<button class="dr-nav-next" data-nav="next">Neste steg →</button>';
    } else {
      html += '<button class="dr-nav-submit" data-nav="submit">Bekreft bestilling</button>';
    }
    if(state.step > 1){
      html += '<button class="dr-nav-back" data-nav="prev">← Tilbake</button>';
    }
    html += '</div>';

    html += '</div>';
    return html;
  }

  function updateSidebars(){
    var sb = document.querySelector('[data-sidebar-root]');
    if(sb) sb.innerHTML = renderSidebar();
  }

  function updateQty(id, dir){
    var q = (dir==='i' ? state.quantities : state.returnQuantities)[id];
    var el = mount.querySelector('[data-qty="'+dir+'-'+id+'"]');
    if(el) el.textContent = q;
    // Update section badges for collapsible sections
    PRODUCTS.forEach(function(s){
      if(!s.collapsible) return;
      var sec = mount.querySelector('[data-section="'+dir+'-'+s.section+'"]');
      if(!sec) return;
      var toggle = sec.querySelector('.dr-section-title-row');
      if(!toggle) return;
      var existing = toggle.querySelector('.dr-section-badge');
      var n = countSelected(s, dir);
      if(n>0){
        if(existing){ existing.textContent = n+' valgt'; }
        else {
          var badge = document.createElement('span');
          badge.className = 'dr-section-badge';
          badge.textContent = n+' valgt';
          toggle.appendChild(badge);
        }
      } else if(existing){
        existing.remove();
      }
    });
  }

  function go(n){
    if(n<1||n>3) return;
    state.step = n;
    mount.querySelectorAll('[data-step]').forEach(function(el){
      el.style.display = el.getAttribute('data-step')==String(n) ? 'block' : 'none';
    });
    updateSidebars();
    window.scrollTo({top:0, behavior:'smooth'});
  }

  mount.innerHTML = ''
    + '<style>'
    + '[data-form-mount]{font-family:inherit;color:#0f1419;position:relative;width:100vw;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;padding:48px 32px;box-sizing:border-box;background:#fbf9f4}'
    + '@media(max-width:640px){[data-form-mount]{padding:32px 20px}}'
    + '.dr-layout{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:48px;align-items:start;max-width:1180px;margin:0 auto}'
    + '@media(max-width:960px){.dr-layout{grid-template-columns:1fr;gap:24px}}'
    + '.dr-main{min-width:0}'
    + '.dr-card{background:#fff;border-radius:20px;padding:56px;box-shadow:0 1px 2px rgba(15,20,25,0.04),0 8px 24px rgba(15,20,25,0.04)}'
    + '@media(max-width:640px){.dr-card{padding:32px 24px;border-radius:16px}}'
    + '.dr-heading{font-size:32px;font-weight:600;margin:0 0 12px;color:#0f1419;letter-spacing:-0.02em;line-height:1.15}'
    + '.dr-sub{font-size:16px;color:#6b7280;margin:0 0 40px;line-height:1.6}'
    + '.dr-section{margin-bottom:48px}'
    + '.dr-section:last-child{margin-bottom:0}'
    + '.dr-section-title{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#9ca3af;margin:0 0 20px}'
    + '.dr-section-collapsible{border-top:1px solid #f3f0ea;margin-bottom:0;padding:0}'
    + '.dr-section-collapsible:last-of-type{border-bottom:1px solid #f3f0ea}'
    + '.dr-section-toggle{display:flex;align-items:center;justify-content:space-between;width:100%;padding:24px 0;background:transparent;border:none;cursor:pointer;font-family:inherit;text-align:left;transition:all 0.15s}'
    + '.dr-section-toggle:hover{opacity:0.7}'
    + '.dr-section-title-row{display:flex;align-items:center;gap:12px}'
    + '.dr-section-collapsible .dr-section-title{margin:0;font-size:15px;font-weight:600;color:#0f1419;text-transform:none;letter-spacing:-0.01em}'
    + '.dr-section-badge{font-size:12px;font-weight:500;color:#1a4d2e;background:#e8f0ec;padding:4px 10px;border-radius:999px;letter-spacing:0;text-transform:none}'
    + '.dr-section-chevron{font-size:24px;color:#9ca3af;transform:rotate(90deg);transition:transform 0.25s ease;line-height:1;font-weight:300}'
    + '.dr-section-collapsible.is-open .dr-section-chevron{transform:rotate(-90deg)}'
    + '.dr-section-body{padding-bottom:8px}'
    + '.dr-row{display:grid;grid-template-columns:1fr auto auto;gap:24px;align-items:center;padding:18px 0;border-bottom:1px solid #f3f0ea}'
    + '.dr-row:last-child{border-bottom:none}'
    + '.dr-row-label{font-size:16px;font-weight:500;color:#0f1419;line-height:1.3;letter-spacing:-0.01em}'
    + '.dr-row-size{font-size:14px;color:#9ca3af;margin-top:4px;font-weight:400}'
    + '.dr-row-price{font-size:15px;font-weight:500;color:#0f1419;min-width:88px;text-align:right;white-space:nowrap;letter-spacing:-0.01em}'
    + '.dr-counter{display:flex;align-items:center;gap:4px;background:#f6f3ed;border-radius:999px;padding:4px}'
    + '.dr-btn{width:32px;height:32px;border-radius:999px;border:none;background:transparent;font-size:18px;font-weight:500;cursor:pointer;color:#0f1419;display:flex;align-items:center;justify-content:center;transition:all 0.2s;padding:0;line-height:1}'
    + '.dr-btn:hover{background:#fff;box-shadow:0 1px 3px rgba(15,20,25,0.1)}'
    + '.dr-qty{font-size:15px;font-weight:600;min-width:24px;text-align:center;color:#0f1419}'
    + '.dr-info{background:#f6f3ed;border-radius:14px;padding:20px 24px;font-size:14px;color:#6b7280;margin-top:40px;line-height:1.6}'
    + '.dr-sidebar{position:sticky;top:32px}'
    + '.dr-summary-card{background:#fff;border-radius:20px;padding:32px;box-shadow:0 1px 2px rgba(15,20,25,0.04),0 8px 24px rgba(15,20,25,0.04)}'
    + '.dr-summary-title{font-size:13px;font-weight:600;margin-bottom:24px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.12em}'
    + '.dr-summary-empty{font-size:15px;color:#9ca3af;padding:8px 0 24px;line-height:1.5}'
    + '.dr-summary-note{font-size:14px;color:#6b7280;padding:8px 0 20px;line-height:1.6}'
    + '.dr-summary-lines{display:flex;flex-direction:column;gap:12px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #f3f0ea}'
    + '.dr-summary-line{display:flex;justify-content:space-between;gap:16px;font-size:14px;color:#6b7280;line-height:1.5}'
    + '.dr-summary-line span:last-child{font-weight:500;color:#0f1419;white-space:nowrap}'
    + '.dr-summary-total{display:flex;justify-content:space-between;font-size:18px;font-weight:600;color:#0f1419;padding-bottom:4px;letter-spacing:-0.01em}'
    + '.dr-summary-hint{font-size:13px;color:#9ca3af;line-height:1.5;margin-top:16px;padding-top:16px;border-top:1px solid #f3f0ea}'
    + '.dr-summary-nav{display:flex;flex-direction:column;gap:10px;margin-top:28px}'
    + '.dr-nav-next,.dr-nav-submit{background:#1a4d2e;color:#fff;padding:16px 24px;border-radius:999px;font-size:15px;font-weight:600;border:none;cursor:pointer;width:100%;transition:all 0.2s;letter-spacing:-0.01em}'
    + '.dr-nav-next:hover,.dr-nav-submit:hover{background:#0f3820;transform:translateY(-1px);box-shadow:0 4px 12px rgba(26,77,46,0.25)}'
    + '.dr-nav-back{background:transparent;color:#6b7280;padding:14px 24px;border-radius:999px;font-size:14px;font-weight:500;border:none;cursor:pointer;width:100%;transition:all 0.2s}'
    + '.dr-nav-back:hover{color:#0f1419;background:#f6f3ed}'
    + '.dr-options{display:flex;flex-direction:column;gap:12px;margin-bottom:32px}'
    + '.dr-opt{display:flex;align-items:center;gap:14px;padding:20px 24px;border:1.5px solid #ece9e2;border-radius:16px;cursor:pointer;background:#fff;transition:all 0.2s}'
    + '.dr-opt:hover{border-color:#1a4d2e;background:#fafaf7}'
    + '.dr-opt input{accent-color:#1a4d2e;width:18px;height:18px;margin:0;cursor:pointer}'
    + '.dr-opt input:checked+span{color:#0f1419}'
    + '.dr-opt span{font-size:15px;color:#6b7280;line-height:1.5}'
    + '.dr-opt strong{font-weight:600;color:#0f1419}'
    + '.dr-form{display:flex;flex-direction:column;gap:14px;margin-bottom:32px}'
    + '.dr-form input{padding:16px 20px;border:1.5px solid #ece9e2;border-radius:14px;font-size:15px;font-family:inherit;color:#0f1419;background:#fff;transition:all 0.2s}'
    + '.dr-form input::placeholder{color:#9ca3af}'
    + '.dr-form input:focus{outline:none;border-color:#1a4d2e;background:#fafaf7}'
    + '.dr-form-row{display:flex;gap:12px}'
    + '.dr-notice{background:#f6f3ed;border-radius:16px;padding:28px 32px;margin-bottom:28px}'
    + '.dr-notice-title{font-size:16px;font-weight:600;margin-bottom:12px;color:#0f1419}'
    + '.dr-notice p{font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 12px}'
    + '.dr-notice-strong{font-weight:500;color:#0f1419;margin-top:16px!important}'
    + '.dr-check{display:flex;align-items:center;gap:12px;cursor:pointer;padding:4px 0}'
    + '.dr-check input{accent-color:#1a4d2e;width:18px;height:18px;cursor:pointer}'
    + '.dr-check span{font-size:14px;color:#6b7280}'
    + '</style>'
    + '<div class="dr-layout">'
    +   '<div class="dr-main">'
    +     renderStep1()
    +     renderStep2()
    +     renderStep3()
    +   '</div>'
    +   '<aside class="dr-sidebar" data-sidebar-root></aside>'
    + '</div>';

  updateSidebars();

  mount.addEventListener('click', function(e){
    var tog = e.target.closest('[data-toggle]');
    if(tog){
      var key = tog.dataset.toggle;
      var body = mount.querySelector('[data-body="'+key+'"]');
      var sec  = mount.querySelector('[data-section="'+key+'"]');
      if(body && sec){
        var isOpen = sec.classList.contains('is-open');
        if(isOpen){ body.style.display='none'; sec.classList.remove('is-open'); }
        else { body.style.display='block'; sec.classList.add('is-open'); }
      }
      return;
    }
    var btn = e.target.closest('[data-action]');
    if(btn){
      var id = btn.dataset.id;
      var dir = btn.dataset.dir;
      var bucket = dir==='i' ? state.quantities : state.returnQuantities;
      bucket[id] = Math.max(0, bucket[id] + (btn.dataset.action==='inc' ? 1 : -1));
      updateQty(id, dir);
      updateSidebars();
      return;
    }
    var nav = e.target.closest('[data-nav]');
    if(nav){
      var a = nav.dataset.nav;
      if(a==='next'){
        if(state.step===1 && totalItems(state.quantities)===0){
          alert('Legg til minst ett produkt for å gå videre.');
          return;
        }
        go(state.step+1);
      }
      if(a==='prev') go(state.step-1);
      if(a==='submit') doSubmit();
    }
  });

  mount.addEventListener('change', function(e){
    var r = e.target.closest('input[name="oc"]');
    if(r){
      state.sameBack = r.value==='same';
      state.contactMe = r.value==='contact';
      var rt = mount.querySelector('[data-return]');
      if(rt) rt.style.display = r.value==='custom' ? 'block' : 'none';
      if(r.value==='same'){
        for(var k in state.quantities){ state.returnQuantities[k] = state.quantities[k]; }
      }
      updateSidebars();
    }
  });

  function doSubmit(){
    var forbehold = mount.querySelector('[name="forbehold"]');
    if(!forbehold || !forbehold.checked){ alert('Du må bekrefte at du har lest forbeholdene.'); return; }
    var navn = mount.querySelector('[name="navn"]').value.trim();
    var epost = mount.querySelector('[name="epost"]').value.trim();
    var telefon = mount.querySelector('[name="telefon"]').value.trim();
    var adresse = mount.querySelector('[name="adresse"]').value.trim();
    var postnr = mount.querySelector('[name="postnr"]').value.trim();
    var sted = mount.querySelector('[name="sted"]').value.trim();
    if(!navn||!epost||!telefon||!adresse||!postnr||!sted){ alert('Fyll ut alle feltene.'); return; }

    var inputList=[], outputList=[];
    PRODUCTS.forEach(function(s){
      s.items.forEach(function(it){
        if(state.quantities[it.id]>0) inputList.push(state.quantities[it.id]+'x '+it.label+' '+it.size);
        if(state.returnQuantities[it.id]>0) outputList.push(state.returnQuantities[it.id]+'x '+it.label+' '+it.size);
      });
    });

    var calc = calcTotal();
    var btn = mount.querySelector('[data-nav="submit"]');
    if(btn){ btn.textContent='Sender...'; btn.disabled=true; }

    fetch('https://hook.eu1.make.com/sgitxxj5vy787dc7j4oalpdofcvazx92', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        navn: navn, epost: epost, telefon: telefon,
        adresse: adresse, postnr: postnr, sted: sted,
        produkter_inn: inputList.join(', '),
        oensket_output: state.contactMe ? 'Kontakt meg når pakken er mottatt' : outputList.join(', '),
        kontakt_meg: state.contactMe,
        estimert_pris: calc.total
      })
    }).then(function(){ window.location.href='/takk'; })
      .catch(function(){
        alert('Noe gikk galt. Prøv igjen.');
        if(btn){ btn.textContent='Bekreft bestilling'; btn.disabled=false; }
      });
  }

  go(1);
})();
