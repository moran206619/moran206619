/**
 * 威锋 App 自动签到脚本
 * 适用工具：QuantumultX（圈X）
 *
 * ======== 安装方式 ========
 * 1. 将本脚本上传到可访问的 URL（如 GitHub raw）
 * 2. 在 圈X → 重写 中添加规则（见下方配置）
 * 3. 打开威锋 App，随便浏览一下，Cookie 会自动写入持久化存储
 * 4. 在 圈X → 任务 中添加定时任务，每天自动签到
 *
 * ======== 圈X 配置 ========
 * [rewrite_local]
 * # 拦截威锋 API 请求，自动抓取 Cookie
 * ^https?://api\.feng\.com/  url script-request-header weifeng_qx.js
 *
 * [task_local]
 * # 每天早上 8:00 自动签到
 * 0 8 * * * weifeng_qx.js, tag=威锋签到, enabled=true
 */

'use strict';

const STORE_KEY_COOKIE   = 'weifeng_cookie';
const STORE_KEY_UID      = 'weifeng_uid';
const STORE_KEY_SIGN_API = 'weifeng_sign_api';

// 判断当前是 重写（抓Cookie）还是 定时任务（签到）
const isTask    = typeof $task   !== 'undefined';   // 定时任务环境
const isRewrite = typeof $request !== 'undefined';  // 重写脚本环境

// ─────────────────────────────────────
// 模式1：重写模式 —— 从请求头中提取 Cookie
// ─────────────────────────────────────
if (isRewrite) {
  captureCookie();
}

// ─────────────────────────────────────
// 模式2：定时任务模式 —— 执行签到
// ─────────────────────────────────────
if (isTask || (!isRewrite && !isTask)) {
  runSignin();
}

// ===== 抓取 Cookie =====
function captureCookie() {
  const headers = $request.headers;

  // 提取 Cookie（不区分大小写的 key 查找）
  const cookieKey = Object.keys(headers).find(k => k.toLowerCase() === 'cookie');
  if (!cookieKey) {
    $done({});
    return;
  }

  const cookie = headers[cookieKey];
  const oldCookie = $prefs.valueForKey(STORE_KEY_COOKIE);

  if (cookie && cookie !== oldCookie) {
    $prefs.setValueForKey(cookie, STORE_KEY_COOKIE);
    console.log('[威锋签到] Cookie 已更新');

    // 尝试提取 uid（用于日志展示）
    const uidMatch = cookie.match(/[Uu][Ii][Dd]=(\d+)/);
    if (uidMatch) {
      $prefs.setValueForKey(uidMatch[1], STORE_KEY_UID);
      console.log(`[威锋签到] UID: ${uidMatch[1]}`);
    }

    // 记录签到 API（从请求 URL 推断 base）
    const url = $request.url;
    const apiBase = url.match(/^(https?:\/\/[^/]+)/)?.[1];
    if (apiBase) {
      $prefs.setValueForKey(apiBase, STORE_KEY_SIGN_API);
    }

    $notification.post('威锋签到', 'Cookie 已自动更新 ✅', `UID: ${uidMatch?.[1] || '未知'}`);
  }

  $done({});
}

// ===== 执行签到 =====
async function runSignin() {
  const cookie = $prefs.valueForKey(STORE_KEY_COOKIE);
  const uid    = $prefs.valueForKey(STORE_KEY_UID) || '未知';

  if (!cookie) {
    const msg = '尚未获取到 Cookie，请先打开威锋 App 浏览一下';
    console.log('[威锋签到] ' + msg);
    $notification.post('威锋签到', '❌ 签到失败', msg);
    $done();
    return;
  }

  console.log(`[威锋签到] 开始签到，UID: ${uid}`);

  const commonHeaders = {
    'User-Agent': 'FengApp/5.0 (iPhone; iOS 17.0)',
    'Accept': 'application/json',
    'Cookie': cookie,
    'Referer': 'https://www.feng.com/',
  };

  // --- 方式A：威锋 APP 签到接口 ---
  try {
    const result = await request({
      url: 'https://api.feng.com/checkin',
      method: 'POST',
      headers: {
        ...commonHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid }),
    });

    const data = JSON.parse(result.body);
    console.log('[威锋签到] API 响应:', JSON.stringify(data));

    if (data.code === 0 || data.status === 'success') {
      notify('✅ 签到成功', data.message || '打卡成功');
      $done();
      return;
    }

    if (data.message?.includes('已') || data.code === 1) {
      notify('✅ 今日已签到', data.message || '无需重复签到');
      $done();
      return;
    }

    // 如果 A 方式失败，尝试 B
    throw new Error(data.message || '接口返回异常');

  } catch (e) {
    console.log('[威锋签到] 接口A失败: ' + e.message + '，尝试论坛接口...');
  }

  // --- 方式B：Discuz 论坛签到插件接口 ---
  try {
    // 先拿 formhash
    const homeRes = await request({
      url: 'https://www.feng.com/',
      method: 'GET',
      headers: commonHeaders,
    });

    const formhashMatch = homeRes.body.match(/formhash['":\s=]+([0-9a-f]{8})/i);
    if (!formhashMatch) {
      throw new Error('未找到 formhash，Cookie 可能已过期');
    }
    const formhash = formhashMatch[1];
    console.log('[威锋签到] formhash:', formhash);

    const signRes = await request({
      url: 'https://www.feng.com/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1&inajax=1',
      method: 'POST',
      headers: {
        ...commonHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: `formhash=${formhash}&signsubmit=yes&handlekey=sign&emotid=0&content=${encodeURIComponent('今天也是美好的一天！')}`,
    });

    const body = signRes.body;
    if (body.includes('签到成功') || body.includes('success')) {
      notify('✅ 签到成功', '论坛打卡成功');
    } else if (body.includes('已经签到') || body.includes('已签')) {
      notify('✅ 今日已签到', '无需重复签到');
    } else {
      notify('❌ 签到失败', body.slice(0, 80));
    }
  } catch (e) {
    notify('❌ 签到出错', e.message);
  }

  $done();
}

// ===== 工具：Promise 封装 $task.fetch =====
function request(options) {
  return new Promise((resolve, reject) => {
    $task.fetch(options).then(
      res => resolve(res),
      err => reject(new Error(err.error || String(err)))
    );
  });
}

// ===== 工具：通知 =====
function notify(title, subtitle, body = '') {
  const uid = $prefs.valueForKey(STORE_KEY_UID) || '';
  const fullTitle = uid ? `威锋签到 (UID:${uid})` : '威锋签到';
  console.log(`[威锋签到] ${title} ${subtitle} ${body}`);
  $notification.post(fullTitle, title, subtitle + (body ? '\n' + body : ''));
}
