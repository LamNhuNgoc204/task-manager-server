const { GraphQLScalarType, GraphQLError } = require("graphql");

const taskResolvers = {
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
    tasks: async (_, { userId }, { models }) => {
      if (!userId) {
        throw new GraphQLError("userId required!");
      }
      return await models.Task.find({
        user: userId,
      }).populate("user");
    },
    task: async (_, { taskId }, { models }) => {
      if (!taskId) {
        throw new GraphQLError("taskId is required");
      }
      return await models.Task.findById(taskId);
    },
    TasksOfStatus: async (_, { userId, status }, { models }) => {
      if (!userId) {
        throw new GraphQLError("userId required");
      }

      const validStatuses = ["todo", "in_progress"];

      if (status && !["todo", "in_progress", "done"].includes(status)) {
        throw new GraphQLError("Status invalid");
      }

      const statusArray = status ? [status] : validStatuses;

      const tasks = await models.Task.find({
        user: userId,
        status: { $in: statusArray },
      });

      return tasks || [];
    },
    importantTasks: async (_, { userId }, { models }) => {
      if (!userId) {
        throw new GraphQLError("userId required!");
      }

      const tasks = await models.Task.find({
        user: userId,
        important: true,
      });
      if (!tasks) {
        throw new GraphQLError("Task not found.");
      }

      return tasks;
    },
  },

  Mutation: {
    createTask: async (_, args, { models }) => {
      try {
        const {
          title,
          description,
          icon,
          important,
          priority,
          status,
          deadline,
          userId,
          subtasks = [],
          checklist = [],
        } = args;

        const user = await models.User.findById(userId);
        if (!user) throw new GraphQLError("User not found");

        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) {
          throw new GraphQLError("Invalid deadline");
        }

        const reminders = [
          new Date(deadlineDate.getTime() - 3 * 24 * 60 * 60 * 1000), // Trước 3 ngày
          new Date(deadlineDate.getTime() - 1 * 24 * 60 * 60 * 1000), // Trước 1 ngày
          deadlineDate, // Đúng ngày deadline
        ];

        const newTask = new models.Task({
          title,
          description,
          icon,
          important,
          priority,
          status,
          deadline: deadlineDate,
          reminders,
          user: user,
          subtasks,
          checklist,
        });

        console.log("newTask", newTask);

        await newTask.save();
        return await newTask.populate("user");
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    updateTask: async (_, args, { models }) => {
      try {
        const {
          id,
          title,
          description,
          icon,
          important,
          priority,
          status,
          deadline,
          subtasks = [],
          checklist = [],
        } = args;

        if (!id) {
          throw new GraphQLError("Id is required!");
        }

        const currTask = await models.Task.findById(id);
        if (!currTask) {
          throw new GraphQLError("Task not found!");
        }

        let newReminders = currTask.reminders;
        if (deadline) {
          const deadlineDate = new Date(deadline);
          if (isNaN(deadlineDate.getTime())) {
            throw new GraphQLError("Invalid deadline");
          }

          newReminders = [
            new Date(deadlineDate.getTime() - 3 * 24 * 60 * 60 * 1000), // Trước 3 ngày
            new Date(deadlineDate.getTime() - 1 * 24 * 60 * 60 * 1000), // Trước 1 ngày
            deadlineDate, // Đúng ngày deadline
          ];
        }

        const updateFields = {};
        updateFields.title = title || currTask.title;
        updateFields.description = description || currTask.description;
        updateFields.icon = icon || currTask.icon;
        updateFields.important = important || currTask.important;
        updateFields.priority = priority || currTask.important;
        updateFields.deadline = deadline || currTask.deadline;
        updateFields.subtasks = subtasks || currTask.subtasks;
        updateFields.checklist = checklist || currTask.checklist;
        updateFields.updatedAt = Date.now();

        const updatedTask = await models.Task.findByIdAndUpdate(
          id,
          updateFields,
          {
            new: true,
          }
        ).populate("user");

        if (!updatedTask) throw new GraphQLError("Task not found");
        return updatedTask;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    deleteTask: async (_, { id }, { models }) => {
      try {
        if (!id) {
          throw new GraphQLError("Id is required!");
        }

        const deletedTask = await models.Task.findByIdAndDelete(id);
        if (!deletedTask) throw new GraphQLError("Task not found");
        return true;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    isImportantTask: async (_, { id }, { models }) => {
      try {
        if (!id) {
          throw new GraphQLError("Id is required!");
        }
        const task = await models.Task.findById(id);
        if (!task) throw new GraphQLError("Task not found");

        task.important = !task.important;

        await task.save();

        return true;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    updateStatus: async (_, { id, status }, { models }) => {
      if (!id || !status) {
        throw new GraphQLError("Id and status are required!");
      }

      if (status && [].includes(status)) {
        throw new GraphQLError("Invalid status!");
      }

      const task = await models.Task.findByIdAndUpdate(
        id,
        { status: status },
        { new: true }
      );

      if (!task) {
        throw new GraphQLError("Task not found!");
      }

      return true;
    },
  },

  Task: {
    user: async (parent, _, { models }) =>
      await models.User.findById(parent.user),
  },
};

module.exports = taskResolvers;
