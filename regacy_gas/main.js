const sheetName = '先生応募一覧';
const mailSheetName = 'メール本文';
const targetSheet =
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
const mailSheet =
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(mailSheetName);

function onFormSubmit(e) {
  const response = e.values; // フォームの1行分の回答

  const data = [
    response[0], // 回答日時
    response[1], // メールアドレス
    response[2], // お名前（漢字）
    response[3], // お名前（カタカナ）
    response[4], // 年齢
    response[5], // 勤務場所
    response[8], // 質問事項
    response[7], // 履歴書
  ];

  targetSheet.appendRow(data);

  const lastRow = targetSheet.getLastRow();

  const dropdownCell = targetSheet.getRange(lastRow, 9);

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['採用', '不採用', '面接実施'], true)
    .setAllowInvalid(false)
    .build();

  dropdownCell.setDataValidation(rule);

  const backgroundColorRules = [];

  backgroundColorRules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenCellEmpty()
      .setBackground('#F0F0F0')
      .setRanges([dropdownCell])
      .build(),
  );

  backgroundColorRules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('採用')
      .setBackground('#F0F0F0')
      .setRanges([dropdownCell])
      .build(),
  );

  backgroundColorRules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('不採用')
      .setBackground('#909090')
      .setRanges([dropdownCell])
      .build(),
  );

  backgroundColorRules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('面接実施')
      .setBackground('#F0F0F0')
      .setRanges([dropdownCell])
      .build(),
  );

  // 運営用メッセージ
  let uneiMessage = mailSheet.getRange(7, 2).getValue();
  uneiMessage = uneiMessage.replace('[username]', response[2]);
  uneiMessage = uneiMessage.replace('[mail]', response[1]);
  uneiMessage = uneiMessage.replace('[history]', response[7]);

  sendLineMessageToGroup(uneiMessage);

  targetSheet.setConditionalFormatRules(backgroundColorRules);

  // 確認メール送信
  const kenmei = mailSheet.getRange(10, 2).getValue();

  let content = mailSheet.getRange(11, 2).getValue();

  content = content.replace('[mail]', response[1]);

  GmailApp.sendEmail(response[1], kenmei, content);
}

// 採用・不採用時の処理
function onEditSaiyo(e) {
  const sheet = e.source.getActiveSheet();
  const range = e.range;

  // 例：B2 のプルダウンを監視
  if (sheet.getName() === sheetName && range.getColumn() === 9) {
    const row = range.getRow();

    // 名前を取得
    const name = sheet.getRange(row, 3).getValue();

    if (e.value !== e.oldValue) {
      showPopup(e.value, name, row);
      targetSheet.getRange(row, 9).setValue(e.oldValue);
    }
  }
}

function showPopup(newValue, name, row) {
  let htmlName = '';

  if (newValue === '面接実施') {
    htmlName = '面接実施';
  } else if (newValue === '不採用') {
    htmlName = '不採用確認';
  } else if (newValue === '採用') {
    htmlName = '採用確認';
  }

  const template = HtmlService.createTemplateFromFile(htmlName);

  template.name = name;
  template.row = row;

  const html = template.evaluate().setWidth(300).setHeight(150);

  SpreadsheetApp.getUi().showModalDialog(html, '確認');
}

function execMensetsuProcess(row) {
  targetSheet.getRange(row, 9).setValue('面接実施');

  const mailAdress = targetSheet.getRange(row, 2).getValue();

  const kenmei = mailSheet.getRange(8, 2).getValue();

  let content = mailSheet.getRange(9, 2).getValue();

  const mail = sheet.getRange(row, 2).getValue();

  content = content.replace('[mail]', mail);

  GmailApp.sendEmail(mailAdress, kenmei, content);
}

function execFusaiyoProcess(row) {
  targetSheet.getRange(row, 9).setValue('不採用');

  const mailAdress = targetSheet.getRange(row, 2).getValue();

  const kenmei = mailSheet.getRange(3, 2).getValue();

  const content = mailSheet.getRange(4, 2).getValue();

  const lineId = targetSheet.getRange(row, 11).getValue();

  if (lineId !== '') {
    const message = mailSheet.getRange(13, 2).getValue();

    sendLineMessageToUser(lineId, message);
  }

  GmailApp.sendEmail(mailAdress, kenmei, content);
}

function execSaiyoProcess(row) {
  targetSheet.getRange(row, 9).setValue('採用');

  const mailAdress = targetSheet.getRange(row, 2).getValue();

  const kenmei = mailSheet.getRange(1, 2).getValue();

  const content = mailSheet.getRange(2, 2).getValue();

  const lineId = targetSheet.getRange(row, 11).getValue();

  if (lineId !== '') {
    const message = mailSheet.getRange(12, 2).getValue();

    console.log(lineId);

    sendLineMessageToUser(lineId, message);
  }

  GmailApp.sendEmail(mailAdress, kenmei, content);
}

function sendLineMessageToUser(userId, message) {
  const accessToken = 'ACCESS_TOKEN';

  const url = 'https://api.line.me/v2/bot/message/push';

  const payload = {
    to: userId,
    messages: [{ type: 'text', text: message }],
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + accessToken,
    },
    payload: JSON.stringify(payload),
  };

  UrlFetchApp.fetch(url, options);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const applicantEmail = data.guest_email;
  const meetingUrl = data.join_url;

  const row = getRowByMail(applicantEmail);
  let lineId = '';
  let applicantName = '応募者';

  if (row !== -1) {
    lineId = sheet.getRange(row, 11).getValue();
    applicantName = sheet.getRange(row, 3).getValue();
  }

  const timeRexFileId = 'TIME_REX_FIELD_ID';
  const timeRexSheet = SpreadsheetApp.openById(timeRexFileId).getSheets()[0];
  timeRexSheet.appendRow([
    new Date(),
    applicantName,
    applicantEmail,
    meetingUrl,
  ]);

  if (lineId !== '') {
    const userMessage =
      applicantName +
      'さん\n面接の日程調整ありがとうございます。\n当日は以下のURLからご参加ください。\n' +
      meetingUrl;
    sendLineMessageToUser(lineId, userMessage);
  }

  const groupMessage =
    '【面接予約完了】\n' +
    applicantName +
    'さんとの面接が予約されました。\n参加URL: ' +
    meetingUrl;
  sendLineMessageToGroup(groupMessage);

  return HtmlService.createHtmlOutput('OK');
}
