
var userModel = require('../model/user');

async  function getUser (username, password){
   return  await userModel.findOne({
        username: username,
        password : password
    }).exec();
}

async  function getUserByUsername (username){
    return  await userModel.findOne({
        username: username
    }).exec();
}

module.exports = {
    getUser,
    getUserByUsername
};
