const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('Hello, World2!');
});

app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to the API!' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
