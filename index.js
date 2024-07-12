const express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');
const app = express();

app.use(bodyParser.json());

let movies = [
    {Title: 'Sicario', Genre: 'Action', Director:'Denis Villenuve'},
    {Title: 'Hit Man', Genre: 'Action', Director:'Richard Linklater'},
    {Title: 'The King', Genre: 'Historical Drama', Director: 'David Michôd'},
    {Title: '12 Strong', Genre: 'Action', Director: 'Nicolai Fuglsig'},
    {Title: 'SISU', Genre: 'Action', Director: 'Jalmari Helander'},
    {Title: 'Zero Dark Thirty', Genre: 'Action', Director: 'Kathryn Bigelow'},
    {Title: 'Nightcrawler', Genre: 'Thriller', Director: 'Dan Gilroy'},
    {Title: 'The Covenent', Genre: 'Action', Director: 'Guy Ritchie'},
    {Title: 'Lift', Genre: 'Comedy', Director: 'Gary Gray'},
    {Title: 'Supercell', Genre: 'Action', Director: 'Herbert James Winterstern'}
];



let users = [
    {name: "Joe", id: 1, favoriteMovies: []},
    {name: "Sally", id: 2, favoriteMovies: ["The Fountain"]}
];


app.use(morgan('common'));

// gets a list of all movies 
app.get('/movies',(req,res)=> {
    res.json(movies);
});

// gets data about a single title
app.get('/movies/:title', (req, res) =>{
    const { title } = req.params;
    const movie = movies.find( movie => movie.Title === title);

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('movie not found')
    }
});

    
// adds data for a new movie to the list of movies
app.post('/movies', (req, res) => {
    let newMovie = req.body;

    if (!newMovie.title) {
        const message = 'Missing title in request body';
        res.status(400).send(message);
    }   else {
        newMovie.id = uuid.v4();
        movies.push(newMovie);
        res.status(201).send(newMovie);
    }
});

// get a genre by title
app.get('/movies/genre/:genreName', (req, res) => {
    const { genreName } = req.params;
    const genre = movies.find(movie => movie.Genre === genreName).Genre;

    if (genre) {
        res.status(200).json(genre);
    } else {
        res.status(400).send('no such movie')
    }
});
    
// get a data about a director 
app.get('/movies/directors/:directorName', (req, res) => {
    const { directorName }= req.params;
    const director = movies.find( movie => movie.Director === directorName).Director;
    if (director) {
        res.json(director);
    } else {
        res.status(404).json({ error: 'Director not found' });
    }
});

// registers a new user
app.post('/users', (req, res) => {
    const newUser = req.body;
    
    if (newUser.name) {
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).json(newUser)
    } else {
        res.status(400).send('users need names')
    }
});

// updates users info 
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const updatedUser = req.body;

    let user = users.find( user => user.id == id);

    if (user) {
        user.name = updatedUser.name;
        res.status(200).json(user);
    } else {
        res.status(400).send('no such user');
    }
});
    

// add a movie to a users favorites 
app.post('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } = req.params;

    let user = users.find( user => user.id == id );
    
    if (user) {
        user.favoriteMovies.push(movieTitle);
        res.status(200).send(`${movieTitle} has been added to user ${id}'s array`);
    } else {
        res.status(400).send('no such user')
    }
});

// delete a movie from a user's favorites 
app.delete('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } = req.params;

    let user = users.find( user => user.id == id);

    if(user) {
        user.favoriteMovies = user.favoriteMovies.filter( title => title !== movieTitle);
        res.status(200).send(`${movieTitle} has been removed from user ${id}'s array`);
    } else {
        res.status(400).send('no such user');
    }
});
    

//deregister a user
app.delete('/users/:id', (req, res) => {
    const { id }= req.params;
     
    let user = users.find( user => user.id == id);

    if (user) {
        users = users.filter( user => user.id != id);
        res.status(200).send(`user ${id} has been deleted`);
    } else {
        res.status(400).send('no such user');
    }
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