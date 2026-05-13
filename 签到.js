/*
 * @name         iKuuu签到助手
 * @desc         集成自动签到与Cookie获取
 *               机场链接: https://ikuuu.win/user 或 https://ikuuu.fyi/user
 *               静默运行: $argument 包含 # 时静默，不弹通知
 * @author       〈ザㄩメ火华
 * @icon         https://raw.githubusercontent.com/loveyuwy/hao/refs/heads/main/ikuuu.png
 * @system       iOS
 *
 * ════════════════ Quantumult X 配置 ════════════════
 *
 * [rewrite_local]
 * ^https?://(ikuuu\.fyi|ikuuu\.win)/user url script-request-header https://raw.githubusercontent.com/moran206619/moran206619/refs/heads/main/ikuu签到.js
 *
 * [task_local]
 * 0 9 * * * https://raw.githubusercontent.com/moran206619/moran206619/refs/heads/main/ikuu签到.js, tag=iKuuu自动签到, img-url=https://raw.githubusercontent.com/loveyuwy/hao/refs/heads/main/ikuuu.png, enabled=true
 *
 * [mitm]
 * hostname = ikuuu.win, ikuuu.fyi
 *
 * ════════════════════════════════════════════════════
 *
 * 使用步骤：
 * 1. 将上方 [rewrite_local] / [task_local] / [mitm] 配置填入 QuanX 对应栏目
 * 2. 开启 MitM，用浏览器访问 https://ikuuu.fyi/user 登录，Cookie 自动保存
 * 3. 定时任务每天 09:00 自动签到
 * 4. 如需静默（成功不弹通知），在任务 tag 末尾加 # 即可，例如: tag=iKuuu签到#
 */

const SCRIPT_NAME = "iKuuu助手";
const CHECKIN_URL = "https://ikuuu.win/user/checkin";
const COOKIE_KEY  = "ikuuu_cookie";

// 静默模式：$argument 包含 # 时不弹成功通知
const isSilent = typeof $argument === "string" && $argument.includes("#");

// ── 入口判断 ──────────────────────────────────────────────────────────────────
// 重写触发（$request 存在）→ 保存 Cookie
// 定时任务触发            → 执行签到
if (typeof $request !== "undefined") {
    saveCookie();
} else {
    doCheckin();
}

// ── 保存 Cookie ───────────────────────────────────────────────────────────────
function saveCookie() {
    const headers = $request.headers || {};
    const cookie  = headers["Cookie"] || headers["cookie"] || "";
    const url     = $request.url || "";

    if (cookie && /ikuuu\.(win|fyi)/.test(url)) {
        $prefs.setValueForKey(cookie, COOKIE_KEY);
        $notify(SCRIPT_NAME + " 🍪", "Cookie 更新成功 🎉", "检测到 ikuuu 访问，已保存 🚀");
        console.log("✅ Cookie 已保存: " + cookie);
    }

    $done({});
}

// ── 执行签到 ──────────────────────────────────────────────────────────────────
function doCheckin() {
    const cookie = $prefs.valueForKey(COOKIE_KEY);

    if (!cookie) {
        $notify(SCRIPT_NAME + " ⚠️", "未找到 Cookie", "请开启 MitM 并访问 ikuuu.fyi 登录 🚫");
        console.log("❌ 未找到 Cookie，任务终止");
        $done();
        return;
    }

    console.log("▶️ 开始签到...");
    if (isSilent) console.log("🔇 静默模式已开启");

    $task.fetch({
        url: CHECKIN_URL,
        method: "POST",
        headers: {
            "Cookie":           cookie,
            "User-Agent":       "Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Mobile/15E148 Safari/604.1",
            "Referer":          "https://ikuuu.fyi/user",
            "Origin":           "https://ikuuu.fyi",
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type":     "application/x-www-form-urlencoded"
        },
        body: ""
    }).then(
        response => handleResponse(response.body),
        error    => handleError(error)
    );
}

// ── 处理响应 ──────────────────────────────────────────────────────────────────
function handleResponse(body) {
    // Cookie 失效时服务器返回 HTML 页面
    if (body && body.includes("<html")) {
        $notify(SCRIPT_NAME + " 🛑", "Cookie 已失效", "请重新访问网页获取 Cookie 🔄");
        console.log("❌ Cookie 失效，服务器返回 HTML");
        $done();
        return;
    }

    let obj;
    try {
        obj = JSON.parse(body);
    } catch (e) {
        $notify(SCRIPT_NAME + " ❌", "解析失败", "返回数据异常，请查看日志");
        console.log("❌ JSON 解析失败: " + e + "\n原始数据: " + body);
        $done();
        return;
    }

    const now     = new Date();
    const timeStr = now.getHours() + ":" + String(now.getMinutes()).padStart(2, "0");
    const dateStr = now.toLocaleDateString("zh-CN");

    if (obj.ret === 1) {
        console.log("✅ 签到成功: " + obj.msg);
        if (!isSilent) {
            $notify(
                SCRIPT_NAME + " 🚀",
                "签到成功 ✅",
                `💎 奖励详情: ${obj.msg}\n⏱️ 时间: ${timeStr}`
            );
        }
    } else {
        console.log("⚠️ 签到结果: " + obj.msg);
        const alreadyChecked = obj.msg.includes("已经");
        if (!alreadyChecked || !isSilent) {
            $notify(
                SCRIPT_NAME + " 🔔",
                "签到提示",
                `📝 信息: ${obj.msg}\n📅 日期: ${dateStr}`
            );
        }
    }

    $done();
}

// ── 处理网络错误 ──────────────────────────────────────────────────────────────
function handleError(error) {
    $notify(SCRIPT_NAME + " ❌", "网络错误", "无法连接到服务器，请检查网络 📶");
    console.log("❌ 网络错误: " + JSON.stringify(error));
    $done();
}
