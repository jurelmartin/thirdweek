const path = require('path');
const fs = require('fs');
const https = require('https');

const express = require('express');
const mongoose = require('mongoose');

const graphqlhttp = require ('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const graphqlValidation = require('./middleware/gqlAuthValidation');


const bodyParser = require('body-parser');
const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');

const app = express();
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });



app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

const MONGODB_URI = `mongodb://thirdweek:xDztVmUhJKMIiFT2@cluster0-shard-00-00-ibwkk.mongodb.net:27017,cluster0-shard-00-01-ibwkk.mongodb.net:27017,cluster0-shard-00-02-ibwkk.mongodb.net:27017/restapi?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority`;
// const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-ibwkk.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');

app.use(bodyParser.json());

app.use(graphqlValidation);

// GRAPHQL
app.use('/graphql', graphqlhttp({ 
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
        if (!err.originalError) {
            return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occurred.';
        const code = err.originalError.code || 500;
        return { message: message, status: code, data: data };

    }
}));

// REST API ROUTES
app.use(usersRoutes);
app.use(authRoutes);

mongoose.connect(MONGODB_URI)
    .then(result => {
        // https.createServer({ key:privateKey, cert: certificate }, app).listen(process.env.PORT || 8080);
        app.listen(process.env.PORT || 8080);
    }).catch(err => {
        console.log(err);
    })

