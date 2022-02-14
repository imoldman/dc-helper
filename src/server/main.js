/*
const http = require('http');

const requestListener = function (req, res) {
  res.writeHead(200);
  res.end('Hello, World!');
}

const server = http.createServer(requestListener);
server.listen(8080);
*/

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import { threadId } from 'worker_threads';
import logger from './logger.js';

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = path.join(THIS_DIR, 'config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'default.json');

class User {
    constructor (name, uid) {
        this.name = name;
        this.uid = uid;
    }
}
class SentMessage {
    constructor (user, content, messageId) {
        this.user = user;
        this.messageId = messageId;
        this.content = content;
    }
}
class NewMessage {
    constructor (user, index, content, replyId) {
        this.user = user;
        this.content = content;
        this.replyId = replyId;
        this.index = index;
    }
}

class ChannelInfo {
    constructor (guildId, channelId) {
        this.guildId = guildId;
        this.channelId = channelId;
    }

    static createFromConfig() {
        let config = JSON.parse(fs.readFileSync(CONFIG_FILE));
        return new ChannelInfo(config.channel.guildId, config.channel.channelId);
    }
}

class Dialog {
    constructor () {
        this.config = JSON.parse(fs.readFileSync(CONFIG_FILE));
        this.nextIndex = this.config.start.index;
        this.nextReplyId = this.config.start.replyId;
        this.users = this.config.users.map(x => new User(x.name, x.uid));
        this.uid2User = {};
        this.name2User = {};
        this.users.forEach(x => {
            this.uid2User[x.uid] = x;
            this.name2User[x.name] = x;
        });
    }

    getUserByUid(uid) {
        return this.uid2User[uid];
    }

    getUserByName(name) {
        return this.name2User[name];
    }

    flushConfig() {
        this.config.start.index = this.nextIndex;
        this.config.start.replyId = this.nextReplyId;
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config));
    }

    getNextMessage() {
        let dialogFilePath = path.join(CONFIG_DIR, 'dialog.txt');
        let dialog = fs.readFileSync(dialogFilePath).toString().split('\n');
        if (dialog.length <= this.nextIndex) {
            return null;
        }
        let rawContent = dialog[this.nextIndex];
        return new NewMessage(this.name2User[rawContent[0]], this.nextIndex, rawContent.substring(2), this.nextReplyId);
    }

    // 根据 uid 获取下一个消息，如果下一个消息不是该 uid 的，返回 null
    getNextMessageForUid(uid) {
        let message = this.getNextMessage();
        if (message && message.user.uid == uid) {
            return message;
        }
        return null;
    }

    markNextMessageSent(sentMessage) {
        let message = this.getNextMessage();
        if (!message) {
            logger.error(`出现错误: 已经发送完毕了，但是仍然有 ${message.user.uid} 来标记发出`);
            return;
        }
        if (message.user.uid != sentMessage.user.uid) {
            logger.error(`出现错误: 下一个消息应该是 ${message.user.uid} 发送，但是现在 ${uid} 来标记发出了`);
            return;
        }
        if (message.content != sentMessage.content) {
            logger.error(`出现错误: 下一个消息应该是 ${message.index}:${message.content}，但是现在是 "${sentMessage.content}"`);
            return;
        }
        this.nextIndex += 1;
        this.nextReplyId = sentMessage.messageId;
        this.flushConfig();
    }

    config;
    users;
    uid2User;
    name2User;
    nextIndex;
    nextReplyId;
}

const dialog = new Dialog();
const channelInfo = ChannelInfo.createFromConfig();

const app = express();
app.use(
  express.urlencoded({
    extended: true
  })
);
app.use(express.json());
app.use(cors());

app.get('/next', (req, res) => {
    let uid = req.query.uid;
    let user = dialog.getUserByUid(uid);
    let newMessage = dialog.getNextMessageForUid(uid);
    if (!newMessage) {
        logger.info(`[${user.name}:${uid}] 无需发送. `);
        res.json({
            "action": "wait"
        });
    } else {
        logger.info(`[${user.name}:${uid}] 需要发送: ${newMessage.index}:${newMessage.content} with replyId ${newMessage.replyId}`);
        res.json({
            "action": "send",
            "channel": channelInfo,
            "message": newMessage
        });
    }
});

app.post('/ack', (req, res) => {
    let uid = req.body.uid; 
    let user = dialog.getUserByUid(uid);
    let sentMessage = new SentMessage(
        user,
        req.body.content,
        req.body.messageId
    );
    dialog.markNextMessageSent(sentMessage);
    logger.info(`[${user.name}:${uid}] 发送完毕: ${sentMessage.content} => ${sentMessage.messageId}`);
    res.json({
        "ack": "ok"
    });
});

app.listen(3000, () => {
    console.log(`===================================`)
});
