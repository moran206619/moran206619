/*
 * iKuuu 自动签到 - Quantumult X 版
 *
 * 使用说明：
 * 1. 在 Quantumult X → 重写 中添加：
 *    hostname = ikuuu.win, ikuuu.fyi
 *    ^https?://(ikuuu\.win|ikuuu\.fyi) url script-request-header ikuuu_quanx.js
 *
 * 2. 在 Quantumult X → 任务 中添加定时任务：
 *    0 8 * * * ikuuu_quanx.js, tag=iKuuu签到, img-url=https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Rocket.png, enabled=true
 *
 * 3. 开启 MitM，确保 ikuuu.win 和 ikuuu.fyi 在 hostname 列表中。
 *
 * 4. 用浏览器访问 https://ikuuu.fyi/user 登录，Cookie 将自动保存。
 *
 * 参数说明（任务参数中加 # 开启静默模式，签到成功不弹通知）：
 *    tag=iKuuu签到#silent
 */

const SCRIPT_NAME = "iKuuu助手";
const CHECKIN_URL = "https://ikuuu.win/user/checkin";
const COOKIE_KEY = "ikuuu_cookie";

// 判断是否静默模式（$argument 包含 # 时静默）
const isSilent = typeof $argument === "string" && $argument.includes("#");

// 入口判断：重写触发还是定时任务触发
if (typeof $request !== "undefined") {
    saveCookie();
} else {
    doCheckin();
}

// ─── 保存 Cookie ───────────────────────────────────────────────────────────────
function saveCookie() {
    const headers = $request.headers || {};
    const cookie = headers["Cookie"] || headers["cookie"] || "";
    const url = $request.url || "";

    if (cookie && /ikuuu\.(win|fyi)/.test(url)) {
        $prefs.setValueForKey(cookie, COOKIE_KEY);
        $notify(SCRIPT_NAME + " 🍪", "Cookie 更新成功 🎉", "检测到 ikuuu 访问，已保存 🚀");
        console.log("✅ Cookie 已保存: " + cookie);
    }

    $done({});
}

// ─── 执行签到 ──────────────────────────────────────────────────────────────────
function doCheckin() {
    const cookie = $prefs.valueForKey(COOKIE_KEY);

    if (!cookie) {
        $notify(SCRIPT_NAME + " ⚠️", "未找到 Cookie", "请开启 MitM 并访问 ikuuu.fyi 登录 🚫");
        console.log("❌ 未找到 Cookie，任务终止。");
        $done();
        return;
    }

    const opts = {
        url: CHECKIN_URL,
        method: "POST",
        headers: {
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Mobile/15E148 Safari/604.1",
            "Referer": "https://ikuuu.fyi/user",
            "Origin": "https://ikuuu.fyi",
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: ""
    };

    console.log("▶️ 开始签到...");
    if (isSilent) console.log("🔇 静默模式已开启");

    $task.fetch(opts).then(
        response => handleResponse(response.body),
        error    => handleError(error)
    );
}

// ─── 处理响应 ──────────────────────────────────────────────────────────────────
function handleResponse(body) {
    // Cookie 失效时服务器返回 HTML
    if (body && body.includes("<html")) {
        $notify(SCRIPT_NAME + " 🛑", "Cookie 已失效", "请重新访问网页重新获取 🔄");
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
        // 签到成功
        console.log("✅ 签到成功: " + obj.msg);
        if (!isSilent) {
            $notify(
                SCRIPT_NAME + " 🚀",
                "签到成功 ✅",
                `💎 奖励详情: ${obj.msg}\n⏱️ 时间: ${timeStr}`
            );
        }
    } else {
        // 已签到或其他提示
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

// ─── 处理网络错误 ──────────────────────────────────────────────────────────────
function handleError(error) {
    $notify(SCRIPT_NAME + " ❌", "网络错误", "无法连接到服务器，请检查网络 📶");
    console.log("❌ 网络错误: " + JSON.stringify(error));
    $done();
}
