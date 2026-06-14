番号 method url 処理内容 GAS対応関数
1 POST /api/v1/teachers/applications 先生の新規応募を受け付け、データベースへ保存。運営グループへのLINE通知と、応募者への確認メール送信を行う。 onFormSubmit
2 PATCH /api/v1/teachers/applications/{id}/status 先生の選考ステータス（採用・不採用・面接実施）を更新し、結果に応じたメール送信およびLINE個別通知を行う。 onEditSaiyo, execSaiyoProcess, execFusaiyoProcess, execMensetsuProcess
3 POST /api/v1/students/applications 生徒の新規応募を受け付け、データベースへ保存。運営グループへの通知等を行う。 （新規追加）
4 GET /api/v1/auth/line/login LINEログインの認証画面URLを組み立て、対象のユーザー（先生など）をLINE公式の認可画面へリダイレクトさせる。 doGet, redirectToLineLogin
5 GET /api/v1/auth/line/callback LINEでの許可完了後、送られてくる暗号（code）を受け取る。裏側でLINE APIと通信してLINE IDを取得し、データベースのユーザー情報と紐づけて保存する。 doGethandleCallback, getTokengetUserProfile, saveUserToSheet
6 POST /api/v1/webhooks/timerex TimeRexからの面接予約完了通知を受け取る。データ内のGoogle Meet等のURLを記録し、対象ユーザーへの個別LINE通知と運営グループへの予約完了通知を行う。 doPost
7 GET /api/v1/teachers/applications 先生の応募データ一覧を取得する。 スプレッドシートを直接閲覧
13 GET /api/v1/teachers/applications/{id} 指定 ID の先生応募データを取得する。 （新規追加）
8 PUT /api/v1/teachers/applications/{id} 先生の基本情報（名前、年齢、履歴書URLなど）を修正する。 スプレッドシートのセルを直接編集
9 DELETE /api/v1/teachers/applications/{id} 指定した先生の応募データを削除する。 スプレッドシートの行を削除
10 GET /api/v1/students/applications 生徒の応募データ一覧を取得する。 （新規）
14 GET /api/v1/students/applications/{id} 指定 ID の生徒応募データを取得する。 （新規追加）
11 PUT /api/v1/students/applications/{id} 生徒の基本情報（名前、希望科目など）を修正する。 （新規）
12 DELETE /api/v1/students/applications/{id} 指定した生徒の応募データを削除する。 （新規）
