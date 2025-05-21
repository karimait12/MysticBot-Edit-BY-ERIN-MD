"use strict";
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'; 
import './config.js';
import './api.js';
import {createRequire} from 'module';
import path, {join} from 'path';
import {fileURLToPath, pathToFileURL} from 'url';
import {platform} from 'process';
import {readdirSync, statSync, unlinkSync, existsSync, readFileSync, watch} from 'fs';
import yargs from 'yargs';
import {spawn} from 'child_process';
import lodash from 'lodash';
import chalk from 'chalk';
import syntaxerror from 'syntax-error';
import {format} from 'util';
import pino from 'pino';
import Pino from 'pino';
import {Boom} from '@hapi/boom';
import {makeWASocket, protoType, serialize} from './src/libraries/simple.js';
import {Low, JSONFile} from 'lowdb';
import store from './src/libraries/store.js';
const {DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, PHONENUMBER_MCC} = await import("baileys");
import readline from 'readline';
import NodeCache from 'node-cache';
const {chain} = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
let stopped = 'close';  
let retryCount = 0;
const MAX_RETRIES = 10;
let keepAliveInterval;
let isReconnecting = false;

protoType();
serialize();
const msgRetryCounterMap = new Map();
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
}; global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
}; global.__require = function require(dir = import.meta.url) {
  return createRequire(dir);
};
global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({...query, ...(apikeyqueryname ? {[apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name]} : {})})) : '');
global.timestamp = {start: new Date};
global.videoList = [];
global.videoListXXX = [];
const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[' + (opts['prefix'] || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-.@').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']');
global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : new JSONFile(`${opts._[0] ? opts._[0] + '_' : ''}database.json`));

global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) {
    return new Promise((resolve) => setInterval(async function() {
      if (!global.db.READ) {
        clearInterval(this);
        resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
      }
    }, 1 * 1000));
  }
  if (global.db.data !== null) return;
  global.db.READ = true;
  await global.db.read().catch(console.error);
  global.db.READ = null;
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {}),
  };
  global.db.chain = chain(global.db.data);
};
loadDatabase();

global.chatgpt = new Low(new JSONFile(path.join(__dirname, '/db/chatgpt.json')));
global.loadChatgptDB = async function loadChatgptDB() {
  if (global.chatgpt.READ) {
    return new Promise((resolve) =>
      setInterval(async function() {
        if (!global.chatgpt.READ) {
          clearInterval(this);
          resolve( global.chatgpt.data === null ? global.loadChatgptDB() : global.chatgpt.data );
        }
      }, 1 * 1000));
  }
  if (global.chatgpt.data !== null) return;
  global.chatgpt.READ = true;
  await global.chatgpt.read().catch(console.error);
  global.chatgpt.READ = null;
  global.chatgpt.data = {
    users: {},
    ...(global.chatgpt.data || {}),
  };
  global.chatgpt.chain = lodash.chain(global.chatgpt.data);
};
loadChatgptDB();

const {state, saveCreds} = await useMultiFileAuthState(global.authFile);

const {version} = await fetchLatestBaileysVersion();
let phoneNumber = global.botnumber || process.argv.find(arg => /^\+\d+$/.test(arg));

const methodCodeQR = process.argv.includes("qr")
const methodCode = !!phoneNumber || process.argv.includes("code")
const MethodMobile = process.argv.includes("mobile")
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

let opcion
if (methodCodeQR) {
  opcion = '1'
}
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${authFile}/creds.json`)) {
  do {
    opcion = await question('[ ℹ️ ] اختر خيارًا:\n1. باستخدام رمز QR\n2. باستخدام رمز نصي مكون من 8 أرقام\n---> ')
    if (!/^[1-2]$/.test(opcion)) {
      console.log('[ ❗ ] الرجاء اختيار 1 أو 2 فقط.\n')
    }
  } while (opcion !== '1' && opcion !== '2' || fs.existsSync(`./${authFile}/creds.json`))
}

console.info = () => {}
const connectionOptions = {
    logger: Pino({ level: 'silent' }),
    printQRInTerminal: opcion === '1' || methodCodeQR,
    mobile: MethodMobile,
    browser: opcion === '1' ? ['Nano-Bot-V2', 'Safari', '2.0.0'] : methodCodeQR ? ['Nano-Bot-V2', 'Safari', '2.0.0'] : ['Ubuntu', 'Chrome', '20.0.04'],
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: 'fatal' }).child({ level: 'fatal' })),
    },
    waWebSocketUrl: 'wss://web.whatsapp.com/ws/chat',
    markOnlineOnConnect: true,
    connectTimeoutMs: 40000,
    keepAliveIntervalMs: 25000,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
        let jid = jidNormalizedUser(key.remoteJid);
        let msg = await store.loadMessage(jid, key.id);
        return msg?.message || "";
    },
    shouldIgnoreJid: (jid) => isJidBroadcast(jid),
    fireInitQueries: true,
    version: [2, 3000, 1015901307],
};

global.conn = makeWASocket(connectionOptions);

if (!fs.existsSync(`./${authFile}/creds.json`)) {
  if (opcion === '2' || methodCode) {
    opcion = '2'
    if (!conn.authState.creds.registered) {  
      if (MethodMobile) throw new Error('لا يمكن استخدام رمز الاقتران مع واجهة برمجة التطبيقات المحمولة.')

      let numeroTelefono
      if (!!phoneNumber) {
        numeroTelefono = phoneNumber.replace(/[^0-9]/g, '')
        if (!Object.keys(PHONENUMBER_MCC).some(v => numeroTelefono.startsWith(v))) {
          console.log(chalk.bgBlack(chalk.bold.redBright("ابدأ برمز الدولة لرقم WhatsApp الخاص بك.\nمثال: +201151094460\n")));
          process.exit(0)
        }
      } else {
        while (true) {
          numeroTelefono = await question(chalk.bgBlack(chalk.bold.yellowBright('يرجى كتابة رقم WhatsApp الخاص بك.\nمثال: +201151094460\n')));
          numeroTelefono = numeroTelefono.replace(/[^0-9]/g, '')
          if (numeroTelefono.match(/^\d+$/) && Object.keys(PHONENUMBER_MCC).some(v => numeroTelefono.startsWith(v))) break 
          else console.log(chalk.bgBlack(chalk.bold.redBright("يرجى كتابة رقم WhatsApp الخاص بك.\nمثال: +201151094460.\n")));
        }
        rl.close()  
      } 

      setTimeout(async () => {
        let codigo = await conn.requestPairingCode(numeroTelefono)
        codigo = codigo?.match(/.{1,4}/g)?.join("-") || codigo
        console.log(chalk.yellow('[ ℹ️ ] أدخل رمز الاقتران في WhatsApp.'))
        console.log(chalk.black(chalk.bgGreen(`رمز الاقتران الخاص بك: `)), chalk.black(chalk.white(codigo)))
      }, 3000)
    }
  }
}

conn.isInit = false;
conn.well = false;
conn.logger.info(`[ ℹ️ ] جارٍ التحميل...\n`);

if (!opts['test']) {
  if (global.db) {
    setInterval(async () => {
      if (global.db.data) await global.db.write();
      if (opts['autocleartmp'] && (global.support || {}).find) (tmp = [os.tmpdir(), 'tmp', 'jadibts'], tmp.forEach((filename) => cp.spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete'])));
    }, 30 * 1000);
  }
}

if (opts['server']) (await import('./server.js')).default(global.conn, PORT);

function clearTmp() {
  const tmp = [join(__dirname, './src/tmp')];
  const filename = [];
  tmp.forEach((dirname) => readdirSync(dirname).forEach((file) => filename.push(join(dirname, file))));
  return filename.map((file) => {
    const stats = statSync(file);
    if (stats.isFile() && (Date.now() - stats.mtimeMs >= 1000 * 60 * 3)) return unlinkSync(file);
    return false;
  });
}

const dirToWatchccc = path.join(__dirname, './');
function deleteCoreFiles(filePath) {
  const coreFilePattern = /^core\.\d+$/i;
  const filename = path.basename(filePath);
  if (coreFilePattern.test(filename)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`خطأ في حذف الملف ${filePath}:`, err);
      else console.log(`تم حذف الملف: ${filePath}`);
    });
  }
}
fs.watch(dirToWatchccc, (eventType, filename) => {
  if (eventType === 'rename') {
    const filePath = path.join(dirToWatchccc, filename);
    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) deleteCoreFiles(filePath);
    });
  }
});

async function connectionUpdate(update) {
  const {connection, lastDisconnect, isNewLogin, qr} = update;
  stopped = connection;
  
  if (isNewLogin) {
    conn.isInit = true;
    retryCount = 0; // Reset retry counter on new login
  }

  const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
  
  if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
    await global.reloadHandler(true).catch(console.error);
    global.timestamp.connect = new Date;
  }

  if (global.db.data == null) loadDatabase();
  
  if (qr != 0 && qr != undefined || methodCodeQR) {
    if (opcion == '1' || methodCodeQR) {
      console.log(chalk.yellow('[ ℹ️ ] قم بمسح رمز الاستجابة السريعة (QR).'));
    }
  }

  if (connection == 'open') {
    console.log(chalk.green('[ ✅ ] تم الاتصال بنجاح.'));
    retryCount = 0; // Reset retry counter on successful connection
    
    // Start keep-alive interval
    keepAliveInterval = setInterval(() => {
      conn.sendPresenceUpdate('available').catch(() => {});
    }, 60000);
  }

  let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
  if (reason == 405) {
    await fs.unlinkSync("./MysticSession/" + "creds.json")
    console.log(chalk.bold.redBright(`[ ⚠ ] تم استبدال الاتصال، يرجى الانتظار لحظة سأقوم بإعادة التشغيل...\nإذا ظهرت أخطاء، يرجى البدء مرة أخرى باستخدام: npm start`))
    process.send('reset')
  }

  if (connection === 'close') {
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    
    if (reason === DisconnectReason.badSession) {
      conn.logger.error(`[ ⚠ ] جلسة غير صحيحة، يرجى حذف المجلد ${global.authFile} وإعادة المسح مرة أخرى.`);
    } 
    else if (reason === DisconnectReason.connectionClosed || 
             reason === DisconnectReason.connectionLost || 
             reason === DisconnectReason.restartRequired ||
             reason === DisconnectReason.timedOut) {
      
      if (isReconnecting) return;
      isReconnecting = true;
      
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        const delay = Math.min(5000 * retryCount, 30000); // Exponential backoff with max 30s
        
        conn.logger.warn(`[ ⚠ ] محاولة إعادة الاتصال ${retryCount}/${MAX_RETRIES}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
          await global.reloadHandler(true);
          conn.logger.info(`[ ℹ️ ] إعادة الاتصال نجحت بعد ${retryCount} محاولات`);
          retryCount = 0;
        } catch (err) {
          conn.logger.error(`[ ❌ ] فشل إعادة الاتصال: ${err.message}`);
        } finally {
          isReconnecting = false;
        }
      } else {
        conn.logger.error(`[ ❌ ] وصلت إلى الحد الأقصى لمحاولات إعادة الاتصال (${MAX_RETRIES})`);
        process.exit(1);
      }
    }
    else if (reason === DisconnectReason.connectionReplaced) {
      conn.logger.error(`[ ⚠ ] الاتصال تم استبداله، تم فتح جلسة جديدة.`);
    } 
    else if (reason === DisconnectReason.loggedOut) {
      conn.logger.error(`[ ⚠ ] الاتصال مغلق، يرجى حذف المجلد ${global.authFile} وإعادة المسح مرة أخرى.`);
    } 
    else {
      conn.logger.warn(`[ ⚠ ] سبب الانفصال غير معروف. ${reason || ''}`);
    }
  }
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  setTimeout(() => process.exit(1), 5000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

let isInit = true;
let handler = await import('./handler.js');

global.reloadHandler = async function(restatConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
    if (Object.keys(Handler || {}).length) handler = Handler;
  } catch (e) {
    console.error(e);
  }
  
  if (restatConn) {
    const oldChats = global.conn.chats;
    try {
      global.conn.ws.close();
    } catch { }
    conn.ev.removeAllListeners();
    global.conn = makeWASocket(connectionOptions, {chats: oldChats});
    store?.bind(conn);
    isInit = true;
  }
  
  if (!isInit) {
    conn.ev.off('messages.upsert', conn.handler);
    conn.ev.off('group-participants.update', conn.participantsUpdate);
    conn.ev.off('groups.update', conn.groupsUpdate);
    conn.ev.off('message.delete', conn.onDelete);
    conn.ev.off('call', conn.onCall);
    conn.ev.off('connection.update', conn.connectionUpdate);
    conn.ev.off('creds.update', conn.credsUpdate);
  }

  conn.welcome = '👋 مرحباً بك!\n@user';
  conn.bye = '👋 إلى اللقاء!\n@user';

  conn.handler = handler.handler.bind(global.conn);
  conn.participantsUpdate = handler.participantsUpdate.bind(global.conn);
  conn.groupsUpdate = handler.groupsUpdate.bind(global.conn);
  conn.onDelete = handler.deleteUpdate.bind(global.conn);
  conn.onCall = handler.callUpdate.bind(global.conn);
  conn.connectionUpdate = connectionUpdate.bind(global.conn);
  conn.credsUpdate = saveCreds.bind(global.conn, true);

  conn.ev.on('messages.upsert', conn.handler);
  conn.ev.on('group-participants.update', conn.participantsUpdate);
  conn.ev.on('groups.update', conn.groupsUpdate);
  conn.ev.on('message.delete', conn.onDelete);
  conn.ev.on('call', conn.onCall);
  conn.ev.on('connection.update', conn.connectionUpdate);
  conn.ev.on('creds.update', conn.credsUpdate);
  
  isInit = false;
  return true;
};

const pluginFolder = global.__dirname(join(__dirname, './plugins/index'));
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = {};

async function filesInit() {
  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename));
      const module = await import(file);
      global.plugins[filename] = module.default || module;
    } catch (e) {
      conn.logger.error(e);
      delete global.plugins[filename];
    }
  }
}

filesInit().then((_) => Object.keys(global.plugins)).catch(console.error);

global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = global.__filename(join(pluginFolder, filename), true);
    if (filename in global.plugins) {
      if (existsSync(dir)) conn.logger.info(` updated plugin - '${filename}'`);
      else {
        conn.logger.warn(`deleted plugin - '${filename}'`);
        return delete global.plugins[filename];
      }
    } else conn.logger.info(`new plugin - '${filename}'`);
    
    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    });
    
    if (err) conn.logger.error(`syntax error while loading '${filename}'\n${format(err)}`);
    else {
      try {
        const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`));
        global.plugins[filename] = module.default || module;
      } catch (e) {
        conn.logger.error(`error require plugin '${filename}\n${format(e)}'`);
      } finally {
        global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)));
      }
    }
  }
};

Object.freeze(global.reload);
watch(pluginFolder, global.reload);
await global.reloadHandler();

async function _quickTest() {
  const test = await Promise.all([
    spawn('ffmpeg'),
    spawn('ffprobe'),
    spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
    spawn('convert'),
    spawn('magick'),
    spawn('gm'),
    spawn('find', ['--version']),
  ].map((p) => {
    return Promise.race([
      new Promise((resolve) => {
        p.on('close', (code) => {
          resolve(code !== 127);
        });
      }),
      new Promise((resolve) => {
        p.on('error', (_) => resolve(false));
      })]);
  }));
  
  const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
  global.support = {ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find};
  Object.freeze(global.support);
}

setInterval(async () => {
  if (stopped === 'close' || !conn || !conn?.user) return;
  await clearTmp();
}, 180000);

setInterval(async () => {
  if (stopped === 'close' || !conn || !conn?.user) return;
  const _uptime = process.uptime() * 1000;
  const uptime = clockString(_uptime);
  const bio = 'anime 7';
  await conn?.updateProfileStatus(bio).catch((_) => _);
}, 60000);

function clockString(ms) {
  const d = isNaN(ms) ? '--' : Math.floor(ms / 86400000);
  const h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24;
  const m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  const s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
  return [d, 'd ️', h, 'h ', m, 'm ', s, 's '].map((v) => v.toString().padStart(2, 0)).join('');
}

_quickTest().catch(console.error);
