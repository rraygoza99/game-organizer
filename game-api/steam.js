import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
const app = express();
const allowedOrigins = ['http://localhost:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

app.get('/api/steam', async (req, res) => {
    try {
      const { steamid, key } = req.query;
  
      if (!steamid || !key) {
        return res.status(400).json({ error: 'Missing required query parameters: steamid and key' });
      }
  
      const apiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${key}&steamid=${steamid}&include_appinfo=true`;
  
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching Steam API:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
app.get('/api/gameDetails', async (req, res)=>{
  try{
    console.log(`https://store.steampowered.com/api/appdetails?appids=${req.query.appids}&filters=basic,metacritic,price_overview`);
    const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${req.query.appids}&filters=basic,metacritic,price_overview`);
    const data = await response.json();
    res.json(data);
  }catch(error){
    console.error('Error fetching Game details: ', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.listen(3001, () => {
  console.log('Server running on port 3001');
});