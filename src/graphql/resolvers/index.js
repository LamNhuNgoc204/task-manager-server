//Xu ly va tra ve du lieu cho client
const userResolvers = require("../resolvers/userResolver");
const taskResolvers = require("../resolvers/taskResolver");

const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...taskResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...taskResolvers.Mutation,
  },
};

module.exports = resolvers;
