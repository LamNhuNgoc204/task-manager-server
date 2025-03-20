const User = require("./userModel");
const Task = require("./taskModel");

const { PubSub } = require("graphql-subscriptions");

const pubsub = new PubSub();

module.exports = { User, Task };
