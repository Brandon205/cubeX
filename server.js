require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const expressJWT = require('express-jwt');
const helmet = require('helmet');
const graphqlHTTP = require('express-graphql');
const schema = require('./schema/schema')
const cors = require('cors');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(helmet());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.once('open', () => console.log(`Connected to MongoDB on ${db.host} at ${db.port}`));
db.on('error', (err) => console.log(`Database error: ${err}`));

app.use('/auth', require('./routes/auth'));
app.use('/locked', expressJWT({ secret: process.env.JWT_SECRET }).unless({ method: 'POST' }), require('./routes/locked'));
app.use('/graphql', )

app.get('/graphql', graphqlHTTP({
  schema, 
  graphiql: true
}));

app.listen(process.env.PORT || 3001, () => console.log('Listening...'))