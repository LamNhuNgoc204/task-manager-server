//(parent, args: tham so truyen vao, context, info)

const { GraphQLScalarType, GraphQLError } = require("graphql");
const { checkEmail, isValidString } = require("../../utils/userValidate");
const {
  hashPassword,
  comparePassword,
  generateRandomPassword,
} = require("../../utils/password");
const { createToken } = require("../../utils/auth");
const { sendEmail } = require("../../utils/sendEmail");

const userResolvers = {
  //Dinh nghia kieu du lieu moi trong graphql
  Date: new GraphQLScalarType({
    name: "Date",
    parseValue(value) {
      return new Date(value);
    },
    serialize(value) {
      return value.toISOString();
    },
  }),

  Query: {
    users: async (parent, args, { models }) => {
      console.log(models);
      await models.User.find();
    },
    user: async (_, { id }, { models }) => {
      return await models.User.findById(id); // Lấy 1 user theo ID
    },
  },

  Mutation: {
    register: async (_, { name, email, password }, { models }) => {
      try {
        if (!email || !name || !password) {
          throw new Error("Please fill in all information.");
        }

        const existingEmail = await models.User.findOne({ email });
        if (existingEmail) {
          throw new Error("Email already exists.");
        }

        if (!checkEmail(email)) {
          throw new Error("Email is not in correct format.");
        }

        if (!isValidString(name)) {
          throw new Error("Please do not use special characters.");
        }

        const hashPass = await hashPassword(password);

        const newUser = new models.User({ name, email, password: hashPass });

        await newUser.save();
        return newUser;
      } catch (error) {
        throw new Error(error.message);
      }
    },

    loginWithEmail: async (_, { email, password }, { models }) => {
      if (!email || !password) {
        throw new Error("Please fill in all information.");
      }

      if (!checkEmail(email)) {
        throw new Error("Email is not in correct format.");
      }

      const user = await models.User.findOne({ email });
      if (!user) {
        throw new Error("Email is not found.");
      }

      if (!(await comparePassword(password, user.password))) {
        throw new Error("Password is wrong.");
      }

      const token = await createToken(user.id);

      return { token, user };
    },

    loginWithGoogle: async (
      parent,
      { googleId, name, email, avatar },
      { models }
    ) => {
      if (!email || !name || !googleId) {
        throw new Error("Please fill in all information.");
      }

      if (!checkEmail(email)) {
        throw new Error("Email is not in correct format.");
      }

      if (!isValidString(name)) {
        throw new Error("Please do not use special characters.");
      }

      let user = await models.User.findOne({ googleId });
      if (!user) {
        user = new models.User({ googleId, name, email, avatar });
      }
      await user.save();

      return user;
    },

    updateInfo: async (_, args, { models }) => {
      const { id, name, email, password } = args;
      if (!id) {
        throw new GraphQLError("Id required!");
      }

      const updateFields = {};
      if (name) updateFields.name = name;
      if (email) updateFields.email = email;

      if (password) {
        const hashedPassword = await hashPassword(password);
        updateFields.password = hashedPassword;
      }

      const user = await models.User.findByIdAndUpdate(id, updateFields, {
        new: true,
      });

      if (!user) {
        throw new GraphQLError("User not found!");
      }

      return user;
    },

    resetPassword: async (_, { email }, { models }) => {
      const user = await models.User.findOne({ email });

      if (!user) {
        throw new GraphQLError("Email không tồn tại!");
      }

      const newPassword = generateRandomPassword();
      const hashedPassword = await hashPassword(newPassword);

      user.password = hashedPassword;
      await user.save();

      await sendEmail(email, newPassword);
      console.log("newPassword", newPassword);

      return true;
    },
  },
};

module.exports = userResolvers;
