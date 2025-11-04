const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Global variables - bad practice
let favorites = [];
let apiKey = process.env.OMDB_API_KEY || 'demo';

// Middleware - poorly configured
app.use(cors());
app.use(express.json());

// Load API key from environment - no validation
if (process.env.OMDB_API_KEY) {
  apiKey = process.env.OMDB_API_KEY;
} else {
  console.log('Warning: No API key found, using default');
  apiKey = 'demo'; // This will cause issues
}

async function initializeData() {
// Load favorites from file - no error handling
	try {
	  const data = await fs.readFileSync('favorites.json', 'utf8');
	  favorites = JSON.parse(data);
	} catch (err) {
	  console.log('No favorites file found, starting empty');
	  favorites = [];
	}
}
// Save favorites function - inefficient, saves on every change
async function saveFavorites() {
  try {
    await fs.writeFileSync('favorites.json', JSON.stringify(favorites, null, 2));
  } catch (err) {
    console.log('Failed to save favorites');
  }
}

// Search movies endpoint - poorly structured
app.get('/movies/search', async (req, res) => {
  const query = req.query.q;
  const page = parseInt(req.query.page) || 1;
  
  if (!query) {
    return res.json({ movies: [], totalResults: 0 });
  }

  try {
    // Hardcoded URL - bad practice
	const OMDB_URL = 'https://www.omdbapi.com/';
    const url = `${OMDB_URL}?apikey=${apiKey}&s=${encodeURIComponent(query)}&page=${page}`;
    const response = await axios.get(url);
    
    // No error handling for API response
    if (response.data.Response === 'False') {
      return res.status(404).json({ movies: [], totalResults: 0, error: response.data.Error });
    }
    
    // Inconsistent response structure
    res.json({
      movies: response.data.Search || [],
      totalResults: parseInt(response.data.totalResults) || 0,
      page: parseInt(page),
      totalPages: Math.ceil((parseInt(response.data.totalResults) || 0) / 10)
    });
  } catch (error) {
    // Poor error handling
    console.log('Error:', error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Get favorites - no validation
app.get('/favorites', async (req, res) => {
  res.json({ favorites: favorites });
});

// Add favorite - no duplicate checking, no validation
app.post('/favorites', async (req, res) => {
  const movie = req.body;
  
  // No validation of movie object
  if (!movie || !movie.imdbID) {
    return res.status(400).json({ error: 'Invalid movie data' });
  }
  
  // Add without checking for duplicates
  favorites.push(movie);
  await saveFavorites();
  
  res.status(201).json({ success: true, movie });
});

// Remove favorite - inefficient search
app.delete('/favorites/:imdbID', async (req, res) => {
  const imdbID = req.params.imdbID;
  
  // Inefficient linear search
  let found = false;
  for (let i = 0; i < favorites.length; i++) {
    if (favorites[i].imdbID === imdbID) {
      favorites.splice(i, 1);
      found = true;
      break;
    }
  }
  
  if (found) {
    saveFavorites();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Movie not found' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server - no graceful shutdown
async function startServer() {
	await initializeData();
	app.listen(PORT, () => {
	  console.log(`Server running on port ${PORT}`);
	  console.log(`API Key: ${apiKey.substring(0, 4)}...`);
	});
}

startServer();
