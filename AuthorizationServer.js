var express = require("express");
var bodyParser = require('body-parser');
var randomstring = require("randomstring");
var cons = require('consolidate');
var querystring = require('querystring');
var __ = require('underscore');
__.string = require('underscore.string');
const mongoose = require('mongoose');
var randtoken = require('rand-token');
var jwt = require('jsonwebtoken');

require('dotenv').config({path: './config/config.env'});
console.log(process.env.SEED);

var userService= require("./mongoUser");
var clientService = require("./mongoClient");
var tokenService = require("./mongoToken");
var tokenModel = require('./mongo/model/token');

var app = express();
//parse the response
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // support form-encoded bodies (for the token endpoint)

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', 'files/authorizationServer');
app.set('json spaces', 4);

//connection mongo db
const db = mongoose.connect('mongodb://'+process.env.USERMONGO+':'+process.env.PASSWORDMONGO+'@'+process.env.HOSTMONGO+'/'+process.env.DATABASE, { useNewUrlParser: true,  useUnifiedTopology: true  })
    .then(() => console.log('Connect to MongoDB..'))
    .catch(err => console.error('Could not connect to MongoDB..', err))




app.post('/oauth/token',async  function(req, res) {
    let clientObject = decodeClientCredentials(req);
    let scopeBody = req.body.scope ?  req.body.scope.split(' ') : undefined;
    if(clientObject.id){
        let cliente = await clientService.getClient(clientObject.id);
        console.log(cliente);
                if(cliente){
                    if(clientObject.secret === cliente.clientSecret){
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
                                return res.status(401).json({message: 'Invalid Authentication Credentials user'});
                            }
                        }
                    } else if (req.body.grant_type === 'refresh_token') {
                        // refresh token logic
                        let refresh = req.body.refresh_token;
                        if (refresh) {
                            let token = await tokenService.getTokenByRefresh(refresh);
                            if (token) {
                                console.log(token);
                                if (clientObject.id === token.client.clientId) {
                                    var now = Math.floor(Date.now() / 1000);
                                    if (token.refresh_token_expires_in_date >= now) {
                                        console.log('pase');
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
                                        return res.status(401).json({message: 'Invalid token '});
                                    }
                                } else {
                                    return res.status(401).json({message: 'compromised token by client Id'});
                                }
                            } else {
                                return res.status(401).json({message: 'Error refreshToken'});
                            }
                        } else {
                            return res.status(401).json({message: 'Invalid param refresh'});
                        }
                    } else {
                        return res.status(401).json({message: 'unsupported_response_type'});
                    }
                }else{
                        return res.status(401).json({message: 'client error auth'});
                    }
                }else{
                    return res.status(401).json({ message: 'Invalid Authentication Credentials Client' });
                }
    }
});

function createToken(clientId,username, scope){
    let expiresin = Number(process.env.EXT);

    let access_token = jwt.sign({
        username: username,
        jti: randomstring.generate(8),
        scope : scope
    },process.env.SEED,{expiresIn : expiresin });

    var tokenResponse = {
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

var decodeClientCredentials = function(req) {

    var clientId;
    var clientSecret ='';

    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        //check the body
        if(req.body.username && req.body.password){
            clientId = req.body.client_Id;
            clientSecret = req.body.client_secret;
        }
    }else{
        const base64Credentials =  req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        [clientId, clientSecret] = credentials.split(':');
    }

    return { id: clientId, secret: clientSecret };
};

var getScopesFromForm = function(body) {
    return __.filter(__.keys(body), function(s) { return __.string.startsWith(s, 'scope'); })
        .map(function(s) { return s.slice('scope'.length); });
};


var server = app.listen(9003, 'localhost', function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log(' Authorization Server is listening at http://%s:%s', host, port);
});

