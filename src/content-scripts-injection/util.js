import StorageMessageItem from "./StorageMessageItem";
import G from "./G";

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const LOG_PREFIX = '[DCH] ';
function log(s) {
    console.log(LOG_PREFIX + s);
}
function error(s) {
    console.error(LOG_PREFIX + s);
}

function getDateString(date) {
    return '' + (date.getMonth()+1).toString().padStart(2, '0')
     + '/' + date.getDate().toString().padStart(2, '0')
     + ' ' + date.getHours().toString().padStart(2, '0')
     + ':' + date.getMinutes().toString().padStart(2, '0')
     + ':' + date.getSeconds().toString().padStart(2, '0')
     + '.' + date.getMilliseconds().toString().padStart(3, '0')
}

function getCurrentGuildId() {
    let url = document.location.href;
    const prefix = 'https://discord.com/channels/'
    if (!url.startsWith(prefix)) {
        console.error('cann\'t find guild id, url is ' + url);
        return null;
    }
    return url.substring(prefix.length, url.indexOf('/', prefix.length+1))
}

function getCurrentChannelId() {
    let url = document.location.href;
    const prefix = 'https://discord.com/channels/'
    if (!url.startsWith(prefix)) {
        console.error('cann\'t find channel id, url is ' + url);
        return null;
    }
    let startIndex = url.indexOf('/', prefix.length+1) + 1;
    let endIndex = url.indexOf('/', startIndex)
    if (endIndex == -1) {
        return url.substring(startIndex);
    } else {
        return url.substring(startIndex, endIndex);
    }
}

async function getChannelMessages(chnnelId) {
    let url = 'https://discord.com/api/v9/channels/' + chnnelId + '/messages?limit=50'
    let response = await fetch(url, {
        method: 'GET',
        headers: {
            'x-discord-locale' : 'zh-CN',
            'x-debug-options' : 'bugReporterEnabled',
            'authorization' : G.token
        },
    });
    return response.text();
}

const SendMessageError = {
    SUCCESS : 'SUCCESS',
    NEED_RETRY: 'NEED_RETRY',
    OTHER_ERROR: 'OTHER_ERROR'
}

// 发送消息，如成功，返回 (SendMessageError.SUCCESS, 生成的messageId)，
// 如需要重试，返回 (SendMessageError.NEED_RETRY, 等待多长时间后重试)
async function sendMessageToChannel(guildId, channelId, content, replyingMessageId=null) {
    let url = 'https://discord.com/api/v9/channels/' + channelId + '/messages'
    var payload = {
        content: content,
        nonce: '938' + parseInt(Math.random() * 1000000000000000).toString().padStart(15, '0'),
        tts: false
    }
    if (replyingMessageId) {
        payload['message_reference'] = {
            guild_id: guildId,
            channel_id: channelId,
            message_id: replyingMessageId
        }
    }
    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'x-discord-locale' : 'zh-CN',
            'x-debug-options' : 'bugReporterEnabled',
            'authorization' : G.token,
            'content-type' : 'application/json'	
        },
        body: JSON.stringify(payload)
    })
    if (response.status == 200) {
        let result = await response.json();
        return[SendMessageError.SUCCESS, result.id];
    } else if (response.status == 409) {
        let result = await response.json();
        if (result['code'] != 20016 || !result['retry_after']) {
            console.error(`invalid response: ${result}`)
            return [SendMessageError.OTHER_ERROR, result]
        } else {
            return [SendMessageError.NEED_RETRY, result['retry_after']];
        }
    }
}

function isReplying() {
    return !!document.querySelector('[class*="replyBar-"]');
}

function closeReplyBar() {
    document.querySelector('[class*="replyBar-"] [class*="closeButton-"').click();
}

function getReplyingMessageId() {
    let e = document.querySelector('[class*="replying-"]')
    if (!e) {
        console.error('Cann\'t find replying message')
        return null;
    }
    let eId = e.parentElement.id;
    if (!eId || !eId.startsWith('chat-messages-')) {
        console.error('Cann\'t find chat mesage id, current Id: ' + eId)
    }
    return eId.substring('chat-messages-'.length)
}

function getTypingMessageContent() {
    let e = document.querySelector('[class*="channelTextArea-"] [contenteditable="true"]')
    if (!e) {
        console.error('Cann\'t find input element');
        return null;
    }
    return e.innerText.trimEnd();
}

function isSlowModeOpening() {
    return !!document.querySelector('[class*="cooldownWrapper-"]');
}

function getSlowModeIntervalMS() {
    let e = document.querySelector('[class*="cooldownWrapper-"]');
    let a = e.getAttribute('aria-label')
    const r = /成员可以每 ([0-9]*) (秒|分钟|小时) +发送一条信息/
    let result = r.exec(a)
    if (result.length < 3) {
        console.error('invalid slow mode aria lable: ' + a)
        return 0;
    } else {
        let num = parseInt(result[1])
        if (result[2] == '秒') {
            return num * 1000;
        } else if (result[2] == '分钟') {
            return num * 60 * 1000;
        } else if (result[3] == '小时') {
            return num * 3600 * 1000;
        } else {
            debugger;
            return 0;
        }
    }
}

function sendCmdBackspaceToInput(e) {
    let backspaceKey = {
        bubbles: true,
        keyCode: 8,
        code: 'Backspace',
        shiftKey: false,
        ctrlKey: false,
        metaKey: true					
    }
    e.dispatchEvent(new KeyboardEvent('keydown', backspaceKey));
    e.dispatchEvent(new KeyboardEvent('keyup', backspaceKey));
}

function hookChatInput(messageStorageInstance) {
    // 先看下是不是没有权限的频道
    var e = document.querySelector('[class*="channelTextArea-"] [class*="innerDisabled-"]')
    if (e) {
        log('no access to send meessage, channel: ' + getCurrentChannelId());
        return;
    }
    // 有权限就安装钩子
    e = document.querySelector('[class^="channelTextArea-"] [contenteditable="true"]')
    e.addEventListener('keydown', k => {
        if (!k.isComposing && k.code == 'Enter' && !k.shiftKey && isSlowModeOpening()) {
            let slowModeInterval = getSlowModeIntervalMS();
            let content = getTypingMessageContent();
            if (!!content) {
                sendCmdBackspaceToInput(e);
                let messageItem = new StorageMessageItem(StorageMessageItem.TYPE_MANUAL, 
                                                  getCurrentGuildId(), 
                                                  getCurrentChannelId(),
                                                  content,
                                                  isReplying() ? getReplyingMessageId() : null,
                                                  (new Date()).getTime());
                messageStorageInstance.appendUnsentMessage(messageItem, slowModeInterval, k.metaKey); // cmd 按键按下，要放在开头
                log(`[+] ${getDateString(new Date)}: new message created: ${JSON.stringify(messageItem)}`)
                if (isReplying()) {
                    setTimeout(closeReplyBar, 1000);
                }
            }
        }
    });	
}


export {
    delay,
    log,
    error,
    LOG_PREFIX,
    getDateString,
    getCurrentGuildId,
    getCurrentChannelId,
    getChannelMessages,
    SendMessageError,
    sendMessageToChannel,
    isReplying,
    closeReplyBar,
    getReplyingMessageId,
    getTypingMessageContent,
    isSlowModeOpening,
    getSlowModeIntervalMS,
    sendCmdBackspaceToInput,
    hookChatInput,
}