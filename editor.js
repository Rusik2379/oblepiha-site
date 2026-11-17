(() => {
  const $ = id => document.getElementById(id);
  let csrf = '', editing = null, photo = '', uploaded = '', previewUrl = '';
  let advertisement = { enabled:false, title:'', image:'', link:'' }, advertisementUploaded = '', advertisementPreviewUrl = '';
  const status = (text = '', error = false) => { $('status').textContent = text; $('status').dataset.error = String(error); };
  function loggedIn(value) { $('login-panel').hidden = value; $('workspace').hidden = !value; $('logout').hidden = !value; }
  async function request(path, options = {}) {
    const response = await fetch(path, { cache: 'no-store', ...options, headers: { ...(options.body && typeof options.body === 'string' ? { 'Content-Type':'application/json' } : {}), 'X-CSRF-Token': csrf, ...options.headers } });
    const result = await response.json().catch(() => ({ error: 'Редактор не подключён к серверу сайта.' }));
    if (!response.ok) { if (response.status === 401 && path !== '/api/admin/login') loggedIn(false); throw new Error(result.error || 'Не удалось выполнить запрос.'); }
    return result;
  }
  function reset() {
    editing = null; photo = ''; uploaded = ''; $('post-form').reset(); $('preview').hidden = true;
    $('form-title').textContent = 'Новая публикация'; $('save').textContent = 'Опубликовать'; $('cancel-edit').hidden = true;
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = ''; }
  }
  function edit(post) {
    reset(); editing = post.id; photo = post.image;
    $('title').value = post.title; $('text').value = post.text; $('kind').value = post.kind; $('start-date').value = post.startDate || ''; $('pinned').checked = post.pinned;
    $('preview').src = photo; $('preview').hidden = false; $('form-title').textContent = 'Редактирование публикации'; $('save').textContent = 'Сохранить изменения'; $('cancel-edit').hidden = false;
    $('form-title').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('title').focus({ preventScroll: true }); status();
  }
  const el = (tag, className, text) => { const node = document.createElement(tag); node.className = className || ''; if (text) node.textContent = text; return node; };
  async function refresh() {
    const posts = await request('/api/admin/news');
    posts.sort((a,b) => Number(b.pinned) - Number(a.pinned) || new Date(b.publishedAt) - new Date(a.publishedAt));
    $('post-list').replaceChildren(...posts.map(post => {
      const node = el('article', 'editor-post'); const img = el('img'); img.src = post.image; img.alt = ''; const copy = el('div');
      copy.append(el('h3', '', post.title), el('small', '', `${post.pinned ? 'Закреплено · ' : ''}${post.kind === 'promotion' ? 'Акция' : 'Новость'}`));
      const actions = el('div', 'editor-post-actions'); const change = el('button', '', 'Редактировать'); change.type = 'button'; change.addEventListener('click', () => edit(post));
      const pin = el('button', 'editor-pin', post.pinned ? 'Открепить новость' : 'Закрепить новость'); pin.type = 'button';
      pin.setAttribute('aria-pressed', String(post.pinned));
      pin.setAttribute('aria-label', `${post.pinned ? 'Открепить' : 'Закрепить'} новость «${post.title}»`);
      pin.addEventListener('click', async () => {
        pin.disabled = true;
        try {
          await request('/api/admin/news/' + encodeURIComponent(post.id), { method:'PATCH', body:JSON.stringify({ pinned:!post.pinned }) });
          if (editing === post.id) $('pinned').checked = !post.pinned;
          await refresh(); status(post.pinned ? 'Новость откреплена.' : 'Новость закреплена и показывается вверху списка.');
        } catch (error) { status(error.message, true); pin.disabled = false; }
      });
      const remove = el('button', 'danger', 'Удалить'); remove.type = 'button'; remove.addEventListener('click', async () => {
        if (!confirm(`Удалить публикацию «${post.title}» с сайта?`)) return;
        remove.disabled = true;
        try { await request('/api/admin/news/' + encodeURIComponent(post.id), { method:'DELETE' }); if (editing === post.id) reset(); await refresh(); status('Публикация удалена.'); }
        catch (error) { status(error.message, true); remove.disabled = false; }
      }); actions.append(pin, change, remove); node.append(img, copy, actions); return node;
    }));
    if (!posts.length) $('post-list').append(el('p', 'field-hint', 'Пока нет публикаций. Добавьте первую новость.'));
  }
  $('login-form').addEventListener('submit', async event => {
    event.preventDefault(); const button = event.currentTarget.querySelector('button'); button.disabled = true; status('Проверяем пароль…');
    try { const result = await request('/api/admin/login', { method:'POST', body:JSON.stringify({ password:$('password').value }) }); csrf = result.csrf; $('password').value = ''; loggedIn(true); await loadWorkspace(); status(); }
    catch (error) { status(error.message, true); } finally { button.disabled = false; }
  });
  $('logout').addEventListener('click', async () => { try { await request('/api/admin/logout', { method:'POST' }); csrf = ''; reset(); resetVacancy(); fillAdvertisement({ enabled:false, title:'', image:'', link:'' }); loggedIn(false); status('Вы вышли из редактора.'); } catch (error) { status(error.message, true); } });
  $('cancel-edit').addEventListener('click', () => { reset(); status(); });
  $('photo').addEventListener('change', () => {
    uploaded = ''; const file = $('photo').files[0];
    if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = ''; }
    if (!file) { $('preview').src = photo; $('preview').hidden = !photo; return; }
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) { $('photo').value = ''; $('preview').src = photo; $('preview').hidden = !photo; status('Выберите JPG, PNG или WebP размером до 8 МБ.', true); return; }
    previewUrl = URL.createObjectURL(file); $('preview').src = previewUrl; $('preview').hidden = false; status();
  });
  $('post-form').addEventListener('submit', async event => {
    event.preventDefault(); const file = $('photo').files[0];
    if (!photo && !file && !uploaded) return status('Добавьте фотографию к публикации.', true);
    $('save').disabled = true; status('Сохраняем публикацию…');
    try {
      if (file && !uploaded) uploaded = (await request('/api/admin/upload', { method:'POST', body:file, headers:{ 'Content-Type':file.type } })).image;
      const data = { title:$('title').value, text:$('text').value, image:uploaded || photo, kind:$('kind').value, startDate:$('start-date').value, pinned:$('pinned').checked };
      await request('/api/admin/news' + (editing ? '/' + encodeURIComponent(editing) : ''), { method:editing ? 'PUT' : 'POST', body:JSON.stringify(data) });
      reset(); await refresh(); status('Публикация сохранена. Она уже доступна на сайте.');
    } catch (error) { status(error.message, true); } finally { $('save').disabled = false; }
  });
  let editingVacancy = null;
  function selectSection(section) {
    for (const name of ['news','vacancies','advertisement']) {
      $(name + '-workspace').hidden = name !== section;
      $(name + '-tab').setAttribute('aria-pressed', String(name === section));
    }
    status();
  }
  $('news-tab').addEventListener('click', () => selectSection('news'));
  $('vacancies-tab').addEventListener('click', () => selectSection('vacancies'));
  $('advertisement-tab').addEventListener('click', () => selectSection('advertisement'));
  function resetVacancy() {
    editingVacancy = null; $('vacancy-form').reset(); $('vacancy-cancel').hidden = true;
    $('vacancy-form-title').textContent = 'Новая вакансия';
  }
  function editVacancy(vacancy) {
    resetVacancy(); editingVacancy = vacancy.id;
    for (const key of ['title','salary','schedule','text','phone']) $('vacancy-' + key).value = vacancy[key];
    $('vacancy-published').checked = vacancy.published; $('vacancy-cancel').hidden = false;
    $('vacancy-form-title').textContent = 'Редактирование вакансии';
    $('vacancy-form-title').scrollIntoView({ behavior:'smooth', block:'start' }); $('vacancy-title').focus({ preventScroll:true }); status();
  }
  async function refreshVacancies() {
    const vacancies = await request('/api/admin/vacancies');
    vacancies.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    $('vacancy-list').replaceChildren(...vacancies.map(vacancy => {
      const node = el('article', 'editor-post editor-vacancy'), copy = el('div');
      copy.append(el('h3', '', vacancy.title), el('small', '', vacancy.published ? 'Опубликована на сайте' : 'Скрыта с сайта'));
      const actions = el('div', 'editor-post-actions');
      const change = el('button', '', 'Редактировать'); change.type = 'button'; change.addEventListener('click', () => editVacancy(vacancy));
      const toggle = el('button', '', vacancy.published ? 'Снять с публикации' : 'Опубликовать'); toggle.type = 'button';
      toggle.addEventListener('click', async () => {
        toggle.disabled = true;
        try {
          await request('/api/admin/vacancies/' + encodeURIComponent(vacancy.id), { method:'PUT', body:JSON.stringify({ ...vacancy, published:!vacancy.published }) });
          if (editingVacancy === vacancy.id) $('vacancy-published').checked = !vacancy.published;
          await refreshVacancies(); status(vacancy.published ? 'Вакансия снята с публикации.' : 'Вакансия опубликована.');
        } catch (error) { status(error.message, true); toggle.disabled = false; }
      });
      const remove = el('button', 'danger', 'Удалить'); remove.type = 'button';
      remove.addEventListener('click', async () => {
        if (!confirm(`Удалить вакансию «${vacancy.title}»?`)) return;
        remove.disabled = true;
        try {
          await request('/api/admin/vacancies/' + encodeURIComponent(vacancy.id), { method:'DELETE' });
          if (editingVacancy === vacancy.id) resetVacancy(); await refreshVacancies(); status('Вакансия удалена.');
        } catch (error) { status(error.message, true); remove.disabled = false; }
      });
      actions.append(change, toggle, remove); node.append(copy, actions); return node;
    }));
    if (!vacancies.length) $('vacancy-list').append(el('p', 'field-hint', 'Вакансий пока нет. Добавьте первую с помощью формы.'));
  }
  const loadWorkspace = () => Promise.all([refresh(), refreshVacancies(), refreshAdvertisement()]);
  $('vacancy-cancel').addEventListener('click', () => { resetVacancy(); status(); });
  $('vacancy-form').addEventListener('submit', async event => {
    event.preventDefault(); $('vacancy-save').disabled = true; status('Сохраняем вакансию…');
    try {
      const data = Object.fromEntries(['title','salary','schedule','text','phone'].map(key => [key, $('vacancy-' + key).value]));
      data.published = $('vacancy-published').checked;
      await request('/api/admin/vacancies' + (editingVacancy ? '/' + encodeURIComponent(editingVacancy) : ''), { method:editingVacancy ? 'PUT' : 'POST', body:JSON.stringify(data) });
      resetVacancy(); await refreshVacancies(); status(data.published ? 'Вакансия сохранена и опубликована на сайте.' : 'Вакансия сохранена. На сайте она скрыта.');
    } catch (error) { status(error.message, true); } finally { $('vacancy-save').disabled = false; }
  });
  function fillAdvertisement(value) {
    advertisement = value; advertisementUploaded = ''; $('advertisement-photo').value = '';
    if (advertisementPreviewUrl) { URL.revokeObjectURL(advertisementPreviewUrl); advertisementPreviewUrl = ''; }
    $('advertisement-title').value = value.title; $('advertisement-link').value = value.link; $('advertisement-enabled').checked = value.enabled;
    if (value.image) $('advertisement-preview').src = value.image; else $('advertisement-preview').removeAttribute('src');
    $('advertisement-preview').hidden = !value.image;
    $('advertisement-state').textContent = value.enabled ? 'Реклама включена на сайте.' : value.image ? 'Баннер сохранён. Показ отключён.' : 'Баннер ещё не добавлен.';
    $('advertisement-disable').hidden = !value.enabled; $('advertisement-delete').hidden = !value.image;
  }
  async function refreshAdvertisement() { fillAdvertisement(await request('/api/admin/advertisement')); }
  $('advertisement-photo').addEventListener('change', () => {
    advertisementUploaded = ''; const file = $('advertisement-photo').files[0];
    if (advertisementPreviewUrl) { URL.revokeObjectURL(advertisementPreviewUrl); advertisementPreviewUrl = ''; }
    if (advertisement.image) $('advertisement-preview').src = advertisement.image; else $('advertisement-preview').removeAttribute('src');
    $('advertisement-preview').hidden = !advertisement.image;
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      $('advertisement-photo').value = ''; status('Выберите JPG, PNG или WebP размером до 8 МБ.', true); return;
    }
    advertisementPreviewUrl = URL.createObjectURL(file); $('advertisement-preview').src = advertisementPreviewUrl; $('advertisement-preview').hidden = false; status();
  });
  const advertisementButtons = disabled => ['advertisement-save','advertisement-disable','advertisement-delete'].forEach(id => $(id).disabled = disabled);
  $('advertisement-form').addEventListener('submit', async event => {
    event.preventDefault(); const file = $('advertisement-photo').files[0];
    if ($('advertisement-enabled').checked && !file && !advertisement.image && !advertisementUploaded) return status('Загрузите картинку перед включением рекламы.', true);
    advertisementButtons(true); status('Сохраняем рекламу…');
    try {
      if (file && !advertisementUploaded) advertisementUploaded = (await request('/api/admin/upload', { method:'POST', body:file, headers:{ 'Content-Type':file.type } })).image;
      const data = { enabled:$('advertisement-enabled').checked, title:$('advertisement-title').value, link:$('advertisement-link').value, image:advertisementUploaded || advertisement.image };
      fillAdvertisement(await request('/api/admin/advertisement', { method:'PUT', body:JSON.stringify(data) }));
      status(data.enabled ? 'Реклама сохранена и включена на сайте.' : 'Баннер сохранён. Показ отключён.');
    } catch (error) { status(error.message, true); } finally { advertisementButtons(false); }
  });
  $('advertisement-disable').addEventListener('click', async () => {
    advertisementButtons(true);
    try { fillAdvertisement(await request('/api/admin/advertisement', { method:'PUT', body:JSON.stringify({ ...advertisement, enabled:false }) })); status('Показ рекламы отключён. Картинка сохранена.'); }
    catch (error) { status(error.message, true); } finally { advertisementButtons(false); }
  });
  $('advertisement-delete').addEventListener('click', async () => {
    if (!confirm('Удалить рекламный баннер и отключить его показ?')) return;
    advertisementButtons(true);
    try { fillAdvertisement(await request('/api/admin/advertisement', { method:'DELETE' })); status('Рекламный баннер удалён.'); }
    catch (error) { status(error.message, true); } finally { advertisementButtons(false); }
  });
  (async () => {
    try { const result = await request('/api/admin/session'); csrf = result.csrf; loggedIn(result.authenticated); if (result.authenticated) await loadWorkspace(); if (!result.configured) status('Пароль редактора ещё не настроен. Выполните настройку на сервере сайта.', true); }
    catch (error) { loggedIn(false); status(error.message, true); }
  })();
})();
