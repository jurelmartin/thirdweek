const path = require('path');
const fs = require('fs');
const https = require('https');

const express = require('express');
const mongoose = require('mongoose');

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

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-ibwkk.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');



app.use(bodyParser.json());


app.use(usersRoutes);
app.use(authRoutes);

mongoose.connect(MONGODB_URI)
    .then(result => {
        // https.createServer({ key:privateKey, cert: certificate }, app).listen(process.env.PORT || 8080);
        app.listen(process.env.PORT || 8080);
    }).catch(err => {
        console.log(err);
    })

