var clientModel = require('./mongo/model/client');

async function getClient (clientId){
    let client = await clientModel.findOne({clientId: clientId}).exec();
    return client;
}

module.exports.getClient = getClient;




