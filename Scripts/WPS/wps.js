[MITM]
hostname = personal-act.wps.cn

[rewrite_local]
^https:\/\/personal-act\.wps\.cn\/activity-rubik\/activity\/page_info url script-request-header https://raw.githubusercontent.com/MaYIHEI/paperclip/refs/heads/main/app/wps/wps.cookie.js

[task_local]
0 10 * * * https://raw.githubusercontent.com/MaYIHEI/paperclip/refs/heads/main/app/wps/wps.js, tag=WPS签到, img-url=https://raw.githubusercontent.com/MaYIHEI/pin/refs/heads/main/app/wps.png, enabled=true
