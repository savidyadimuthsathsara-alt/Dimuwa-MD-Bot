const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

const phoneNumber = "94740325746"; 

async function startDimuwaBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" })
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(`\n================================`);
            console.log(`YOUR PAIRING CODE: ${code}`);
            console.log(`================================\n`);
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if(shouldReconnect) {
                startDimuwaBot();
            } else {
                console.log('Connection Logged Out. Please delete session folder and restart.');
            }
        } else if(connection === 'open') {
            console.log('Dimuwa-MD Bot Connected Successfully!');
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if(!msg.message || msg.key.fromMe) return;
        
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
        
        if(text === '.menu' || text === '.alive') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Dimuwa-MD Bot is Alive and Working!' });
        }
    });
}

startDimuwaBot();

