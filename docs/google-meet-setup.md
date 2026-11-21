# Google Meet 連携の設定（GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN）

管理画面の「Google Meet URL を発行して通知」で使う設定です。
未設定でも、管理画面で面接 URL を手動入力して通知できます。

## 仕組み

- 面接の予定は **教室の Google アカウント**（面接を主催するアカウント）の
  Google カレンダーに作られ、そのアカウントが Meet の主催者になります。
  管理画面のログインユーザー（AdminUser）とは別物で、Google アカウントの話です。
- 応募者には、本アプリのメール（LINE 連携済みなら LINE も）で **URL だけ** を送ります。
  Google の招待メールは既定では送りません（`GOOGLE_SEND_CALENDAR_INVITES=false`）。
- 応募者のメールアドレスは予定の出席者に入れます。応募者がそのアドレスの Google
  アカウントでログインしていれば、承認待ちなしで入室できます。それ以外のアカウントや
  未ログインの場合は「参加をリクエスト」になり、主催者が承認します。

| 変数 | 中身 | 誰のもの |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth クライアント ID | Google Cloud プロジェクト（作るのは誰のアカウントでも可） |
| `GOOGLE_CLIENT_SECRET` | OAuth クライアントシークレット | 同上 |
| `GOOGLE_REFRESH_TOKEN` | カレンダーを操作するための長期トークン | **面接を主催する教室の Google アカウント** が許可して発行する |
| `GOOGLE_CALENDAR_ID` | 予定を作るカレンダー。通常は `primary` のまま | 同上 |

## 手順

### 1. Google Cloud プロジェクトを作る

1. <https://console.cloud.google.com/> を開き、新しいプロジェクトを作ります
   （例: `tomodachi-sensei-meet`）。
2. 「API とサービス」→「ライブラリ」で **Google Calendar API** を有効にします。

### 2. OAuth 同意画面を設定する

1. 「API とサービス」→「OAuth 同意画面」（「Google Auth Platform」と表示される場合あり）。
2. ユーザーの種類は **外部**。アプリ名・サポートメールを入力します。
3. スコープに `https://www.googleapis.com/auth/calendar.events` を追加します。
4. **公開ステータスを「本番環境」にします。**
   「テスト」のままだと、リフレッシュトークンが **7日で失効** します。
   審査は不要です（自分のアカウントだけで使うため）。同意時に「Google が確認していません」と
   表示されますが、「詳細」→「（アプリ名）に移動」で進めます。

### 3. OAuth クライアントを作る

1. 「API とサービス」→「認証情報」→「認証情報を作成」→「OAuth クライアント ID」。
2. アプリケーションの種類は **ウェブ アプリケーション**。
3. 「承認済みのリダイレクト URI」に `https://developers.google.com/oauthplayground` を追加します。
4. 作成後に表示される **クライアント ID** と **クライアントシークレット** が
   `GOOGLE_CLIENT_ID` と `GOOGLE_CLIENT_SECRET` です。

### 4. リフレッシュトークンを発行する（OAuth 2.0 Playground）

**この手順は、面接を主催する教室の Google アカウントでログインして行います。**

1. <https://developers.google.com/oauthplayground> を開きます。
2. 右上の歯車 →「Use your own OAuth credentials」にチェックを入れ、
   手順3のクライアント ID とシークレットを入力します。
3. 左の「Input your own scopes」に `https://www.googleapis.com/auth/calendar.events` を入力し、
   「Authorize APIs」を押します。
4. 教室の Google アカウントを選び、アクセスを許可します。
5. 「Exchange authorization code for tokens」を押します。
   表示された **Refresh token** が `GOOGLE_REFRESH_TOKEN` です。

教室の方にログインしてもらうのが難しい場合は、手順4だけ画面共有などで一緒に行ってください。
トークンはカレンダーの予定を操作できる権限なので、チャットなどに貼らずに直接設定してください。

### 5. API サーバーに設定する

検証環境（App Runner）なら、サービスの環境変数に設定します。
`GOOGLE_CLIENT_SECRET` と `GOOGLE_REFRESH_TOKEN` は Secrets Manager か SSM パラメータに入れ、
App Runner からは参照で渡すのがおすすめです。

```text
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
GOOGLE_REFRESH_TOKEN=1//0exxxxxxxx
GOOGLE_CALENDAR_ID=primary
GOOGLE_SEND_CALENDAR_INVITES=false
INTERVIEW_DURATION_MINUTES=30
```

設定後、管理画面で確定面接日時を保存した応募者の詳細画面から
「Google Meet URL を発行して通知」を押し、教室のカレンダーに予定ができることを確認します。

## よくあるつまずき

- 発行に失敗し、ログに `Google token refresh failed: 400`（`invalid_grant`）が出る:
  リフレッシュトークンが失効しています。同意画面が「テスト」のままになっていないか確認し、
  手順4をやり直します。教室のアカウントでパスワードを変えた場合や、
  アクセス許可を取り消した場合にも失効します。
- `Google Calendar API failed: 403`: Calendar API が有効になっていないか、
  手順4で許可したスコープが足りません。
- 予定が別のカレンダーにできる: `GOOGLE_CALENDAR_ID` が `primary` なら、
  リフレッシュトークンを発行したアカウントのメインカレンダーに作られます。
