if (process.env.NODE_ENV == 'production'){
  var app = require('http').createServer();
  var listen_port = 3000;
}else{
  console.log("Warning: node is serving static assets!");
  var app = require('http').createServer(handler);
  var listen_port = 8080;
}

var fs      = require('fs')
  , request = require('request')
  , rdslib  = require('redis')
  , redis   = rdslib.createClient()
  , sub     = rdslib.createClient()
  , admin   = rdslib.createClient()
  , io      = require('socket.io')(app)

app.listen(listen_port);



/**
 * Development HTTP server
 */
var DOCUMENT_ROOT     = 'public';
var DEFAULT_FILENAME  = 'index.html';

function handler (req, res) {

  req.url = req.url.split('?')[0]; // Rimuove query string

  // Impedisce di risalire la doc root
  if ( req.url.indexOf('..') > -1 )
    req.url = '/';

  // Sostituisce / con l'index
  if ( req.url == '/' )
    req.url += DEFAULT_FILENAME;

  var fileToServe = DOCUMENT_ROOT + req.url;

  fs.readFile(fileToServe,
  function (err, data) {
    if (err) {
      res.writeHead(404);
      return res.end('File not found');
    }
    res.writeHead(200);
    if ( req.url.indexOf('.svg') !== -1 ) {
      res.writeHead(200, {"Content-Type": 'image/svg+xml'});
    } else {
      res.writeHead(200);
    }
    res.end(data);
  });
}

  // TODO: abilitare queste robe
  // io.enable('browser client minification');  // send minified client
  // io.enable('browser client etag');          // apply etag caching logic based on version number
  // io.enable('browser client gzip');          // gzip the file

//   _   _  _   _  _____ ___  ___ _____ ______  _____  _   _   ___  _____ 
// | | | || \ | ||_   _||  \/  ||_   _|| ___ \/  __ \| | | | / _ \|_   _|
// | | | ||  \| |  | |  | .  . |  | |  | |_/ /| /  \/| |_| |/ /_\ \ | |  
// | | | || . ` |  | |  | |\/| |  | |  | ___ \| |    |  _  ||  _  | | |  
// | |_| || |\  | _| |_ | |  | | _| |_ | |_/ /| \__/\| | | || | | | | |  
//  \___/ \_| \_/ \___/ \_|  |_/ \___/ \____/  \____/\_| |_/\_| |_/ \_/  
//                                                                      

//TODO: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers
//      https://blog.jcoglan.com/2010/10/18/i-am-a-fast-loop/

//                      __  _        
//                     / _|(_)       
//   ___  ___   _ __  | |_  _   __ _ 
//  / __|/ _ \ | '_ \ |  _|| | / _` |
// | (__| (_) || | | || |  | || (_| |
//  \___|\___/ |_| |_||_|  |_| \__, |
//                              __/ |
//                             |___/ 
//

// Messaggi di errore:
const DEFAULT_REFUSAL_REASON  = "Riprova tra un attimo.";
const REDIS_REFUSAL_REASON    = "Qualcosa ha smesso di funzionare. Abbiamo messo le nostre scimmie migliori ad urlare contro i server per risolvere il problema, riprova tra qualche minuto.";
// const DEFAULT_SHUTDOWN_REASON = "" 

// Limiti utenti:
const MAX_ROOMS_JOINED = 20;
const MAX_MSG_LENGTH = 500;
// const MIN_MSG_LENGTH = 2;




//// ______ ______  _____  _____  _____  _____  _____  _     
//// | ___ \| ___ \|  _  ||_   _||  _  |/  __ \|  _  || |    
//// | |_/ /| |_/ /| | | |  | |  | | | || /  \/| | | || |    
//// |  __/ |    / | | | |  | |  | | | || |    | | | || |    
//// | |    | |\ \ \ \_/ /  | |  \ \_/ /| \__/\\ \_/ /| |____
//// \_|    \_| \_| \___/   \_/   \___/  \____/ \___/ \_____/
////

  //       _          _                                 _            
  //      | |        | |                               | |           
  //  ___ | |_  __ _ | |_  _   _  ___    ___  ___    __| |  ___  ___ 
  // / __|| __|/ _` || __|| | | |/ __|  / __|/ _ \  / _` | / _ \/ __|
  // \__ \| |_| (_| || |_ | |_| |\__ \ | (__| (_) || (_| ||  __/\__ \
  // |___/ \__|\__,_| \__| \__,_||___/  \___|\___/  \__,_| \___||___/
  //

const OK          = 0;
const FAIL        = 1;
const HIDE        = 2;
const NICK_TAKEN  = 3;
const TOO_MANY    = 4;

  //       _ _            _                          _       
  //      | (_)          | |                        | |      
  //   ___| |_  ___ _ __ | |_    _____   _____ _ __ | |_ ___ 
  //  / __| | |/ _ \ '_ \| __|  / _ \ \ / / _ \ '_ \| __/ __|
  // | (__| | |  __/ | | | |_  |  __/\ V /  __/ | | | |_\__ \
  //  \___|_|_|\___|_| |_|\__|  \___| \_/ \___|_| |_|\__|___/
  //
  // Basic info: (* = non sempre presente)
  // i     ->   
  //       <-   [message_length_limit, real_identity, nickname, channel_list] 
  //               
  //
  // Check nickname: (per sapere se un nick valido e' prendibile)
  // c     ->  nickname 
  //       <-  OK | FAIL | NICK_TAKEN  (FAIL capita per politiche del server (es: bad nickname))
  // 
  // Set nickname:
  // s     ->  nickname (se nickname assente -> sto rimettendo l'identita' autentica)
  //       <-  OK | FAIL | NICK_TAKEN  (FAIL capita per politiche del server (es: bad nickname))
  //
  // Join channel: 
  // j     ->  channel
  //       <-  OK | FAIL | TOO_MANY
  // 
  // Quit channel:
  // q     ->  channel
  //       <-  OK | FAIL
  //
  // List channels:
  // l     ->  
  //       <-  [ch1, size1, ch2, size2, ... chN, sizeN] (lista canali e relativo peso)
  //
  // Send Message:
  // m     ->  [tags, body, reply]
  //            | tags: lista da 0 a 3 canali di appartenenza del messaggio (se 0, reply obbligatorio)
  //            | body:  il corpo del messaggio
  //            | reply: se il messaggio e' in risposta ad un utente ne contiene il nick, altrimenti non presente (o null?)
  //       <-  OK | HIDE | <msg>  (<msg> e' un errore da mostrare assieme al messaggio)
  // 
  //                                                               _        
  //                                                              | |       
  //  ___   ___  _ __ __   __ ___  _ __    ___ __   __ ___  _ __  | |_  ___ 
  // / __| / _ \| '__|\ \ / // _ \| '__|  / _ \\ \ / // _ \| '_ \ | __|/ __|
  // \__ \|  __/| |    \ V /|  __/| |    |  __/ \ V /|  __/| | | || |_ \__ \
  // |___/ \___||_|     \_/  \___||_|     \___|  \_/  \___||_| |_| \__||___/
  // 
  // New info: (* = non sempre presente)
  // I     <-   [message_length_limit, *[real_identity, *nickname]]
  //       ->   OK
  //
  // Join channel:
  // J     <-   channel
  //       ->   OK
  // 
  // Quit channel:
  // Q     <-   channel
  //       ->   OK
  //
  // New message: (* = non sempre presente)
  // M     <-   [important, author, tags, body, reply, *date]
  //             | important: 0|1
  //             | author: l'autore (nome completo nick@tipoutente)
  //             | tags: lista dei canali (da 0 a 3 canali) se zero: []
  //             | body: il corpo del messaggio 
  //             | reply: a chi risponde il messaggio 
  //             | date: se il server offre una data di invio del messaggio (per eventuale supporto messaggi offline)
  //      ->    OK (se important = 1, altrimenti non voglio ACK)
  // New notification:
  // N    <-   [type, msg] 
  //            | type:  0|1|2 (info | error | important)
  //            | msg: il messaggio
  //       ->   OK (se important = 1, altrimenti non voglio ACK)
  //
  // User count: (numero utenti online)
  // U    <-   usercount  
  //



sub.subscribe('chat');
admin.subscribe('admin');


// TODO: controllo tipi strani nei messaggi

// TODO: performance in generale protocolli
// TODO: errori malformazione, servono?
// TODO: strip()
// TODO: MOTD
// TODO: reply to
// TODO: switch blocco connessioni E ALTRE OPERAZIONI / redis

var CLIENT_ID = "111899957451-6mr9mgh4vvi3mbmmk1q9teo48vsr2nre.apps.googleusercontent.com";
// TODO: check di argv
var NODE_NAME = (process.argv[2] == undefined ? 'node-'+Math.floor(Math.random()*100) : process.argv[2]);

var nick_regex = /^[a-zA-Z0-9\-]{6,20}$/;
var tag_regex = /[a-z0-9\-]{2,20}/;


// Quando redis e' pronto qui vanno gli SHA1 degli script LUA.
var NICKNAME_LOCK;
var NICKNAME_RENEW;
var NICKNAME_FREE;


// Fino a che REDIS non e' pronto non accetto connessioni.
var ACCEPT_CONNECTIONS = false;
var REFUSAL_REASON = DEFAULT_REFUSAL_REASON; 




//                   __ _       
//                  / _(_)      
//   ___ ___  _ __ | |_ _  __ _ 
//  / __/ _ \| '_ \|  _| |/ _` |
// | (_| (_) | | | | | | | (_| |
//  \___\___/|_| |_|_| |_|\__, |
//                         __/ |
//                        |___/
//

// SERVER LOCK
io.use(function(socket, next) {
  if (!ACCEPT_CONNECTIONS)
    next(new Error(REFUSAL_REASON));
  else
    next();
});

// AUTH
io.use(function (socket, next) {
  // compongo l'url di richiesta per l'indirizzo email
  console.log('OK TOKEN: ' + socket.request._query.access_token);
  url = "https://www.googleapis.com/oauth2/v2/userinfo?fields=email&key=" + CLIENT_ID +
         "&access_token=" + socket.request._query.access_token;
  // Ottengo la risposta da google
  request({url: url, json: true}, function (error, response, body){
    if (!error && response.statusCode === 200){
      console.log('RICEVUTO DA GOOGLE:', body);
      if (true || (body.email.indexOf('@campus.unimib.it', body.email.length - 17) !== -1)){
        //^^^^ riattivare il controllo.

        // Inizializzazione stato client:
        socket.chat_authentic_identity = body.email;
        socket.chat_public_identity = socket.chat_authentic_identity;
        socket.is_using_nickname = false;
        socket.channels = {};
        socket.channels_joined = 0;
        if (users_connected[socket.chat_authentic_identity] == undefined)
          users_connected[socket.chat_authentic_identity] = {};
        users_connected[socket.chat_authentic_identity][socket.id] = socket;

        next();

      } else next(new Error("Sono accettati solo gli account @campus.unimib.it"));
    } else next(new Error("Nope"));
  });
});




var reserved_nicknames = {};

/////// 
// TODO: cambiare con una vera hashmap? (lol V8)
var users_connected = {};        // {authentic: {socketid: socket}}
var local_custom_nicknames = {}; // {nickname:  authentic}
var local_channel_list = {};     // {channel:   {socketid: socket}}
//---------
var subgroup_cache = {}; // Cache LRU di raggruppamenti calcolati all'invio di un messaggio.
var global_channel_list = []; // cache locale dei canali con relativi pesi
////////


function join_channel(socket, channel){
  if (!local_channel_list[channel]) 
    local_channel_list[channel] = {};

  local_channel_list[channel][socket.id] = socket;
  socket.channels[channel] = true;
  socket.channels_joined++;
}

function leave_channel(socket, channel){
  if (!socket.channels[channel]) return;
  // Se per qualche motivo le info nei socket e lo stato di local_channel_list 
  // vanno fuori sincronia si sfancula tutto.

  delete local_channel_list[channel][socket.id];
  delete socket.channels[channel];
  socket.channels_joined--;

  if (Object.keys(local_channel_list[channel]).length == 0)
    delete local_channel_list[channel];
}

function can_take_nickname (nickname, socket, callback){
  // TODO: eventualmente implementare logiche di negazione (nickname bannati ecc ecc)

  // Bisogna vedere che sia libero:
  if (local_custom_nicknames[nickname] === undefined) //cache miss
    redis.get('n:'+nickname, function(err, res){ 
      // magari questo utente ha il nick preso su un' altra connessione 
      // verso un altro nodo
      if (res === null || res == socket.chat_authentic_identity) {
        callback(OK);
      } else {
        callback(NICK_TAKEN);
      }
    });
  else if (local_custom_nicknames[nickname] === socket.chat_authentic_identity) // stesso utente
    callback(OK);
  else // utente diverso
    callback(NICK_TAKEN);  
}

function change_nickname (nickname, socket, callback){
    // cerco di prendere il nickname nuovo
    redis.evalsha(NICKNAME_LOCK, 1, nickname, socket.chat_authentic_identity, function (err, val){
        if (val){ // ok preso

          // Aggiungo il nick nella cache locale
          local_custom_nicknames[nickname] = socket.chat_authentic_identity;

          // Se aveva un altro nickname preso, lo libero (async) <- va bene, non voglio aspettare redis
          if (socket.is_using_nickname)
            release_nickname(socket.chat_public_identity, socket.chat_authentic_identity);

          // Assegno il nuovo nick al client
          socket.chat_public_identity = nickname;
          socket.is_using_nickname = true;

          callback(OK);
        } else callback(NICK_TAKEN); // no preso :(
      });
    return true;
}

function release_nickname (nickname, authentic_identity, callback_or_dc){
    // La callback viene chiamata quando il nick 
    // viene sbloccato globalmente su REDIS.
    delete local_custom_nicknames[nickname];
    if (callback_or_dc == undefined) // niente callback 
      redis.evalsha(NICKNAME_FREE, 1, nickname, authentic_identity);
    else
      redis.evalsha(NICKNAME_FREE, 1, nickname, authentic_identity, callback_or_dc);
    return true;
}

function back_to_authentic_identity(socket){
  if (!socket.is_using_nickname) return;

  socket.chat_public_identity = socket.chat_authentic_identity;
  socket.is_using_nickname = false;
  release_nickname(socket.chat_public_identity, socket.chat_authentic_identity);
}

function can_join_channel (channel, socket){
  //TODO regex channel
  // if (badchannel) return FAIL;

  if (socket.channels_joined < MAX_ROOMS_JOINED)
    // socket.emit('JOIN', {result: OK, tag: data.tag});
    return OK;
   else 
    // socket.emit('JOIN', {result: TOO_MANY, tag: data.tag});
    return TOO_MANY;
}

function prepare_message (message, socket, important){
  // TODO: fare bene la modifica del messaggio, altrimenti errori imbarazzanti
  // ^^^^^^^^^^ porcodio, fortuna che me lo sono scritto 
  if (important !== 0 && important !== 1) important = 0;
  malformed = false;
  try{
    prepared_message = {is_garbage: false, reply: OK, message: null, broadcast: false, echo_to_client: false}
    message.splice(0, 0, important, socket.chat_public_identity);
    message[3] = "" + message[3];
    //TODO: castare tutti i tipi correttamente o qualcosa del genere (gesu cristo)
    message_too_long = message[3].length > MAX_MSG_LENGTH;
    message_too_short = message[3].length == 0;
    too_many_tags = message[2].length > 3;
    no_tags = message[2].length == 0;
    missing_both_tags_and_reply = no_tags && !message[4];
  }catch(err){
    malformed = true;
  }

  // I messaggi che non rispettano queste regole vengono insta-cestinati:
  if (   malformed
      || message_too_short 
      || message_too_long 
      || too_many_tags 
      || missing_both_tags_and_reply) {
    prepared_message.is_garbage = true;
    return prepared_message;
  }

  // Gli utenti che usano nickname non possono mandare messaggi diretti a 
  // utenti non anonimi.
  if (socket.is_using_nickname && no_tags && message[4].indexOf('@') != -1){
    message.reply = "Gli utenti anonimi possono mandare messaggi solo ad altri utenti anonimi.";
    return prepared_message;
  }

  // if (message[3].indexOf('>:3') != -1){
  //   prepared_message.reply = "Jesus Christ it's a lion get in the car!";
  //   console.log("IL MESSAGGIO HA IL LEONE");
  //   return prepared_message;
  // }

  prepared_message.message = message;
  prepared_message.broadcast = true;
  return prepared_message;
}

function emit_message_locally (message, except_id){
  // TODO: callback di conferma e altri modificatori per singolo utente!
  // TODO: esistono modi non dementi per gestire unioni di insiemi
  //       (loop innestati in applicazioni realtime, good jaab)

  msgd = {};
  if (except_id !== undefined)
    msgd[except_id] = true;

  // TODO: reply important message
  json_message = JSON.stringify(message)
  t = message[2].length;
  while (t--){
    // reverse while, biatch
    if (!local_channel_list[message[2][t]]) continue;
    
    client_ids = Object.keys(local_channel_list[message[2][t]]);

    i = client_ids.length;
    while (i--) {
      if (msgd[client_ids[i]]) continue;

      msgd[client_ids[i]] = true;
      local_channel_list[message[2][t]][client_ids[i]].emit('M', message);
      // local_channel_list[message[2][t]][client_ids[i]].json.emit('M', message);
    }
  }

  // TODO: controllare che il destinatario di un reply lo riceva sicuramente

  if (message[4] && message[4].length > 0){
    if (message[4].indexOf('@') != -1){
      authentic = message[4];
    }else{
      authentic = local_custom_nicknames[message[4]];
    }
    console.log("MESSAGGGIIIIII");
    console.log(message[4]);
    console.log(authentic);
    if (authentic){
      sockets_obj = users_connected[authentic];
      console.log('autentico presente');
      if (sockets_obj){
        socket_ids = Object.keys(sockets_obj);
        console.log('socket trovati:');
        console.log(socket_ids);
        i = socket_ids.length;
        while(i--){
          if (!msgd[socket_ids[i]]){
            socket = users_connected[authentic][socket_ids[i]];
            if (socket && socket.chat_public_identity == message[4]){
              socket.emit('M', message);
            }
          }
        }
      }
    }
  }
  // TODO: aggiungere altre logiche di identificazione di messaggi importanti
  // TODO: if message.important redis.set(blablabla); (se non arriva da redis, cioe' no except_id lol!)


}

function broadcast_message (message, socketid){
  //TODO: callback
  emit_message_locally(message, socketid); 
  redis.publish('chat', JSON.stringify({node: NODE_NAME, msg: message}));
  //                    ^^^^  + veloce di messagepack a quanto pare
} 



io.sockets.on('connection', function (socket) {




  socket.on('disconnect', function (reason) {
    // TODO: logging
    // TODO: parametrizzare il tempo?


    // Libero nickname (lascia 20 secondi al 
    // client per tornare prima di liberare il nick)
    if (socket.is_using_nickname)
      release_nickname(socket.chat_public_identity, socket.chat_authentic_identity, 'DC')
    delete users_connected[socket.chat_authentic_identity][socket.id];
    if (Object.keys(users_connected[socket.chat_authentic_identity]).length == 0) // diocane sto linguaggio di merda 
      delete users_connected[socket.chat_authentic_identity];

    // leave canali:
    for (channel in socket.channels) leave_channel(socket, channel);
    // non ottimale :(
    
  });

  // BASIC INFO 
  socket.on('i', function (_, reply){
    console.log("i");
    reply([140, socket.chat_authentic_identity, socket.chat_public_identity, socket.channels]);
  });

  // CHECK NICKNAME
  socket.on('c', function (nickname, reply){
    if (typeof nickname != 'string') return;

    if (!nick_regex.test(nickname)) return;
    console.log('ok regex nickname!!!')

    can_take_nickname(nickname, socket, reply);
  });

  // SET NICKNAME
  socket.on('s', function (nickname, reply){
    // REMOVE NICKNAME, BACK TO REAL IDENTITY
    if (nickname == null){
      back_to_authentic_identity(socket);
      reply(OK);
      return;
    }

    if (typeof nickname != 'string') return;
    if (!nick_regex.test(nickname)) return;

    change_nickname(nickname, socket, reply);
  });

  // JOIN CHANNEL
  socket.on('j', function (channel, reply){
    //TODO: test iniziale canale
    //TODO: vedere se serve async o no
    //TODO: controllare se il canale esiste, nel caso bypass del controllo
    
    if (typeof channel != 'string') return;

    verdict = can_join_channel(channel, socket);
    if (verdict == OK){
      reply(OK);
      join_channel(socket, channel);
    } else {
      reply(verdict);
    }
  });

  // QUIT CHANNEL
  socket.on('q', function (channel, reply){
    //TODO: test iniziale channel
    if (typeof channel != 'string') return;
    
    leave_channel(socket, channel);
    reply(OK);
  });
  
  // LIST CHANNELS 
  // TODO: non usa la chiusura, basta dichiararla una volta.
  socket.on('l', function (channel, reply){
    reply(global_channel_list);
  });

  // SEND MESSAGE
  socket.on('m', function (message, reply){
    // Message sanity checks done by prepare_message.
    prepared_message = prepare_message(message, socket);
    if (prepared_message.is_garbage) return;

    // TODO: meccaniche del bangbot.
    // if (message[3].indexOf('!') > -1){ // #!
    //   redis.pfadd('bangbot', message[1], function(err, val){
    //     if (val) {
    //       reply('!BOT ha rifiutato questo messaggio.');
    //       return;
    //     }
    //     reply(prepared_message.reply);
    //     if (prepared_message.broadcast)
    //       broadcast_message(prepared_message.message, prepared_message.echo_to_client ? undefined : socket.id);
    //   });
    //   return;
    // }
    
    reply(prepared_message.reply);

    if (prepared_message.broadcast)
      broadcast_message(prepared_message.message, prepared_message.echo_to_client ? undefined : socket.id);
  });
});



sub.on('message', function (channel, data){
  //   __                             _    _ 
  //  / _|                           | |  | |
  // | |_  __ _  _ __    ___   _   _ | |_ | |
  // |  _|/ _` || '_ \  / _ \ | | | || __|| |
  // | | | (_| || | | || (_) || |_| || |_ |_|
  // |_|  \__,_||_| |_| \___/  \__,_| \__|(_)
  // (kinda, this actually is the `-in` part)                     

  if (channel == 'chat'){
    packet = JSON.parse(data);
    if (packet.node == NODE_NAME) return;
    emit_message_locally(packet.msg);
  }
});





admin.on('message', function (channel, data){
  if (channel == 'admin'){
    packet = JSON.parse(data);
    console.log("ADMIN");
    console.log(packet);
  }

  if (packet['action'] == 'send') {
    packet = packet['data'];
    if (packet['type'] == 'normal'){
        msg = [(packet['important'] ? 1 : 0), packet['alias'], packet['tags'], packet['message'], packet['reply']];
        emit_message_locally(msg);
    }
  }
});


// MISCELLANEA REDIS
// TODO: rebuild lista canali
// TODO: errori redis
// TODO: socket.io-emitter meglio di fare parsing del json?

// TODO: mettere id alle robe in generale


//                 _  _                                 _        
//                | |(_)                               | |       
//  _ __  ___   __| | _  ___    ___ __   __ ___  _ __  | |_  ___ 
// | '__|/ _ \ / _` || |/ __|  / _ \\ \ / // _ \| '_ \ | __|/ __|
// | |  |  __/| (_| || |\__ \ |  __/ \ V /|  __/| | | || |_ \__ \
// |_|   \___| \__,_||_||___/  \___|  \_/  \___||_| |_| \__||___/
//

redis.on('error', function (err){
  // PDPDPD e' morto redis, che fare?
  console.log('REDIS IS DEAD');
  console.log(err);
  // Messaggio di errore:
  REFUSAL_REASON = REDIS_REFUSAL_REASON;
  // Non accetto nuove connessioni:
  ACCEPT_CONNECTIONS = false;
  // TODO: Kick di tutti i presenti:
  // io.sockets.disconnect();

  // TODO: CAPIRE COME CAZZO VIENE GESTITA STA COSA CRISTO D'UN DIO STA GENTE

     
  
});

sub.on('error', function (error){

  // La gestione l'ho messa tutta nell'altro client.
  // Qui la funzione serve solo a catturare l'eccezione.
});



redis.on('ready', function (){
  // Dunque, o e' l' avvio del server, oppure redis e' scoppiato.
  console.log('REDIS IS READY!');

  // Mi registro all'elenco dei node attivi:
  redis.sadd('nodes', NODE_NAME);

  // Gli script LUA:
  // TODO : test expire 
  SETLOCK = [ // se il node scoppia si hanno 60 secondi per riprendersi il proprio nick
    "if redis.call('SET', 'n:'..KEYS[1], ARGV[1], 'EX', 60, 'NX') == 1",
    "then", 
         "redis.call('SET', 'N:'..KEYS[1], 1, 'EX', 60)",
         "return 1",
    "else", 
         "if redis.call('GET', 'n:'..KEYS[1]) == ARGV[1]",
         "then",
              "redis.call('INCR', 'N:'..KEYS[1])",
              // "redis.call('EXPIRE', 'N:'..KEYS[1], 60)",
              "return 1",
         "else",
              "return 0",
         "end",
    "end"
  ].join("\n");

  RENEWLOCK = [
  // TODO: vedere se si puo' migliorare, non e' un granche
    "if redis.call('GET', 'n:'..KEYS[1]) == ARGV[1]",
    "then", // ok e' il lock che mi aspetto
         "redis.call('EXPIRE', 'n:'..KEYS[1], 60)",
         "redis.call('EXPIRE', 'N:'..KEYS[1], 60)",
         "return 1",
    "else", // zomg 
         "return 0",
    "end"
  ].join("\n");

  FREELOCK = [
    "if redis.call('GET', 'n:'..KEYS[1]) == ARGV[1]",
    "then", // ok e' il lock che mi aspetto
         "if redis.call('DECR', 'N:'..KEYS[1]) > 0",
         "then", // ci sono altri dispositivi dell'utente con questo nick
              "return 1",
         "else", // l'ultimo dipositivo con questo nick si sta disconnettendo            
              "if ARGV[2] == 'DC'", 
              "then", // il client si e' disconnesso, gli do tempo di tornare
                   "redis.call('EXPIRE', 'n:'..KEYS[1], 20)", 
              "else", // cambio nickname -> il nick va liberato
                   "redis.call('DEL', 'n:'..KEYS[1])",
              "end",
              "return 1",
         "end",
    "else", // zomg
         "return 0",
    "end"
  ].join("\n");

  // Carico gli script su redis (in fila per sapere quando tutto e' pronto):
  redis.script('load', SETLOCK, function (err, sha){
    NICKNAME_LOCK = sha.toString();
    // serve?          ^^^^^^^^^^^ (l'ho visto fare nei test di node_redis)
    redis.script('load', RENEWLOCK, function (err, sha){
      NICKNAME_RENEW = sha.toString();
      redis.script('load', FREELOCK, function (err, sha){
        NICKNAME_FREE = sha.toString();

        // Finito di caricare gli script, siamo pronti:
        ACCEPT_CONNECTIONS = true;
        console.log('DONE LOADING SCRIPTS!');
      });
    });
  });
});

//              __                 _       _                           
//             / _|               | |     | |                          
//  _ __  ___ | |_ _ __  ___  ___ | |__   | | ___   ___  _ __   ___ 
// | '__|/ _ \|  _| '__|/ _ \/ __|| '_ \  | |/ _ \ / _ \| '_ \ / __|
// | |  |  __/| | | |  |  __/\__ \| | | | | | (_) | (_) | |_) |\__ \
// |_|   \___||_| |_|   \___||___/|_| |_| |_|\___/ \___/| .__/ |___/
//                                                      | |         
//                                                      |_|         
//

// MANTENIMENTO VALIDITA PRESENZA ELENCO SERVER NODE
setInterval(function (){
  //TODO: magari mettere info utili
  redis.set('node:'+NODE_NAME, 'helo', 'EX', 6);
}, 1000 * 3)

// MANTENIMENTO LOCK NICKNAME
// TODO: distribuire sta operazione nel tempo e fare magari un pelo di pipelining
setInterval(function (){
  Object.keys(local_custom_nicknames).forEach(function (nickname) {
    redis.evalsha(NICKNAME_RENEW, 1, nickname, local_custom_nicknames[nickname], function (err, val){
      // TODO: controllare il risultato dell'operazione
    });
  });
}, 1000 * 40);

// AGGIORNAMENTO CACHE LISTA CANALI GLOBALE
setInterval(function (){
  // Aggiorno la mia lista: (prima creo un sortedset temporaneo)
   command = ['tcn:' + NODE_NAME];

   Object.keys(local_channel_list).forEach(function (room){
    // if (room.length < 2) return;
    command.push(Object.keys(local_channel_list[room]).length); // score
    command.push(room); // member
   });

   if (command.length > 1){
     redis.zadd(command, function(err, val){
      // Sposto la lista temporanea per fare un update atomico:
      redis.rename(command[0], command[0].slice(1));
      // tcn:nodename -> cn:nodename
      redis.expire(command[0].slice(1), 20);
     });
   }


  // Controllo se c'e' da aggiornare la lista globale:
  redis.set('r:channels', 1, 'EX', 9, 'NX', function (err, lock){
    if (lock) // tocca a me aggiornare
      redis.smembers('nodes', function (err, nodes){
        // Eseguo l'unione degli insiemi: (a cui aggiungo anche i canali sticky)
        command = ['channels', nodes.length + 1, 's:channels'].concat(nodes.map(function (e) {return 'cn:'+e;}));
        redis.zunionstore(command, function (err, val){
          if (val == 0) return; // se non c'e' nulla di nuovo non prendo niente
          redis.zrangebyscore('channels', 1, '+inf', 'WITHSCORES', function (err, val){
            global_channel_list = val;
          });
        });

        // Gia che ci sono controllo se qualche node e' morto:
        redis.mget(nodes.map(function (e){return 'node:'+e;}), function (err, livenodes){
          // TODO: notificare la tragedia
        });
      });
  });
}, 1000 * 10);


// SPAM UTENTI GLOBALI

setInterval(function(){
  usercount = Object.keys(users_connected).length;
  console.log('USERCOUNT:', usercount);
  io.sockets.emit('U', usercount);
}, 1000 * 10);




