'use strict';
require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const mongoose    = require('mongoose');
const helmet      = require('helmet');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.dnsPrefetchControl({ allow: false }));
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

//Sample front-end
app.route('/b/:board/')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/board.html');
  });

app.route('/b/:board/:threadid')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/thread.html');
  });

//Index page (static HTML)
app.route('/')
  .get((req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API
apiRoutes(app);

//404 Not Found Middleware
app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const port = process.env.PORT || 3000;

const runTest = () => {
  console.log('Running Tests...');
  setTimeout(() => {
    try {
      runner.run();
    } catch(err) {
      console.log('Tests are not valid:');
      console.log(err);
    }
  }, 1500);
}

//Start our server and tests!
app.listen(port, () => {
  console.log('Listening on port ' + port);
  mongoose.connect(process.env.MONGO_URI, {
   useNewUrlParser: true,
   useUnifiedTopology: true
  }, (err) => {
    if (err) {
      console.log(err.message);
    } else {
      console.log('Connected to database');

      if (process.env.NODE_ENV === 'test') {
        runTest();
      }
    }
  });
});

module.exports = app; //for testing
