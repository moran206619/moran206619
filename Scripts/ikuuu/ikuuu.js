#!name=iKuuu签到助手
#!desc=集成了自动签到与Cookie获取。\n机场链接:https://ikuuu.win/user或https://ikuuu.fyi/user\n静默运行: 静默运行 (填 # 则静默不通知，留空则正常弹出通知)\nCRON定时设置:运行时间（默认早上9点运行）。

[mitm]
hostname = ikuuu.win, ikuuu.fyi

[script_local]
^https:\/\/ikuuu\.(fyi|win)/user url script-request-header https://raw.githubusercontent.com/loveyuwy/huohua/refs/heads/main/ikuuu_auto.js, tag=iKuuu自动获取Cookie
{CRON定时设置} url cron https://raw.githubusercontent.com/loveyuwy/huohua/refs/heads/main/ikuuu_auto.js, argument=[{静默运行}], tag=ikuuu自动签到

