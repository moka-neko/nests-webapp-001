function sendLineMessageToGroup(message) {
  const accessToken =
    'EQMUdiWt1UwCT9R/kD2aKk28/ihlsUUmEuahC4cL0oIItpGgLlqMSrzgGfm76+aMZHhRb5nUD7FgfB8m8FqufcFX2k57FQJosRIDch/ugeLXY5T7VT6fMTMh0Ep7heTwtlrvfja/uP2GBn2TqekF4gdB04t89/1O/w1cDnyilFU=';

  const url = 'https://api.line.me/v2/bot/message/push';

  const payload = {
    to: '{LINE_GROUP_ID}',
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
