(() => {
  const root = document.querySelector('.c-feedback--empty');
  if (!root) return;
  const create = root.querySelector('[data-create]');
  const reset = root.querySelector('[data-reset]');
  const list = root.querySelector('[data-list]');
  create.addEventListener('click', () => {
    const item = document.createElement('li');
    item.textContent = 'プロジェクト 01 / DRAFT';
    list.replaceChildren(item); list.hidden = false;
    root.querySelector('h3').textContent = 'プロジェクト一覧';
    root.querySelector('p').hidden = true;
    create.hidden = true; reset.hidden = false; reset.focus();
    root.querySelector('[data-status]').textContent = 'デモ用プロジェクトを作成しました。';
  });
  reset.addEventListener('click', () => {
    list.replaceChildren(); list.hidden = true;
    root.querySelector('h3').textContent = 'まだプロジェクトがありません';
    root.querySelector('p').hidden = false;
    create.hidden = false; reset.hidden = true; create.focus();
    root.querySelector('[data-status]').textContent = '初期状態へ戻しました。';
  });
})();

(() => {
  const root = document.querySelector('.c-feedback--access');
  if (!root) return;
  const edit = root.querySelector('[data-edit]');
  const request = root.querySelector('[data-request]');
  const grant = root.querySelector('[data-grant]');
  const output = root.querySelector('[data-status]');
  request.addEventListener('click', () => {
    request.disabled = true; grant.disabled = false;
    output.textContent = 'デモ：申請中です。承認を再現して続けられます。'; grant.focus();
  });
  grant.addEventListener('click', () => {
    grant.disabled = true; edit.disabled = false;
    root.querySelector('h3').textContent = '編集可能';
    root.querySelector('p').textContent = '内容の確認と編集ができます。';
    output.textContent = 'デモ：承認されました。編集を開始できます。'; edit.focus();
  });
  edit.addEventListener('click', () => { output.textContent = 'デモ：編集画面を開く操作を受け付けました。'; });
  root.querySelector('[data-reset]').addEventListener('click', () => {
    edit.disabled = true; request.disabled = false; grant.disabled = true;
    root.querySelector('h3').textContent = '閲覧モード';
    root.querySelector('p').textContent = '内容の確認はできます。編集には担当者の許可が必要です。'; output.textContent = '初期状態へ戻しました。';
  });
})();

(() => {
  const root = document.querySelector('.c-feedback--quota');
  if (!root) return;
  let used = 60;
  const add = root.querySelector('[data-add]');
  const render = () => {
    root.querySelector('progress').value = used;
    root.querySelector('[data-usage]').textContent = used + ' / 100 MB 使用中';
    add.disabled = used >= 100;
    root.querySelector('[data-status]').textContent = used >= 100 ? '上限に達しました。不要なデータを整理してください。' : used >= 80 ? '残り容量が少なくなっています。あと20 MB追加できます。' : '容量に余裕があります。';
  };
  add.addEventListener('click', () => { used = Math.min(100, used + 20); render(); });
  root.querySelector('[data-reset]').addEventListener('click', () => { used = 60; render(); });
  render();
})();

(() => {
  const root = document.querySelector('.c-feedback--process');
  if (!root) return;
  let timer = 0;
  let step = 0;
  const start = root.querySelector('[data-start]');
  const cancel = root.querySelector('[data-cancel]');
  const output = root.querySelector('[data-status]');
  const labels = ['待機中です。', '準備完了。変換しています。', '変換完了。結果を確認しています。', 'デモ処理が完了しました。'];
  const render = () => {
    root.querySelector('progress').value = step;
    root.querySelectorAll('li').forEach((li, index) => {
      li.dataset.complete = String(index < step);
      li.textContent = (index < step ? '✓ ' : '') + ['1. 準備', '2. 変換', '3. 完了'][index];
    });
    output.textContent = labels[step];
  };
  start.addEventListener('click', () => {
    clearInterval(timer); step = 0; render();
    start.disabled = true; cancel.disabled = false;
    timer = setInterval(() => {
      step += 1; render();
      if (step === 3) { clearInterval(timer); start.disabled = false; start.textContent = 'もう一度開始'; cancel.disabled = true; }
    }, 900);
  });
  cancel.addEventListener('click', () => {
    clearInterval(timer); start.disabled = false; cancel.disabled = true;
    start.textContent = '最初から再試行'; output.textContent = '中断しました。最初から再試行できます。'; start.focus();
  });
  render();
})();

(() => {
  const root = document.querySelector('.c-feedback--batch');
  if (!root) return;
  let timer = 0;
  const retry = root.querySelector('[data-retry]');
  const failed = root.querySelector('[data-failed]');
  const output = root.querySelector('[data-status]');
  retry.addEventListener('click', () => {
    retry.disabled = true; failed.textContent = 'CODE NOTE：再試行中';
    output.textContent = '成功した2件は維持し、失敗した1件だけ再処理しています。';
    timer = setTimeout(() => {
      failed.textContent = 'CODE NOTE：成功'; output.textContent = '3件すべて成功しました。';
    }, 900);
  });
  root.querySelector('[data-reset]').addEventListener('click', () => {
    clearTimeout(timer); retry.disabled = false;
    failed.textContent = 'CODE NOTE：失敗（通信タイムアウト）';
    output.textContent = '2件成功・1件失敗。失敗した項目を再試行できます。';
  });
  output.textContent = '2件成功・1件失敗。失敗した項目を再試行できます。';
})();

(() => {
  const root = document.querySelector('.c-feedback--rating');
  if (!root) return;
  const form = root.querySelector('form');
  const output = root.querySelector('[data-status]');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const rating = new FormData(form).get('feedback-rating');
    if (!rating) { form.reportValidity(); return; }
    output.textContent = '評価 ' + rating + ' / 5 を受け付けました（デモ・外部送信なし）。';
    form.querySelectorAll('input, textarea, button[type=submit]').forEach(el => { el.disabled = true; });
  });
  root.querySelector('[data-reset]').addEventListener('click', () => {
    form.querySelectorAll('input, textarea, button[type=submit]').forEach(el => { el.disabled = false; });
    form.reset(); output.textContent = '回答を選び直せます。'; form.querySelector('input').focus();
  });
})();
