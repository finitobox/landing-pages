// Giriş yapmış kullanıcıyı tanıtım sayfasında da tanır (web uygulamasıyla aynı alan adı → aynı oturum).
(function () {
  var REF = 'dbbgzhfjubtdqwitqies';
  var URL = 'https://' + REF + '.supabase.co';
  var KEY = 'sb_publishable_yPAtlepBeNoezGVosMqdBg_aFS33auH';
  var s = null;
  try { s = JSON.parse(localStorage.getItem('sb-' + REF + '-auth-token') || 'null'); } catch (e) {}
  if (!s || !s.user) return;

  var meta = s.user.user_metadata || {};
  var isProv = meta.user_type === 'provider';
  var name = meta.full_name || meta.name || (s.user.email || '').split('@')[0] || 'Hesabım';
  var photo = meta.avatar_url || meta.picture || '';
  var esc = function (t) { var d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; };
  var initials = name.trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0).toLocaleUpperCase('tr'); }).join('');

  // Üst menü: Giriş yap yerine Taleplerim + profil fotoğrafı
  var right = document.querySelector('header .right');
  if (right) {
    var main = isProv ? '/app/#/usta' : '/app/#/taleplerim';
    right.innerHTML =
      '<a class="btn ghost" href="' + main + '">' + (isProv ? 'Gelen talepler' : 'Taleplerim') + '</a>' +
      '<a class="me-av" href="' + main + '" title="' + esc(name) + '">' +
      (photo ? '<img src="' + esc(photo) + '" alt="" referrerpolicy="no-referrer">' : esc(initials)) + '</a>';
  }

  // Ana sayfa: son talepler
  var hero = document.querySelector('.hero');
  if (!hero) return;
  var sec = document.createElement('section');
  sec.className = 'mine';
  sec.innerHTML = '<div class="wrap"><div class="mine-head"><h2>' + (isProv ? 'Merhaba ' + esc(name.split(' ')[0]) : 'Son taleplerin') + '</h2>' +
    '<a class="btn dark" href="' + (isProv ? '/app/#/usta' : '/app/#/taleplerim') + '">' + (isProv ? 'Gelen taleplere git →' : 'Tümünü gör →') + '</a></div><div class="mine-list"></div></div>';
  hero.parentNode.insertBefore(sec, hero.nextSibling);
  var list = sec.querySelector('.mine-list');

  if (isProv) { list.innerHTML = '<p class="mut">Bölgendeki yeni müşteri taleplerini panelinden görüp yanıtlayabilirsin.</p>'; return; }
  var expired = s.expires_at && s.expires_at * 1000 < Date.now();
  if (expired) { list.innerHTML = '<p class="mut">Taleplerini görmek için <a href="/app/#/taleplerim" style="color:var(--g)">buraya tıkla</a>.</p>'; return; }

  fetch(URL + '/rest/v1/ai_requests?select=id,title,status,city,district,is_remote,created_at&status=neq.collecting&order=created_at.desc&limit=3', {
    headers: { apikey: KEY, Authorization: 'Bearer ' + s.access_token }
  }).then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
    if (!rows.length) { list.innerHTML = '<p class="mut">Henüz bir talebin yok. Yukarıya ihtiyacını yaz, ustalar sana yazsın.</p>'; return; }
    list.innerHTML = rows.map(function (r) {
      var where = r.is_remote ? 'Uzaktan' : [r.district, r.city].filter(Boolean).join(', ');
      var when = new Date(r.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      return '<a class="mine-card" href="/app/#/taleplerim/' + esc(r.id) + '"><span class="' + (r.status === 'open' ? 'st on' : 'st') + '">' +
        (r.status === 'open' ? 'Açık · ustalar yanıtlıyor' : 'Kapalı') + '</span><b>' + esc(r.title || 'Talep') + '</b><small>' + esc(where) + ' · ' + esc(when) + '</small></a>';
    }).join('');
  }).catch(function () { list.innerHTML = ''; });
})();
