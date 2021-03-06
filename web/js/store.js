var RECAM = RECAM || {};

(function() {

var Utils = RECAM.Utils;
var mask = Utils.mask;
var valida = Utils.valida;
var services = RECAM.Services;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var query = Utils.parseQuery(location.search);

function validaObrigatoriedadeSenha(campo, context) {
	if (!valida.trimValor(campo)) {
		var rede = context.getters.sessionRedeUsuario;
		return { falta: !Boolean(rede) };
	}
}
function processMeetingLocationName(name) {
	name = name.split(/\s*-\s*/g);
	var nameParts = name.length;
	if (nameParts >= 4) {
		var reCityState = /^\s*(\S.*?)\s*,?\s*(\w{2})\s*$/;
		var cityState = name[nameParts-1].match(reCityState);
		if (cityState) {
			var reRepeat = new RegExp('^\\s*'+cityState[1]+'\\s*,?\\s*'+cityState[2]+'\\s+\\(?\\s*'+name[nameParts-2]+'\\s*\\)?\\s*$');
			if (reRepeat.test(name[nameParts-3])) {
				name.splice(nameParts-3, 1);
			}
		}
	}
	return name.join(' - ');
}

var state = {
	baseUrl: (RECAM.BaseUrl || ''),
	query: query,
	pageScroll: [0, 0],
	screen: null,
	session: null,
	formLogin: {
		login: {
			nome: 'login',
			rotulo: 'E-mail',
			tipo: 'email',
			valor: '',
			erro: null,
			falta: false,
			valida: [
				valida.naoVazio,
				valida.email,
			]
		},
		senha: {
			nome: 'senha',
			rotulo: 'Senha',
			tipo: 'password',
			valor: '',
			erro: null,
			falta: false,
			valida: [
				valida.naoVazio
			]
		}
	},
	formLoginErro: null,
	formLoginErroTipo: null,
	formUsuarioCadastrar: {
		nome: {
			nome: 'nome',
			rotulo: 'Nome',
			tipo: 'text',
			valor: '',
			erro: null,
			falta: false,
			valida: [
				valida.naoVazio
			]
		},
		email: {
			nome: 'email',
			rotulo: 'E-mail',
			tipo: 'email',
			valor: '',
			erro: null,
			falta: false,
			valida: [
				valida.naoVazio,
				valida.email,
			]
		},
		senha: {
			nome: 'senha',
			rotulo: 'Senha',
			tipo: 'password',
			valor: '',
			erro: null,
			falta: false,
			valida: [
				validaObrigatoriedadeSenha
			]
		},
		senhaConfirmacao: {
			nome: 'senha-confirmacao',
			rotulo: 'Confirme a senha',
			tipo: 'password',
			valor: '',
			erro: null,
			falta: false,
			valida: [
				validaObrigatoriedadeSenha,
				function(campo, context) {
					var campoSenha = context.state.formUsuarioCadastrar.senha;
					if (campo.valor !== campoSenha.valor) {
						return {
							erro: 'Erro na confirmação'
						};
					}
				}
			]
		}
	},
	formUsuarioCadastrarErro: null,
	serviceGetLogin: null,
	serviceGetLoginLoading: false,
	serviceGetLoginError: null,
	servicePostLogin: null,
	servicePostLoginLoading: false,
	servicePostLoginError: null,
	serviceLogout: null,
	serviceLogoutLoading: false,
	serviceLogoutError: null,
	serviceUsuarioCadastrar: null,
	serviceUsuarioCadastrarLoading: false,
	serviceUsuarioCadastrarError: null,
	serviceUsuarioLocalReuniao: null,
	serviceUsuarioLocalReuniaoLoading: false,
	serviceUsuarioLocalReuniaoError: null
};
var getters = {
	sessionFacebookId: function(state) {
		var session = state.session;
		var facebook = session && session.facebook;
		var user = facebook && facebook.user;
		if (user) {
			return { id: user.id, id_facebook: user.id_facebook };
		}
	},
	sessionGoogleId: function(state) {
		var session = state.session;
		var google = session && session.google;
		var user = google && google.user;
		if (user) {
			return { id: user.id, id_google: user.id_google };
		}
	},
	sessionTwitterId: function(state) {
		var session = state.session;
		var twitter = session && session.twitter;
		var user = twitter && twitter.user;
		if (user) {
			return { id: user.id, id_twitter: user.id_twitter };
		}
	},
	sessionLinkedinId: function(state) {
		var session = state.session;
		var linkedin = session && session.linkedin;
		var user = linkedin && linkedin.user;
		if (user) {
			return { id: user.id, id_linkedin: user.id_linkedin };
		}
	},
	sessionRedeUsuario: function(state) {
		var session = state.session;
		var rede = session && (session.facebook || session.google || session.linkedin || session.twitter);
		var user = rede && rede.user;
		if (user) {
			return {
				nome: user.nome,
				email: user.email,
				url_foto: user.url_foto
			};
		}
	},
	getPostLoginRequestData: function(state, getters) {
		return function() {
			return {
				username: state.formLogin.login.valor,
				password: state.formLogin.senha.valor
			};
		};
	},
	getUsuarioCadastrarRequestData: function(state, getters) {
		return function() {
			var formUC = state.formUsuarioCadastrar;
			return {
				name: formUC.nome.valor,
				email: formUC.email.valor,
				password: formUC.senha.valor,
				password_confirm: formUC.senhaConfirmacao.valor,
				facebook: getters.sessionFacebookId,
				google: getters.sessionGoogleId,
				twitter: getters.sessionTwitterId,
				linkedin: getters.sessionLinkedinId
			};
		};
	},
	processMeetingLocationName: function() {
		return processMeetingLocationName;
	}
};
var actions = {
	sessionUpdateFormCadastrar: function(context) {
		var rede = context.getters.sessionRedeUsuario;
		var form_uc = context.state.formUsuarioCadastrar;
		context.commit('setFormCampoValor', {
			campo: form_uc.nome,
			valor: rede ? rede.nome : ''
		});
		context.commit('setFormCampoValor', {
			campo: form_uc.email,
			valor: rede ? rede.email : ''
		});
		context.commit('setFormCampoValor', {
			campo: form_uc.senha,
			valor: ''
		});
		context.commit('setFormCampoValor', {
			campo: form_uc.senhaConfirmacao,
			valor: ''
		});
		context.commit('setFormCampoRotulo', {
			campo: form_uc.senha,
			rotulo: rede ? 'Senha (opcional)' : 'Senha'
		});
	},
	loadGetLogin: function(context) {
		return new Promise(function(resolve, reject) {
			context.commit('setGetLoginError', null);
			context.commit('setGetLogin', null);
			services.getLogin(
				null,
				function(loading, error, data) {
					context.commit('setGetLoginLoading', loading);
					if (loading) return;
					if (error) {
						context.commit('setGetLoginError', error);
						resolve();
					} else {
						context.commit('setGetLogin', data);
						context.commit('setSession', data.session);
						resolve(context.dispatch('sessionUpdateFormCadastrar'));
					}
				}
			);
		});
	},
	loadPostLogin: function(context) {
		return new Promise(function(resolve, reject) {
			context.commit('setPostLoginError', null);
			context.commit('setPostLogin', null);
			services.postLogin(
				context.getters.getPostLoginRequestData(),
				function(loading, error, data) {
					context.commit('setPostLoginLoading', loading);
					if (loading) return;
					if (error) {
						context.commit('setPostLoginError', error);
						resolve();
					} else {
						context.commit('setPostLogin', data);
						context.commit('setSession', data.session);
						resolve(context.dispatch('sessionUpdateFormCadastrar'));
					}
				}
			);
		});
	},
	loadLogout: function(context) {
		context.commit('setLogoutError', null);
		context.commit('setLogout', null);
		return new Promise(function(resolve, reject) {
			services.logout(
				null,
				function(loading, error, data) {
					context.commit('setLogoutLoading', loading);
					if (loading) return;
					if (error) {
						context.commit('setLogoutError', error);
						resolve();
					} else {
						context.commit('setLogout', data);
						context.commit('setSession', data.session);
						resolve();
					}
				}
			);
		});
	},
	loadUsuarioCadastrar: function(context) {
		return new Promise(function(resolve, reject) {
			context.commit('setUsuarioCadastrarError', null);
			context.commit('setUsuarioCadastrar', null);
			services.usuarioCadastrar(
				context.getters.getUsuarioCadastrarRequestData(),
				function(loading, error, data) {
					context.commit('setUsuarioCadastrarLoading', loading);
					if (loading) return;
					if (error) {
						context.commit('setUsuarioCadastrarError', error);
						resolve();
					} else {
						context.commit('setUsuarioCadastrar', data);
						context.commit('setSession', data.session);
						resolve();
					}
				}
			);
		});
	},
	loadUsuarioLocalReuniao: function(context, payload) {
		context.commit('setUsuarioLocalReuniaoError', null);
		context.commit('setUsuarioLocalReuniao', null);
		return new Promise(function(resolve, reject) {
			services.usuarioLocalReuniao(
				payload,
				function(loading, error, data) {
					context.commit('setUsuarioLocalReuniaoLoading', loading);
					if (loading) return;
					if (error) {
						context.commit('setUsuarioLocalReuniaoError', error);
						resolve();
					} else {
						context.commit('setUsuarioLocalReuniao', data);
						context.commit('setSessionReuniao', data.session.reuniao);
						resolve();
					}
				}
			);
		});
	},
	testaCampo: function(context, campo) {
		var validacao = null;
		if (campo.valida) {
			Utils.forEach(campo.valida, function(fn) {
				validacao = fn(campo, context);
				if (validacao) return this._break;
			});
		}
		return Promise.resolve({
			campo: campo,
			validacao: validacao
		});
	},
	validarCampo: function(context, campo) {
		return new Promise(function(resolve, reject) {
			context.dispatch('testaCampo', campo).then(function(item) {
				context.commit('setFormCampoErro', item);
				resolve(item);
			});
		});
	},
	testaFormGrupo: function(context, grupo) {
		var camposPromise = [];
		Utils.forEachProperty(g, function(campo) {
			camposPromise.push(context.dispatch('testaCampo', campo));
		});
		return Promise.all(camposPromise);
	},
	testaForm: function(context, form) {
		// var grupos = context.state.formGrupos;
		var camposPromise = [];
		// Utils.forEachProperty(grupos, function(g, gkey) {
			Utils.forEachProperty(form, function(campo) {
				camposPromise.push(context.dispatch('testaCampo', campo));
			});
		// });
		return Promise.all(camposPromise);
	},
	validarForm: function(context, form) {
		return context.dispatch('testaForm', form).then(function(lista) {
			var result = {
				erroMensagem: null,
				lista: lista,
				erros: 0,
				faltas: 0
			};
			Utils.forEach(lista, function(item) {
				context.commit('setFormCampoErro', item);
				var v = item.validacao;
				if (!v) return;
				if (v.falta) result.faltas++;
				if (v.erro) result.erros++;
			});
			if (result.erros) {
				result.erroMensagem = 'Um ou mais campos possuem dados inválidos';
			} else if (result.faltas) {
				result.erroMensagem = 'Você precisa preencher todas as informações';
			}
			return result;
		});
	}
};
var mutations = {
	setGetLogin: function(state, data) {
		state.serviceGetLogin = data;
	},
	setGetLoginLoading: function(state, loading) {
		state.serviceGetLoginLoading = loading;
	},
	setGetLoginError: function(state, error) {
		state.serviceGetLoginError = error;
	},
	setPostLogin: function(state, data) {
		state.servicePostLogin = data;
	},
	setPostLoginLoading: function(state, loading) {
		state.servicePostLoginLoading = loading;
	},
	setPostLoginError: function(state, error) {
		state.servicePostLoginError = error;
	},
	setLogout: function(state, data) {
		state.serviceLogout = data;
	},
	setLogoutLoading: function(state, loading) {
		state.serviceLogoutLoading = loading;
	},
	setLogoutError: function(state, error) {
		state.serviceLogoutError = error;
	},
	setUsuarioCadastrar: function(state, data) {
		state.serviceUsuarioCadastrar = data;
	},
	setUsuarioCadastrarLoading: function(state, loading) {
		state.serviceUsuarioCadastrarLoading = loading;
	},
	setUsuarioCadastrarError: function(state, error) {
		state.serviceUsuarioCadastrarError = error;
	},
	setUsuarioLocalReuniao: function(state, data) {
		state.serviceUsuarioLocalReuniao = data;
	},
	setUsuarioLocalReuniaoLoading: function(state, loading) {
		state.serviceUsuarioLocalReuniaoLoading = loading;
	},
	setUsuarioLocalReuniaoError: function(state, error) {
		state.serviceUsuarioLocalReuniaoError = error;
	},
	setPageScroll: function(state, ps) {
		var sps = state.pageScroll;
		if (ps[0] != null && !isNaN(+ps[0])) sps[0] = ps[0];
		if (ps[1] != null && !isNaN(+ps[1])) sps[1] = ps[1];
	},
	setSession: function(state, session) {
		if (session && session.reuniao && session.reuniao.name) {
			session.reuniao.name = processMeetingLocationName(session.reuniao.name);
		}
		state.session = session ? {
			usuario: session.usuario,
			acesso: session.acesso,
			reuniao: session.reuniao,
			username: session.username,
			facebook: session.facebook,
			google: session.google,
			twitter: session.twitter,
			linkedin: session.linkedin
		} : null;
	},
	setSessionReuniao: function(state, reuniao) {
		if (reuniao && reuniao.name) {
			reuniao.name = processMeetingLocationName(reuniao.name);
		}
		state.session.reuniao = reuniao;
	},
	setFormCampoValor: function(state, payload) {
		payload.campo.valor = payload.valor;
	},
	setFormCampoSelecionado: function(state, payload) {
		payload.campo.selecionado = payload.selecionado;
	},
	setFormCampoOpcoes: function(state, payload) {
		payload.campo.opcoes = payload.opcoes;
	},
	setFormCampoRotulo: function(state, payload) {
		payload.campo.rotulo = payload.rotulo;
	},
	setFormCampoErro: function(state, payload) {
		var campo = payload.campo;
		var v = payload.validacao;
		campo.falta = v && v.falta || false;
		campo.erro = v && v.erro || null;
	},
	setFormLoginErro: function(state, erro) {
		state.formLoginErro = erro;
	},
	setFormLoginErroTipo: function(state, tipo) {
		state.formLoginErroTipo = tipo;
	},
	setFormUsuarioCadastrarErro: function(state, erro) {
		state.formUsuarioCadastrarErro = erro;
	}
};

var store = new Vuex.Store({
	state: state,
	getters: getters,
	actions: actions,
	mutations: mutations
});

RECAM.store = store;

})();
