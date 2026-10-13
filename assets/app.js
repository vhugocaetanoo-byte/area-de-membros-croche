(function () {
  "use strict";

  const BRAND = "Ateliê Ponto Nobre";
  const C = window.CATALOG;
  const app = document.getElementById("app");

  // ---------- Storage (tolerates blocked localStorage) ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("apn:" + key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("apn:" + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
    del(key) { try { localStorage.removeItem("apn:" + key); } catch (e) { /* ignore */ } },
  };
  const state = {
    user: store.get("user", null),
    done: new Set(store.get("done", [])),
    favs: new Set(store.get("favs", [])),
    last: store.get("last", null),
  };
  const save = () => {
    store.set("done", [...state.done]);
    store.set("favs", [...state.favs]);
    store.set("last", state.last);
  };

  // ---------- Index ----------
  const catById = {}, trackById = {}, modelIndex = [];
  C.categories.forEach((c) => {
    catById[c.id] = c;
    c.models.forEach((m) => { m.cat = c; modelIndex.push(m); });
  });
  C.tracks.forEach((t) => { trackById[t.id] = t; });
  const allVideos = [];
  modelIndex.forEach((m) => m.videos.forEach((v) => allVideos.push(v)));
  C.tracks.forEach((t) => t.videos.forEach((v) => allVideos.push(v)));

  // ---------- Helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const thumb = (yt) => `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`;
  const fmtDur = (sec) => {
    if (!sec) return "";
    const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
    return h ? `${h}h${m ? String(m).padStart(2, "0") : ""}` : `${m} min`;
  };
  const doneCount = (videos) => videos.filter((v) => state.done.has(v.yt)).length;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const firstName = () => (state.user && state.user.name) || "aluna";
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"; };
  const modelNextIndex = (m) => { const i = m.videos.findIndex((v) => !state.done.has(v.yt)); return i < 0 ? 0 : i; };

  const I = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    heart: '<path d="M12 20s-7-4.4-9.2-8.6C1.2 8.3 3 4.5 6.6 4.5c2.1 0 3.4 1.2 4.4 2.6 1-1.4 2.3-2.6 4.4-2.6 3.6 0 5.4 3.8 3.8 6.9C19 15.6 12 20 12 20z"/>',
    gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4 9 8 12 8zm0 0s2-5 4.5-4S15 8 12 8z"/>',
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    back: '<path d="m15 6-6 6 6 6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    yarn: '<circle cx="12" cy="12" r="8"/><path d="M6 8c4 1 8 5 9 10M9 4.6c2 3 6 6 10.6 6.4M4.2 13c3 0 6 2 7 6.8"/>',
    ruler: '<rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6.5 8v3M10 8v4M13.5 8v3M17 8v4"/>',
    grid: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 7.5 20 18M8.5 16.5 20 6"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6.5v11"/>',
    box: '<path d="m3 7 9-4 9 4v10l-9 4-9-4z"/><path d="m3 7 9 4 9-4M12 11v10"/>',
    dress: '<path d="M9 3h6l-1 4 4 14H6l4-14z"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  };
  const icon = (name, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${I[name] || ""}</svg>`;
  const TRACK_ICON = { "fios-e-agulhas": "yarn", "medidas-e-modelagem": "ruler", "leitura-de-graficos": "grid", "acabamentos": "scissors" };

  const brandMark = `<svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#8C3B4A"/><circle cx="32" cy="32" r="15" fill="none" stroke="#F3D9B1" stroke-width="4"/><path d="M20 27c8 4 16 4 24 0M19 35c9 4 17 4 26 0" stroke="#F3D9B1" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
  const brand = (href = "#/") => `<a class="brand" href="${href}">${brandMark}<span class="brand-name"><small>Ateliê</small>Ponto Nobre</span></a>`;

  let toastTimer;
  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  // ---------- Layout ----------
  function shell(active, content) {
    const initial = esc(firstName().charAt(0).toUpperCase());
    const nav = [["home", "#/", "Início"], ["search", "#/buscar", "Buscar"], ["favs", "#/favoritos", "Favoritas"], ["extras", "#/materiais", "Materiais"]];
    const navIcons = { home: "home", search: "search", favs: "heart", extras: "gift" };
    return `
      <header class="topbar"><div class="wrap">
        ${brand()}
        <nav class="nav" aria-label="Principal">${nav.map(([k, h, l]) => `<a href="${h}" ${active === k ? 'aria-current="page"' : ""}>${l}</a>`).join("")}</nav>
        <div class="top-actions">
          <a class="icon-btn" href="#/buscar" aria-label="Buscar aulas">${icon("search")}</a>
          <div class="menu">
            <button class="avatar" type="button" aria-haspopup="true" aria-expanded="false" data-menu>${initial}</button>
            <div class="menu-pop" hidden>
              <div class="who"><strong>${esc(firstName())}</strong><span>${esc(state.user ? state.user.email : "")}</span></div>
              <a href="#/favoritos">${icon("heart")} Minhas favoritas</a>
              <a href="#/materiais">${icon("gift")} Materiais e bônus</a>
              <button type="button" data-logout>${icon("logout")} Sair</button>
            </div>
          </div>
        </div>
      </div></header>
      <main id="main" tabindex="-1">${content}</main>
      <footer class="footer"><div class="wrap">${BRAND} · Área exclusiva para alunas</div></footer>
      <nav class="tabbar" aria-label="Navegação">${nav.map(([k, h, l]) => `<a href="${h}" ${active === k ? 'aria-current="page"' : ""}>${icon(navIcons[k])}${l}</a>`).join("")}</nav>`;
  }

  function modelCard(m) {
    const total = m.videos.length, done = doneCount(m.videos), fav = state.favs.has(m.id);
    const complete = done === total;
    const next = modelNextIndex(m);
    return `
      <article class="card">
        <button class="fav" type="button" data-fav="${m.id}" aria-pressed="${fav}" aria-label="${fav ? "Remover das favoritas" : "Salvar nas favoritas"}: ${esc(m.title)}">${icon("heart")}</button>
        <a href="#/aula/${m.cat.id}/${m.id}/${next + 1}">
          <div class="thumb">
            <img src="${thumb(m.thumb)}" alt="" loading="lazy">
            <div class="play"><span>${icon("play")}</span></div>
            <div class="badges">
              ${total > 1 ? `<span class="badge">${total} partes</span>` : ""}
              ${complete ? `<span class="badge done">Concluída</span>` : done ? `<span class="badge">${done}/${total} vistas</span>` : ""}
            </div>
          </div>
          <div class="body">
            <h3>${esc(m.title)}</h3>
            <div class="meta">
              <span>${icon("layers")}${esc(m.level)}</span>
              ${m.duration ? `<span>${icon("clock")}${fmtDur(m.duration)}</span>` : ""}
            </div>
          </div>
        </a>
      </article>`;
  }

  // ---------- Pages ----------
  function pageLogin() {
    document.body.classList.remove("app");
    const pics = modelIndex.filter((_, i) => i % 23 === 0).slice(0, 12).map((m) => `<img src="${thumb(m.thumb)}" alt="">`).join("");
    app.innerHTML = `
      <div class="login">
        <section class="login-art">
          <div class="mosaic" aria-hidden="true">${pics}</div>
          <div class="brand-row">${brand("#/login").replace('class="brand"', 'class="brand" style="color:#fff"')}</div>
          <div>
            <h1>Seu ateliê de crochê, sempre aberto.</h1>
            <p>Mais de 250 modelos com aulas passo a passo, organizados para você aprender no seu ritmo.</p>
          </div>
          <div class="head-stats">
            <span class="pill">5 coleções</span><span class="pill">4 trilhas bônus</span><span class="pill">287 aulas</span>
          </div>
        </section>
        <section class="login-panel">
          <form class="login-card" novalidate>
            <h2>Bem-vinda de volta</h2>
            <p class="lead">Entre com o e-mail e a senha que você recebeu na compra.</p>
            <label class="field"><span>Seu e-mail</span><input type="email" name="email" autocomplete="email" required placeholder="nome@email.com"></label>
            <label class="field"><span>Sua senha</span><input type="password" name="password" autocomplete="current-password" required placeholder="Digite sua senha"></label>
            <button class="btn btn-primary btn-block" type="submit">Entrar no ateliê ${icon("arrow")}</button>
            <p class="login-note">Problemas para entrar? Responda o e-mail de compra que ajudamos você.</p>
          </form>
        </section>
      </div>`;
    app.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      const email = f.email.value.trim();
      if (!email || !f.password.value) { toast("Preencha o e-mail e a senha."); (email ? f.password : f.email).focus(); return; }
      const raw = email.split("@")[0].split(/[._\-\d]/)[0] || "aluna";
      state.user = { email, name: raw.charAt(0).toUpperCase() + raw.slice(1) };
      store.set("user", state.user);
      location.hash = "#/";
    });
  }

  function pageHome() {
    const total = allVideos.length, done = doneCount(allVideos);
    const R = 46, CIRC = 2 * Math.PI * R;
    const modelsDone = modelIndex.filter((m) => doneCount(m.videos) === m.videos.length).length;
    let cont = "";
    if (state.last) {
      cont = `
        <a class="continue" href="${state.last.href}">
          <div class="thumb"><img src="${thumb(state.last.yt)}" alt=""><div class="play" style="opacity:1"><span>${icon("play")}</span></div></div>
          <div><div class="kicker">Continuar de onde parei</div><h3>${esc(state.last.title)}</h3><div class="meta">${esc(state.last.sub)}</div></div>
        </a>`;
    } else {
      const start = trackById["fios-e-agulhas"];
      cont = `
        <a class="continue" href="#/trilha/${start.id}/1">
          <div class="thumb"><img src="${thumb(start.videos[0].yt)}" alt=""><div class="play" style="opacity:1"><span>${icon("play")}</span></div></div>
          <div><div class="kicker">Primeira vez aqui? Comece por aqui</div><h3>${esc(start.title)}</h3><div class="meta">Escolha os fios e agulhas certos antes do primeiro ponto.</div></div>
        </a>`;
    }
    return shell("home", `
      <div class="wrap">
        <section class="hero">
          <div class="hello">
            <h1>${greeting()}, ${esc(firstName())}!</h1>
            <p>Que bom ter você no ateliê. Escolha uma coleção e aprenda no seu ritmo.</p>
            ${cont}
          </div>
          <aside class="progress-card" aria-label="Seu progresso">
            <h2>Seu progresso</h2>
            <div class="ring">
              <svg viewBox="0 0 110 110" aria-hidden="true"><circle cx="55" cy="55" r="${R}" stroke="rgba(255,255,255,.18)" stroke-width="12" fill="none"/><circle cx="55" cy="55" r="${R}" stroke="#F3D9B1" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC * (1 - done / total)}"/></svg>
              <div><div class="num">${pct(done, total)}%</div><div class="lbl">das aulas concluídas</div></div>
            </div>
            <div class="stats">
              <div class="stat"><b>${done}</b><span>de ${total} aulas vistas</span></div>
              <div class="stat"><b>${modelsDone}</b><span>peças concluídas</span></div>
            </div>
          </aside>
        </section>

        <section class="section" aria-labelledby="h-col">
          <div class="section-head"><div><div class="eyebrow">Coleções</div><h2 id="h-col">O que você quer fazer hoje?</h2></div></div>
          <div class="collections">
            ${C.categories.map((c) => {
              const vids = c.models.flatMap((m) => m.videos), d = doneCount(vids);
              return `<a class="collection" href="#/colecao/${c.id}">
                <img src="${thumb(c.models[0].thumb)}" alt="" loading="lazy">
                <span class="pill">${c.models.length} modelos</span>
                <div class="body"><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p>
                <div class="bar" aria-label="${pct(d, vids.length)}% concluído"><i style="width:${pct(d, vids.length)}%"></i></div></div>
              </a>`;
            }).join("")}
          </div>
        </section>

        <section class="section" aria-labelledby="h-tr">
          <div class="section-head"><div><div class="eyebrow">Bônus</div><h2 id="h-tr">Trilhas para aprender a base</h2><p>Aulas em sequência. Assista na ordem para aproveitar melhor.</p></div></div>
          <div class="tracks">
            ${C.tracks.map((t) => {
              const d = doneCount(t.videos);
              return `<a class="track" href="#/trilha/${t.id}/${Math.min(d + 1, t.videos.length)}">
                <div class="ico">${icon(TRACK_ICON[t.id])}</div>
                <h3>${esc(t.title)}</h3><p>${esc(t.description)}</p>
                <div class="mini-bar"><i style="width:${pct(d, t.videos.length)}%"></i></div>
                <div class="foot"><span>${t.videos.length} aulas</span><span>${d ? `${d}/${t.videos.length} vistas` : "Começar"}</span></div>
              </a>`;
            }).join("")}
          </div>
        </section>

        <section class="section" aria-labelledby="h-ex">
          <div class="section-head"><div><div class="eyebrow">Materiais</div><h2 id="h-ex">Produtos e bônus extras</h2></div><a class="btn btn-ghost" href="#/materiais">Ver todos</a></div>
          ${extrasHtml(true)}
        </section>
      </div>`);
  }

  function extrasHtml(compact) {
    return C.extras.map((g) => `
      <div class="extras-group">
        ${compact ? "" : `<h3>${esc(g.group)}</h3>`}
        <div class="extras">${(compact ? g.items.slice(0, 2) : g.items).map((x) => `
          <a class="extra" href="${x.url}" target="_blank" rel="noopener">
            <span class="ico">${icon(x.icon)}</span><span>${esc(x.title)}</span><span class="go">${icon("external")}</span>
          </a>`).join("")}</div>
      </div>`).join("");
  }

  function pageExtras() {
    return shell("extras", `
      <div class="wrap">
        <div class="page-head">
          <nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a>${icon("chevron")}<span>Materiais</span></nav>
          <h1>Produtos e bônus</h1>
          <p>Receitas, guias e materiais extras. Cada item abre em uma nova aba, no Google Drive.</p>
        </div>
        <section class="section" style="margin-top:28px">${extrasHtml(false)}</section>
      </div>`);
  }

  const catFilter = { group: "Todos", level: "Todos", q: "" };
  function pageCategory(id) {
    const c = catById[id];
    if (!c) return pageNotFound();
    const groups = ["Todos", ...new Set(c.models.map((m) => m.group))];
    const vids = c.models.flatMap((m) => m.videos), d = doneCount(vids);
    if (catFilter.cat !== id) Object.assign(catFilter, { cat: id, group: "Todos", level: "Todos", q: "" });
    const html = shell("home", `
      <div class="wrap">
        <div class="page-head">
          <nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a>${icon("chevron")}<span>${esc(c.title)}</span></nav>
          <h1>${esc(c.title)}</h1>
          <p>${esc(c.description)}</p>
          <div class="head-stats"><span class="pill soft">${c.models.length} modelos</span><span class="pill soft">${vids.length} aulas</span><span class="pill ok">${d} vistas</span></div>
        </div>
        <div class="toolbar">
          <div class="toolbar-row">
            <label class="search">${icon("search")}<span class="sr" hidden>Buscar</span><input type="search" placeholder="Buscar nesta coleção…" value="${esc(catFilter.q)}" data-q aria-label="Buscar nesta coleção"></label>
            <select class="select" data-level aria-label="Filtrar por nível">
              ${["Todos", "Iniciante", "Intermediário", "Avançado"].map((l) => `<option value="${l}" ${catFilter.level === l ? "selected" : ""}>${l === "Todos" ? "Todos os níveis" : l}</option>`).join("")}
            </select>
          </div>
          <div class="chips" role="group" aria-label="Tipos">
            ${groups.map((g) => `<button class="chip" type="button" data-group="${esc(g)}" aria-pressed="${catFilter.group === g}">${esc(g)}<small>${g === "Todos" ? c.models.length : c.models.filter((m) => m.group === g).length}</small></button>`).join("")}
          </div>
        </div>
        <div data-results></div>
      </div>`);
    app.innerHTML = html;
    const results = app.querySelector("[data-results]");
    const draw = () => {
      const q = norm(catFilter.q.trim());
      const list = c.models.filter((m) =>
        (catFilter.group === "Todos" || m.group === catFilter.group) &&
        (catFilter.level === "Todos" || m.level === catFilter.level) &&
        (!q || norm(m.title).includes(q)));
      results.innerHTML = list.length
        ? `<p class="result-note">${list.length} ${list.length === 1 ? "modelo" : "modelos"}</p><div class="grid">${list.map(modelCard).join("")}</div>`
        : `<div class="empty"><h3>Nenhum modelo encontrado</h3><p>Tente outra palavra ou limpe os filtros.</p><button class="btn btn-ghost" type="button" data-clear>Limpar filtros</button></div>`;
    };
    draw();
    app.querySelector("[data-q]").addEventListener("input", (e) => { catFilter.q = e.target.value; draw(); });
    app.querySelector("[data-level]").addEventListener("change", (e) => { catFilter.level = e.target.value; draw(); });
    app.querySelectorAll("[data-group]").forEach((b) => b.addEventListener("click", () => {
      catFilter.group = b.dataset.group;
      app.querySelectorAll("[data-group]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    }));
    results.addEventListener("click", (e) => {
      if (e.target.closest("[data-clear]")) {
        Object.assign(catFilter, { group: "Todos", level: "Todos", q: "" });
        app.querySelector("[data-q]").value = ""; app.querySelector("[data-level]").value = "Todos";
        app.querySelectorAll("[data-group]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.group === "Todos")));
        draw();
      }
    });
    return null;
  }

  function playerHtml(v) {
    const src = v.drive
      ? `https://drive.google.com/file/d/${v.drive}/preview`
      : `https://www.youtube-nocookie.com/embed/${v.yt}?rel=0&playsinline=1`;
    return `<div class="player"><div class="loading">Carregando vídeo…</div><iframe src="${src}" title="${esc(v.title)}" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen loading="eager"></iframe></div>`;
  }
  const externalUrl = (v) => v.drive ? `https://drive.google.com/file/d/${v.drive}/view` : `https://www.youtube.com/watch?v=${v.yt}`;

  function lessonLayout({ crumbs, kicker, title, tags, v, nextHref, nextLabel, prevHref, side, fav }) {
    const isDone = state.done.has(v.yt);
    return shell("home", `
      <div class="wrap">
        <div class="page-head" style="padding-bottom:0"><nav class="crumbs" aria-label="Você está em">${crumbs}</nav></div>
        <div class="lesson">
          <div>
            ${playerHtml(v)}
            <div class="lesson-info">
              <div class="kicker">${kicker}</div>
              <h1>${esc(title)}</h1>
              <div class="tags">${tags}</div>
              <div class="actions">
                <button class="btn ${isDone ? "btn-done" : "btn-ghost"}" type="button" data-done="${v.yt}">${icon("check")} ${isDone ? "Aula concluída" : "Marcar como concluída"}</button>
                ${nextHref ? `<a class="btn btn-primary" href="${nextHref}" data-next>${nextLabel} ${icon("arrow")}</a>` : ""}
                ${fav ? `<button class="btn btn-ghost" type="button" data-fav="${fav.id}" aria-pressed="${state.favs.has(fav.id)}">${icon("heart")} ${state.favs.has(fav.id) ? "Nas favoritas" : "Favoritar"}</button>` : ""}
              </div>
              <div class="help">${icon("info")}<div>O vídeo não carregou? <a href="${externalUrl(v)}" target="_blank" rel="noopener">Abra em uma nova aba</a>. Dica: use o botão de tela cheia no canto do vídeo para ver os pontos de perto.</div></div>
              ${prevHref ? `<p style="margin-top:20px"><a href="${prevHref}" style="font-weight:700">← Voltar para a aula anterior</a></p>` : ""}
            </div>
          </div>
          ${side}
        </div>
      </div>`);
  }

  function pageModel(catId, modelId, partNo) {
    const c = catById[catId];
    const m = c && c.models.find((x) => x.id === modelId);
    if (!m) return pageNotFound();
    const i = Math.min(Math.max(parseInt(partNo, 10) || 1, 1), m.videos.length) - 1;
    const v = m.videos[i], total = m.videos.length;
    const base = `#/aula/${c.id}/${m.id}/`;
    state.last = { href: base + (i + 1), yt: v.yt, title: m.title + (total > 1 ? ` — Parte ${i + 1}` : ""), sub: c.title };
    save();

    const pos = c.models.indexOf(m);
    const nextModel = c.models[pos + 1];
    let nextHref, nextLabel;
    if (i < total - 1) { nextHref = base + (i + 2); nextLabel = `Ir para a Parte ${i + 2}`; }
    else if (nextModel) { nextHref = `#/aula/${c.id}/${nextModel.id}/1`; nextLabel = "Próximo modelo"; }

    let side;
    if (total > 1) {
      const d = doneCount(m.videos);
      side = `<aside class="side" aria-label="Partes desta aula">
        <div class="side-head"><h2>Partes desta aula</h2><p>Assista na ordem: ${d} de ${total} concluídas.</p><div class="mini-bar"><i style="width:${pct(d, total)}%"></i></div></div>
        <ol class="steps">${m.videos.map((x, k) => `<li><a href="${base + (k + 1)}" ${k === i ? 'aria-current="true"' : ""}>
          <span class="n ${state.done.has(x.yt) ? "done" : ""}">${state.done.has(x.yt) ? icon("check") : k + 1}</span>
          <span><span class="t">${esc(x.title)}</span><br><span class="d">${k === i ? "Assistindo agora" : fmtDur(x.duration)}</span></span></a></li>`).join("")}</ol>
      </aside>`;
    } else {
      const more = c.models.filter((x) => x !== m && x.group === m.group).slice(0, 6);
      side = `<aside class="side" aria-label="Mais modelos">
        <div class="side-head"><h2>Mais em ${esc(m.group)}</h2><p>Outros modelos parecidos com este.</p></div>
        <ul class="steps">${more.map((x) => `<li><a href="#/aula/${c.id}/${x.id}/${modelNextIndex(x) + 1}">
          <img class="thumbmini" src="${thumb(x.thumb)}" alt="" loading="lazy">
          <span><span class="t">${esc(x.title)}</span><br><span class="d">${x.videos.length > 1 ? x.videos.length + " partes · " : ""}${esc(x.level)}</span></span></a></li>`).join("")}</ul>
      </aside>`;
    }
    return lessonLayout({
      crumbs: `<a href="#/">Início</a>${icon("chevron")}<a href="#/colecao/${c.id}">${esc(c.title)}</a>${icon("chevron")}<span>${esc(m.title)}</span>`,
      kicker: total > 1 ? `${esc(c.title)} · Parte ${i + 1} de ${total}` : esc(c.title),
      title: m.title + (total > 1 ? ` — Parte ${i + 1}` : ""),
      tags: `<span class="pill soft">${esc(m.level)}</span><span class="pill soft">${esc(m.group)}</span>${v.duration ? `<span class="pill soft">${fmtDur(v.duration)}</span>` : ""}`,
      v, nextHref, nextLabel, prevHref: i > 0 ? base + i : null, side, fav: m,
    });
  }

  function pageTrack(trackId, n) {
    const t = trackById[trackId];
    if (!t) return pageNotFound();
    const i = Math.min(Math.max(parseInt(n, 10) || 1, 1), t.videos.length) - 1;
    const v = t.videos[i], base = `#/trilha/${t.id}/`;
    state.last = { href: base + (i + 1), yt: v.yt, title: v.title, sub: `${t.title} · Aula ${i + 1}` };
    save();
    const d = doneCount(t.videos);
    const side = `<aside class="side" aria-label="Aulas da trilha">
      <div class="side-head"><h2>${esc(t.title)}</h2><p>${d} de ${t.videos.length} aulas concluídas.</p><div class="mini-bar"><i style="width:${pct(d, t.videos.length)}%"></i></div></div>
      <ol class="steps">${t.videos.map((x, k) => `<li><a href="${base + (k + 1)}" ${k === i ? 'aria-current="true"' : ""}>
        <span class="n ${state.done.has(x.yt) ? "done" : ""}">${state.done.has(x.yt) ? icon("check") : k + 1}</span>
        <span><span class="t">${esc(x.title)}</span><br><span class="d">${k === i ? "Assistindo agora" : fmtDur(x.duration)}</span></span></a></li>`).join("")}</ol>
    </aside>`;
    return lessonLayout({
      crumbs: `<a href="#/">Início</a>${icon("chevron")}<span>Trilha: ${esc(t.title)}</span>`,
      kicker: `Trilha bônus · Aula ${i + 1} de ${t.videos.length}`,
      title: v.title,
      tags: v.duration ? `<span class="pill gold">${fmtDur(v.duration)}</span>` : "",
      v, nextHref: i < t.videos.length - 1 ? base + (i + 2) : null, nextLabel: "Próxima aula",
      prevHref: i > 0 ? base + i : null, side,
    });
  }

  function pageSearch() {
    const html = shell("search", `
      <div class="wrap">
        <div class="page-head">
          <h1>Buscar aulas</h1>
          <p>Digite o nome de uma peça, como “bolsa de praia”, “sereia” ou “bebê”.</p>
        </div>
        <label class="search search-big" style="display:block;margin-top:20px">${icon("search")}<input type="search" placeholder="O que você quer aprender?" data-q aria-label="Buscar aulas" autofocus></label>
        <div data-results></div>
      </div>`);
    app.innerHTML = html;
    const input = app.querySelector("[data-q]"), results = app.querySelector("[data-results]");
    const draw = () => {
      const q = norm(input.value.trim());
      if (q.length < 2) { results.innerHTML = `<p class="result-note">Digite pelo menos 2 letras.</p>`; return; }
      const words = q.split(/\s+/);
      const match = (s) => { const n = norm(s); return words.every((w) => n.includes(w)); };
      const models = modelIndex.filter((m) => match(m.title + " " + m.group + " " + m.cat.title));
      const lessons = C.tracks.flatMap((t) => t.videos.map((v, k) => ({ t, v, k })).filter((x) => match(x.v.title + " " + x.t.title)));
      if (!models.length && !lessons.length) { results.innerHTML = `<div class="empty"><h3>Nada encontrado</h3><p>Tente uma palavra mais simples, como “vestido” ou “tapete”.</p></div>`; return; }
      results.innerHTML =
        (lessons.length ? `<h2 class="group-title">Trilhas bônus</h2><div class="extras">${lessons.map((x) => `<a class="extra" href="#/trilha/${x.t.id}/${x.k + 1}"><span class="ico">${icon(TRACK_ICON[x.t.id])}</span><span>${esc(x.v.title)}<br><small style="color:var(--muted);font-weight:600">${esc(x.t.title)}</small></span></a>`).join("")}</div>` : "") +
        (models.length ? `<h2 class="group-title">${models.length} ${models.length === 1 ? "modelo" : "modelos"}</h2><div class="grid">${models.slice(0, 60).map(modelCard).join("")}</div>` : "");
    };
    input.addEventListener("input", draw);
    draw();
    input.focus();
    return null;
  }

  function pageFavs() {
    const list = modelIndex.filter((m) => state.favs.has(m.id));
    return shell("favs", `
      <div class="wrap">
        <div class="page-head">
          <h1>Minhas favoritas</h1>
          <p>Toque no coração de qualquer modelo para guardar aqui.</p>
        </div>
        ${list.length ? `<p class="result-note">${list.length} ${list.length === 1 ? "modelo salvo" : "modelos salvos"}</p><div class="grid">${list.map(modelCard).join("")}</div>`
          : `<div class="empty"><h3>Nenhuma favorita ainda</h3><p>Quando um modelo chamar sua atenção, toque no coração.</p><a class="btn btn-primary" href="#/">Ver coleções</a></div>`}
      </div>`);
  }

  function pageNotFound() {
    return shell("", `<div class="wrap"><div class="empty"><h3>Página não encontrada</h3><p>Esse endereço não existe mais.</p><a class="btn btn-primary" href="#/">Voltar ao início</a></div></div>`);
  }

  // ---------- Router ----------
  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    if (!state.user && parts[0] !== "login") { location.replace("#/login"); return; }
    if (parts[0] === "login") { if (state.user) { location.replace("#/"); return; } pageLogin(); window.scrollTo(0, 0); return; }
    document.body.classList.add("app");
    let html;
    switch (parts[0]) {
      case undefined: html = pageHome(); break;
      case "colecao": html = pageCategory(parts[1]); break;
      case "aula": html = pageModel(parts[1], parts[2], parts[3]); break;
      case "trilha": html = pageTrack(parts[1], parts[2]); break;
      case "buscar": html = pageSearch(); break;
      case "favoritos": html = pageFavs(); break;
      case "materiais": html = pageExtras(); break;
      default: html = pageNotFound();
    }
    if (html) app.innerHTML = html;
    window.scrollTo(0, 0);
  }

  // ---------- Global events ----------
  document.addEventListener("click", (e) => {
    const fav = e.target.closest("[data-fav]");
    if (fav) {
      e.preventDefault();
      const id = fav.dataset.fav, on = !state.favs.has(id);
      on ? state.favs.add(id) : state.favs.delete(id);
      save();
      document.querySelectorAll(`[data-fav="${id}"]`).forEach((b) => {
        b.setAttribute("aria-pressed", String(on));
        if (b.classList.contains("btn")) b.innerHTML = `${icon("heart")} ${on ? "Nas favoritas" : "Favoritar"}`;
      });
      toast(on ? "Salvo nas favoritas" : "Removido das favoritas");
      return;
    }
    const done = e.target.closest("[data-done]");
    if (done) {
      const yt = done.dataset.done, on = !state.done.has(yt);
      on ? state.done.add(yt) : state.done.delete(yt);
      save();
      toast(on ? "Aula concluída. Parabéns!" : "Marcação removida");
      route();
      return;
    }
    const next = e.target.closest("[data-next]");
    if (next) {
      const cur = document.querySelector("[data-done]");
      if (cur && !state.done.has(cur.dataset.done)) { state.done.add(cur.dataset.done); save(); }
    }
    const menuBtn = e.target.closest("[data-menu]");
    const pop = document.querySelector(".menu-pop");
    if (menuBtn && pop) {
      const open = pop.hidden; pop.hidden = !open; menuBtn.setAttribute("aria-expanded", String(open)); return;
    }
    if (pop && !e.target.closest(".menu-pop")) pop.hidden = true;
    if (e.target.closest("[data-logout]")) {
      store.del("user"); state.user = null; location.hash = "#/login";
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { const pop = document.querySelector(".menu-pop"); if (pop) pop.hidden = true; }
  });

  window.addEventListener("hashchange", route);
  route();
})();
