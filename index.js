const mongoose = require('mongoose');
const Models = require('./models');
const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/cfDB', { useNewUrlParser: true, useUnifiedTopology: true });

const express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');
const app = express();

app.use(bodyParser.json());
app.use(morgan('common'));

// gets a list of all movies 
app.get('/movies', async (req,res)=> {
    await Movies.find()
    .then((titles) => {
        res.status(201).json(titles);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// gets data on a single title 
app.get('/movies/:Title', async (req, res) => {
    await Movies.findOne({ Title: req.params.Title})
    .then((title) => {
        res.status(201).json(title);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// gets all users
app.get('/users', async (req, res) => {
    await Users.find()
    .then((users) => {
        res.status(201).json(users);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// gets a user by username
app.get('/users/:Username', async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
    .then((user) => {
        res.json(user);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
}); 

// add data for a new movie to the list of movies
app.post('/movies', async (req, res) => {
    await Movies.findOne({ Title: req.body.Title})
    .then((movie) => {
        if (movie) {
            return res.status(400).send(req.body.Title + 'already exists');
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
            .then((movie) => {res.status(201).json(movie) })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        })
        }
    })
})

app.get('/movies/genre/:genreName', async (req, res) => {
    await Movies.find({ "Genre.Name": req.params.genreName })
    .then((genre) => {
        res.status(200).json(genre);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Get data about a director
app.get('/movies/directors/:directorName', async (req, res) => {
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


// registers a new user
app.post('/users', async (req, res) => {
    await Users.findOne({ Username: req.body.Username})
    .then((user) => {
        if (user) {
            return res.status(400).send(req.body.Username + 'already exists');
        } else {
            Users
              .create ({
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday
              })
              .then ((user) =>{res.status(201).json(user) })
              .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
              })
        }
    })
    .catch ((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});
    
   
// update a user's username 
app.put('/users/:Username', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, { $set: 
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

// add a movie to a users favorites 
app.post('/users/:Username/movies/:MovieID', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $push: { FavoriteMovies: req.params.MovieID }
    },
    {new: true})
    .then((updatedMovie) => {
        res.json(updatedMovie);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Delete a movie from a user's favorites
app.delete('/users/:Username/movies/:movieID', async (req, res) => {
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

    
// Delete a user by username
app.delete('/users/:Username', async (req, res) => {
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


app.get('/',(req,res)=> {
    res.send('Welcome to my Top Movies!');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
  });

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });