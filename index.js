const express = require('express');
    morgan = require('morgan');
const app = express();


let topMovies = [
    {Title: 'Sicario'},
    {Title: 'Hit Man'},
    {Title: 'The King'},
    {Title: '12 Strong'},
    {Title: 'SISU'},
    {Title: 'Zero Dark Thirty'},
    {Title: 'Nightcrawler'},
    {Title: 'The Covenent'},
    {Title: 'Lift'},
    {Title: 'Supercell'}
];

app.use(morgan('common'));

app.get('/movies',(req,res)=> {
    res.json(topMovies);
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