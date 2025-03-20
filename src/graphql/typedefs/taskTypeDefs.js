const taskTypeDefs = `#graphql
  scalar Date

  type Task {
    id: ID!
    title: String!
    description: String!
    icon: String!
    important: Boolean!
    priority: String!
    status: String!
    deadline: Date!
    reminders: [Date]
    user: User!
    subtasks: [Subtask]
    checklist: [ChecklistItem]
    createdAt: Date
    updatedAt: Date
  }

  type Subtask {
    title: String!
    completed: Boolean!
  }

  type ChecklistItem {
    item: String!
    checked: Boolean!
  }

  type Query {
    tasks(userId: String) : [Task]
    task(taskId: String): Task
    TasksOfStatus(userId: String!, status: String): [Task]
    importantTasks(userId: String!): [Task]
  }

  type Mutation {
    createTask(
      title: String!
      description: String!
      icon: String!
      important: Boolean
      priority: String
      status: String
      deadline: Date!
      userId: ID!
      reminders: [Date]
      subtasks: [SubtaskInput]
      checklist: [ChecklistItemInput]
    ): Task

    updateTask(
      id: String!
      title: String
      description: String
      icon: String
      important: Boolean
      priority: String
      status: String
      deadline: Date
      reminders: [Date]
      subtasks: [SubtaskInput]
      checklist: [ChecklistItemInput]
    ): Task

    deleteTask(id: String!): Boolean

    isImportantTask(id:String!): Boolean

    updateStatus(id: String!, status: String!) : Boolean
  }

  input SubtaskInput {
    title: String!
    completed: Boolean
  }

  input ChecklistItemInput {
    item: String!
    checked: Boolean
  }
`;

module.exports = taskTypeDefs;
