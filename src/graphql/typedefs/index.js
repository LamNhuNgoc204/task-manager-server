//typeDefs: Dinh nghia schema, luu tru tai lieu docs
//Query: truy van
//Mutation: update, them, xoa du lieu
//Subscription: cap nhat du lieu realtime

const userTypeDefs = require("./userTypeDefs");
const taskTypeDefs = require("./taskTypeDefs");

module.exports = [userTypeDefs, taskTypeDefs];
