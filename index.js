/**
 * @file Main application file for the Movie API.
 * @requires mongoose
 * @requires express
 * @requires morgan
 * @requires body-parser
 * @requires uuid
 * @requires cors
 * @requires express-validator
 * @requires passport
 * @requires './models'
 * @requires './auths'
 * @requires './passport'
 */

const mongoose = require('mongoose');
const Models = require('./models');
const Movies = Models.Movie;
const Users = Models.User;

// mongoose.connect('mongodb://localhost:27017/cfDB', { useNewUrlParser: true, useUnifiedTopology: true });

// mongoDB connection
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');
const app = express();

const { check, validationResult } = require('express-validator');

app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());

let auth = require('./auths')(app);

const passport = require('passport');
require('./passport');

app.use(morgan('common'));


/**
 * Get all movies.
 * @name GET /movies
 * @function
 * @memberof module:app
 * @inner
 * @returns {Array} Array of all movies.
 */
app.get('/movies', async (req, res) => {
    await Movies.find()
        .then((titles) => {
            res.status(201).json(titles);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * Get data about a single movie by title.
 * @name GET /movies/:Title
 * @function
 * @memberof module:app
 * @inner
 * @param {string} Title - Title of the movie to retrieve.
 * @returns {Object} Movie object.
 */
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ Title: req.params.Title })
        .then((title) => {
            res.status(201).json(title);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * Gets data on all users
 * @name GET /users
 * @function
 * @memberof module:app
 * @inner
 * @returns {Object} users data object
 */
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.find()
        .then((users) => {
            res.status(201).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * get data on a user by username
 * @name GET /users/:Username
 * @function
 * @memberof module:app
 * @inner
 * @param {string} Username 
 * @returns {Object} user's data
 */
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * Add a new movie.
 * @name POST /movies
 * @function
 * @memberof module:app
 * @inner
 * @param {Object} req.body - Movie object to add.
 * @returns {Object} The added movie.
 */
app.post('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.findOne({ Title: req.body.Title })
        .then((movie) => {
            if (movie) {
                return res.status(400).send(req.body.Title + ' already exists');
            } else {
                Movies
                    .create({
                        Title: req.body.Title,
                        Description: req.body.Description,
                        Genre: {
                            Name: req.body.Genre.Name,
                            Description: req.body.Genre.Description
                        },
                        Director: {
                            Name: req.body.Director.Name,
                            Bio: req.body.Director.Bio
                        },
                        Actors: req.body.Actors,
                        ImagePath: req.body.ImagePath,
                        Featured: req.body.Featured
                    })
                    .then((movie) => { res.status(201).json(movie) })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send('Error: ' + error);
                    })
            }
        })
})

/**
 * gets data about a genre
 * @name GET /movies/genre/:genreName
 * @function
 * @memberof module:app
 * @inner
 * @param {string} genreName
 * @returns {Object} data on the genre
 */
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Movies.find({ "Genre.Name": req.params.genreName })
        .then((genre) => {
            res.status(200).json(genre);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * gets data on a director by name
 * @name GET /movies/directors/:directorName
 * @function
 * @memberof module:app
 * @inner
 * @param {string} directorName
 * @returns {Object} data on the director
 */
app.get('/movies/directors/:directorName', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movie = await Movies.findOne({ "Director.Name": req.params.directorName });

        if (movie) {
            res.status(200).json(movie.Director);
        } else {
            res.status(404).send('Director not found.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});


/**
 * register a new user 
 * @name POST /users
 * @function
 * @inner
 * @param {Object} req.body
 * @returns {string} User resigstered succesfully 
 */
app.post('/users', [
    check('Username', 'Username is required').isLength({ min: 5 }),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
], async (req, res) => {

    // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    let hashPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username })
        .then((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + 'already exists');
            } else {
                Users
                    .create({
                        Username: req.body.Username,
                        Password: hashPassword,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday
                    })
                    .then((user) => { res.status(201).json(user) })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send('Error: ' + error);
                    })
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});


/**
 * Update a user's details.
 * @name PUT /users/:Username
 * @function
 * @inner
 * @param {string} Username - Username of the user to update.
 * @param {Object} req.body - Updated user details.
 * @returns {Object} Updated user object.
 */
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (req.user.Username !== req.params.Username) {
        return res.status(400).send('Permission denied');
    }
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $set:
        {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        }
    },
        { new: true })
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        })
});

/**
 * add a movie to a user's favorites
 * @name POST /users/:Username/movies/:MovieID
 * @function
 * @memberof module:app
 * @inner
 * @param {string} Username 
 * @param {Object} req.
 * @returns {string} movie was added to favorites
 */
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $push: { FavoriteMovies: req.params.MovieID }
    },
        { new: true })
        .then((updatedMovie) => {
            res.json(updatedMovie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * delete a movie from user's favorites
 * @name DELETE /users/:Username/movies/:movieID
 * @function
 * @memberof module:app
 * @inner 
 * @param {string} Username 
 * @param {Object} 
 * @returns {string} movie was removed
 */
app.delete('/users/:Username/movies/:movieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const updatedUser = await Users.findOneAndUpdate(
            { Username: req.params.Username },
            { $pull: { FavoriteMovies: req.params.movieID } },
            { new: true }
        );

        if (!updatedUser) {
            res.status(404).send(req.params.Username + ' was not found.');
        } else {
            res.status(200).json(updatedUser);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});


/**
 * delete a user 
 * @name DELETE /users/:Username
 * @function
 * @inner
 * @param {string} Username
 * @returns {string} Username was deleted
 */
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    if (req.user.Username !== req.params.Username) {
        return res.status(400).send('Permission denied');
    }
    await Users.findOneAndDelete({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + ' was not found');
            } else {
                res.status(200).send(req.params.Username + ' was deleted.');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * Welcome message route.
 * @name GET /
 * @function
 * @memberof module:app
 * @inner
 * @returns {string} Welcome message.
 */
app.get('/', (req, res) => {
    res.send('Welcome to my Top Movies!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});