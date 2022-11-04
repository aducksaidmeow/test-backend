const router = require('express').Router();
const { google } = require('googleapis');
const cors = require('cors');

router.use(cors({
  origin: "https://aducksaidmeow.github.io",
  credentials: true
}));

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.NODE_ENV === 'production' ? 
    "https://aducksaidmeow.github.io/test-frontend" :
    "http://localhost:3000"
)

router.get('/', async (req, res, next) => {
  res.send({ message: 'Ok api is working 🚀' });
});

router.post('/test', async(req, res, next) => {
  try { 
    res.send({ message: "Success!" });
  } catch(error) {
    next(error);
  }
});

router.post('/get-token', async(req, res, next) => {
  try {
    const { code } = req.body;
    const { tokens } = await oauth2Client.getToken(code);
    res.send(tokens);
  } catch(error) {
    next(error);
  }
});

module.exports = router;
