const userTypeDefs = `#graphql
  scalar Date

  type User {
    id: ID!
    avatar: String
    name: String!
    email: String!
    password: String
    googleId: String
    facebookId: String
    tasks: [Task]
    updatedAt: Date
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    users: [User]
    user(id: ID!): User 
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): User
    loginWithEmail(email: String!, password: String!): AuthPayload
    loginWithGoogle(googleId: String!, name: String!, email: String!, avatar: String): User
    loginWithFacebook(facebookId: String!, name: String!, email: String, avatar: String): AuthPayload
    updateInfo(id: String!, name: String,email: String, password: String): User
    resetPassword(email: String!): Boolean
  }
`;

module.exports = userTypeDefs;
