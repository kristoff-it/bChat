/**
 * (c)2014 Alfio Emanuele Fresta
 */

const ABILITA_AUTOLOGIN		= true;
const DEBUG 				= true;
const LIV_NOTIFICA_DEFAULT 	= 'tutti';

var livelli = ['info', 'success', 'warning', 'danger'];

var tags_impostazioni = {
	tagLimit: 3,
	beforeTagAdded: 	ui_tag_add_before,
	afterTagAdded:  	ui_tag_add_after,
	beforeTagRemoved: 	ui_tag_remove_before,
	afterTagRemoved: 	ui_tag_remove_after,
	onTagLimitExceeded: ui_tag_limit_hit,
	autocomplete: 	{
		source: 		ui_tag_source
	},
	caseSensitive: false,
	placeholderText: "Aggiungi tag..."
};

var livelli_notifica = {
	'tutti': 	 	['normale', 'importante'],
	'importanti': 	['importante'],
	'muto': 		[]
};

var tagList = [];


// Inizializza il client
var client = new CClient();

Date.prototype.ottieniTempo = function() {
	return this.toString().replace(/.*(\d{2}:\d{2}):(\d{2}).*/, "$1");
}

function google_login_callback(a) {

	if ( a.status.method == "PROMPT" && !a.status.signed_in ) {
		// Login negato :(
		$("#login-nonfatto").show(500);

	} else if ( 
		(
			ABILITA_AUTOLOGIN && $.jStorage.get("login", false) 
			|| a.status.method == "PROMPT" 
		) 
		&& a.status.signed_in
	) {
		// Token ottenuta

		$("#accesso-pulsante").hide();
		$("#login-incorso").show();

		client.connect({
			access_token: a.access_token

		}, function() {
			// Login effettuato
			personalizzaNavbar();
			mostraComponente("chat", 500);

			// Assegna eventi
			client.events = {
				disconnect: 	client_disconnect,
				notification: 	client_notification,
				receive: 		client_receive,
				reconnect: 		client_reconnect,
				subscribe: 		client_subscribe,
				unsubscribe: 	client_unsubscribe,
				updateCount: 	client_updateCount,
				updateIdentity: client_updateIdentity, 
				updateList: 	client_updateList,
				updateTags: 	client_updateTags,
			};

			// storico_aggiungi_sys("Benvenuto/a nella chat!"); 
			$("#modulo-msg-txt").focus();
			client_connect();

		}, function() {
			// Accesso negato
			$("#login-incorso").hide();
			$("#accesso-pulsante").show();
			$("#login-errore").show();

		});

	}
}

function refreshVieport() {
	const ALTEZZA_COMPONENTI = 165;
	$("#corpo, .sidebar").css('min-height', $(window).height() - 165);
}

function mostraComponente(nuovaComponente, tempo) {
	DEBUG && console.log("$ ui:", nuovaComponente);
	if ( !tempo ) {
		tempo = 0;
	}
	$(".componente-corpo").not("#comp-" + nuovaComponente).stop().hide(0, function() {
		$("#comp-" + nuovaComponente).stop().fadeIn(tempo);
	});
}

function mostraTab(tab, tempo) {
	DEBUG && console.log("$ tab:", tab);
	if ( !tempo ) {
		tempo = 0;
	}
	$(".tab").hide(tempo, function() {
		$("#tab-" + tab).show(tempo);
	});
}


function personalizzaNavbar() {
	// Personalizza la navbar
	$("#accesso-noneffettuato").hide(0, function() {
		$(".mia-email").html(renderAutore(client.getIdentity(function(){}).realname));
		$("#accesso-effettuato").stop().fadeIn(500);
	});
	$(".barra-laterale li").attr('disabled', false).removeClass('disabled');
	$("[data-tab]").each(_data_tab);
	mostraTab("chat");
}

/**
 * Prepara funzionamento dei tab
 */
function _data_tab(i, e) {
	$(e).click( function() {
		$(".barra-laterale li").removeClass('active');
		$(e).parent('li').addClass('active');
		mostraTab($(e).data('tab'));
	});
}

function logout() {
	// TODO: svuota cookies
	$.jStorage.flush();
	window.location = '/?logout';
}

function client_refreshList() {
	DEBUG && console.log('%', 'Tag list requested');
	client.refreshList();
}

function client_receive(important, author, reply, tags, body, date) {
	DEBUG && console.log('<', important, author, reply, tags, body, date);
	storico_aggiungi_msg(important, reply, date, tags, author, body);
}

function client_updateIdentity(identity) {
	DEBUG && console.log('* Identity: ', identity);
	$("#modulo-msg-txt").attr('maxlength', identity.max_length);
	if (identity.hasOwnProperty('nickname') && identity.nickname != null  && identity.nickname != identity.realname){
		$("#username").text(identity.nickname);
		$("#modulo-msg-txt").removeClass('form-messaggio-autentico');
		$("#modulo-msg-txt").addClass('form-messaggio-anonimo');
	}
	else {
		$("#username").text(identity.realname);
		$("#modulo-msg-txt").removeClass('form-messaggio-anonimo');
		$("#modulo-msg-txt").addClass('form-messaggio-autentico');
	}
}

function client_disconnect() {
	DEBUG && console.log('@ Disconnect', new Date());
	storico_aggiungi_sys('<i class="fa fa-warning"></i> La connessione &egrave; stata persa! Riconnessione...', 3);
}

function client_reconnect() {
	DEBUG && console.log('@ Connected!', new Date());
	storico_aggiungi_sys('<i class="fa fa-rss"></i> Connessione ristabilita!', 1);
}

function client_notification(type, body) {
	DEBUG && console.log('i', type, body);
	storico_aggiungi_sys('<i class="fa fa-info-circle"></i> ' + body, type);
}


function client_subscribe(tag) {
	DEBUG && console.log('+', tag);
	storico_aggiungi_join(tag);
	ui_postjoin(tag);
}

function client_unsubscribe(tag) {
	DEBUG && console.log('-', tag);
	storico_aggiungi_leave(tag);
	ui_postquit(tag);
}

function client_updateCount(count) {
	DEBUG && console.log('u', count);
	$("#utenti-online").text(count);
}

function client_updateList(list) {
	DEBUG && console.log('l', list);
	var tags = client.getTags();
	for ( var i in tags ) {
		if ( !list.hasOwnProperty(tags[i]) )
			list[tags[i]] = "1";
	}
	tagList = ui_prepare_list(list);
	list = client_sortList(list);
	trending_render(list);
}

function client_updateTags(tags) {
	DEBUG && console.log('t', tags);
	subscribed_render(tags);
	$("#tag-count").text(tags.length); // TODO: da cambiare
	$.jStorage.set("tags", tags);
}

function client_connect() {
	$.jStorage.set("login", (new Date));
	var tags = $.jStorage.get("tags", []);
	for (var i in tags) {
		ui_join(tags[i]);
	}
	var nick = $.jStorage.get("nick", false);
	if ( nick ) {
		client.requestNickname(nick);
	}
	var tags_selected = $.jStorage.get("tags-selected");
	for ( i in tags_selected ) {
		$("#modulo-msg-tags").tagit("createTag", "#" + tags_selected[i]);
	}
	refreshVieport();
	ui_notifica_audio_inizializza();
}

function client_sortList(list) {
	if ( $("[name=ordinamento]:checked").data("valore") == "popolazione" ) {
		var sf = function(a, b){
	    	return b.num.localeCompare(a.num);
		};
	} else {
		var sf = function(a, b){
	    	return a.tag.localeCompare(b.tag);
		};
	}
	var r = [];
	for (var i in list) {
		r.push({tag: i, num: list[i]});
	}
	r.sort(sf);
	return r;
}

function renderAutore(username) {
	username = username.trim().split("@");
	if ( username.length == 1 ) {
		username.push("anonymous");
	}
	return " <img src='/id/" + username[1] + ".svg' alt='Avatar di " + username[0] + "' class='id-avatar' />" + username[0];
}

function storico_aggiungi_raw(data, tags, autore, messaggio, importante, risposta) {
	var rid = Math.floor( Math.random() * 9999999 );
	var str = "";

	var classi_messaggio = [];
	var anonimo = autore.indexOf('@') == -1

	if (client.identity.nickname == autore || client.identity.realname == autore)
		classi_messaggio.push('messaggio-mio');
	if (anonimo)
		classi_messaggio.push('messaggio-anonimo');
	if (importante)
		classi_messaggio.push('messaggio-importante');
	// if (risposta)
	// 	classi_messaggio.push('messaggio-risposta');

	tagRegex = new RegExp("@(" + $("#username").text() + "): ");
    messaggio = messaggio.replace(tagRegex, 
    	'<span class="msg-tag msg-tag-io">@<span class="autore-to-render">$1</a></span>: ');

	tagRegex = /@([a-zA-Z0-9._-]+(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})?): /g;
    messaggio = messaggio.replace(tagRegex,
    	'<span class="msg-tag " onclick="ui_autore(\'$1\');">@<span class="autore-to-render">$1</span></span>: ');

	str += "<tr data-mt='msg' data-rid='" + rid + "' class='"+ classi_messaggio.join(' ') +"'>\n";
	str += "  <td class='messaggio'>";
	str += "  <div class='autore grassetto cliccami' ";
	str +=   "onclick='ui_autore(\"" + autore + "\");'>";
	str +=     renderAutore(autore);
	str += " </div>\n";

	str += "  <div class='tags'> <i>ha scritto " +
		 (anonimo? 	'anonimamente '		:"") + 
		 (tags? 	"su</i> " + tags 	:"in privato</i>") + "</div>\n";
	str += "   <div class='messaggio'>";
	str +=     messaggio;
	str += "   </div>\n";
	str += "  </td>\n";

	str += "  <td class='data-reply'><div>";
	str += "  " + data + "<br />\n";

	if ( autore != $("#username").text() ) {
		str +=   "<div class='btn-group btn-group-xs pull-right'>";
		str +=     "<a class='btn btn-default'";
		str +=     " onclick='ui_reply(\"" + rid + "\", \"" + autore + "\");'"
		str +=     " title='Rispondi a " + autore + " pubblicamente'>";
		str +=       "<i class='fa fa-reply'></i>";
		str +=     "</a>";
		str +=     "<a class='btn btn-default'";
		str +=     " onclick='ui_privato(\"" + rid + "\", \"" + autore + "\");'"
		str +=     " title='Rispondi a " + autore + " privatamente'>";
		str +=       "<i class='fa fa-user'></i>";
		str +=     "</a>";
		str +=   "</div>";
	}

	str += "  </div></td>\n";
	str += "</tr>\n";

	storico_scorri_fondo();
	$("#storico tbody").append($(str));
	$(".autore-to-render").each( function(i, e) {
		$(e).html(renderAutore($(e).html()));
		$(e).removeClass('autore-to-render');
	});
	return rid;
}

function storico_aggiungi_sys(testo, livello, categoria) {

	/*
	>                   <tr data-mt="sys" data-categoria="join" class="success">
>                     <td class="messaggio"><div class="messaggio" colspan="3"><i class="fa fa-check"></i> Hai iniziato a seguire <span class="tag-span label label-primary">#primo</span></div></td>
>                     <td class="data-reply">7:11 PM</td>
>                   </tr>

*/
	if (livello === undefined) {
		livello = 0;
	}
	if ( categoria === undefined ) {
		categoria = 'g';
	}
	var str = "<tr data-mt='sys' data-categoria='" + categoria + "' class='" + livelli[livello] + "'>\n";
	str += " <td class='messaggio'>\n";
	str +=    testo;
	str += " </td>\n";
	str += " <td class='data-reply'><div>" + (new Date()).ottieniTempo() + "</div></td>";
	str += "</tr>\n";
	storico_scorri_fondo();
	$("#storico tbody").append($(str));
}


function storico_aggiungi_join(tag) {
	// l'ultimo messaggio e' un join anch'esso?
	if ( $("#storico tr:last").data('categoria') == 'join' ) {
		// yes, allora appendi il tag
		$("#storico tr:last td:first").append(render_tag(tag));
	} else {
		// altrimenti, nuova riga :)
		storico_aggiungi_sys('<i class="fa fa-check"></i> Hai iniziato a seguire ' + render_tag(tag), 1, 'join');
	}
}

function storico_aggiungi_leave(tag) {
	// l'ultimo messaggio e' un join anch'esso?
	if ( $("#storico tr:last").data('categoria') == 'leave' ) {
		// yes, allora appendi il tag
		$("#storico tr:last td:first").append(render_tag(tag));
	} else {
		// altrimenti, nuova riga :)
		storico_aggiungi_sys('<i class="fa fa-times"></i> Hai smesso di seguire ' + render_tag(tag), 1, 'leave');
	}
}


function storico_aggiungi_msg(importante, risposta, data, tags, autore, messaggio, muto) {
	data = data.ottieniTempo();
	messaggio = $("<div />").text(messaggio).html();
	tags = render_tags(tags);

	// Determino il tipo e notifico
	var tipo = importante ? 'importante' : 'normale';
	DEBUG && console.log('£ notifica generata tipo: ', tipo);
	ui_notifica_audio(tipo);

	if ( risposta ) {
		messaggio = "@" + risposta + ": " + messaggio;
	}
	return storico_aggiungi_raw(data, tags, autore, messaggio, importante, risposta);
}

function storico_scorri_fondo() {
	var LIMITE = 100;
	if ( $("body")[0].scrollHeight - ($("body").scrollTop()+ $(window).height()) > LIMITE ) {
		// Non scrollare se al momento la schermata non e' scrollata al massimo...
		return;
	}
  	$("html, body").animate({ scrollTop: $(document).height() }, "slow");
}

function storico_elimina(rid) {
	$("[data-rid=" + rid + "]").remove();
}

function storico_errore(rid, msg) {
	var originale = $("[data-rid=" + rid + "] .messaggio").html();
	$("[data-rid=" + rid + "] .messaggio").html(
		"<span class='text-muted'>" + originale + "</span><br />" +
		"<span class='text-danger'>" +
		 "<i class='fa fa-warning'></i> " +
		 "<strong>Impossibile inviare il messaggio</strong>:<br />" + msg +
		"</span>"
	);
}

function trending_render(tags) {
	var str = "";
	for ( var i in tags ) {
		var classi_li = '';
		if ( subscribedTo(tags[i].tag) ) {
			classi_li = 'tag-laterale-si';
		} else {
			classi_li = 'tag-laterale-no';
		}
		str += "<li class='allinea-sinistra tag-laterale " + classi_li + "'><a onclick='ui_clicktag(this,\"" + tags[i].tag + "\");'>";
		str +=   render_tag(tags[i].tag, false);
		str += " <span class='badge pull-right'>" + tags[i].num + "</span>";
		str += "</a></li>\n";
	}
	$("#trending-tags").html(str);
}

function subscribed_render(tags) {
	var str = "";
	for ( var i in tags ) {
		//str += "<li class='allinea-sinistra'><a>";
		//str += " <a class='btn btn-danger btn-xs'><i class='fa fa-times'></i></a> "
		str +=   render_tag(tags[i]);
		//str += "</a></li>\n";
	}
	// $("#subscribed-tags").html(str);
}

function storico_render_tags(tags) {
	return render_tags(tags);
}

function ui_clicktag(obj, tag) {
	DEBUG && console.log('^ click-tag:', tag, $(obj).data('tid'));
	if ( subscribedTo(tag) ) {
		ui_quit(tag, obj);
	} else {
		ui_join(tag, obj);
	}
}

function ui_trending_join(obj, tag) {
	ui_join(tag, obj);
}

function subscribedTo(tag) {
	return (client.getTags().indexOf(tag) !== -1);
}

function ui_reply(rid, autore) {
	// Rimuovi tutti i tag e segui quelli del messaggio
	$("#modulo-msg-tags").tagit("removeAll");
	$("[data-rid=" + rid + "] [data-tag]").each( function(i, e) {
		$("#modulo-msg-tags").tagit("createTag", "#" + $(e).data('tag'));
	});
	if ( rid !== undefined ) {
		ui_autore(autore, true);
	} else {
		ui_autore(false, true);
	}
}

function ui_privato(rid, autore) {
	// Rimuovi tutti i tag
	$("#modulo-msg-tags").tagit("removeAll");
	if ( rid !== undefined ) {
		ui_autore(autore, false);
	} else {
		ui_autore(false, false);
	}
}

function ui_autore(autore, pubblico) {
	if ( pubblico == undefined ) {
		var pubblico = true;
	}
	if ( autore ) {
		$("#inRispostaA").removeClass('nascosto').show();
		$("#inRispostaA").data('utente', autore);
		$("#inRispostaA-utente").html(renderAutore(autore));
		$(".inRispostaA-tipo").hide();
		if ( pubblico ) {
			$("#inRispostaA-pubblico").show();
			$("#contenitore-modulo-msg-tags").show();
		} else {
			$("#inRispostaA-privato").show();
			$("#contenitore-modulo-msg-tags").hide();
		}
	} else {
		$("#inRispostaA").hide();
		$("#inRispostaA").data('utente', false);
		$("#inRispostaA-utente").html('nessuno');
		$("#contenitore-modulo-msg-tags").show();
	}
}

function ui_join(tag, _obj, silenzioso) {
	if ( silenzioso == undefined ) {
		client.subscribe(tag, function() { }, ui_join_errore);
	} else {
		client.subscribe(tag, function() { }, function() { })
	}
}

function ui_quit(tag, _obj) {
	client.unsubscribe(tag, function() { });
}

function ui_postjoin(tag) {
	DEBUG && console.log('x', 'post-join', tag);
	$("[data-tag=" + tag + "]").filter('.tag-span').removeClass('label-default').addClass('label-primary');
	$("[data-tag=" + tag + "]").parents('li').removeClass('tag-laterale-no').addClass('tag-laterale-si');
}

function ui_postquit(tag) {
	DEBUG && console.log('x', 'post-quit', tag);
	$("[data-tag=" + tag + "]").filter('.tag-span').removeClass('label-primary').addClass('label-default');
	$("[data-tag=" + tag + "]").parents('li').removeClass('tag-laterale-si').addClass('tag-laterale-no');
}

/**
 * Renderizza piu' tag
 *
 * @param array tag 		La lista di tag da renderizzare
 * @param bool cliccabile	I tag devono essere cliccabili? Default: true
 * @return string 			I vari tag renderizzati
 */
function render_tags(tags, cliccabile) {
	// tags = tags.sort(); -- Non ordinare i tag.
	var str = "";
	for (var i in tags) {
		str += render_tag(tags[i], cliccabile);
	}
	return str;
}

/**
 * Renderizza un tag
 *
 * @param string tag 		Il tag da renderizzare
 * @param bool cliccabile	Il tag deve essere cliccabile? Default: true
 * @return string 			Il tag renderizzato
 */
function render_tag(tag, cliccabile) {
	if (cliccabile == undefined || cliccabile == true) {
		on_click = "onclick='ui_clicktag(this, \"" + tag + "\");'";
	} else {
		on_click = "";
	}
	var tid = Math.floor( Math.random() * 100000 );
	var str = "";
	str += "<span data-tag='" + tag + "' data-tid='" + tid + "' " + on_click + " class='  ";
	str += "tag-span label ";
	if ( subscribedTo(tag) ) {
		str += "label-primary ";
	} else {
		str += "label-default ";
	}
	str += "'>#" + tag + "</span> ";
	return str;
}

function ui_hidepopover(obj) {
	var tag = $(obj).data('tohide');
	$("[data-tag=" + tag + "]").popover('hide');
	ltp=null;
}

/**
 * Eventi al caricamento della pagina
 */
$(document).ready(function() {
	mostraComponente("accedi");
	$(".barra-laterale li").attr('disabled', 'disabled').addClass('disabled');
	$("#modulo-msg").submit( ui_invia );
	$("#form-tag").submit( ui_tag );
	$(".b-ordinamento").click ( client_refreshList );
	$('body').popover({
        selector: '.tag-cliccabile'
    });
    $("#username").popover();
    $("#btn-cambia-nick").click( ui_cambia_nick );
    $("#btn-in-risposta-a-nessuno").click ( function() {
    	ui_autore();
    } );
    $("[data-toggle=tooltip]").each( function(i, e) {
    	$(e).tooltip();
    });
    $("#cambia-nick-input").keyup( ui_cambia_nick_keyup );
    $("#cambia-nick-form").submit ( ui_cambia_nick_submit );
    $("#usa-identita-originale").click ( ui_cambia_nick_originale );
    $("#modulo-msg-tags").tagit( tags_impostazioni );
    $("#notifica-audio-pulsante").click(ui_notifica_audio_click);
    $("[data-notifiche]").each ( function(i, e) {
    	$(e).click(function() {
    		ui_notifica_audio_click($(e).data('notifiche'));
    	});
    })
    $(window).resize(refreshVieport);
});

function ui_cambia_nick() {
	$("#cambia-nick-conferma").attr('disabled', 'disabled').addClass('disabled');
	$("#cambia-nick-msgs p").hide();
	$('#cambia-nick').modal('show');
	if ( $("#username").text().indexOf("@") == -1 ) {
		$("#cambia-nick-input").val($("#username").text());
	} else {
		$("#cambia-nick-input").val('');
	}
	$("#cambia-nick-input").select().focus();
}

var ltimer = false;
function ui_cambia_nick_keyup() {
	if ( ltimer !== false ) {
		clearTimeout(ltimer);
		ltimer = false;
	}
	var n = $("#cambia-nick-input").val();
	$(".nickname-scelto").text(n);
	$("#cambia-nick-conferma").attr('disabled', 'disabled').addClass('disabled');
	$("#cambia-nick-msgs p").hide();
	if ( !/^[a-zA-Z0-9\-]{6,20}$/.test(n) ) {
		$("#cambia-nick-msg-nv").show();
		return;
	}
	ltimer = setTimeout(ui_cambia_nick_controlla, 1000);
	$("#cambia-nick-msg-ip").show();
}

function ui_cambia_nick_controlla() {
	var n = $("#cambia-nick-input").val();
	client.testNickname(n, function(r) {
		$("#cambia-nick-msgs p").hide();
		$(".nickname-scelto").text(n);
		if ( r ) {
			$("#cambia-nick-msg-ok").show();
			$("#cambia-nick-conferma").removeAttr('disabled').removeClass('disabled');
		} else {
			$("#cambia-nick-msg-no").show();
		}
	});
}

function ui_cambia_nick_submit() {
	var n = $("#cambia-nick-input").val();
	client.requestNickname(n);
	$('#cambia-nick').modal('hide');
	return false;
}

function ui_cambia_nick_originale() {
	client.requestNickname(null);
	$.jStorage.set("nick", false);
	$('#cambia-nick').modal('hide');
}

function ui_tag_selezionati() {
	var r = [];
	$("[name=tags]").each(function(i,e){
		r.push($(e).val().substr(1));
	});
	return r;
}
function ui_invia () {

	var reply = $("#inRispostaA").data('utente') ? $("#inRispostaA").data('utente') : null;
	var msg  = $("#modulo-msg-txt").val();
	
	var tags = ui_tag_selezionati();
	if ( !reply && tags.length == 0 ) {
		$("#modulo-msg-tags").popover('show');
		setTimeout(function(){
			$("#modulo-msg-tags").popover('hide');
		}, 5000);
		return false;
	}

	tagRegex = /^@([a-zA-Z0-9._-]+(@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})?): (.*)$/;
	if ( tagRegex.test(msg) ) {
    	reply = msg.match(tagRegex)[1];
    	msg = msg.replace(tagRegex, '$3');
	}

	var rid  = storico_aggiungi_msg(0, reply, (new Date()), tags, $("#username").text(), msg, true);

	$("#modulo-msg-txt").val('').focus().select();
	client.send(tags, msg, reply, function (mostra) {
		if (!mostra) {
			storico_elimina(rid);
		}
		if ( tags[0] && !subscribedTo(tags[0]) ) {
			ui_join(tags[0], null, true);
		}
	},
	function(testo) {
		storico_errore(rid, testo);
	}); // TODO: cambiare tags

	return false;
}

function ui_tag () {
	var tag = $("#form-tag-txt").val();
	$("#form-tag-txt").val('').focus().select();

	client.subscribe(tag, function() {
		setTimeout(client_refreshList, 100);
	}, ui_join_errore);

	return false;
}

function ui_join_errore(r) {
	if ( r == 4 ) {
		alert("Impossibile seguire questo tag. Limite massimo superato.")
	} else {
		alert("Impossibile seguire questo tag. Codice errore: " + r);
	}
}

function ui_tag_limit_hit() {
	alert("Spiacente, non e' possibile inviare un messaggio con piu' di 3 tag.");
}

function ui_tag_add_before(e, u) {
	if ( !u.tagLabel.match(/^[#]?[a-zA-Z0-9\-]{2,20}$/) ) {
		alert("Il nome del tag non e' valido.");
		return false;
	}
	if ( u.tagLabel.substr(0,1) != '#' ) {
		$("#modulo-msg-tags").tagit("createTag", "#" + u.tagLabel);
		return false;
	}
}

function ui_tag_add_after() {
	$.jStorage.set("tags-selected", ui_tag_selezionati());
}

function ui_tag_remove_before(){

}

function ui_tag_remove_after() {

}

function ui_prepare_list(obj) {
	var r = [];
	for (i in obj) {
		r.push({
			label: "#" + i,
			value: i
		});
	}
	return r;
}

function ui_tag_source(request, response) {
	var MAX = 5;
	var c = 0;
	var term;
	if ( request.term.substr(0,1) == '#' ) {
		term = request.term;
	} else {
		term = '#' + request.term;
	}
	var r = [];
	for (i in tagList) {
		if ( tagList[i].label.lastIndexOf(term, 0) === 0 ) {
			r.push(tagList[i]);
		}
		c++;
		if (c >= MAX)
			break;
	}
	response(r);
}

function ui_notifica_audio(tipo) {
	if ( tipo === undefined ) {
		tipo = 'normale';
	}
	var audio = $.jStorage.get("audio", LIV_NOTIFICA_DEFAULT);
	if (livelli_notifica[audio].indexOf(tipo) !== -1) {
		$("#notifica-" + tipo + "-player")[0].load();
		$("#notifica-" + tipo + "-player")[0].play();
		DEBUG && console.log('£ notifica ' + tipo + ' presente in impostazione ' + audio + ': riproduco');
	} else {
		DEBUG && console.log('£ notifica ' + tipo + ' NON presente in impostazione ' + audio + ': salto');
	}
}

function ui_notifica_audio_inizializza() {
	ui_notifica_audio_click($.jStorage.get("audio", LIV_NOTIFICA_DEFAULT));
	console.log("Inizializzo", $.jStorage.get("audio", LIV_NOTIFICA_DEFAULT));
}

function ui_notifica_audio_click(tipo) {
	$.jStorage.set("audio", tipo);
	$("#notifica-attuale").html($("[data-notifiche=" + tipo + "]").html());
}