const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const { expressMiddleware } = require("@apollo/server/express4");
const {
  ApolloServerPluginDrainHttpServer,
} = require("@apollo/server/plugin/drainHttpServer");
const { ApolloServer } = require("@apollo/server");
require("dotenv").config({ path: "./src/.env" });
require("./firebase/config");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const mongoose = require("mongoose");

const userTypeDefs = require("./graphql/typedefs/userTypeDefs");
const taskTypeDefs = require("./graphql/typedefs/taskTypeDefs");
// const resolvers = require("./graphql/resolvers/index");
const userResolvers = require("./graphql/resolvers/userResolver");
const taskResolvers = require("./graphql/resolvers/taskResolver");

const User = require("./models/userModel");
const Task = require("./models/taskModel");
const Notification = require("./models/notiModel");
const connectDB = require("./config/db");
const { authorizationJWT } = require("./middlewares/auth");
const cron = require("node-cron");

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT;
const { PubSub } = require("graphql-subscriptions");
const { GraphQLError } = require("graphql");

connectDB();

const checkDeadlines = async () => {
  const tasks = await Task.find();
  const now = new Date().toISOString();

  tasks.forEach(async (task) => {
    for (const reminder of task.reminders) {
      if (reminder <= now) {
        const newNoti = new Notification({
          taskId: task._id,
          content: `😱 Trời ơi! Nhiệm vụ "${task.title}" đã đến hạn!  Làm ngay kẻo trễ!`,
        });
        await newNoti.save();

        console.log("📢 Đã gửi event:");
        pubsub.publish("DEADLINE_REMINDER", {
          deadlineReminder: {
            task: task,
            message: newNoti.content,
          },
        });
        console.log(`📢 Nhắc nhở: ${task.title} đã đến hạn!`);
      }
    }
  });
};

cron.schedule("* * * * *", async () => {
  console.log("⏳ Đang kiểm tra deadline...");
  await checkDeadlines();
});

// const mongoose = require("mongoose");
// const MONGO_URI =
//   "mongodb+srv://lamlamnhungoc:GYfpmevyMkPPolEx@cluster0.7qgbb.mongodb.net/TasksManager"; // Thay bằng URI của bạn

// async function dropIndex() {
//   try {
//     await mongoose.connect(MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     console.log("🔗 Kết nối MongoDB thành công!");

//     const db = mongoose.connection.db;
//     await db.collection("users").dropIndex("username_1");

//     console.log("✅ Xóa index 'username_1' thành công!");

//     mongoose.connection.close();
//   } catch (error) {
//     console.error("❌ Lỗi khi xóa index:", error.message);
//   }
// }

// dropIndex();

const typeDefs = `
  ${userTypeDefs}
  ${taskTypeDefs}

  type DeadlineReminder {
    task: Task!
    message: String!
  }

  type Subscription {
    deadlineReminder(userId: String!): DeadlineReminder!
  }

  type Notification {
    content: String
    userId: String
    taskId: String
  }

  type Query {
    notifications(userId: String!): [Notification] 
  }
`;
const pubsub = new PubSub();

const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...taskResolvers.Query,
    notifications: async (_, { userId }) => {
      if (!userId) {
        throw new GraphQLError("UserId is required!");
      }
      const id = new mongoose.Types.ObjectId(userId);
      const user = await User.findById({ _id: id });
      if (!user) {
        throw new GraphQLError("User not found!");
      }

      const lstNoti = await Notification.find({ userId: id });
      return lstNoti;
    },
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...taskResolvers.Mutation,
  },
  Subscription: {
    deadlineReminder: {
      subscribe: (_, { userId }) => {
        if (!userId) {
          throw new Error("❌ Không xác định được userId!");
        }
        console.log(
          `📡 User ${userId} đã subscribe vào DEADLINE_REMINDER_${userId}`
        );
        return pubsub.asyncIterableIterator(`DEADLINE_REMINDER_${userId}`);
      },
    },
  },
};

async function startServer() {
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Creating the WebSocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  // WebSocketServer start listening.
  const serverCleanup = useServer(
    {
      schema,
      onConnect: () => console.log("🔗 WebSocket connected!"),
      onDisconnect: () => console.log("🔴 WebSocket disconnected!"),
      onError: (ctx, error) => console.error("❌ WebSocket error:", error),
      onSubscription: (ctx, msg) => {
        console.log("📡 Subscription message received:", msg);
      },
    },
    wsServer
  );

  const server = new ApolloServer({
    schema,
    context: async (req, res) => ({
      models: { User, Task }, // Truyền model vào resolver
      id: req.userId,
    }),
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(cors({
    origin: "https://deluxe-daffodil-b9bfc0.netlify.app", 
    credentials: true
  }));
  app.use(
    cors(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: () => ({ models: { User, Task } }),
    }),
    authorizationJWT
  );

  await new Promise((resolve) =>
    httpServer.listen({ port: PORT || 5000 }, resolve)
  );

  // **Kiểm tra deadline task mỗi phút**
  cron.schedule("0 0 * * *", async () => {
    console.log("⏳ Kiểm tra deadline...");
    const now = new Date();
    const tasks = await Task.find({ deadline: { $lte: now } })
      .populate({
        path: "user",
        select: "_id name email",
      })
      .lean()
      .exec();

    tasks.forEach(async (task) => {
      if (!task.user || !task.user._id) {
        console.warn(`⚠️ Không tìm thấy user cho task: "${task.title}"`);
        return;
      }

      if (new Date(task.deadline) <= now) {
        const id = task.user && task?.user?._id;
        if (!id) {
          console.warn(`⚠️ Không tìm thấy user cho task ${task.title}`);
          return;
        }

        const taskId = task && task._id;
        if (!taskId) {
          console.warn(`⚠️ Không tìm thấy task id ${taskId}`);
          return;
        }

        const newNoti = new Notification({
          taskId: taskId.toString(),
          userId: id,
          content: `📢Trời ơi đất hỡi! 🚨 '${task.title}' sắp hết hạn! Không làm là 'toang' á nha! 🤯`,
        });
        await newNoti.save();

        console.log("📢 Gửi thông báo qua WebSocket...");
        pubsub.publish(`DEADLINE_REMINDER_${id}`, {
          deadlineReminder: {
            task: {
              ...task,
              id: task._id.toString(),
            },
            message: newNoti.content,
          },
        });
      }
    });
  });
}

startServer().then(() =>
  console.log(
    "🚀 Server is running...",
    `Server ready at http://localhost:${PORT}`
  )
);
