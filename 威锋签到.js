```javascript
/*
@Name: 威锋 自动签到（自动抓取版）
@Author: ChatGPT

========================

[rewrite_local]
^https?:\/\/.*feng\.com\/.* url script-request-header https://你的raw/weifeng_signin.js

[task_local]
30 9 * * * https://你的raw/weifeng_signin.js, tag=威锋签到, enabled=true

[MITM]
hostname = *.feng.com

========================
*/

const NAME = '威锋签到';

const COOKIE_KEY = 'weifeng_cookie';
const URL_KEY = 'weifeng_sign_url';
const BODY_KEY = 'weifeng_sign_body';

// ====== 抓包模式 ======
if (typeof $request !== 'undefined') {

  const url = $request.url;
  const method = $request.method;

  const headers = $request.headers || {};
  const body = $request.body || '';

  let cookie = '';

  Object.keys(headers).forEach(k => {
    if (k.toLowerCase() === 'cookie') {
      cookie = headers[k];
    }
  });

  // 自动识别签到请求
  const keywords = [
    'sign',
    'signin',
    'checkin',
    'qiandao',
    'mission',
    'task'
  ];

  const matched = keywords.some(k =>
    url.toLowerCase().includes(k)
  );

  if (matched) {

    if (cookie) {
      $prefs.setValueForKey(cookie, COOKIE_KEY);
    }

    $prefs.setValueForKey(url, URL_KEY);
    $prefs.setValueForKey(body, BODY_KEY);

    $notify(
      NAME,
      '已抓到疑似签到请求',
      url
    );
  }

  $done({});
}

// ====== 定时签到 ======

const cookie = $prefs.valueForKey(COOKIE_KEY);
const signUrl = $prefs.valueForKey(URL_KEY);
const signBody = $prefs.valueForKey(BODY_KEY);

if (!cookie || !signUrl) {

  $notify(
    NAME,
    '未获取签到数据',
    '请打开威锋 App 手动签到一次'
  );

  $done();
}

$task.fetch({
  url: signUrl,
  method: 'POST',
  headers: {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
    'Content-Type':
      'application/x-www-form-urlencoded',
    'Cookie': cookie
  },
  body: signBody

}).then(resp => {

  const body = resp.body || '';

  try {

    const obj = JSON.parse(body);

    if (
      obj.success === true ||
      obj.code === 0 ||
      body.includes('成功') ||
      body.includes('已签到')
    ) {

      $notify(
        NAME,
        '签到成功',
        body.slice(0, 80)
      );

    } else {

      $notify(
        NAME,
        '签到返回',
        body.slice(0, 120)
      );
    }

  } catch(e) {

    if (
      body.includes('成功') ||
      body.includes('已签到')
    ) {

      $notify(NAME, '签到成功', '');

    } else {

      $notify(
        NAME,
        '返回内容',
        body.slice(0, 120)
      );
    }
  }

  $done();

}, err => {

  $notify(
    NAME,
    '请求失败',
    JSON.stringify(err)
  );

  $done();
});
```
