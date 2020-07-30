var express = require("express");
var bodyParser = require('body-parser');
var randomstring = require("randomstring");
var cons = require('consolidate');
var __ = require('underscore');
__.string = require('underscore.string');
const mongoose = require('mongoose');
var randtoken = require('rand-token');
var jwt = require('jsonwebtoken');

require('dotenv').config({path: './config/config.env'});

var userService= require("./mongo/service/mongoUser");
var clientService = require("./mongo/service/mongoClient");
var tokenService = require("./mongo/service/mongoToken");
var tokenModel = require('./mongo/model/token');

var app = express();
//parse the response
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // support form-encoded bodies (for the token endpoint)

//connection mongo db
const db = mongoose.connect('mongodb://'+process.env.USERMONGO+':'+process.env.PASSWORDMONGO+'@'+process.env.HOSTMONGO+'/'+process.env.DATABASE, { useNewUrlParser: true,  useUnifiedTopology: true  })
    .then(() => console.log('Connect to MongoDB..'))
    .catch(err => console.error('Could not connect to MongoDB..', err))

app.post('/oauth/token',async  function(req, res) {
    let clientObject = decodeClientCredentials(req);
    let scopeBody = req.body.scope ?  req.body.scope.split(' ') : undefined;
    if(clientObject.id){
        let cliente = await clientService.getClient(clientObject.id);
                if(cliente){
                    let clientSecret='';
                    if(cliente.clientSecret){
                        clientSecret = cliente.clientSecret;
                    }
                    if(clientObject.secret === clientSecret){
                    if (req.body.grant_type == 'password'){
                        let username = req.body.username;
                        let password = req.body.password;

                        if (username && password) {
                            let user = await userService.getUser(username, password);
                            if (user) {
                                let scopes= '';
                                let arrayUserScope= user.scope;
                                if(scopeBody != undefined){
                                    scopeBody.forEach(function(entry) {
                                       if(arrayUserScope.includes(entry)){
                                           scopes = scopes + entry + ' ';
                                       }
                                    });
                                }

                                let tokenResponse = createToken(clientObject.id, user.username, scopes);
                                let tokenInstance = new tokenModel(tokenResponse);
                                tokenInstance.save(function (err) {
                                    if (err) return handleError(err);
                                    delete tokenResponse.client;
                                    delete tokenResponse.user;
                                    delete tokenResponse.refresh_token_expires_in_date;
                                    res.status(200).json(tokenResponse);
                                });
                            } else {
                                return res.status(401).json({code: '401' ,message: 'Error en las credenciales del usuario, verificar los datos '});
                            }
                        }
                    } else if (req.body.grant_type === 'refresh_token') {
                        // refresh token logic
                        let refresh = req.body.refresh_token;
                        if (refresh) {
                            let token = await tokenService.getTokenByRefresh(refresh);
                            if (token) {
                                if (clientObject.id === token.client.clientId) {
                                    var now = Math.floor(Date.now() / 1000);
                                    if (token.refresh_token_expires_in_date >= now) {
                                        let user = await userService.getUserByUsername(token.user.username);
                                        let scopes= '';
                                        let arrayUserScope= user.scope;
                                        if(scopeBody != undefined){
                                            scopeBody.forEach(function(entry) {
                                                if(arrayUserScope.includes(entry)){
                                                    scopes = scopes + entry + ' ';
                                                }
                                            });
                                        }

                                        let tokenResponse = createToken(clientObject.id, token.user.username, scopes);
                                        let tokenInstance = new tokenModel(tokenResponse);
                                        tokenInstance.save(async function (err) {
                                            if (err) return handleError(err);
                                            delete tokenResponse.client;
                                            delete tokenResponse.user;
                                            delete tokenResponse.refresh_token_expires_in_date;
                                            let valueDelete = await tokenService.removeTokenByRefresh(refresh);
                                            if (valueDelete.ok == 1 && valueDelete.deletedCount == 1) {
                                                await res.status(200).json(tokenResponse);
                                            }
                                        });
                                    } else {
                                        let valueDelete = await tokenService.removeTokenByRefresh(refresh);
                                        if (valueDelete.ok == 1 && valueDelete.deletedCount == 1) {
                                            console.log("token removed");
                                        }
                                        return res.status(401).json({code: '401' ,message: 'El refresh token ha expirado'});
                                    }
                                } else {
                                    return res.status(401).json({code: '401' , message: 'Clientid invalido, revise el campo '});
                                }
                            } else {
                                return res.status(401).json({code: '401' ,message: 'El refresh token es invalido, revisar sintaxis '});
                            }
                        } else {
                            return res.status(401).json({code: '401' ,message: 'El refresh token falta en la solicitud, verificar campo '});
                        }
                    } else {
                        return res.status(401).json({code: '401' , message: 'Grant type no soportado'});
                    }
                }else{
                        return res.status(401).json({code: '401' ,message: 'Error en el la contraseña del cliente'});
                    }
                }else{
                    return res.status(401).json({code: '401',  message: 'Credenciales del cliente incorrectas' });
                }
    }else{
        return res.status(401).json({code: '401',  message: 'Parametros de cliente mandados incorrectamente ' });
    }
});

function createToken(clientId,username, scope){
    let expiresin = Number(process.env.EXT); //se obtienen los segundos de vida del token

    let access_token = jwt.sign({
        username: username,
        jti: randomstring.generate(8),
        scope : scope
    },process.env.SEED,{expiresIn : expiresin }); //se genera el JWT y se se agregan a su payload algunos atributos que consideramos se utilizaran en el API

    let tokenResponse = {
        access_token: access_token,
        token_type: 'bearer',
        expires_in: expiresin, //value in seconds
        refreshToken: randtoken.uid(256),
        refresh_token_expires_in: Number(process.env.RTEXT) , //value in seconds
        refresh_token_expires_in_date: Math.floor(Date.now() / 1000) + Number(process.env.RTEXT) ,
        scope: scope,
        client: {clientId: clientId},
        user: {username : username}
    }
    return tokenResponse;
}

let decodeClientCredentials = function(req) {

    let clientId;
    let clientSecret ='';

    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        //check the body
        if(req.body.client_id){
            clientId = req.body.client_id;
            if(req.body.client_secret){
                clientSecret = req.body.client_secret;
            }
        }
    }else{
        const base64Credentials =  req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        [clientId, clientSecret] = credentials.split(':');
    }

    return { id: clientId, secret: clientSecret };
};

let server = app.listen(process.env.PORTSERVER, function () {
    let host = server.address().address;
    let port = server.address().port;
    console.log(' Authorization Server is listening at http://%s:%s', host, port);
});

