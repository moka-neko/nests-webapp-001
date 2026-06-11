const sheet = SpreadsheetApp.getActive().getSheetByName('先生応募一覧');

/**
 * ▼ Webアプリ入口
 * 応募者がアクセス → LINEログイン画面に飛ばす or コールバック処理
 */
function doGet(e) {
  const mail = e.parameter.mail || null;

  // LINEから返却された "code" があるか確認（＝ログイン後）
  if (e.parameter.code) {
    return handleCallback(e);
  }

  return redirectToLineLogin(mail);
}

/**
 * ▼ LINEログイン後の callback 処理
 * code → accessToken → userId を取得
 */
function handleCallback(e) {
  const mail = decodeURIComponent(e.parameter.state);

  const token = getToken(e.parameter.code);
  const profile = getUserProfile(token.access_token);

  const userId = profile.userId;
  const name = profile.displayName;

  saveUserToSheet(mail, userId, name);

  return HtmlService.createHtmlOutput(`
    <p>登録が完了しました！</p>
    <p>サービス利用には公式LINEの友だち追加が必要です。</p>
    <a href="https://line.me/R/ti/p/@{LINE_CHANNEL_ID}">
      <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" height="40">
    </a>
  `);
}

function redirectToLineLogin(mail) {
  const clientId = '2008552381';
  const redirectUri = ScriptApp.getService().getUrl();
  const state = encodeURIComponent(mail);

  const loginUrl =
    'https://access.line.me/oauth2/v2.1/authorize?response_type=code' +
    '&client_id=' +
    clientId +
    '&redirect_uri=' +
    encodeURIComponent(redirectUri) +
    '&scope=openid%20profile' +
    '&state=' +
    state;

  // テンプレートを使わない簡易版（このままでもOK）
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>LINEログイン</title>
      </head>
      <body>
        <p>LINEでログインするには、下のボタンを押してください。</p>
        <button id="loginBtn">LINEでログインする</button>

        <script>
          document.getElementById('loginBtn').addEventListener('click', function () {
            // ここはユーザーのクリックイベントなので、sandbox からの top ナビゲーションが許可される
            window.top.location.href = "${loginUrl}";
          });
        </script>
      </body>
    </html>
  `);

  // Gmail等から iframe で開かれても中身が動くように ALLOWALL にしておく
  return html.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * ▼ code → アクセストークン取得
 */
function getToken(code) {
  const url = 'https://api.line.me/oauth2/v2.1/token';

  const payload = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: ScriptApp.getService().getUrl(),
    client_id: 'CLIENT_ID',
    client_secret: 'CLIENT_SECRET',
  };

  return JSON.parse(
    UrlFetchApp.fetch(url, {
      method: 'post',
      payload: payload,
    }).getContentText(),
  );
}

/**
 * ▼ アクセストークン → LINEプロフィール（userId）取得
 */
function getUserProfile(accessToken) {
  const url = 'https://api.line.me/v2/profile';

  const response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + accessToken,
    },
  });

  return JSON.parse(response.getContentText());
}

/**
 * ▼ スプレッドシートに紐づけ保存
 */
function saveUserToSheet(mail, userId, name) {
  const row = getRowByMail(mail);

  // 見つからなかった場合（-1）に処理を中断してエラーを防ぐ
  if (row === -1) {
    console.log(
      'メールアドレスが一致しないため、LINE IDを記録できませんでした: ' + mail,
    );
    return;
  }

  sheet.getRange(row, 10).setValue(name);
  sheet.getRange(row, 11).setValue(userId);
}
