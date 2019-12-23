const { buildSchema } = require('graphql');

module.exports = buildSchema(`


    type User {
        _id: ID!
        firstName: String
        lastName: String
        email: String
        password: String
        permissionLevel: Int
        message: String
        status: Int
    }

    input UserInputData {
        firstName: String
        lastName: String
        email: String
        password: String
    }

    type UsersData {
        users: [User!]!
    }
    
    type RootQuery {
        getUsers: UsersData!        
        getUser(id: ID!): User!
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
        updateUser(id: ID!, userInput:UserInputData): User!
        deleteUser(id: ID!): User
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }

`);     